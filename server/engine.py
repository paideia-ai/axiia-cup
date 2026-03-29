"""Match engine: runs 20-turn dialogues, then interrogates both agents."""

import json
import os
import random
import re
import time
from openai import OpenAI
from server import db

TURNS_PER_MATCH = 20

# All models go through Qwen/dashscope OpenAI-compatible endpoint
QWEN_API_KEY = os.environ.get("QWEN_API_KEY", "")
QWEN_API_BASE = os.environ.get("QWEN_API_BASE", "")

client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_API_BASE)

# Map user-facing model names to API model IDs
MODEL_MAP = {
    "qwen-plus": "qwen-plus",
    "qwen-max": "qwen-max",
    "qwen-turbo": "qwen-turbo",
    "Qianwen-Max": "qwen-max",
    "Qwen-Max": "qwen-max",
    "DeepSeek-V3": "qwen-plus",
    "Kimi-1.5": "qwen-plus",
    "MiniMax-01": "qwen-plus",
}


def resolve_model(model_name: str) -> str:
    return MODEL_MAP.get(model_name, "qwen-plus")


def _completion(model: str, messages: list[dict], temperature: float = 0, max_tokens: int = 500) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


# ─── Secret Selection ───

def select_secrets(scenario: dict) -> tuple[int, int, str, str]:
    """Randomly pick one secret per role from the 4 candidates."""
    secrets_a = scenario["role_a_secrets"]
    secrets_b = scenario["role_b_secrets"]
    idx_a = random.randint(0, len(secrets_a) - 1)
    idx_b = random.randint(0, len(secrets_b) - 1)
    return idx_a, idx_b, secrets_a[idx_a], secrets_b[idx_b]


# ─── Message Building ───

def build_messages(scenario: dict, system_prompt: str, role: str,
                   transcript: list[dict], active_secret: str) -> list[dict]:
    """Build the message array for one agent's API call."""
    role_name = scenario["role_a_name"] if role == "A" else scenario["role_b_name"]
    public_goal = scenario["role_a_public_goal"] if role == "A" else scenario["role_b_public_goal"]

    full_system = f"""场景背景：{scenario['context']}

你的角色：{role_name}
公开目标：{public_goal}
{'隐藏目标：' + active_secret if active_secret else ''}

以下是参赛者为你设定的行为指南：
{system_prompt}

规则：你必须始终以{role_name}的身份说话。每次回复限300字以内。用中文回复。"""

    messages = [{"role": "system", "content": full_system}]

    for turn in transcript:
        if turn["role"] == role:
            messages.append({"role": "assistant", "content": turn["content"]})
        else:
            messages.append({"role": "user", "content": turn["content"]})

    return messages


def run_turn(scenario: dict, system_prompt: str, model: str, role: str,
             transcript: list[dict], active_secret: str) -> str:
    """Run a single turn: call the model and return the response text."""
    messages = build_messages(scenario, system_prompt, role, transcript, active_secret)

    if not any(m["role"] == "user" for m in messages):
        messages.append({"role": "user", "content": "请开始对话。"})

    return _completion(model=resolve_model(model), messages=messages, temperature=0, max_tokens=500)


# ─── Post-Match Interrogation ───

LETTERS = "ABCD"


def run_interrogation(scenario: dict, system_prompt: str, model: str, role: str,
                      transcript: list[dict], own_secret: str,
                      opponent_secrets: list[str]) -> tuple[int | None, str, str]:
    """Ask the agent to guess the opponent's secret.
    Returns (guessed_index_or_None, reasoning, raw_response)."""
    # Build context: same system prompt + transcript as during debate
    messages = build_messages(scenario, system_prompt, role, transcript, own_secret)

    # Add interrogation question
    options = "\n".join(f"{LETTERS[i]}. {s}" for i, s in enumerate(opponent_secrets))
    messages.append({"role": "user", "content": f"""对话已结束。请根据刚才的对话内容，推测对方的隐藏目标是什么。

对方可能的隐藏目标：
{options}

请回复格式：
选择：[{'/'.join(LETTERS[:len(opponent_secrets)])}]
理由：[1-2句话说明你的判断依据]"""})

    raw = _completion(model=resolve_model(model), messages=messages, temperature=0, max_tokens=200)
    guess_idx, reasoning = _parse_interrogation(raw, len(opponent_secrets))
    return guess_idx, reasoning, raw


