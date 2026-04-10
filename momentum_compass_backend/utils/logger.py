"""Structured logging for the agent system."""
import logging
from utils.helpers import now_iso

logger = logging.getLogger("momentum")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(handler)
