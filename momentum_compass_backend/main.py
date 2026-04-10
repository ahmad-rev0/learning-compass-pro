"""FastAPI backend for the Momentum & Stuckness Compass."""
from __future__ import annotations
import asyncio
import random
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import EVAL_INTERVAL, TICK_INTERVAL_SECONDS
from simulation.mock_student import MockStudent
from simulation.event_generator import format_event
from agent.agent_core import Agent
from exa.exa_client import ExaClient
from gamification.quest_engine import QuestEngine
from utils.logger import logger

# ── Global state ──
student = MockStudent()
exa_client = ExaClient()
quest_engine = QuestEngine()
agent = Agent(exa_client=exa_client, quest_engine=quest_engine)

simulation_running = False
simulation_task: asyncio.Task | None = None
event_log: List[Dict[str, Any]] = []
MAX_EVENTS = 200


async def simulation_loop() -> None:
    global simulation_running
    logger.info("Simulation started")
    while simulation_running:
        event = student.tick()
        state = "normal"
        quest_title = None

        if student.tick_count % EVAL_INTERVAL == 0:
            metrics = student.get_metrics()
            state = agent.evaluate(metrics)

            if state != "normal":
                quest = await agent.act(state, {**event, **metrics})
                if quest:
                    quest_title = quest["title"]
                    # Auto-complete with 60% chance
                    if random.random() < 0.6:
                        result = quest_engine.complete_quest(quest["id"])
                        if result:
                            logger.info(f"Quest auto-completed: {quest['title']} (+{quest['xp_reward']} XP)")

            student.clear_force()

        log_entry = format_event(event, state, quest_title)
        event_log.append(log_entry)
        if len(event_log) > MAX_EVENTS:
            event_log.pop(0)

        await asyncio.sleep(TICK_INTERVAL_SECONDS)

    logger.info("Simulation stopped")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    global simulation_running, simulation_task
    simulation_running = False
    if simulation_task:
        simulation_task.cancel()


app = FastAPI(title="Momentum Compass API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "Momentum & Stuckness Compass API"}


@app.post("/api/simulation/start")
async def start_simulation():
    global simulation_running, simulation_task
    if simulation_running:
        return {"status": "already_running"}
    simulation_running = True
    simulation_task = asyncio.create_task(simulation_loop())
    return {"status": "started"}


@app.post("/api/simulation/stop")
async def stop_simulation():
    global simulation_running
    simulation_running = False
    return {"status": "stopped"}


@app.post("/api/simulation/reset")
async def reset_simulation():
    global simulation_running, student, quest_engine, agent, event_log
    simulation_running = False
    await asyncio.sleep(0.2)
    student = MockStudent()
    quest_engine = QuestEngine()
    agent = Agent(exa_client=exa_client, quest_engine=quest_engine)
    event_log.clear()
    return {"status": "reset"}


@app.get("/api/state")
def get_state():
    metrics = student.get_metrics()
    return {
        "state": agent.state_machine.current_state,
        "metrics": metrics,
        "simulation_running": simulation_running,
        "student_name": student.name,
    }


@app.get("/api/quests")
def get_quests():
    return {
        "active": quest_engine.active_quests,
        "completed": quest_engine.completed_quests[-20:],
    }


@app.get("/api/events")
def get_events(limit: int = 50):
    return {"events": event_log[-limit:]}


@app.get("/api/stats")
def get_stats():
    return quest_engine.get_stats()


@app.post("/api/trigger/{state}")
async def trigger_state(state: str):
    valid = ["micro_stuck", "momentum_dip", "double_trouble"]
    if state not in valid:
        raise HTTPException(400, f"Invalid state. Use one of: {valid}")
    student.force_state(state)
    return {"status": f"forced_{state}", "message": f"Next evaluation will trigger {state}"}
