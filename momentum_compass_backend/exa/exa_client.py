"""Exa AI client wrapper with graceful fallbacks."""
from __future__ import annotations
from typing import Dict, Any
from config import EXA_API_KEY
from utils.logger import logger

class ExaClient:
    def __init__(self) -> None:
        self._client = None
        if EXA_API_KEY:
            try:
                from exa_py import Exa
                self._client = Exa(api_key=EXA_API_KEY)
                logger.info("Exa client initialized with API key")
            except Exception as e:
                logger.warning(f"Failed to init Exa client: {e}")
        else:
            logger.warning("No EXA_API_KEY set — using mock results")

    def _fallback(self, query: str) -> Dict[str, Any]:
        return {
            "title": f"Resource for: {query}",
            "url": "https://docs.python.org/3/tutorial/",
            "snippet": f"Fallback result for '{query}'. Set EXA_API_KEY for real results.",
        }

    async def get_code_context(self, query: str) -> Dict[str, Any]:
        if not self._client:
            return self._fallback(query)
        try:
            result = self._client.search(query, num_results=2, type="keyword")
            if result.results:
                r = result.results[0]
                return {"title": r.title or "", "url": r.url, "snippet": (r.text or "")[:300]}
            return self._fallback(query)
        except Exception as e:
            logger.warning(f"Exa code search failed: {e}")
            return self._fallback(query)

    async def web_search(self, query: str, deep: bool = False) -> Dict[str, Any]:
        if not self._client:
            return self._fallback(query)
        try:
            num = 5 if deep else 2
            result = self._client.search(query, num_results=num, type="neural")
            if result.results:
                r = result.results[0]
                return {"title": r.title or "", "url": r.url, "snippet": (r.text or "")[:500]}
            return self._fallback(query)
        except Exception as e:
            logger.warning(f"Exa web search failed: {e}")
            return self._fallback(query)
