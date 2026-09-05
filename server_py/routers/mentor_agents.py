from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from server_py.memoria.database import get_db, User
from server_py.mentoria.models import Agent
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/mentor", tags=["Mentor Agents"])

# ── Base agent templates seeded at startup ──────────────────────────────────
BASE_AGENTS = [
    {
        "name": "Razonamiento",
        "description": "Evaluador de habilidades de pensamiento lógico, análisis y resolución de problemas.",
        "competencies": ["Pensamiento Lógico", "Análisis Crítico", "Resolución de Problemas"],
        "system_prompt": "Eres un evaluador experto en razonamiento. Evalúa la capacidad del estudiante para analizar situaciones, identificar patrones y resolver problemas de forma lógica."
    },
    {
        "name": "Aprendizaje",
        "description": "Evaluador de hábitos de estudio, curiosidad intelectual y gestión del aprendizaje.",
        "competencies": ["Curiosidad Intelectual", "Metacognición", "Gestión del Aprendizaje"],
        "system_prompt": "Eres un evaluador de competencias de aprendizaje. Evalúa cómo el estudiante aprende, su capacidad de reflexión sobre su propio proceso y su motivación por el conocimiento."
    },
    {
        "name": "Criterio",
        "description": "Evaluador de pensamiento crítico, toma de decisiones y juicio ético.",
        "competencies": ["Pensamiento Crítico", "Toma de Decisiones", "Juicio Ético"],
        "system_prompt": "Eres un evaluador de criterio y juicio. Evalúa la capacidad del estudiante para analizar con objetividad, considerar perspectivas distintas y tomar decisiones razonadas y éticas."
    },
    {
        "name": "Adaptabilidad",
        "description": "Evaluador de flexibilidad, tolerancia al cambio y resiliencia ante retos.",
        "competencies": ["Flexibilidad Cognitiva", "Resiliencia", "Tolerancia a la Incertidumbre"],
        "system_prompt": "Eres un evaluador de adaptabilidad. Evalúa la capacidad del estudiante para ajustarse a nuevas situaciones, superar obstáculos y mantener el rendimiento ante cambios inesperados."
    },
    {
        "name": "Autonomía",
        "description": "Evaluador de la iniciativa propia, autodisciplina y gestión del tiempo.",
        "competencies": ["Autodisciplina", "Iniciativa", "Gestión del Tiempo"],
        "system_prompt": "Eres un evaluador de autonomía. Evalúa si el estudiante actúa con iniciativa, se organiza de forma independiente y asume responsabilidad sobre sus metas."
    },
    {
        "name": "Liderazgo",
        "description": "Evaluador de competencias de liderazgo, influencia y trabajo en equipo.",
        "competencies": ["Liderazgo", "Trabajo en Equipo", "Toma de Decisiones"],
        "system_prompt": "Eres un evaluador de habilidades de liderazgo. Evalúa la capacidad del estudiante para guiar, influir positivamente y colaborar con otros."
    },
    {
        "name": "Comunicación",
        "description": "Evaluador de habilidades comunicativas orales y escritas.",
        "competencies": ["Comunicación Oral", "Comunicación Escrita", "Escucha Activa"],
        "system_prompt": "Eres un evaluador de competencias comunicativas. Evalúa la claridad, coherencia y efectividad al expresar ideas y escuchar activamente."
    },
    {
        "name": "Personalizado",
        "description": "Plantilla vacía para crear un agente evaluador personalizado con criterios propios.",
        "competencies": [],
        "system_prompt": "Eres un evaluador personalizado. Define aquí el criterio y área de evaluación específicos para este agente."
    },
]


def check_is_mentor(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["teacher", "admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de mentor.")
    return user


def seed_base_agents(db: Session):
    """Seeds base agent templates if they don't exist."""
    existing = db.query(Agent).filter(Agent.is_template.is_(True)).count()
    if existing == 0:
        for a in BASE_AGENTS:
            db.add(Agent(
                name=a["name"],
                description=a["description"],
                system_prompt=a["system_prompt"],
                competencies=a["competencies"],
                is_template=True,
                creator_id=None
            ))
        db.commit()


class CreateAgentRequest(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    competencies: List[str] = []


@router.get("/agents")
async def list_agents(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Returns base template agents + agents created by any mentor (visible to all mentors).
    """
    check_is_mentor(current_user_id, db)

    # Ensure base templates exist
    seed_base_agents(db)

    templates = db.query(Agent).filter(Agent.is_template.is_(True)).all()
    custom = db.query(Agent).filter(Agent.is_template.is_(False)).all()

    def agent_to_dict(a: Agent, is_mine: bool = False):
        return {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "system_prompt": a.system_prompt,
            "competencies": a.competencies or [],
            "is_template": a.is_template,
            "creator_id": a.creator_id,
            "is_mine": is_mine,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }

    return {
        "templates": [agent_to_dict(a) for a in templates],
        "custom": [agent_to_dict(a, is_mine=(a.creator_id == current_user_id)) for a in custom]
    }


@router.post("/agents")
async def create_agent(req: CreateAgentRequest, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    """
    Creates a custom agent owned by the mentor.
    """
    check_is_mentor(current_user_id, db)

    agent = Agent(
        name=req.name,
        description=req.description,
        system_prompt=req.system_prompt,
        competencies=req.competencies,
        is_template=False,
        creator_id=current_user_id
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    return {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "competencies": agent.competencies,
        "is_template": agent.is_template
    }


    return {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "system_prompt": agent.system_prompt,
        "competencies": agent.competencies or [],
        "is_template": agent.is_template
    }


class AgentChatRequest(BaseModel):
    message: str


@router.post("/agents/{agent_id}/chat")
async def chat_with_agent(
    agent_id: int,
    req: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Permite probar en vivo las respuestas y evaluación de cualquier Agente IA de Mentoría.
    """
    check_is_mentor(current_user_id, db)
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    competencies_str = ", ".join(agent.competencies or [])
    system_prompt = (
        agent.system_prompt
        or f"Eres el agente evaluador {agent.name}. Evalúas las competencias: {competencies_str}."
    )

    try:
        from server_py.core.ai_wrapper import chat_complete
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message}
        ]
        reply = await chat_complete(messages=messages, user_key=f"user_{current_user_id}")
        return {
            "agent_id": agent.id,
            "agent_name": agent.name,
            "reply": reply,
            "status": "ok"
        }
    except Exception as e:
        return {
            "agent_id": agent.id,
            "agent_name": agent.name,
            "reply": f"🤖 [{agent.name}] (Modo Evaluador): Analizando la respuesta ante el parámetro '{req.message[:40]}...'. Competencias evaluadas: [{competencies_str}]. El estudiante demuestra capacidad de respuesta en el área objetivo.",
            "status": "simulated",
            "detail": str(e)
        }
