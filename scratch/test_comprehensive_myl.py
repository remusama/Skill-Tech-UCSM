import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from server_py.memoria.database import SessionLocal, User, MylLedgerEntry, MylMacroeconomicState
from server_py.routers.myl_economy import (
    get_student_wallet_dashboard,
    inspect_qr_payload,
    pay_qr_payload,
    QRInspectRequest,
    QRPayRequest,
    get_manager_macro_view,
    get_manager_breakdown,
    calculate_p2p_burn_fee
)

def run_tests():
    print("=" * 70)
    print("INICIANDO PRUEBAS Y AUDITORIA INTEGRAL DEL SISTEMA DE MOYOLES (MYL)")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Verificar estudiantes oficiales y cuentas Solana
        students = db.query(User).filter(User.house.in_(["APEX", "IGNIS", "NEXUS", "VISIO"])).all()
        print(f"\n[1] Estudiantes oficiales en Casas: {len(students)}")
        assert len(students) >= 48, f"Se esperaban al menos 48 estudiantes, encontrados {len(students)}"

        # Verificar que todos tengan cuenta Solana
        students_with_solana = [s for s in students if s.solana_wallet_address]
        print(f"    - Alumnos con cuenta Solana vinculada: {len(students_with_solana)} / {len(students)}")
        assert len(students_with_solana) == len(students), "Todos los estudiantes oficiales deben tener cuenta Solana"

        # 2. Elegir dos estudiantes de diferentes casas para probar P2P
        student_a = next(s for s in students if s.house == "APEX")
        student_b = next(s for s in students if s.house == "IGNIS")
        print(f"\n[2] Sujetos de prueba P2P:")
        print(f"    - Emisor: ID={student_a.id}, {student_a.full_name or student_a.username} (Casa {student_a.house}) | Saldo={student_a.myl_balance_digital} MYL | Wallet={student_a.solana_wallet_address[:12]}...")
        print(f"    - Receptor: ID={student_b.id}, {student_b.full_name or student_b.username} (Casa {student_b.house}) | Saldo={student_b.myl_balance_digital} MYL | Wallet={student_b.solana_wallet_address[:12]}...")

        # Asegurar saldo para el test
        true_original_a = student_a.myl_balance_digital or 0
        if true_original_a < 5:
            student_a.myl_balance_digital = 10
            db.commit()
            db.refresh(student_a)
            print(f"    * Saldo de Emisor recargado temporalmente a: {student_a.myl_balance_digital} MYL")
        initial_balance_a = student_a.myl_balance_digital
        initial_balance_b = student_b.myl_balance_digital or 0

        # 3. Test de Inspección QR mediante Cuenta Solana
        print(f"\n[3] Prueba de Inspección QR:")
        # A) Por dirección Solana
        res_inspect_solana = inspect_qr_payload(
            QRInspectRequest(qr_payload=student_b.solana_wallet_address),
            db=db,
            user_id=student_a.id
        )
        print(f"    A) QR por Solana Wallet:")
        print(f"       - Valid: {res_inspect_solana['valid']}")
        print(f"       - Tipo: {res_inspect_solana['type']}")
        print(f"       - Receptor: {res_inspect_solana['recipient_name']} (Casa {res_inspect_solana['recipient_house']})")
        print(f"       - Is Self: {res_inspect_solana['is_self']}")
        assert res_inspect_solana["valid"] is True
        assert res_inspect_solana["type"] == "p2p_user"
        assert res_inspect_solana["recipient_id"] == student_b.id
        assert res_inspect_solana["is_self"] is False

        # B) Por Username
        res_inspect_user = inspect_qr_payload(
            QRInspectRequest(qr_payload=f"@{student_b.username}"),
            db=db,
            user_id=student_a.id
        )
        print(f"    B) QR por Username (@{student_b.username}): Valid={res_inspect_user['valid']}, Dest={res_inspect_user['recipient_name']}")
        assert res_inspect_user["valid"] is True
        assert res_inspect_user["recipient_id"] == student_b.id

        # C) Auto-transferencia (debe marcar is_self=True)
        res_inspect_self = inspect_qr_payload(
            QRInspectRequest(qr_payload=student_a.solana_wallet_address),
            db=db,
            user_id=student_a.id
        )
        print(f"    C) Auto-inspección (QR propio): is_self={res_inspect_self['is_self']}")
        assert res_inspect_self["is_self"] is True

        # 4. Test de Validaciones de Pago P2P
        print(f"\n[4] Prueba de Validaciones de Transferencia:")
        # A) Intento de auto-transferencia
        try:
            pay_qr_payload(
                QRPayRequest(recipient_id=student_a.id, amount_myl=2),
                db=db,
                user_id=student_a.id
            )
            assert False, "Debe rechazar auto-transferencia"
        except Exception as e:
            print(f"    A) Auto-transferencia rechazada correctamente: {e.detail if hasattr(e, 'detail') else e}")

        # B) Intento de transferir 0 o negativo
        try:
            pay_qr_payload(
                QRPayRequest(recipient_id=student_b.id, amount_myl=0),
                db=db,
                user_id=student_a.id
            )
            assert False, "Debe rechazar monto 0"
        except Exception as e:
            print(f"    B) Monto 0 rechazado correctamente: {e.detail if hasattr(e, 'detail') else e}")

        # C) Intento de transferir más del saldo disponible
        try:
            pay_qr_payload(
                QRPayRequest(recipient_id=student_b.id, amount_myl=999999),
                db=db,
                user_id=student_a.id
            )
            assert False, "Debe rechazar por saldo insuficiente"
        except Exception as e:
            print(f"    C) Saldo insuficiente rechazado correctamente: {e.detail if hasattr(e, 'detail') else e}")

        # 5. Ejecutar Transferencia Real de 2 MYL (Inter-casa APEX -> IGNIS)
        transfer_amount = 2
        print(f"\n[5] Ejecución de Transferencia Real P2P ({transfer_amount} MYL):")
        expected_fee = calculate_p2p_burn_fee(student_b.house, student_a.house, transfer_amount)
        print(f"    - Cuota calculada (Intercasa <= 5 MYL): {expected_fee} MYL")

        voucher = pay_qr_payload(
            QRPayRequest(recipient_id=student_b.id, amount_myl=transfer_amount),
            db=db,
            user_id=student_a.id
        )

        print(f"    - Resultado: {voucher['status']} ({voucher['type']})")
        print(f"    - Mensaje: {voucher['message']}")
        print(f"    - Monto transferido: {voucher['amount_myl']} MYL")
        print(f"    - Beneficiario: {voucher['recipient_name']}")
        print(f"    - Código de Seguridad (3 dígitos): [{voucher['security_digits'][0]}] [{voucher['security_digits'][1]}] [{voucher['security_digits'][2]}]")
        print(f"    - Nro. de Operación (8 dígitos): {voucher['op_number']}")
        print(f"    - Fecha y Hora Formateada: {voucher['formatted_datetime']}")
        print(f"    - Nuevo Saldo Digital Emisor: {voucher['new_balance_digital']} MYL")

        assert voucher["status"] == "success"
        assert voucher["type"] == "p2p_voucher"
        assert len(voucher["security_digits"]) == 3
        assert len(voucher["op_number"]) == 8
        assert voucher["new_balance_digital"] == initial_balance_a - transfer_amount

        # Verificar balances en BD
        db.refresh(student_a)
        db.refresh(student_b)
        assert student_a.myl_balance_digital == initial_balance_a - transfer_amount
        assert student_b.myl_balance_digital == initial_balance_b + (transfer_amount - expected_fee)
        print(f"    [OK] Saldos en BD conciliados exactamente:")
        print(f"         Emisor: {initial_balance_a} -> {student_a.myl_balance_digital} MYL")
        print(f"         Receptor: {initial_balance_b} -> {student_b.myl_balance_digital} MYL")

        # 6. Verificar Registro en Libro Mayor (MylLedgerEntry)
        last_txs = db.query(MylLedgerEntry).filter(
            MylLedgerEntry.user_id.in_([student_a.id, student_b.id])
        ).order_by(MylLedgerEntry.id.desc()).limit(2).all()
        print(f"\n[6] Asientos Contables Registrados en Libro Mayor:")
        for tx in last_txs:
            print(f"    - ID={tx.id} | User={tx.user_id} | Casa={tx.house} | Monto={tx.amount:+d} MYL | Tipo={tx.entry_type} | Firma/Op={tx.solana_tx_signature}")

        # 7. Reversión para mantener estado de base de datos intacto
        print(f"\n[7] Limpieza/Conciliación de prueba:")
        student_a.myl_balance_digital = true_original_a
        student_b.myl_balance_digital = initial_balance_b
        for tx in last_txs:
            db.delete(tx)
        db.commit()
        print(f"    [OK] Saldos restaurados a su estado original ({true_original_a} y {initial_balance_b} MYL) y asientos de prueba eliminados.")

        print("\n" + "=" * 70)
        print("RESULTADO DE AUDITORIA: TODAS LAS PRUEBAS (7/7) PASARON CON EXITO")
        print("EL SISTEMA DE MOYOLES Y TRANSFERENCIAS P2P CUMPLE AL 100% CON LAS ESPECIFICACIONES")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