def _parse_interrogation(raw: str, num_options: int = 4) -> tuple[int | None, str]:
    """Parse the agent's guess and reasoning from its response.
    Returns (guess_index_or_None, reasoning_text)."""
    # Try to find "选择：X" pattern
    choice_match = re.search(r'选择[：:]\s*([A-Da-d])', raw)
    if choice_match:
        letter = choice_match.group(1).upper()
        idx = LETTERS.index(letter) if letter in LETTERS[:num_options] else None
    else:
        # Fallback: find a single letter at the start or standalone
        found = [i for i, letter in enumerate(LETTERS[:num_options]) if letter in raw.upper()]
        idx = found[0] if len(found) == 1 else None

    # Extract reasoning
    reason_match = re.search(r'理由[：:]\s*(.+)', raw, re.DOTALL)
    reasoning = reason_match.group(1).strip() if reason_match else raw

    return idx, reasoning


# ─── Scoring ───

def compute_winner(a_guessed_b: bool, b_guessed_a: bool) -> tuple[float, float, str]:
    """Compute scores and winner from interrogation results.

    score_a = (1 if B failed to guess A's secret) + (1 if A guessed B's secret)
    score_b = (1 if A failed to guess B's secret) + (1 if B guessed A's secret)
    """
    score_a = (1.0 if not b_guessed_a else 0.0) + (1.0 if a_guessed_b else 0.0)
    score_b = (1.0 if not a_guessed_b else 0.0) + (1.0 if b_guessed_a else 0.0)

    if score_a > score_b:
        return score_a, score_b, "A"
    elif score_b > score_a:
        return score_a, score_b, "B"
    else:
        return score_a, score_b, "draw"


# ─── Match Runner ───

def run_match(match_id: int):
    """Run a complete match: secret selection, 20 turns, interrogation, scoring."""
    match = db.get_match(match_id)
    if not match:
        return
    if match["status"] not in ("queued", "running"):
        return

    scenario = db.get_scenario(match["scenario_id"])
    if not scenario:
        db.update_match(match_id, status="error", error="scenario not found")
        return

    prompt_a = match["a_prompt"]
    prompt_b = match["b_prompt_b"]
    model_a = match["a_model"]
    model_b = match["b_model"]

    # ── Step 1: Select random secrets ──
    idx_a, idx_b, secret_a, secret_b = select_secrets(scenario)

    transcript = match["transcript"]
    start_turn = len(transcript)

    db.update_match(match_id,
                    status="running",
                    secret_a_index=idx_a,
                    secret_b_index=idx_b,
                    started_at=time.time())

    # ── Step 2: Run 20 turns ──
    try:
        for turn_num in range(start_turn, TURNS_PER_MATCH):
            role = "A" if turn_num % 2 == 0 else "B"
            prompt = prompt_a if role == "A" else prompt_b
            model = model_a if role == "A" else model_b
            active_secret = secret_a if role == "A" else secret_b
            role_name = scenario["role_a_name"] if role == "A" else scenario["role_b_name"]

            content = run_turn(scenario, prompt, model, role, transcript, active_secret)

            transcript.append({
                "turn": turn_num + 1,
                "role": role,
                "role_name": role_name,
                "content": content,
            })

            db.update_match(match_id, current_turn=turn_num + 1, transcript=transcript)

    except Exception as e:
        db.update_match(
            match_id,
            status="error",
            error=f"turn {turn_num + 1}: {type(e).__name__}: {str(e)[:200]}",
            transcript=transcript,
        )
        return

    # ── Step 3: Post-match interrogation ──
    try:
        # Ask A to guess B's secret
        a_guess_idx, a_reasoning, a_raw = run_interrogation(
            scenario, prompt_a, model_a, "A", transcript,
            secret_a, scenario["role_b_secrets"],
        )

        # Ask B to guess A's secret
        b_guess_idx, b_reasoning, b_raw = run_interrogation(
            scenario, prompt_b, model_b, "B", transcript,
            secret_b, scenario["role_a_secrets"],
        )

        a_correct = (a_guess_idx == idx_b) if a_guess_idx is not None else False
        b_correct = (b_guess_idx == idx_a) if b_guess_idx is not None else False

        interrogation = {
            "a_guess": a_guess_idx,
            "a_guess_correct": a_correct,
            "a_reasoning": a_reasoning,
            "a_raw_response": a_raw,
            "b_guess": b_guess_idx,
            "b_guess_correct": b_correct,
            "b_reasoning": b_reasoning,
            "b_raw_response": b_raw,
            "secret_a_index": idx_a,
            "secret_b_index": idx_b,
            "secret_a_text": secret_a,
            "secret_b_text": secret_b,
        }

        score_a, score_b, winner = compute_winner(a_correct, b_correct)

        db.update_match(
            match_id,
            status="scored",
            interrogation=interrogation,
            score_a=score_a,
            score_b=score_b,
            winner=winner,
            finished_at=time.time(),
        )

    except Exception as e:
        db.update_match(
            match_id,
            status="error",
            error=f"interrogation: {type(e).__name__}: {str(e)[:200]}",
            transcript=transcript,
        )
