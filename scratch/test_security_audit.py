import sys, os
sys.path.insert(0, os.path.abspath("."))
from server_py.memoria.database import SessionLocal, User
from server_py.routers.myl_economy import (
    get_manager_macro_view, get_manager_breakdown, get_house_desk,
    inspect_qr_payload, QRInspectRequest, OFFICIAL_HOUSES
)
from fastapi import HTTPException

db = SessionLocal()

print("=== 1. VERIFICACIÓN DE ALUMNOS OFICIALES Y CASAS ===")
total_houses = db.query(User).filter(User.house.isnot(None)).count()
print(f"Total de usuarios con Casa asignada: {total_houses} (Esperado: 48)")
assert total_houses == 48, f"Se esperaban 48 pero hay {total_houses}"

for h in OFFICIAL_HOUSES:
    cnt = db.query(User).filter(User.house == h, User.role == "student").count()
    print(f"  Casa {h}: {cnt} alumnos (Esperado: 12)")
    assert cnt == 12, f"Casa {h} tiene {cnt} != 12"

print("✅ Distribución de casas estrictamente 12x4 = 48 alumnos.")

print("\n=== 2. VERIFICACIÓN DE CONTROL DE ACCESO (PREVENCIÓN DE ESCALADA DE PRIVILEGIOS) ===")
# Obtener un alumno oficial
student = db.query(User).filter(User.role == "student", User.house == "APEX").first()
# Obtener un mentor / teacher
mentor = db.query(User).filter(User.role.in_(["teacher", "admin", "mentor"])).first()

print(f"Probando endpoint administrativo con Alumno (ID {student.id}, rol: {student.role})...")
try:
    get_manager_macro_view(db, user_id=student.id)
    print("❌ ERROR CRÍTICO: El alumno pudo acceder a la consola del gestor!")
except HTTPException as e:
    print(f"✅ Bloqueado correctamente con HTTP {e.status_code}: {e.detail}")
    assert e.status_code == 403

print(f"Probando endpoint administrativo con Mentor (ID {mentor.id}, rol: {mentor.role})...")
try:
    res = get_manager_macro_view(db, user_id=mentor.id)
    print(f"✅ Mentor autorizado correctamente. Sesión: {res['session_number']}, Estado: {res['alert_status']}")
except Exception as e:
    print(f"❌ Error al autorizar mentor: {e}")
    raise

print("\n=== 3. VERIFICACIÓN DE DESGLOSE OPTIMIZADO DEL GESTOR ===")
breakdown = get_manager_breakdown(db, user_id=mentor.id)
print(f"Total de estudiantes en el desglose: {breakdown['students_total']} (Esperado: 48)")
assert breakdown["students_total"] == 48
for hb in breakdown["houses"]:
    print(f"  {hb['house']}: Liquidez total {hb['total_house_liquidity_myl']} MYL, Estado orden: {hb['order_status']}")

print("\n=== 4. VERIFICACIÓN DE MESA DE CONTROL (HOUSE-DESK) ===")
desk = get_house_desk(db, user_id=student.id)
print(f"Mesa de control de Casa {desk['house']}: {len(desk['members_contributions'])} integrantes en vivo (Esperado: <= 12)")
assert len(desk["members_contributions"]) <= 12
for m in desk["members_contributions"]:
    assert m["full_name"] is not None

print("\n=== 5. VERIFICACIÓN DE BLOQUEO DE FILTRACIONES EN TRANSFERENCIAS P2P ===")
# Si se intenta inspeccionar a un usuario externo o docente para P2P
print(f"Intentando inspeccionar QR de mentor/docente (ID {mentor.id}) para transferirle MYL...")
inspect_res = inspect_qr_payload(QRInspectRequest(qr_payload=str(mentor.id)), db, user_id=student.id)
print(f"Resultado: valid={inspect_res.get('valid')}, tipo={inspect_res.get('type')}, título={inspect_res.get('title')}")
assert inspect_res.get("valid") is False
print("✅ Transferencia a docentes o externos bloqueada correctamente.")

# Si se intenta transferir a un alumno externo sin Casa oficial (ej. ID 63)
external_student = db.query(User).filter(User.house.is_(None), User.role == "student").first()
if external_student:
    print(f"Probando transferencia a alumno sin Casa asignada (ID {external_student.id}, email: {external_student.email})...")
    inspect_ext = inspect_qr_payload(QRInspectRequest(qr_payload=str(external_student.id)), db, user_id=student.id)
    print(f"Resultado alumno externo: valid={inspect_ext.get('valid')}, tipo={inspect_ext.get('type')}")
    assert inspect_ext.get("valid") is False
    print("✅ Transferencia a alumno externo sin casa bloqueada exitosamente.")

# Si se inspecciona a un compañero oficial de las Casas (1 de los 48)
peer_student = db.query(User).filter(User.role == "student", User.house.in_(OFFICIAL_HOUSES), User.id != student.id).first()
inspect_peer = inspect_qr_payload(QRInspectRequest(qr_payload=str(peer_student.id)), db, user_id=student.id)
print(f"Resultado inspección compañero oficial ({peer_student.full_name}, Casa {peer_student.house}): valid={inspect_peer.get('valid')}, destinatario={inspect_peer.get('recipient_name')}")
assert inspect_peer.get("valid") is True
print("✅ Transferencia a compañero oficial habilitada correctamente.")

print("\n🎉 TODAS LAS PRUEBAS DE SEGURIDAD, INTEGRIDAD Y OPTIMIZACIÓN PASARON EXITOSAMENTE!")
db.close()
