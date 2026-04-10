"""Core agent that orchestrates detection, Exa search, and quest generation."""
from __future__ import annotations
from typing import Dict, Any, Optional
from agent.state_machine import StateMachine
from exa.exa_client import ExaClient
from gamification.quest_engine import QuestEngine
from utils.logger import logger

class Agent:
    def __init__(self, exa_client: ExaClient, quest_engine: QuestEngine) -> None:
        self.state_machine = StateMachine()
        self.exa_client = exa_client
        self.quest_engine = quest_engine

    def evaluate(self, metrics: Dict[str, Any]) -> str:
        return self.state_machine.evaluate(metrics)

    async def act(self, state: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state == "normal":
            return None

        topic = context.get("topic", context.get("current_topic", "python"))
        error_msg = context.get("error_msg", "")
        error_type = context.get("error_type", "Error")

        exa_result: Dict[str, Any] = {"title": "", "url": "", "snippet": ""}

        try:
            if state == "micro_stuck":
                query = f"fix {error_type} {error_msg} python"
                exa_result = await self.exa_client.get_code_context(query)
            elif state == "momentum_dip":
                query = f"{topic} tutorial beginner python"
                exa_result = await self.exa_client.web_search(query)
            elif state == "double_trouble":
                query = f"{error_type} {topic} recover learning python"
                exa_result = await self.exa_client.web_search(query, deep=True)
        except Exception as e:
            logger.warning(f"Exa search failed: {e}")
            exa_result = {"title": f"Learn {topic}", "url": f"https://docs.python.org/3/tutorial/", "snippet": f"Fallback resource for {topic}"}

        quest = self.quest_engine.generate_quest(
            state=state,
            error_type=error_type,
            topic=topic,
            resource_url=exa_result.get("url", ""),
        )
        quest["exa_result"] = exa_result

        logger.info(f"Agent acted: state={state}, quest={quest['title']}")
        return quest
