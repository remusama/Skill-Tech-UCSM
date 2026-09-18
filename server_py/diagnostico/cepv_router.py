from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict
from sqlalchemy.orm import Session

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment

from io import StringIO, BytesIO
import csv

from server_py.memoria.database import get_db, ExamResult, User
from server_py.memoria.skills import update_user_skills
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/diagnosis/cepv", tags=["CEPV-20"])


class CepvSubmission(BaseModel):
    answers: Dict[int, int]
    openAns: Dict[int, str]
    avg: Dict[str, str]


def get_cepv_export_rows(db: Session):
    results = (
        db.query(ExamResult, User)
        .join(User, User.id == ExamResult.user_id)
        .filter(ExamResult.area == "cepv-20")
        .order_by(ExamResult.timestamp.desc())
        .all()
    )

    rows = []

    for result, user in results:
        data = result.data or {}

        answers = data.get("answers", {})
        averages = data.get("avg", {})
        open_answers = data.get("openAns", {})

        row = {
            "ID Resultado": result.id,
            "ID Estudiante": user.id,
            "Usuario": user.username,
            "Nombre completo": user.full_name or user.username,
            "Escuela": user.school or "",
            "Aula": user.classroom or "",
            "Fecha": (
                result.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                if result.timestamp
                else ""
            ),
            "Puntaje (%)": result.score,
            "Promedio global": data.get("overall_avg", ""),
        }

        for i in range(1, 21):
            row[f"P{i}"] = answers.get(
                str(i),
                answers.get(i, "")
            )

        row["Aprendizaje y aplicabilidad"] = averages.get(
            "aprendizaje_aplicabilidad",
            ""
        )

        row["Metodología vivencial"] = averages.get(
            "metodologia_vivencial",
            ""
        )

        row["Facilitación y conducción"] = averages.get(
            "facilitacion_conduccion",
            ""
        )

        row["Interacción social y networking"] = averages.get(
            "interaccion_social_networking",
            ""
        )

        row["Respuesta 21"] = open_answers.get(
            "21",
            open_answers.get(21, "")
        )

        row["Respuesta 22"] = open_answers.get(
            "22",
            open_answers.get(22, "")
        )

        row["Respuesta 23"] = open_answers.get(
            "23",
            open_answers.get(23, "")
        )

        rows.append(row)

    return rows


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
            "answers": submission.answers,
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


@router.get("/export/csv")
async def export_cepv_csv(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user or user.role not in ["teacher", "mentor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para exportar estos resultados."
        )

    rows = get_cepv_export_rows(db)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No existen resultados CEPV-20 para exportar."
        )

    output = StringIO()

    # BOM UTF-8 para que Excel reconozca correctamente tildes y ñ
    output.write("\ufeff")

    writer = csv.DictWriter(
        output,
        fieldnames=list(rows[0].keys())
    )

    writer.writeheader()
    writer.writerows(rows)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition":
            'attachment; filename="resultados_cepv20.csv"'
        }
    )


@router.get("/export/xlsx")
async def export_cepv_excel(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user or user.role not in ["teacher", "mentor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para exportar estos resultados."
        )

    rows = get_cepv_export_rows(db)

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No existen resultados CEPV-20 para exportar."
        )

    wb = Workbook()

    # =========================================================
    # HOJA 1: RESULTADOS COMPLETOS
    # =========================================================

    ws = wb.active
    ws.title = "Resultados CEPV-20"

    headers = [
        "ID Resultado",
        "ID Estudiante",
        "Usuario",
        "Nombre completo",
        "Escuela",
        "Aula",
        "Fecha",
        "Puntaje (%)",
        "Promedio global",
    ]

    for i in range(1, 21):
        headers.append(f"P{i}")

    headers.extend([
        "Aprendizaje y aplicabilidad",
        "Metodología vivencial",
        "Facilitación y conducción",
        "Interacción social y networking",
    ])

    ws.append(headers)

    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(
            horizontal="center",
            vertical="center"
        )

    for row in rows:
        ws.append([
            row[column]
            for column in headers
        ])

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

    # Ajustar ancho de columnas
    for column_cells in ws.columns:
        max_length = 0

        for cell in column_cells:
            value = str(cell.value or "")

            if len(value) > max_length:
                max_length = min(len(value), 50)

        column_letter = column_cells[0].column_letter

        ws.column_dimensions[column_letter].width = max(
            max_length + 2,
            12
        )

    # =========================================================
    # HOJA 2: RESPUESTAS ABIERTAS
    # =========================================================

    qualitative = wb.create_sheet("Respuestas abiertas")

    qualitative_headers = [
        "ID Resultado",
        "ID Estudiante",
        "Usuario",
        "Nombre completo",
        "Fecha",
        "21. Expectativa prioritaria",
        "22. Preocupaciones o barreras anticipadas",
        "23. Criterio de éxito",
    ]

    qualitative.append(qualitative_headers)

    for cell in qualitative[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(
            horizontal="center",
            vertical="center",
            wrap_text=True
        )

    for row in rows:
        qualitative.append([
            row["ID Resultado"],
            row["ID Estudiante"],
            row["Usuario"],
            row["Nombre completo"],
            row["Fecha"],
            row["Respuesta 21"],
            row["Respuesta 22"],
            row["Respuesta 23"],
        ])

    qualitative.freeze_panes = "A2"
    qualitative.auto_filter.ref = qualitative.dimensions

    qualitative.column_dimensions["A"].width = 14
    qualitative.column_dimensions["B"].width = 14
    qualitative.column_dimensions["C"].width = 18
    qualitative.column_dimensions["D"].width = 28
    qualitative.column_dimensions["E"].width = 20
    qualitative.column_dimensions["F"].width = 35
    qualitative.column_dimensions["G"].width = 45
    qualitative.column_dimensions["H"].width = 35

    for row_cells in qualitative.iter_rows(min_row=2):
        for cell in row_cells[5:8]:
            cell.alignment = Alignment(
                vertical="top",
                wrap_text=True
            )

    # =========================================================
    # GENERAR ARCHIVO
    # =========================================================

    output = BytesIO()

    wb.save(output)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
            'attachment; filename="resultados_cepv20.xlsx"'
        }
    )