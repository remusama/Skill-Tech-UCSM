with open('server_py/user/service.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Make each block in delete_user_account safe with try/except rollback so a non-fatal error doesn't abort the transaction
old_block = """    # 6. Módulo de Mentoría, Exámenes y Asistencia
    try:
        from server_py.mentoria.models import (
            GroupStudent, AttendanceRecord, AttendanceClass,
            MentorExamAssignment, MentorExamAnswer, MentorExamQuestion,
            MentorExam, MentorGroup, Agent
        )

        student_assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.student_id == target_uid).all()
        for a in student_assignments:
            db.query(MentorExamAnswer).filter(MentorExamAnswer.assignment_id == a.id).delete(synchronize_session=False)
        purged["mentor_exam_assignments"] = db.query(MentorExamAssignment).filter(MentorExamAssignment.student_id == target_uid).delete(synchronize_session=False)

        # Asistencias
        purged["attendance_records"] = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == target_uid).delete(synchronize_session=False)

        # Grupos de mentoría
        purged["group_memberships"] = db.query(GroupStudent).filter(GroupStudent.student_id == target_uid).delete(synchronize_session=False)

        # Si era docente / creador de clases:
        mentor_classes = db.query(AttendanceClass).filter(AttendanceClass.mentor_id == target_uid).all()
        for c in mentor_classes:
            db.query(AttendanceRecord).filter(AttendanceRecord.class_id == c.id).delete(synchronize_session=False)
        db.query(AttendanceClass).filter(AttendanceClass.mentor_id == target_uid).delete(synchronize_session=False)

        # Exámenes del mentor
        mentor_exams = db.query(MentorExam).filter(MentorExam.mentor_id == target_uid).all()
        for me in mentor_exams:
            exam_assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == me.id).all()
            for ea in exam_assignments:
                db.query(MentorExamAnswer).filter(MentorExamAnswer.assignment_id == ea.id).delete(synchronize_session=False)
            db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == me.id).delete(synchronize_session=False)
            db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == me.id).delete(synchronize_session=False)
        db.query(MentorExam).filter(MentorExam.mentor_id == target_uid).delete(synchronize_session=False)

        mentor_groups = db.query(MentorGroup).filter(MentorGroup.mentor_id == target_uid).all()
        for g in mentor_groups:
            db.query(GroupStudent).filter(GroupStudent.group_id == g.id).delete(synchronize_session=False)
        db.query(MentorGroup).filter(MentorGroup.mentor_id == target_uid).delete(synchronize_session=False)

        db.query(Agent).filter(Agent.creator_id == target_uid).update({"creator_id": None}, synchronize_session=False)
    except Exception as e:
        logger.debug(f"Aviso limpiando server_py.mentoria.models: {e}")"""

new_block = """    # 6. Módulo de Mentoría, Exámenes y Asistencia
    try:
        from server_py.mentoria.models import (
            GroupStudent, AttendanceRecord, AttendanceClass,
            MentorExamAssignment, MentorExamAnswer, MentorExamQuestion,
            MentorExam, MentorGroup, Agent
        )

        try:
            student_assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.student_id == target_uid).all()
            for a in student_assignments:
                db.query(MentorExamAnswer).filter(MentorExamAnswer.assignment_id == a.id).delete(synchronize_session=False)
            purged["mentor_exam_assignments"] = db.query(MentorExamAssignment).filter(MentorExamAssignment.student_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            purged["attendance_records"] = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            purged["group_memberships"] = db.query(GroupStudent).filter(GroupStudent.student_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            mentor_classes = db.query(AttendanceClass).filter(AttendanceClass.mentor_id == target_uid).all()
            for c in mentor_classes:
                db.query(AttendanceRecord).filter(AttendanceRecord.class_id == c.id).delete(synchronize_session=False)
            db.query(AttendanceClass).filter(AttendanceClass.mentor_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            mentor_exams = db.query(MentorExam).filter(MentorExam.mentor_id == target_uid).all()
            for me in mentor_exams:
                exam_assignments = db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == me.id).all()
                for ea in exam_assignments:
                    db.query(MentorExamAnswer).filter(MentorExamAnswer.assignment_id == ea.id).delete(synchronize_session=False)
                db.query(MentorExamAssignment).filter(MentorExamAssignment.exam_id == me.id).delete(synchronize_session=False)
                db.query(MentorExamQuestion).filter(MentorExamQuestion.exam_id == me.id).delete(synchronize_session=False)
            db.query(MentorExam).filter(MentorExam.mentor_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            mentor_groups = db.query(MentorGroup).filter(MentorGroup.mentor_id == target_uid).all()
            for g in mentor_groups:
                db.query(GroupStudent).filter(GroupStudent.group_id == g.id).delete(synchronize_session=False)
            db.query(MentorGroup).filter(MentorGroup.mentor_id == target_uid).delete(synchronize_session=False)
        except Exception:
            db.rollback()

        try:
            db.query(Agent).filter(Agent.creator_id == target_uid).update({"creator_id": None}, synchronize_session=False)
        except Exception:
            db.rollback()
    except Exception as e:
        logger.debug(f"Aviso limpiando server_py.mentoria.models: {e}")"""

if old_block in text:
    text = text.replace(old_block, new_block, 1)
    with open('server_py/user/service.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("REPLACED SUCCESSFULLY IN service.py")
else:
    print("OLD BLOCK NOT FOUND")

