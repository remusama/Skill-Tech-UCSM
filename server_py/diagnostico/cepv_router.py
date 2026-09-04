from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
from sqlalchemy.orm import Session
from server_py.memoria.database import get_db
from server_py.memoria.skills import update_user_skills
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis/cepv", tags=["CEPV-20"])


class CepvSubmission(BaseModel):
    answers: Dict[int, int]
    openAns: Dict[int, str]
    avg: Dict[str, str]


@router.post("/submit")
async def submit_cepv(submission: CepvSubmission, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    try:
        numeric_avgs = [float(v) for v in submission.avg.values() if float(v) > 0]
        overall_avg = sum(numeric_avgs) / len(numeric_avgs) if numeric_avgs else 0.0
        nivel = round((overall_avg / 5.0) * 100)

        obs_parts = [f"{k}: {v}/5" for k, v in submission.avg.items()]
        obs_text = f"Cuestionario CEPV-20 de Expectativas completado. Promedio global: {overall_avg:.2f}/5 ({nivel}%).\nDimensiones: " + ", ".join(obs_parts)

        ai_diag = {
            "nivel": nivel,
            "overall_avg": overall_avg,
            "avg": submission.avg,
            "openAns": submission.openAns,
            "observaciones": obs_text,
            "razonamiento": f"EXPECTATIVAS CEPV-20 ({nivel}%)",
            "analisis_profundo": f"Evaluación de Expectativas Vivenciales CEPV-20. Promedio ponderado de dimensiones: {overall_avg:.2f}/5.",
            "puntos_fuertes": [f"Expectativa global de {overall_avg:.1f}/5"],
            "recomendaciones": ["Alinear metas vivenciales con mentores asignados"]
        }

        update_user_skills(db, area="expectativas", ai_diagnosis=ai_diag, user_id=user_id)
        update_user_skills(db, area="cepv-20", ai_diagnosis=ai_diag, user_id=user_id)

        return {"status": "ok", "nivel": nivel, "overall_avg": overall_avg, "avg": submission.avg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
