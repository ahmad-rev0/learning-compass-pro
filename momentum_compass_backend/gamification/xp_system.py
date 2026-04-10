"""XP and streak tracking system."""
from __future__ import annotations
from dataclasses import dataclass, field

MOTIVATION_MESSAGES = [
    "You're on fire! Keep the momentum going! 🔥",
    "Every bug squashed makes you stronger! 💪",
    "Learning is a journey, not a sprint. You've got this! 🚀",
    "Consistency beats intensity. Nice streak! ⚡",
    "The best programmers debug the most. Keep going! 🧠",
]

@dataclass
class XPSystem:
    total_xp: int = 0
    streak: int = 0
    level: int = 1
    history: list[dict] = field(default_factory=list)

    def add_xp(self, amount: int, reason: str) -> dict:
        self.total_xp += amount
        self.streak += 1
        old_level = self.level
        self.level = 1 + self.total_xp // 100
        entry = {
            "xp_gained": amount,
            "reason": reason,
            "total_xp": self.total_xp,
            "streak": self.streak,
            "level": self.level,
            "leveled_up": self.level > old_level,
        }
        self.history.append(entry)
        return entry

    def break_streak(self) -> None:
        self.streak = 0

    def get_motivation(self) -> str:
        import random
        base = random.choice(MOTIVATION_MESSAGES)
        if self.streak >= 5:
            base += f" 🔥 {self.streak}-quest streak!"
        if self.level > 1:
            base += f" Level {self.level} achieved!"
        return base

    def to_dict(self) -> dict:
        return {
            "total_xp": self.total_xp,
            "streak": self.streak,
            "level": self.level,
            "motivation": self.get_motivation(),
        }
