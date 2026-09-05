"""Módulo de generación de mensajes de bienvenida.

Este módulo define la función generate_welcome_message, que construye
un saludo personalizado para el usuario al inicio de sesión. El saludo
utiliza datos de exámenes previos como prueba de memoria y controla
la frecuencia para evitar spam.
"""
import datetime
from sqlalchemy.orm import Session
from server_py.config.app_config import client
from server_py.memoria.database import ExamResult, EleonorSession


async def generate_welcome_message(db: Session, user_id: int) -> dict:
    """Genera un mensaje de bienvenida personalizado para el usuario.

    Pasos:
        1. Recupera la sesión del usuario desde la base de datos.
        2. Controla la frecuencia del saludo (mínimo 30 minutos).
        3. Si existen exámenes previos, los menciona como prueba de memoria.
        4. Construye el prompt y llama al modelo de lenguaje.
        5. Registra el uso de tokens y actualiza la marca de tiempo.

    Args:
        db (Session): Sesión de base de datos activa.
        user_id (int): Identificador del usuario.

    Returns:
        dict: Contiene el texto del saludo y un flag `can_speak`.
    """
    try:
        # 1. Recuperar contexto
        session = (
            db.query(EleonorSession)
            .filter(EleonorSession.user_id == user_id)
            .first()
        )

        # Control de frecuencia (30 minutos)
        now = datetime.datetime.utcnow()
        if session and session.last_welcome_at:
            delta = now - session.last_welcome_at
            if delta.total_seconds() < 1800:
                print(
                    f"[WELCOME] Omitiendo saludo "
                    f"(último hace {int(delta.total_seconds())}s)",
                    flush=True,
                )
                return {"text": None, "can_speak": False}

        latest_exam = (
            db.query(ExamResult)
            .filter(ExamResult.user_id == user_id)
            .order_by(ExamResult.timestamp.desc())
            .first()
        )

        user_context = "El usuario no ha realizado ningún examen aún."
        if latest_exam:
            exam_summary = (
                f"Último examen: {latest_exam.area} "
                f"(Score: {latest_exam.score}). "
                f"Fecha: {latest_exam.timestamp}"
            )
            user_context = (
                f"El usuario tiene un historial. {exam_summary}. "
                "Úsalo para demostrar que lo recuerdas."
            )

        # 2. Construir prompt
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

        # 3. Llamar al modelo
        print(f"👋 [WELCOME] Generando saludo para User {user_id}...", flush=True)
        completion = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=False,
            max_tokens=100
        )

        response_text = completion.choices[0].message.content

        # 4. Registrar tokens
        if completion.usage:
            usage_data = completion.usage
            print(
                f"[WELCOME TOKENS] Prompt: {usage_data.prompt_tokens} | "
                f"Completion: {usage_data.completion_tokens} | "
                f"Total: {usage_data.total_tokens}",
                flush=True,
            )

        # Actualizar timestamp persistente
        if session:
            session.last_welcome_at = now
            db.commit()

        return {
            "text": response_text,
            "can_speak": True
        }

    except Exception as error:
        print(f"Error generating welcome message: {error}")
        return {
            "text": "Hola. Estoy lista para continuar.",
            "can_speak": True
        }
