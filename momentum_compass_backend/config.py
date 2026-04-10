"""Configuration for the Momentum Compass system."""
import os
from dotenv import load_dotenv

load_dotenv()

EXA_API_KEY: str = os.getenv("EXA_API_KEY", "")

# Stuckness thresholds
MICRO_STUCK_THRESHOLD: int = 3          # errors per 10 min
MOMENTUM_DROP_MINUTES: int = 15         # study-time drop threshold
QUIZ_THRESHOLD: float = 70.0           # score below = struggling

# Simulation
SIMULATION_MINUTES: int = 60
EVAL_INTERVAL: int = 5                 # evaluate every N ticks
TICK_INTERVAL_SECONDS: float = 1.0     # real-time seconds per tick
