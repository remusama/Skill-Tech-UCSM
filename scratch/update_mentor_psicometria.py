target = 'server_py/routers/mentor.py'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """@router.get("/dashboard/psicometria")
def get_psicometria_dashboard(
    area: str,
    group_id: int = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    \"\"\"Devuelve, para el área psicométrica indicada, el último resultado de cada
    estudiante (opcionalmente filtrado por grupo) junto con el promedio grupal.\"\"\"
    check_is_mentor(current_user_id, db)

    if area not in VALID_PSICOMETRIA_AREAS:
        raise HTTPException(
            status_code=400,
            detail=f"Área inválida. Debe ser una de: {', '.join(sorted(VALID_PSICOMETRIA_AREAS))}"
        )"""

new_block = """@router.get("/dashboard/psicometria")
def get_psicometria_dashboard(
    area: str,
    response: Response = None,
    group_id: int = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    \"\"\"Devuelve, para el área psicométrica indicada, el último resultado de cada
    estudiante (opcionalmente filtrado por grupo) junto con el promedio grupal.\"\"\"
    check_is_mentor(current_user_id, db)

    if response is not None:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    if area not in VALID_PSICOMETRIA_AREAS:
        raise HTTPException(
            status_code=400,
            detail=f"Área inválida. Debe ser una de: {', '.join(sorted(VALID_PSICOMETRIA_AREAS))}"
        )"""

if old_block in text:
    text = text.replace(old_block, new_block)
elif old_block.replace('\n', '\r\n') in text:
    text = text.replace(old_block.replace('\n', '\r\n'), new_block.replace('\n', '\r\n'))
else:
    print("Could not find old_block in text")

# Now update the area_filter and results loop
old_filter_block = """    if area == "liderazgo_ccl":
        area_filter = ExamResult.area.in_(["liderazgo_ccl", "ccl"])
    elif area == "personalidad_neo":
        area_filter = ExamResult.area.in_(["personalidad_neo", "neo-pi-r", "neo_pi_r", "personalidad"])
    else:
        area_filter = ExamResult.area == area

    results = (
        db.query(
            ExamResult.user_id,
            ExamResult.score,
            ExamResult.data,
            ExamResult.timestamp,
        )
        .filter(
            ExamResult.user_id.in_(student_ids),
            area_filter,
        )
        .order_by(
            ExamResult.timestamp.desc()
        )
        .all()
    )

    latest_by_student = {}

    for user_id, score, data, timestamp in results:
        if user_id not in latest_by_student:
            latest_by_student[user_id] = {
                "score": score,
                "data": data,
                "timestamp": timestamp,
            }"""

new_filter_block = """    if area == "liderazgo_ccl":
        area_filter = ExamResult.area.in_(["liderazgo_ccl", "ccl", "competencias_ccl", "psicometria", "liderazgo"])
    elif area == "personalidad_neo":
        area_filter = ExamResult.area.in_(["personalidad_neo", "neo-pi-r", "neo_pi_r", "personalidad", "neo", "psicometria"])
    else:
        area_filter = ExamResult.area.in_(["liderazgo", "psicometria", "kurt_lewin", "liderazgo_kurt_lewin"])

    results = (
        db.query(
            ExamResult.user_id,
            ExamResult.score,
            ExamResult.data,
            ExamResult.timestamp,
        )
        .filter(
            ExamResult.user_id.in_(student_ids),
            area_filter,
        )
        .order_by(
            ExamResult.timestamp.desc()
        )
        .all()
    )

    latest_by_student = {}

    for user_id, score, data, timestamp in results:
        d = data if isinstance(data, dict) else {}
        obs_lower = str(d.get("observaciones", "")).lower()
        raz_lower = str(d.get("razonamiento", "")).lower()

        # Validación específica por área científica
        if area == "liderazgo_ccl":
            if "mando_crisis" not in d and "ccl" not in obs_lower and "ccl" not in raz_lower:
                continue
        elif area == "personalidad_neo":
            if "dominios" not in d and "neo" not in obs_lower and "neo" not in raz_lower:
                continue
        elif area == "liderazgo":
            # Excluir exámenes CCL puros que no tengan estilo dominante de Kurt Lewin
            if "mando_crisis" in d and "estilo_dominante" not in d:
                continue

        if user_id not in latest_by_student:
            latest_by_student[user_id] = {
                "score": score,
                "data": data,
                "timestamp": timestamp,
            }"""

if old_filter_block in text:
    text = text.replace(old_filter_block, new_filter_block)
elif old_filter_block.replace('\n', '\r\n') in text:
    text = text.replace(old_filter_block.replace('\n', '\r\n'), new_filter_block.replace('\n', '\r\n'))
else:
    print("Could not find old_filter_block in text")

# Add server_time in return
old_return = """    return {
        "area": area,
        "total": total,
        "group_avg_score": group_avg_score,
        "students": students_out,
    }"""

new_return = """    return {
        "area": area,
        "total": total,
        "group_avg_score": group_avg_score,
        "students": students_out,
        "server_time": datetime.now().isoformat(),
    }"""

if old_return in text:
    text = text.replace(old_return, new_return)
elif old_return.replace('\n', '\r\n') in text:
    text = text.replace(old_return.replace('\n', '\r\n'), new_return.replace('\n', '\r\n'))

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated mentor.py for psicometria successfully!")

