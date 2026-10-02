from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from server_py.memoria.database import get_db
from server_py.memoria.skills import update_user_skills
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis/ccl", tags=["CCL"])


class CCLAnswer(BaseModel):
    itemId: int
    value: int


class CCLSubmission(BaseModel):
    answers: List[CCLAnswer]


DIMENSIONS = {
    "mando_crisis": {1, 7, 13, 19, 25, 31},
    "vision_inspiracion": {2, 8, 14, 20, 26, 32},
    "empatia_vinculo": {3, 9, 15, 21, 27, 33},
    "decision_participativa": {4, 10, 16, 22, 28, 34},
    "altos_estandares": {5, 11, 17, 23, 29, 35},
    "coaching_desarrollo": {6, 12, 18, 24, 30, 36},
}

DIMENSION_LABEL = {
    "mando_crisis": "Mando en crisis",
    "vision_inspiracion": "Visión e inspiración",
    "empatia_vinculo": "Empatía y vínculo",
    "decision_participativa": "Decisión participativa",
    "altos_estandares": "Altos estándares (pace-setting)",
    "coaching_desarrollo": "Coaching y desarrollo de personas",
}


def get_level(score: int) -> str:
    if score <= 13:
        return "bajo"
    if score <= 21:
        return "medio"
    return "alto"


@router.post("/submit")
async def submit_ccl(
    submission: CCLSubmission,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    scores = {dim: 0 for dim in DIMENSIONS}
    for ans in submission.answers:
        for dim, items in DIMENSIONS.items():
            if ans.itemId in items:
                scores[dim] += ans.value
                break
    levels = {dim: get_level(s) for dim, s in scores.items()}
    total = sum(scores.values())
    nivel_general = round((total / (36 * 5)) * 100)
    fortalezas = [DIMENSION_LABEL[d] for d, lvl in levels.items() if lvl == "alto"]
    areas_desarrollo = [DIMENSION_LABEL[d] for d, lvl in levels.items() if lvl == "bajo"]
    ai_diag = {
        "nivel": nivel_general,
        "scores": scores,
        "levels": levels,
        "observaciones": (
            f"Cuestionario de Competencias de Liderazgo (CCL): nivel general {nivel_general}%. "
            f"Fortalezas: {', '.join(fortalezas) if fortalezas else 'ninguna dimensión en nivel alto'}. "
            f"Áreas de desarrollo: {', '.join(areas_desarrollo) if areas_desarrollo else 'ninguna en nivel bajo'}."
        ),
        "razonamiento": f"CCL: nivel general {nivel_general}%",
        "analisis_profundo": (
            "Evaluación determinística de 6 competencias de liderazgo aplicadas al desempeño "
            f"(marco de Goleman), sin inferencia de IA. Puntajes por dimensión: {scores}."
        ),
        "puntos_fuertes": fortalezas,
        "recomendaciones": [
            f"Reforzar la competencia de {label}" for label in areas_desarrollo
        ] or ["Mantener el desarrollo equilibrado de las 6 competencias"],
    }
    update_user_skills(db, area="liderazgo", ai_diagnosis=ai_diag, user_id=user_id)
    update_user_skills(db, area="psicometria", ai_diagnosis=ai_diag, user_id=user_id)
    return {
        "scores": scores,
        "levels": levels,
        "nivel_general": nivel_general,
        "fortalezas": fortalezas,
        "areas_desarrollo": areas_desarrollo,
    }
