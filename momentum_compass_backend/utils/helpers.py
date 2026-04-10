"""Utility helpers."""
import uuid
from datetime import datetime

def gen_id() -> str:
    return uuid.uuid4().hex[:8]

def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"
