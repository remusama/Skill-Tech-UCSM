from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..memoria.database import get_db, User, UserSkill
from ..auth.router import get_current_user_id

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@router.get("/status")
def get_gamification_status(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "streak_count": user.streak_count,
        "xp": user.global_cognitive_index,
        "last_active_at": user.last_active_at
    }

def update_user_streak(db: Session, user: User):
    now = datetime.utcnow()
    
    if user.last_active_at:
        last_active = user.last_active_at.date()
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        if last_active == today:
            # Already active today, no change
            pass
        elif last_active == yesterday:
            # Consistent, increase streak
            user.streak_count += 1
        else:
            # Missed a day, reset streak
            user.streak_count = 1
    else:
        # First activity ever
        user.streak_count = 1
    
    user.last_active_at = now
    user.global_cognitive_index += 10 # Base XP for activity
    db.flush()

@router.post("/award-xp")
def award_xp(amount: int, area: str = None, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = db.query(User).filter(User.id == user_id).first()
    user.global_cognitive_index += amount
    
    if area:
        skill = db.query(UserSkill).filter(
            UserSkill.user_id == user_id,
            UserSkill.area == area
        ).first()
        if skill:
            skill.level += amount
            
    db.commit()
    return {"status": "success", "new_xp": user.global_cognitive_index}
