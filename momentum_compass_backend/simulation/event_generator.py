"""Event formatting utilities."""
from typing import Dict, Any
from utils.helpers import now_iso

def format_event(event: Dict[str, Any], state: str, quest_title: str | None = None) -> Dict[str, Any]:
    return {
        "timestamp": now_iso(),
        "tick": event.get("tick", 0),
        "state": state,
        "topic": event.get("topic", "unknown"),
        "error_type": event.get("error_type"),
        "quiz_score": event.get("quiz_score"),
        "study_minutes": event.get("study_minutes"),
        "quest_generated": quest_title,
    }
