"""State machine for detecting student stuckness."""
from __future__ import annotations
from config import MICRO_STUCK_THRESHOLD, QUIZ_THRESHOLD, MOMENTUM_DROP_MINUTES

STATES = ("normal", "micro_stuck", "momentum_dip", "double_trouble")

class StateMachine:
    def __init__(self) -> None:
        self.current_state: str = "normal"
        self.history: list[str] = []

    def evaluate(self, metrics: dict) -> str:
        errors = metrics.get("error_count_last_10", 0)
        avg_quiz = metrics.get("avg_quiz_score_last_3", 100)
        study_trend = metrics.get("study_time_trend", 0)

        micro = errors >= MICRO_STUCK_THRESHOLD
        momentum = avg_quiz < QUIZ_THRESHOLD or study_trend <= -MOMENTUM_DROP_MINUTES

        if micro and momentum:
            state = "double_trouble"
        elif micro:
            state = "micro_stuck"
        elif momentum:
            state = "momentum_dip"
        else:
            state = "normal"

        self.current_state = state
        self.history.append(state)
        return state
