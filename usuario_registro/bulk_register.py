"""
Script de registro masivo de alumnos desde Excel/ODS.

Uso:
    python bulk_register.py --file lista_completa.ods --dry-run
    python bulk_register.py --file lista_completa.ods --api http://localhost:8000

El archivo (.xlsx o .ods) debe tener las columnas:
    Id, Ap. Paterno, Ap. Materno, Nombres, Tipo Partic., Estado, Correo
Solo se registran filas con Estado == "FINALIZADO".

Requiere: pip install pandas openpyxl odfpy requests
"""

import argparse
import csv
import time
from datetime import datetime

import pandas as pd
import requests

DEFAULT_PASSWORD = "12345678"
REQUEST_DELAY_SECONDS = 0.3  # pausa entre requests para no saturar el server
REQUIRED_COLUMNS = ["Id", "Ap. Paterno", "Ap. Materno", "Nombres", "Estado", "Correo"]


def load_rows(file_path: str):
    # pandas detecta el engine automáticamente por extensión (.xlsx -> openpyxl, .ods -> odf)
    df = pd.read_excel(file_path)

    faltantes = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if faltantes:
        raise ValueError(f"Al archivo le faltan estas columnas: {faltantes}")

    students = []
    for _, row in df.iterrows():
        raw_id = row.get("Id")
        if pd.isna(raw_id):
            continue  # fila vacía o de fórmula/subtotal

        estado = str(row.get("Estado", "")).strip().upper()
        if estado != "FINALIZADO":
            continue

        nombres = str(row.get("Nombres", "")).strip()
        ap_paterno = str(row.get("Ap. Paterno", "")).strip()
        ap_materno = str(row.get("Ap. Materno", "")).strip()
        correo = str(row.get("Correo", "")).strip()

        if not nombres or not ap_paterno or not correo or correo.lower() == "nan":
            print(f"⚠️  Fila con Id={raw_id} incompleta (falta nombre/apellido/correo), la salto.")
            continue

        username = " ".join(f"{nombres} {ap_paterno} {ap_materno}".split())  # colapsa espacios extra

        students.append({
            "id_excel": int(raw_id),
            "username": username,
            "email": correo,
        })

    return students


def register_student(api_base: str, student: dict) -> tuple[bool, str]:
    try:
        resp = requests.post(
            f"{api_base}/api/auth/register",
            json={
                "username": student["username"],
                "email": student["email"],
                "password": DEFAULT_PASSWORD,
                "role": "student",
            },
            timeout=15,
        )
    except requests.RequestException as e:
        return False, f"Error de conexión: {e}"

    if resp.status_code == 200:
        return True, "OK"
    else:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        return False, f"{resp.status_code}: {detail}"


def main():
    parser = argparse.ArgumentParser(description="Registro masivo de alumnos desde Excel/ODS")
    parser.add_argument("--file", required=True, help="Ruta al archivo .xlsx o .ods")
    parser.add_argument("--api", default="http://localhost:8000", help="URL base del backend")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué se registraría, sin llamar al API")
    args = parser.parse_args()

    students = load_rows(args.file)
    print(f"📋 {len(students)} alumnos con Estado=FINALIZADO listos para registrar.\n")

    if args.dry_run:
        for s in students:
            print(f"  [DRY-RUN] {s['username']} <{s['email']}>")
        print("\nNada se registró (modo --dry-run). Corre sin esa flag para registrar de verdad.")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = f"reporte_registro_{timestamp}.csv"

    ok_count = 0
    fail_count = 0

    with open(report_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id_excel", "username", "email", "resultado", "detalle"])

        for s in students:
            success, detail = register_student(args.api, s)
            status = "✅" if success else "❌"
            print(f"{status} {s['username']} <{s['email']}> — {detail}")
            writer.writerow([s["id_excel"], s["username"], s["email"], "OK" if success else "FALLO", detail])

            if success:
                ok_count += 1
            else:
                fail_count += 1

            time.sleep(REQUEST_DELAY_SECONDS)

    print(f"\n🏁 Listo. {ok_count} registrados, {fail_count} con error.")
    print(f"📄 Reporte guardado en: {report_path}")


if __name__ == "__main__":
    main()