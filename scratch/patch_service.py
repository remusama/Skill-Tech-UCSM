import re

path = 'server_py/user/service.py'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target = """    # 7. Tablas directas auxiliares
    try:
        db.execute(text("DELETE FROM ponencias_preguntas WHERE user_id = :uid"), {"uid": str(target_uid)})
    except Exception:
        pass"""

repl = """    # 7. Tablas directas auxiliares y economía MYL
    try:
        from server_py.memoria.database import (
            MylLedgerEntry, MylActiveImpulse, MylP2POrder, MylOrderContribution
        )
        db.query(MylLedgerEntry).filter(MylLedgerEntry.user_id == target_uid).delete(synchronize_session=False)
        db.query(MylActiveImpulse).filter(MylActiveImpulse.user_id == target_uid).delete(synchronize_session=False)
        db.query(MylP2POrder).filter((MylP2POrder.seller_user_id == target_uid) | (MylP2POrder.buyer_user_id == target_uid)).delete(synchronize_session=False)
        db.query(MylOrderContribution).filter(MylOrderContribution.user_id == target_uid).delete(synchronize_session=False)
    except Exception as e:
        logger.debug(f"Aviso limpiando tablas MYL: {e}")

    try:
        db.execute(text("DELETE FROM ponencias_preguntas WHERE user_id = :uid"), {"uid": str(target_uid)})
    except Exception:
        pass"""

if target in c:
    c2 = c.replace(target, repl, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c2)
    print("SUCCESS")
else:
    print("NOT FOUND")

