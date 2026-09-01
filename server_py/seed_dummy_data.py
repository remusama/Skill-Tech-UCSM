import os
import random
import sys
from datetime import datetime, timedelta

import bcrypt
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from server_py.memoria.database import SessionLocal, User, ExamResult, UserSkill, Base


def seed_users():
    db = SessionLocal()
    try:
        hashed = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        # 1. Create Teacher
        teacher = db.query(User).filter(User.username == "docente_debug").first()
        if not teacher:
            print("Creating Teacher...")
            teacher = User(
                username="docente_debug",
                full_name="Docente de Prueba (Eleonor)",
                role="teacher",
                hashed_password=hashed,
                has_onboarded=1
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)


        # 2. Check if design student exists
        design_student = db.query(User).filter(User.username == "design_student").first()
        if design_student:
            print("Design student already exists. Cleaning up old data...")
            db.query(ExamResult).filter(ExamResult.user_id == design_student.id).delete()
            db.query(UserSkill).filter(UserSkill.user_id == design_student.id).delete()
            db.delete(design_student)
            db.commit()

        # 2. Create Design Student
        print("Creating Design Student...")
        new_student = User(
            username="design_student",
            full_name="Carlos Eduardo Informante",
            role="student",
            classroom="5º B",
            hashed_password=hashed
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)

        # 3. Create Diagnostic History
        areas = ["Matemáticas", "Comprensión Lectora", "Lógica", "Ciencia", "Creatividad"]


        print("Seeding diagnostic history...")
        for i in range(5):
            days_ago = (5 - i) * 7
            timestamp = datetime.now() - timedelta(days=days_ago)


            # Simulate progress
            base_score = 60 + (i * 5)


            for area in areas:
                score = min(100, base_score + random.randint(-10, 10))


                # Create detailed competency data for the graph
                competencias = [
                    {"area": area, "level": score, "razonamiento": f"Análisis de {area} nivel {i + 1}.",
                        "observaciones": "Progresión constante.", "confianza": "95%"}
                ]


                for other_area in areas:
                    if other_area != area:
                        competencias.append({
                            "area": other_area,
                            "level": random.randint(40, 80),
                            "razonamiento": "Evaluación base.",
                            "observaciones": "Nivel estándar.",
                            "confianza": "90%"
                        })

                exam = ExamResult(
                    user_id=new_student.id,
                    area=area,
                    score=score,
                    timestamp=timestamp,
                    data={
                        "competencias": competencias,
                        "bloom_matrix": {
                            "recordar": random.uniform(0.6, 0.9),
                            "comprender": random.uniform(0.5, 0.8),
                            "aplicar": random.uniform(0.4, 0.7),
                            "analizar": random.uniform(0.3, 0.6),
                            "evaluar": random.uniform(0.2, 0.5),
                            "crear": random.uniform(0.1, 0.4)
                        },
                        "razonamiento_vector": {
                            "analitico": random.uniform(0.5, 0.9),
                            "divergente": random.uniform(0.4, 0.8),
                            "intuitivo": random.uniform(0.6, 0.9),
                            "mecanico": random.uniform(0.3, 0.7),
                            "estrategico": random.uniform(0.4, 0.8)
                        },
                        "metricas_base": {
                            "precision": random.uniform(0.6, 0.9),
                            "velocidad_normalizada": random.uniform(0.5, 0.8),
                            "consistencia": random.uniform(0.4, 0.8),
                            "tasa_error_conceptual": random.uniform(0.1, 0.3)
                        },
                        "analisis_profundo": f"Se observan patrones exploratorios en {area}. Las métricas sugieren un progreso sostenido con oportunidades de mejora en habilidades analíticas profundas."
                    }
                )
                db.add(exam)

        # 4. Create current skills (for the directory view)
        for area in areas:
            skill = UserSkill(
                user_id=new_student.id,
                area=area,
                level=random.randint(75, 95),
                bloom_matrix={
                    "recordar": random.uniform(0.6, 0.9),
                    "comprender": random.uniform(0.5, 0.8),
                    "aplicar": random.uniform(0.4, 0.7),
                    "analizar": random.uniform(0.3, 0.6),
                    "evaluar": random.uniform(0.2, 0.5),
                    "crear": random.uniform(0.1, 0.4)
                },
                razonamiento_vector={
                    "analitico": random.uniform(0.5, 0.9),
                    "divergente": random.uniform(0.4, 0.8),
                    "intuitivo": random.uniform(0.6, 0.9),
                    "mecanico": random.uniform(0.3, 0.7),
                    "estrategico": random.uniform(0.4, 0.8)
                }
            )
            db.add(skill)

        db.commit()
        print(
            f"Success! Design student '{new_student.full_name}' (ID: {new_student.id}) created in classroom '{new_student.classroom}'.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()



if __name__ == "__main__":
    seed_users()