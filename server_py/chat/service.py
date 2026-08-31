from server_py.config.app_config import client


class ChatService:
    async def stream_response(self, prompt: str, cognitive_context: str = "", history: list = []):
        """
        Generates a streaming response from OpenAI.
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
                    u = chunk.usage
                    print(f"📊 [ChatService] Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens}")

            yield {"type": "done", "content": full_content}

        except Exception as e:
            print(f"❌ [ChatService] Error: {e}")
            yield {"type": "error", "content": str(e)}


chat_service = ChatService()
