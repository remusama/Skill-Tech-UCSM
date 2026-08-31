import time
from fastapi import APIRouter, HTTPException, Body
from openai import AsyncOpenAI
from server_py.config import settings
from server_py.core.structured_logger import get_logger

logger = get_logger("vision")

router = APIRouter(prefix="/api/vision", tags=["vision"])
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


@router.post("/analyze")
async def analyze_frame(payload: dict = Body(...)):
    """
    Recibe una imagen en Base64 y devuelve un análisis visual usando GPT-4o.
    """
    try:
        image_base64 = payload.get("image_base64")
        if not image_base64:
            logger.error("Error: No se recibió image_base64 en el body")
            raise HTTPException(status_code=400, detail="Falta image_base64")

        logger.info(f"Procesando frame ({len(image_base64)} caracteres)...")

        # Limpiar prefijo data:image/jpeg;base64, si existe
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]

        start_time = time.time()

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text",
                            "text": "Analiza brevemente: expresión facial (emoción), atención y objetos clave. Máximo 20 palabras."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "low"
                            },
                        },
                    ],
                }
            ],
            max_tokens=50,
        )

        content = response.choices[0].message.content
        latency = time.time() - start_time

        # Log de tokens sin emojis
        if response.usage:
            u = response.usage
            logger.info(
                f"Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens} | Latency: {latency:.2f}s",
                extra={"extra_fields": {"prompt_tokens": u.prompt_tokens,
                                        "completion_tokens": u.completion_tokens, "total_tokens": u.total_tokens, "latency": latency}}
            )

        return {
            "analysis": content,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Error procesando visión: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
