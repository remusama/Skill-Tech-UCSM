from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from server_py.chambista.database import get_chambista_db
from server_py.chambista.services.openai_service import openai_service
from server_py.chambista.services.ranking_service import ranking_service

router = APIRouter(prefix="/api/search", tags=["Chambista Search"])

class SearchRequest(BaseModel):
    problem: str

@router.post("")
def search_professionals(request: SearchRequest, db: Session = Depends(get_chambista_db)):
    try:
        # 1. Analyze problem with OpenAI
        analysis = openai_service.analyze_problem(request.problem)
        
        # 2. Search and rank candidates
        recommended = ranking_service.search_and_rank(db, analysis)
        
        # 3. Generate explanation
        explanation = openai_service.generate_explanation(request.problem, recommended)
        
        # 4. Final Response
        return {
            "problem_detected": analysis.get("tipo_trabajo", "Problema detectado"),
            "category": analysis.get("categoria", "General"),
            "recommended": recommended,
            "assistant_message": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
