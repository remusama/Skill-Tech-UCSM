from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Literal
from sqlalchemy.orm import Session
from server_py.memoria.database import get_db
from server_py.memoria.skills import update_user_skills
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis/neo-pi-r", tags=["NeoPiR"])

DOMAINS = ["N", "E", "O", "A", "C"]


def get_facet(item: int):
    pos = (item - 1) % 30
    d = DOMAINS[pos % 5]
    f = pos // 5
    return d, f


REVERSE_SCORED: dict[int, bool] = {}


class NeoAnswer(BaseModel):
    itemId: int
    value: int


class NeoSubmission(BaseModel):
    answers: List[NeoAnswer]
    gender: Literal["M", "F"]


def raw_to_t(raw: int, is_domain: bool, gender: str) -> int:
    if gender == "M":
        mean = 96 if is_domain else 16
        sd = 18 if is_domain else 4.5
    else:
        mean = 98 if is_domain else 16.5
        sd = 17 if is_domain else 4.3
    return round(50 + 10 * (raw - mean) / sd)


@router.post("/submit")
async def submit_neo(submission: NeoSubmission, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    facet_raw = [[0] * 6 for _ in DOMAINS]
    for a in submission.answers:
        v = a.value
        if a.itemId in REVERSE_SCORED and REVERSE_SCORED[a.itemId]:
            v = 4 - v
        d, f = get_facet(a.itemId)
        di = DOMAINS.index(d)
        facet_raw[di][f] += v
    domain_raw = [sum(x) for x in facet_raw]
    facets_t = [[raw_to_t(v, False, submission.gender) for v in arr] for arr in facet_raw]
    domains_t = {d: raw_to_t(domain_raw[i], True, submission.gender) for i, d in enumerate(DOMAINS)}
    update_user_skills(db, area="personalidad_neo", ai_diagnosis={"dominios": domains_t, "facetas": facets_t, "gender": submission.gender, "raw": {
                       "facetRaw": facet_raw, "domainRaw": domain_raw}, "observaciones": f"NEO PI-R T perfil {domains_t}"}, user_id=user_id)
    return {"facets": facets_t, "domains": domains_t, "raw": {"facetRaw": facet_raw, "domainRaw": domain_raw}, "gender": submission.gender}
