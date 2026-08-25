"""
AI Wrapper (PR F) — Central interface for all LLM API calls.

Features:
- Token counting via tiktoken before each call
- Per-user daily token quota enforcement (stored in-process dict; upgrade to Redis in prod)
- Exponential backoff on rate-limit (429) errors
- Structured logging of every call: tokens_used, provider_latency, model
- Single import point for all routers — never import openai directly in route handlers
"""
import asyncio
import time
from typing import Optional

import tiktoken
from openai import AsyncOpenAI, RateLimitError, APIStatusError

from server_py.config import settings
from server_py.core.structured_logger import get_logger

logger = get_logger("ai_wrapper")

# ─────────────────────────────────────────────────────────────────────────────
# Token quota configuration (in-process; swap to Redis for multi-worker setups)
# ─────────────────────────────────────────────────────────────────────────────
DAILY_TOKEN_LIMIT = int(getattr(settings, "DAILY_TOKEN_LIMIT", 50_000))  # tokens/user/day

# Simple in-memory counter: {user_id -> token_count_today}
# Reset is not automatic here — for production use a Redis key with TTL=86400
_token_usage: dict[str, int] = {}


def get_tokens_used(user_key: str) -> int:
    return _token_usage.get(user_key, 0)


def _count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    try:
        enc = tiktoken.encoding_for_model(model)
        return len(enc.encode(text))
    except Exception:
        return len(text) // 4  # safe fallback


# ─────────────────────────────────────────────────────────────────────────────
# Shared async client (singleton)
# ─────────────────────────────────────────────────────────────────────────────
_openai_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


# ─────────────────────────────────────────────────────────────────────────────
# Core wrapper function
# ─────────────────────────────────────────────────────────────────────────────
async def chat_complete(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    user_key: str = "anonymous",
    json_output: bool = False,
    max_retries: int = 3,
) -> str:
    """
    Call OpenAI chat completions with:
      - quota check before the call
      - token counting after the call
      - exponential backoff on rate limit (429)
      - structured logging for observability

    Args:
        messages: OpenAI-format message list.
        model: Model identifier.
        user_key: Unique key per user/session (for quota tracking).
        json_output: If True, requests JSON-only response_format.
        max_retries: Number of retry attempts on rate limit.

    Returns:
        The assistant message content as a string.

    Raises:
        ValueError: If user has exceeded their daily token quota.
        APIStatusError: On non-recoverable API errors.
    """
    # Pre-call quota check
    current_usage = get_tokens_used(user_key)
    if current_usage >= DAILY_TOKEN_LIMIT:
        logger.error(f"Token quota exceeded for user_key={user_key}: {current_usage}/{DAILY_TOKEN_LIMIT}")
        raise ValueError(f"Daily token quota exceeded ({current_usage}/{DAILY_TOKEN_LIMIT} tokens).")

    # Estimate prompt tokens upfront for early rejection
    prompt_text = " ".join(m.get("content", "") for m in messages if isinstance(m.get("content"), str))
    estimated_prompt_tokens = _count_tokens(prompt_text, model)

    if current_usage + estimated_prompt_tokens > DAILY_TOKEN_LIMIT:
        logger.error(f"Estimated prompt tokens would exceed quota for user_key={user_key}")
        raise ValueError("Request exceeds remaining daily token quota.")

    client = get_openai_client()
    kwargs: dict = {
        "model": model,
        "messages": messages,
    }
    if json_output:
        kwargs["response_format"] = {"type": "json_object"}

    # Retry loop with exponential backoff
    last_error: Optional[Exception] = None
    for attempt in range(max_retries):
        try:
            t_start = time.perf_counter()
            response = await client.chat.completions.create(**kwargs)
            latency = time.perf_counter() - t_start

            content = response.choices[0].message.content or ""
            usage = response.usage

            tokens_prompt = usage.prompt_tokens if usage else estimated_prompt_tokens
            tokens_completion = usage.completion_tokens if usage else _count_tokens(content, model)
            tokens_total = usage.total_tokens if usage else (tokens_prompt + tokens_completion)

            # Update in-process usage counter
            _token_usage[user_key] = current_usage + tokens_total

            logger.info(
                "chat_complete: success",
                extra={
                    "extra_fields": {
                        "user_key": user_key,
                        "model": model,
                        "tokens_prompt": tokens_prompt,
                        "tokens_completion": tokens_completion,
                        "tokens_total": tokens_total,
                        "latency_s": round(latency, 3),
                        "attempt": attempt + 1,
                    }
                },
            )
            return content

        except RateLimitError as e:
            wait = (2 ** attempt) + 0.5
            logger.error(f"chat_complete: RateLimitError on attempt {attempt + 1}/{max_retries}. Retrying in {wait}s. Error: {e}")
            last_error = e
            await asyncio.sleep(wait)

        except APIStatusError as e:
            logger.error(f"chat_complete: APIStatusError (non-retriable) on attempt {attempt + 1}: {e}")
            raise

        except Exception as e:
            logger.error(f"chat_complete: Unexpected error on attempt {attempt + 1}: {e}", exc_info=True)
            last_error = e
            await asyncio.sleep(1)

    raise RuntimeError(f"chat_complete: All {max_retries} retries exhausted. Last error: {last_error}")
