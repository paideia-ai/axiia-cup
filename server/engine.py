"""Match engine: runs 20-turn dialogues between two agents, then judges."""

import json
import os
import time
import traceback
from litellm import completion
from server import db

TURNS_PER_MATCH = 20
JUDGE_VOTES = 3

# Model config: all models go through Qwen/dashscope OpenAI-compatible endpoint
QWEN_API_KEY = os.environ.get("QWEN_API_KEY", "")
QWEN_API_BASE = os.environ.get("QWEN_API_BASE", "")
JUDGE_MODEL = "openai/qwen-plus"

# Map user-facing model names to litellm model IDs
MODEL_MAP = {
    "qwen-plus": "openai/qwen-plus",
    "qwen-max": "openai/qwen-max",
    "qwen-turbo": "openai/qwen-turbo",
    "deepseek-chat": "openai/qwen-plus",  # fallback until DeepSeek key works
    "deepseek/deepseek-chat": "openai/qwen-plus",
    "Qianwen-Max": "openai/qwen-max",
    "Qwen-Max": "openai/qwen-max",
}


def _completion(**kwargs):
    """Wrapper that injects Qwen API credentials."""
    kwargs.setdefault("api_key", QWEN_API_KEY)
    kwargs.setdefault("api_base", QWEN_API_BASE)
    return completion(**kwargs)


def resolve_model(model_name: str) -> str:
    """Resolve user-facing model name to litellm model ID."""
    return MODEL_MAP.get(model_name, "openai/qwen-plus")


def build_messages(scenario: dict, system_prompt: str, role: str, transcript: list[dict]) -> list[dict]:
    """Build the message array for one agent's API call."""
    role_name = scenario["role_a_name"] if role == "A" else scenario["role_b_name"]
    public_goal = scenario["role_a_public_goal"] if role == "A" else scenario["role_b_public_goal"]
    hidden_goal = scenario["role_a_hidden_goal"] if role == "A" else scenario["role_b_hidden_goal"]

    # scenario context injected as part of system prompt
    full_system = f"""场景背景：{scenario['context']}

你的角色：{role_name}
公开目标：{public_goal}
{'隐藏目标：' + hidden_goal if hidden_goal else ''}

以下是参赛者为你设定的行为指南：
{system_prompt}

规则：你必须始终以{role_name}的身份说话。每次回复限300字以内。用中文回复。"""

    messages = [{"role": "system", "content": full_system}]

    # convert transcript to alternating user/assistant messages
    for turn in transcript:
        if turn["role"] == role:
            messages.append({"role": "assistant", "content": turn["content"]})
        else:
            messages.append({"role": "user", "content": turn["content"]})

    return messages


def run_turn(scenario: dict, system_prompt: str, model: str, role: str, transcript: list[dict]) -> str:
    """Run a single turn: call the model and return the response text."""
    messages = build_messages(scenario, system_prompt, role, transcript)

    # if this is the first turn for this role and there's no prior conversation,
    # add a nudge so the model starts talking
    if not any(m["role"] == "user" for m in messages):
        messages.append({"role": "user", "content": "请开始对话。"})

    resp = _completion(
        model=resolve_model(model),
        messages=messages,
        temperature=0,
        max_tokens=500,
    )
    return resp.choices[0].message.content.strip()


def run_judge(scenario: dict, transcript: list[dict], vote_index: int) -> str:
    """Run the judge once. Returns 'A', 'B', or 'draw'.

    vote_index is used to slightly vary the prompt for diversity in 3x voting.
    """
    transcript_text = "\n".join(
        f"[第{t['turn']}回合 - {t['role_name']}]: {t['content']}"
        for t in transcript
    )

    # slight prompt variation per vote to avoid identical deterministic outputs
    variation = [
        "请仔细分析对话内容，判断哪一方更好地达成了自己的目标。",
        "请从目标达成度的角度，评估双方在对话中的表现。",
        "请综合考虑策略运用和目标达成情况，判断胜负。",
    ]

    judge_system = f"""{scenario['judge_prompt']}

{variation[vote_index % 3]}

胜利条件：{scenario['win_condition']}

请只回复以下三个选项之一（不要加任何其他文字）：
A
B
draw"""

    messages = [
        {"role": "system", "content": judge_system},
        {"role": "user", "content": f"以下是完整的{TURNS_PER_MATCH}回合对话记录：\n\n{transcript_text}"},
    ]

    resp = _completion(
        model=JUDGE_MODEL,
        messages=messages,
        temperature=0,
        max_tokens=10,
    )
    answer = resp.choices[0].message.content.strip().upper()

    if "A" in answer and "B" not in answer:
        return "A"
    elif "B" in answer and "A" not in answer:
        return "B"
    else:
        return "draw"


def run_match(match_id: int):
    """Run a complete match: 20 turns + 3x judge vote. Updates DB as it goes."""
    match = db.get_match(match_id)
    if not match:
        return
    if match["status"] not in ("queued", "running"):
        return

    scenario = db.get_scenario(match["scenario_id"])
    if not scenario:
        db.update_match(match_id, status="error", error="scenario not found")
        return

    # sub_a plays Role A using prompt_a, sub_b plays Role B using prompt_b
    prompt_a = match["a_prompt"]   # sub_a's Role A prompt
    prompt_b = match["b_prompt_b"] # sub_b's Role B prompt
    model_a = match["a_model"]
    model_b = match["b_model"]

    transcript = match["transcript"]  # resume from existing transcript if retrying
    start_turn = len(transcript)

    db.update_match(match_id, status="running", started_at=time.time())

    try:
        for turn_num in range(start_turn, TURNS_PER_MATCH):
            role = "A" if turn_num % 2 == 0 else "B"
            prompt = prompt_a if role == "A" else prompt_b
            model = model_a if role == "A" else model_b
            role_name = scenario["role_a_name"] if role == "A" else scenario["role_b_name"]

            content = run_turn(scenario, prompt, model, role, transcript)

            transcript.append({
                "turn": turn_num + 1,
                "role": role,
                "role_name": role_name,
                "content": content,
            })

            # persist after every turn (enables retry-from-failure)
            db.update_match(match_id, current_turn=turn_num + 1, transcript=transcript)

    except Exception as e:
        db.update_match(
            match_id,
            status="error",
            error=f"turn {turn_num + 1}: {type(e).__name__}: {str(e)[:200]}",
            transcript=transcript,
        )
        return

    # ─── Judge (3x majority vote) ───
    try:
        votes = []
        for i in range(JUDGE_VOTES):
            vote = run_judge(scenario, transcript, i)
            votes.append(vote)

        # majority
        from collections import Counter
        counts = Counter(votes)
        winner = counts.most_common(1)[0][0]

        db.update_match(
            match_id,
            status="scored",
            judge_votes=votes,
            winner=winner,
            finished_at=time.time(),
        )

    except Exception as e:
        db.update_match(
            match_id,
            status="error",
            error=f"judge: {type(e).__name__}: {str(e)[:200]}",
            transcript=transcript,
        )
