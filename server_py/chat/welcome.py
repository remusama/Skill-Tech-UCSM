import json
from sqlalchemy.orm import Session
from server_py.memoria.database import ExamResult, EleonorSession
from server_py.config.app_config import client
import datetime

async def generate_welcome_message(db: Session, user_id: int) -> dict:
    """
    Generates a personalized welcome message for the user.
    If the user has taken an exam, Eleonor mentions it as proof of memory.
    Logs token usage to the backend console.
    Checks `last_welcome_at` to avoid spamming on reconnections.
    """
    try:
        # 1. Fetch Context
        session = db.query(EleonorSession).filter(EleonorSession.user_id == user_id).first()
        
        # Check flood control (30 mins)
        now = datetime.datetime.utcnow()
        if session and session.last_welcome_at:
            delta = now - session.last_welcome_at
            if delta.total_seconds() < 1800: # 30 minutes
                print(f"⏱️ [WELCOME] Skipping welcome (last was {int(delta.total_seconds())}s ago)", flush=True)
                return {"text": None, "can_speak": False}

        latest_exam = db.query(ExamResult).filter(ExamResult.user_id == user_id).order_by(ExamResult.timestamp.desc()).first()
        
        user_context = "El usuario no ha realizado ningún examen aún."
        if latest_exam:
            # Simplificamos los datos para no saturar el prompt
            exam_summary = f"Último examen: {latest_exam.area} (Score: {latest_exam.score}). Fecha: {latest_exam.timestamp}"
            user_context = f"El usuario tiene un historial. {exam_summary}. Úsalo para demostrar que lo recuerdas."

        # 2. Build Prompt
        system_prompt = f"""
        Eres Eleonor. Estás saludando al usuario al inicio de una sesión.
        Tu objetivo es demostrar que tienes MEMORIA.
        
        CONTEXTO DEL USUARIO:
        {user_context}
        
        INSTRUCCIONES:
        - Saluda brevemente.
        - Si hay datos de examen, MENCIÓNALOS sutilmente para confirmar que "sabes" cómo le fue.
        - Ejemplo: "Hola, veo que tu último examen de Lógica fue interesante..."
        - No seas técnica, sé cercana.
        - Mantén el mensaje corto (máx 2 frases).
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Genera mi saludo de bienvenida."}
        ]

        # 3. Call LLM
        print(f"👋 [WELCOME] Generando saludo para User {user_id}...", flush=True)
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=False, # No streaming for welcome message to keep it simple
            max_tokens=100
        )

        response_text = completion.choices[0].message.content
        
        # 4. Log Tokens
        if completion.usage:
            u = completion.usage
            print(f"📊 [WELCOME TOKENS] Prompt: {u.prompt_tokens} | Completion: {u.completion_tokens} | Total: {u.total_tokens}", flush=True)

        # Update persistent timestamp
        if session:
            session.last_welcome_at = now
            db.commit()

        return {
            "text": response_text,
            "can_speak": True
        }

    except Exception as e:
        print(f"❌ Error generating welcome message: {e}")
        return {
            "text": "Hola. Estoy lista para continuar.",
            "can_speak": True
        }
