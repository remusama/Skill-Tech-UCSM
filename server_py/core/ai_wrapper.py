"""Interfaz central para realizar llamadas asíncronas a OpenAI.

Gestiona el conteo de tokens, las cuotas de uso por usuario, los reintentos
ante errores de límite y el registro estructurado de las solicitudes.
"""
import asyncio
import time
from typing import Optional

import tiktoken
from openai import APIStatusError, AsyncOpenAI, RateLimitError

from server_py.config import settings
from server_py.core.structured_logger import get_logger

logger = get_logger("ai_wrapper")

DAILY_TOKEN_LIMIT = int(
    getattr(settings, "DAILY_TOKEN_LIMIT", 50_000)
)

# Contador de tokens por usuario durante la vida del proceso.
_token_usage: dict[str, int] = {}


def get_tokens_used(user_key: str) -> int:
    """Obtiene el total de tokens registrados para un usuario."""
    return _token_usage.get(user_key, 0)


def _count_tokens(
    text: str,
    model: str = "gpt-4o-mini",
) -> int:
    """Cuenta los tokens de un texto usando el modelo indicado."""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        return len(text) // 4


# Cliente asíncrono compartido.
_openai_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    """Obtiene el cliente compartido de OpenAI."""
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        )
    return _openai_client


async def chat_complete(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    user_key: str = "anonymous",
    json_output: bool = False,
    max_retries: int = 3,
) -> str:
    """Realiza una solicitud asíncrona de chat a OpenAI.

    Verifica la cuota de tokens antes de la llamada, cuenta el consumo
    posterior, aplica reintentos y registra información de observabilidad.

    Args:
        messages: Mensajes con el formato esperado por OpenAI.
        model: Identificador del modelo que se utilizará.
        user_key: Identificador del usuario o sesión.
        json_output: Solicita una respuesta en formato JSON cuando es True.
        max_retries: Número total de intentos permitidos.

    Returns:
        Contenido de la respuesta del asistente.

    Raises:
        ValueError: Si se supera la cuota diaria de tokens.
        APIStatusError: Si OpenAI devuelve un error no recuperable.
        RuntimeError: Si se agotan todos los intentos disponibles.
    """

    current_usage = get_tokens_used(user_key)

    if current_usage >= DAILY_TOKEN_LIMIT:
        logger.error(
            "Token quota exceeded for user_key=%s: %s/%s",
            user_key,
            current_usage,
            DAILY_TOKEN_LIMIT,
        )
        raise ValueError(
            "Daily token quota exceeded "
            f"({current_usage}/{DAILY_TOKEN_LIMIT} tokens)."
        )

    prompt_text = " ".join(
        message.get("content", "")
        for message in messages
        if isinstance(message.get("content"), str)
    )
    estimated_prompt_tokens = _count_tokens(prompt_text, model)

    if current_usage + estimated_prompt_tokens > DAILY_TOKEN_LIMIT:
        logger.error(
            "Estimated prompt tokens would exceed quota for user_key=%s",
            user_key,
        )
        raise ValueError("Request exceeds remaining daily token quota.")

    client = get_openai_client()
    request_kwargs: dict = {
        "model": model,
        "messages": messages,
    }

    if json_output:
        request_kwargs["response_format"] = {"type": "json_object"}

    last_error: Optional[Exception] = None

    for attempt in range(max_retries):
        try:
            start_time = time.perf_counter()
            response = await client.chat.completions.create(
                **request_kwargs
            )
            latency = time.perf_counter() - start_time

            content = response.choices[0].message.content or ""
            usage = response.usage

            tokens_prompt = (
                usage.prompt_tokens
                if usage
                else estimated_prompt_tokens
            )
            tokens_completion = (
                usage.completion_tokens
                if usage
                else _count_tokens(content, model)
            )
            tokens_total = (
                usage.total_tokens
                if usage
                else tokens_prompt + tokens_completion
            )

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

        except RateLimitError as error:
            wait_time = (2**attempt) + 0.5
            logger.error(
                "chat_complete: RateLimitError on attempt %s/%s. "
                "Retrying in %ss. Error: %s",
                attempt + 1,
                max_retries,
                wait_time,
                error,
            )
            last_error = error
            await asyncio.sleep(wait_time)

        except APIStatusError as error:
            logger.error(
                "chat_complete: APIStatusError on attempt %s: %s",
                attempt + 1,
                error,
            )
            raise

        except Exception as error:
            logger.error(
                "chat_complete: Unexpected error on attempt %s: %s",
                attempt + 1,
                error,
                exc_info=True,
            )
            last_error = error
            await asyncio.sleep(1)

    raise RuntimeError(
        f"chat_complete: All {max_retries} retries exhausted. "
        f"Last error: {last_error}"
    )
