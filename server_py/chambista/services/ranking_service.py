from sqlalchemy.orm import Session
from sqlalchemy import or_
from server_py.chambista.models import Professional, Skill, ProfessionalSkill
from typing import List

class RankingService:
    def search_and_rank(self, db: Session, analysis: dict) -> List[dict]:
        categoria = analysis.get("categoria", "")
        keywords = analysis.get("keywords", [])
        
        # 1. Base Query: Filter by Category and Availability
        query = db.query(Professional).filter(
            Professional.activo == True,
            Professional.disponible == True
        )
        
        # Basic filtering (if category is detected)
        if categoria:
            query = query.filter(Professional.categoria.ilike(f"%{categoria}%"))
            
        candidates = query.all()
        
        # Fallback if no exact category match: try to match by keywords in description
        if not candidates and keywords:
            query = db.query(Professional).filter(
                Professional.activo == True,
                Professional.disponible == True
            )
            keyword_filters = [Professional.descripcion.ilike(f"%{kw}%") for kw in keywords]
            query = query.filter(or_(*keyword_filters))
            candidates = query.all()

        # 2. Compute Scores
        # 40% Experiencia (Max 20 years = 40 pts) -> 2 pts per year (capped at 40)
        # 25% Rating (Max 5.0 = 25 pts) -> rating * 5
        # 15% Cercanía (Ignored for this MVP or mocked)
        # 10% Precio (Lower is better. Max 10 pts)
        # 10% Disponibilidad (Max 10 pts if completely available)
        
        results = []
        for c in candidates:
            # Experiencia
            exp = min(c.experiencia_anios or 0, 20)
            score_exp = (exp / 20.0) * 40
            
            # Rating
            rating = c.rating or 0.0
            score_rating = (rating / 5.0) * 25
            
            # Cercania (Mocked to 15 for now)
            score_cercania = 15
            
            # Precio (Simplification: cheaper gets more points, assume 100 is very expensive)
            precio = c.precio_base or 0.0
            if precio == 0:
                score_precio = 10
            else:
                score_precio = max(0, 10 - (precio / 10.0)) # Example heuristic
                
            # Disponibilidad
            score_disp = 10
            
            total_score = score_exp + score_rating + score_cercania + score_precio + score_disp
            
            results.append({
                "id": c.id,
                "nombre": f"{c.nombre} {c.apellido}",
                "score": round(total_score, 1),
                "precio": c.precio_base,
                "rating": c.rating
            })
            
        # 3. Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        
        # 4. Return top 5
        return results[:5]

ranking_service = RankingService()
