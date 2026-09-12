"""Módulo de servicio de chat.

Este módulo define la clase ChatService, encargada de generar respuestas
en streaming desde el modelo de lenguaje. Se construyen mensajes con
contexto cognitivo e historial, se envían al cliente OpenAI y se procesan
los fragmentos de texto recibidos junto con métricas de uso.
"""
from server_py.config.app_config import client


class ChatService:
    async def stream_response(
        self,
        prompt: str,
        cognitive_context: str = "",
        history: list = [],
    ):
        """Genera una respuesta en streaming desde el modelo de lenguaje.

        Pasos:
        1. Construye los mensajes con contexto cognitivo e historial.
        2. Envía el prompt al cliente OpenAI.
        3. Procesa el flujo de tokens recibidos.
        4. Devuelve texto parcial, métricas de uso y estado final.

        Args:
        prompt (str): Texto enviado por el usuario.
        cognitive_context (str): Contexto cognitivo adicional.
        history (list): Historial de mensajes previos.

        Yields:
        dict: Eventos de tipo 'text', 'done' o 'error'.
        """
        messages = [{"role": "system", "content": cognitive_context}] + history
        if prompt:
            messages.append({"role": "user", "content": prompt})

        try:
            stream = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                stream=True,
                stream_options={"include_usage": True}
            )

            full_content = ""
            async for chunk in stream:
                if chunk.choices:
                    delta = chunk.choices[0].delta.content or ""
                    full_content += delta
                    yield {"type": "text", "content": delta}

                if chunk.usage:
                    usage_data = chunk.usage
                    print(
                        f"[ChatService] Prompt: {usage_data.prompt_tokens} "
                        f"| Completion: {usage_data.completion_tokens}"
                    )

            yield {"type": "done", "content": full_content}

        except Exception as error:
            print(f"[ChatService] Error: {error}")
            yield {"type": "error", "content": str(error)}


chat_service = ChatService()
