"""Quest generation engine with templates per state."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from utils.helpers import gen_id, now_iso
from gamification.xp_system import XPSystem

QUEST_TEMPLATES = {
    "micro_stuck": {
        "title": "Escape the {error_type} Labyrinth",
        "description": "You've been hitting {error_type} errors. Let's fix this!",
        "steps": ["Read the error message carefully", "Check the Exa resource", "Fix the bug", "Run your code again"],
        "xp_reward": 30,
    },
    "momentum_dip": {
        "title": "Rediscover {topic}",
        "description": "Your momentum has dipped on {topic}. Time to recharge!",
        "steps": ["Review the basics of {topic}", "Complete a mini-exercise", "Take a quiz"],
        "xp_reward": 50,
    },
    "double_trouble": {
        "title": "The Great Recovery: {topic}",
        "description": "Both errors and momentum are down. Time for a full recovery on {topic}!",
        "steps": ["Pause and breathe", "Review {topic} fundamentals", "Fix the {error_type} bug", "Complete a challenge", "Celebrate!"],
        "xp_reward": 100,
    },
}

@dataclass
class QuestEngine:
    xp_system: XPSystem = field(default_factory=XPSystem)
    active_quests: List[Dict[str, Any]] = field(default_factory=list)
    completed_quests: List[Dict[str, Any]] = field(default_factory=list)

    def generate_quest(self, state: str, error_type: str = "Error", topic: str = "python", resource_url: str = "") -> Dict[str, Any]:
        template = QUEST_TEMPLATES.get(state, QUEST_TEMPLATES["micro_stuck"])
        quest = {
            "id": gen_id(),
            "title": template["title"].format(error_type=error_type, topic=topic),
            "description": template["description"].format(error_type=error_type, topic=topic),
            "steps": [s.format(error_type=error_type, topic=topic) for s in template["steps"]],
            "xp_reward": template["xp_reward"],
            "resource_url": resource_url,
            "state": state,
            "status": "active",
            "created_at": now_iso(),
        }
        self.active_quests.append(quest)
        return quest

    def complete_quest(self, quest_id: str) -> Optional[Dict[str, Any]]:
        for i, q in enumerate(self.active_quests):
            if q["id"] == quest_id:
                q["status"] = "completed"
                q["completed_at"] = now_iso()
                self.completed_quests.append(q)
                self.active_quests.pop(i)
                xp_entry = self.xp_system.add_xp(q["xp_reward"], q["title"])
                return {**q, "xp_update": xp_entry}
        return None

    def get_stats(self) -> Dict[str, Any]:
        return {
            "active_quests": len(self.active_quests),
            "completed_quests": len(self.completed_quests),
            **self.xp_system.to_dict(),
        }
