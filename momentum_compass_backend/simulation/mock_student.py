"""Simulated student that generates learning events."""
from __future__ import annotations
import random
from dataclasses import dataclass, field
from typing import List, Dict, Any
from utils.helpers import now_iso

ERROR_TYPES = ["IndexError", "NameError", "TypeError", "KeyError", "RecursionError"]
TOPICS = ["recursion", "arrays", "linked_lists", "sorting", "dynamic_programming", "graphs"]

@dataclass
class MockStudent:
    name: str = "Alex"
    current_topic: str = field(default_factory=lambda: random.choice(TOPICS))
    error_log: List[Dict[str, str]] = field(default_factory=list)
    quiz_scores: List[float] = field(default_factory=list)
    study_minutes_history: List[int] = field(default_factory=lambda: [45, 50, 40])
    tick_count: int = 0
    _forced_state: str | None = None

    def force_state(self, state: str) -> None:
        self._forced_state = state

    def clear_force(self) -> None:
        self._forced_state = None

    def tick(self) -> Dict[str, Any]:
        self.tick_count += 1
        event: Dict[str, Any] = {"tick": self.tick_count, "timestamp": now_iso(), "topic": self.current_topic}

        if self._forced_state == "micro_stuck":
            for _ in range(5):
                err = random.choice(ERROR_TYPES)
                self.error_log.append({"type": err, "msg": f"{err}: simulated forced error", "ts": now_iso()})
            event["errors"] = 5
            event["error_type"] = self.error_log[-1]["type"]
            event["error_msg"] = self.error_log[-1]["msg"]
        elif self._forced_state == "momentum_dip":
            self.quiz_scores.append(random.uniform(30, 60))
            self.study_minutes_history.append(random.randint(5, 15))
            event["quiz_score"] = self.quiz_scores[-1]
            event["study_minutes"] = self.study_minutes_history[-1]
        elif self._forced_state == "double_trouble":
            for _ in range(5):
                err = random.choice(ERROR_TYPES)
                self.error_log.append({"type": err, "msg": f"{err}: forced", "ts": now_iso()})
            self.quiz_scores.append(random.uniform(20, 50))
            self.study_minutes_history.append(random.randint(2, 10))
            event["errors"] = 5
            event["error_type"] = self.error_log[-1]["type"]
            event["error_msg"] = self.error_log[-1]["msg"]
            event["quiz_score"] = self.quiz_scores[-1]
            event["study_minutes"] = self.study_minutes_history[-1]
        else:
            # Natural randomness
            if random.random() < 0.35:
                err = random.choice(ERROR_TYPES)
                self.error_log.append({"type": err, "msg": f"{err}: something went wrong in {self.current_topic}", "ts": now_iso()})
                event["error_type"] = err
                event["error_msg"] = self.error_log[-1]["msg"]
            if random.random() < 0.2:
                score = random.uniform(40, 100)
                self.quiz_scores.append(score)
                event["quiz_score"] = score
            study = random.randint(10, 60)
            self.study_minutes_history.append(study)
            event["study_minutes"] = study

        if random.random() < 0.1:
            self.current_topic = random.choice(TOPICS)
            event["topic_change"] = self.current_topic

        return event

    def get_metrics(self) -> Dict[str, Any]:
        recent_errors = self.error_log[-10:] if self.error_log else []
        recent_quizzes = self.quiz_scores[-3:] if self.quiz_scores else [80]
        recent_study = self.study_minutes_history[-3:] if self.study_minutes_history else [45]
        study_trend = recent_study[-1] - recent_study[0] if len(recent_study) >= 2 else 0

        return {
            "error_count_last_10": len(recent_errors),
            "avg_quiz_score_last_3": sum(recent_quizzes) / len(recent_quizzes),
            "study_time_trend": study_trend,
            "current_topic": self.current_topic,
            "last_error": recent_errors[-1] if recent_errors else None,
            "total_ticks": self.tick_count,
        }
