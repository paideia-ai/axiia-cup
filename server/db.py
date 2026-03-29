"""SQLite database for Axiia Cup. Single file, no ORM."""

import sqlite3
import json
import os
import time
from pathlib import Path

# Use /data on Fly (persistent volume), local path for dev
if os.environ.get("FLY_APP_NAME"):
    DB_PATH = Path("/data/axiia_cup.db")
else:
    DB_PATH = Path(__file__).parent.parent / "axiia_cup.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        wechat TEXT NOT NULL,
        display_name TEXT NOT NULL,
        anonymous INTEGER DEFAULT 0,
        created_at REAL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        context TEXT NOT NULL,
        role_a_name TEXT NOT NULL,
        role_a_public_goal TEXT NOT NULL,
        role_a_secrets TEXT DEFAULT '[]',
        role_b_name TEXT NOT NULL,
        role_b_public_goal TEXT NOT NULL,
        role_b_secrets TEXT DEFAULT '[]',
        win_condition TEXT NOT NULL,
        judge_prompt TEXT NOT NULL DEFAULT '',
        created_at REAL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        scenario_id TEXT NOT NULL REFERENCES scenarios(id),
        prompt_a TEXT NOT NULL,
        prompt_b TEXT NOT NULL,
        model TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at REAL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id TEXT NOT NULL REFERENCES scenarios(id),
        sub_a_id INTEGER NOT NULL REFERENCES submissions(id),
        sub_b_id INTEGER NOT NULL REFERENCES submissions(id),
        status TEXT NOT NULL DEFAULT 'queued',
        current_turn INTEGER DEFAULT 0,
        transcript TEXT DEFAULT '[]',
        secret_a_index INTEGER DEFAULT NULL,
        secret_b_index INTEGER DEFAULT NULL,
        interrogation TEXT DEFAULT '{}',
        score_a REAL DEFAULT NULL,
        score_b REAL DEFAULT NULL,
        winner TEXT DEFAULT NULL,
        error TEXT DEFAULT NULL,
        started_at REAL DEFAULT NULL,
        finished_at REAL DEFAULT NULL,
        created_at REAL DEFAULT (unixepoch())
    );
    """)
    # Migrations for existing DBs
    migrations = [
        "ALTER TABLE scenarios ADD COLUMN role_a_secrets TEXT DEFAULT '[]'",
        "ALTER TABLE scenarios ADD COLUMN role_b_secrets TEXT DEFAULT '[]'",
        "ALTER TABLE matches ADD COLUMN secret_a_index INTEGER DEFAULT NULL",
        "ALTER TABLE matches ADD COLUMN secret_b_index INTEGER DEFAULT NULL",
        "ALTER TABLE matches ADD COLUMN interrogation TEXT DEFAULT '{}'",
        "ALTER TABLE matches ADD COLUMN score_a REAL DEFAULT NULL",
        "ALTER TABLE matches ADD COLUMN score_b REAL DEFAULT NULL",
    ]
    for sql in migrations:
        try:
            conn.execute(sql)
        except Exception:
            pass
    conn.commit()
    conn.close()


# ─── Users ───

def create_user(phone: str, wechat: str, display_name: str, anonymous: bool = False) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO users (phone, wechat, display_name, anonymous) VALUES (?, ?, ?, ?)",
        (phone, wechat, display_name, int(anonymous)),
    )
    conn.commit()
    uid = cur.lastrowid
    conn.close()
    return uid


def get_user(user_id: int) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# ─── Scenarios ───

def create_scenario(scenario: dict) -> str:
    conn = get_conn()
    conn.execute(
        """INSERT OR REPLACE INTO scenarios (id, title, context, role_a_name, role_a_public_goal,
           role_a_secrets, role_b_name, role_b_public_goal, role_b_secrets,
           win_condition, judge_prompt)
           VALUES (:id, :title, :context, :role_a_name, :role_a_public_goal,
           :role_a_secrets, :role_b_name, :role_b_public_goal, :role_b_secrets,
           :win_condition, :judge_prompt)""",
        scenario,
    )
    conn.commit()
    conn.close()
    return scenario["id"]


def get_scenario(scenario_id: str) -> dict | None:
    conn = get_conn()
    row = conn.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["role_a_secrets"] = json.loads(d.get("role_a_secrets", "[]") or "[]")
    d["role_b_secrets"] = json.loads(d.get("role_b_secrets", "[]") or "[]")
    return d


def list_scenarios() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM scenarios ORDER BY created_at").fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["role_a_secrets"] = json.loads(d.get("role_a_secrets", "[]") or "[]")
        d["role_b_secrets"] = json.loads(d.get("role_b_secrets", "[]") or "[]")
        results.append(d)
    return results


# ─── Submissions ───

def create_submission(user_id: int, scenario_id: str, prompt_a: str, prompt_b: str, model: str) -> int:
    conn = get_conn()
    row = conn.execute(
        "SELECT MAX(version) as v FROM submissions WHERE user_id = ? AND scenario_id = ?",
        (user_id, scenario_id),
    ).fetchone()
    version = (row["v"] or 0) + 1
    cur = conn.execute(
        """INSERT INTO submissions (user_id, scenario_id, prompt_a, prompt_b, model, version)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (user_id, scenario_id, prompt_a, prompt_b, model, version),
    )
    conn.commit()
    sid = cur.lastrowid
    conn.close()
    return sid


