"""Core agent that orchestrates detection, Exa search, and quest generation."""
from __future__ import annotations
from typing import Dict, Any, Optional, List
from agent.state_machine import StateMachine
from exa.exa_client import ExaClient
from gamification.quest_engine import QuestEngine
from utils.logger import logger

# Side quest topic templates — supplementary knowledge adjacent to the main topic
SIDEQUEST_TOPICS = {
    "python": [
        ("Python decorators and metaprogramming", "python decorators advanced patterns"),
        ("Command-line tools with Python", "build CLI tools python click argparse"),
        ("Python testing best practices", "python unit testing pytest best practices"),
    ],
    "data structures": [
        ("Graph algorithms visualization", "graph algorithms interactive tutorial"),
        ("Bloom filters and probabilistic data structures", "bloom filter probabilistic data structures tutorial"),
    ],
    "oop": [
        ("Design patterns in real-world apps", "design patterns python real world examples"),
        ("SOLID principles deep dive", "SOLID principles python examples tutorial"),
    ],
    "ai": [
        ("Neural network math from scratch", "neural network math backpropagation tutorial"),
        ("Prompt engineering techniques", "prompt engineering best practices guide"),
    ],
    "default": [
        ("Version control mastery", "git advanced workflows rebase cherry-pick"),
        ("Clean code principles", "clean code python best practices readability"),
        ("Debugging like a pro", "debugging techniques python pdb strategies"),
    ],
}


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
            exa_result = {"title": f"Learn {topic}", "url": "https://docs.python.org/3/tutorial/", "snippet": f"Fallback resource for {topic}"}

        quest = self.quest_engine.generate_quest(
            state=state,
            error_type=error_type,
            topic=topic,
            resource_url=exa_result.get("url", ""),
        )
        quest["exa_result"] = exa_result

        logger.info(f"Agent acted: state={state}, quest={quest['title']}")
        return quest

    async def generate_side_quests(self, context: Dict[str, Any], count: int = 2) -> List[Dict[str, Any]]:
        """Generate supplementary side quests using Exa to find bonus learning resources."""
        topic = context.get("topic", context.get("current_topic", "python"))
        topic_key = topic.lower()

        # Find matching topic templates or fall back to defaults
        templates = SIDEQUEST_TOPICS.get(topic_key, SIDEQUEST_TOPICS["default"])

        side_quests: List[Dict[str, Any]] = []
        for title_template, search_query in templates[:count]:
            exa_result: Dict[str, Any] = {"title": "", "url": "", "snippet": ""}
            try:
                exa_result = await self.exa_client.web_search(search_query)
            except Exception as e:
                logger.warning(f"Exa side quest search failed: {e}")
                exa_result = {
                    "title": title_template,
                    "url": "https://docs.python.org/3/tutorial/",
                    "snippet": f"Explore: {title_template}",
                }

            quest = self.quest_engine.generate_quest(
                state="sidequest",
                error_type="",
                topic=title_template,
                resource_url=exa_result.get("url", ""),
            )
            quest["exa_result"] = exa_result
            quest["type"] = "sidequest"
            side_quests.append(quest)
            logger.info(f"Side quest generated: {quest['title']}")

        return side_quests
