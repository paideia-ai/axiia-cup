"""FastAPI server for Axiia Cup."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from server import db
from server.engine import run_match


# ─── Background match runner ───

async def match_worker():
    """Poll for queued matches and run them."""
    while True:
        queued = db.get_queued_matches(limit=1)
        if queued:
            match_id = queued[0]["id"]
            await asyncio.to_thread(run_match, match_id)
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    # Auto-seed if no scenarios exist
    if not db.list_scenarios():
        from server.seed import seed
        seed()
    task = asyncio.create_task(match_worker())
    yield
    task.cancel()


app = FastAPI(title="Axiia Cup", lifespan=lifespan)

# serve frontend
STATIC_DIR = Path(__file__).parent.parent
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def index():
    return FileResponse(str(STATIC_DIR / "index.html"))


# ─── Pydantic models ───

class UserCreate(BaseModel):
    phone: str
    wechat: str
    display_name: str
    anonymous: bool = False


class SubmissionCreate(BaseModel):
    user_id: int
    scenario_id: str
    prompt_a: str
    prompt_b: str
    model: str


class MatchCreate(BaseModel):
    scenario_id: str
    sub_a_id: int
    sub_b_id: int


# ─── API routes ───

@app.post("/api/users")
async def api_create_user(body: UserCreate):
    try:
        uid = db.create_user(body.phone, body.wechat, body.display_name, body.anonymous)
        return {"id": uid}
    except Exception as e:
        if "UNIQUE" in str(e):
            raise HTTPException(400, "该手机号已注册")
        raise


@app.get("/api/users/{user_id}")
async def api_get_user(user_id: int):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(404, "用户不存在")
    return user


@app.get("/api/scenarios")
async def api_list_scenarios():
    return db.list_scenarios()


@app.get("/api/scenarios/{scenario_id}")
async def api_get_scenario(scenario_id: str):
    s = db.get_scenario(scenario_id)
    if not s:
        raise HTTPException(404, "场景不存在")
    return s


@app.post("/api/submissions")
async def api_create_submission(body: SubmissionCreate):
    if len(body.prompt_a) > 1000:
        raise HTTPException(400, "角色A提示词超过1000字")
    if len(body.prompt_b) > 1000:
        raise HTTPException(400, "角色B提示词超过1000字")
    if not body.prompt_a.strip() or not body.prompt_b.strip():
        raise HTTPException(400, "提示词不能为空")
    sid = db.create_submission(body.user_id, body.scenario_id, body.prompt_a, body.prompt_b, body.model)
    return {"id": sid}


@app.get("/api/submissions/{scenario_id}")
async def api_list_submissions(scenario_id: str):
    return db.list_submissions(scenario_id)


@app.post("/api/matches")
async def api_create_match(body: MatchCreate):
    mid = db.create_match(body.scenario_id, body.sub_a_id, body.sub_b_id)
    return {"id": mid, "status": "queued"}


@app.get("/api/matches/{match_id}")
async def api_get_match(match_id: int):
    m = db.get_match(match_id)
    if not m:
        raise HTTPException(404, "对局不存在")
    return m


@app.get("/api/matches/list/{scenario_id}")
async def api_list_matches(scenario_id: str):
    return db.list_matches(scenario_id)


@app.get("/api/leaderboard/{scenario_id}")
async def api_leaderboard(scenario_id: str):
    return db.get_leaderboard(scenario_id)