def get_latest_submission(user_id: int, scenario_id: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        """SELECT * FROM submissions WHERE user_id = ? AND scenario_id = ?
           ORDER BY version DESC LIMIT 1""",
        (user_id, scenario_id),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def list_submissions(scenario_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT s.*, u.display_name, u.anonymous FROM submissions s
           JOIN users u ON s.user_id = u.id
           WHERE s.scenario_id = ?
           ORDER BY s.created_at DESC""",
        (scenario_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Matches ───

def create_match(scenario_id: str, sub_a_id: int, sub_b_id: int) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO matches (scenario_id, sub_a_id, sub_b_id) VALUES (?, ?, ?)",
        (scenario_id, sub_a_id, sub_b_id),
    )
    conn.commit()
    mid = cur.lastrowid
    conn.close()
    return mid


def update_match(match_id: int, **fields):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in fields)
    vals = [json.dumps(v) if isinstance(v, (list, dict)) else v for v in fields.values()]
    conn.execute(f"UPDATE matches SET {sets} WHERE id = ?", vals + [match_id])
    conn.commit()
    conn.close()


def get_match(match_id: int) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        """SELECT m.*, sa.prompt_a as a_prompt, sa.prompt_b as a_prompt_b, sa.model as a_model, sa.user_id as a_user_id,
           sb.prompt_a as b_prompt, sb.prompt_b as b_prompt_b, sb.model as b_model, sb.user_id as b_user_id
           FROM matches m
           JOIN submissions sa ON m.sub_a_id = sa.id
           JOIN submissions sb ON m.sub_b_id = sb.id
           WHERE m.id = ?""",
        (match_id,),
    ).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["transcript"] = json.loads(d["transcript"])
    d["interrogation"] = json.loads(d.get("interrogation", "{}") or "{}")
    return d


def list_matches(scenario_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT m.id, m.status, m.winner, m.current_turn, m.score_a, m.score_b,
           m.created_at, m.finished_at,
           ua.display_name as player_a, ua.anonymous as a_anon, sa.model as a_model,
           ub.display_name as player_b, ub.anonymous as b_anon, sb.model as b_model
           FROM matches m
           JOIN submissions sa ON m.sub_a_id = sa.id
           JOIN submissions sb ON m.sub_b_id = sb.id
           JOIN users ua ON sa.user_id = ua.id
           JOIN users ub ON sb.user_id = ub.id
           WHERE m.scenario_id = ?
           ORDER BY m.created_at DESC""",
        (scenario_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_queued_matches(limit: int = 10) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT id FROM matches WHERE status = 'queued' ORDER BY created_at LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_leaderboard(scenario_id: str) -> list[dict]:
    """Compute win rates per user for a scenario."""
    conn = get_conn()
    rows = conn.execute(
        """
        WITH user_matches AS (
            SELECT sa.user_id as uid, m.winner, 'A' as side
            FROM matches m JOIN submissions sa ON m.sub_a_id = sa.id
            WHERE m.scenario_id = ? AND m.status = 'scored'
            UNION ALL
            SELECT sb.user_id as uid, m.winner, 'B' as side
            FROM matches m JOIN submissions sb ON m.sub_b_id = sb.id
            WHERE m.scenario_id = ? AND m.status = 'scored'
        )
        SELECT
            u.id, u.display_name, u.anonymous,
            COUNT(*) as total_matches,
            SUM(CASE WHEN (um.side = 'A' AND um.winner = 'A')
                      OR (um.side = 'B' AND um.winner = 'B') THEN 1 ELSE 0 END) as wins
        FROM user_matches um
        JOIN users u ON um.uid = u.id
        GROUP BY u.id
        ORDER BY (CAST(wins AS REAL) / total_matches) DESC, wins DESC
        """,
        (scenario_id, scenario_id),
    ).fetchall()
    conn.close()
    results = []
    for i, r in enumerate(rows):
        d = dict(r)
        d["rank"] = i + 1
        d["win_rate"] = round(d["wins"] / d["total_matches"] * 100, 1) if d["total_matches"] > 0 else 0
        sub = get_latest_submission(d["id"], scenario_id)
        d["model"] = sub["model"] if sub else "unknown"
        results.append(d)
    return results
