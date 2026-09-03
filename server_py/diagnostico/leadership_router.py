from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from server_py.memoria.database import get_db
from server_py.memoria.skills import update_user_skills
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis/leadership", tags=["Leadership"])


class LewinAnswer(BaseModel):
    itemId: int
    value: str


class LewinSubmission(BaseModel):
    answers: List[LewinAnswer]


ESTILO_1 = {1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31}
ESTILO_2 = {2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32}
ESTILO_3 = {3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33}


@router.post("/submit")
async def submit_lewin_test(submission: LewinSubmission, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    counts = {"autoritario": 0, "democratico": 0, "laissez-faire": 0}
    for ans in submission.answers:
        if ans.value != "A":
            continue
        if ans.itemId in ESTILO_1:
            counts["autoritario"] += 1
        elif ans.itemId in ESTILO_2:
            counts["democratico"] += 1
        elif ans.itemId in ESTILO_3:
            counts["laissez-faire"] += 1
    dominant = max(counts, key=lambda k: counts[k])
    winners = [k for k, v in counts.items() if v == counts[dominant]]
    is_tied = len(winners) > 1
    nivel = round((counts[dominant] / 11) * 100)
    update_user_skills(db, area="liderazgo", ai_diagnosis={
        "nivel": nivel,
        "estilo_dominante": dominant,
        "detalle": counts,
        "isTied": is_tied,
        "observaciones": f"Test Lewin: dominante {dominant} ({counts[dominant]}/11).",
        "razonamiento": dominant,
    }, user_id=user_id)
    return {"counts": counts, "dominant": dominant, "isTied": is_tied, "nivel": nivel}
