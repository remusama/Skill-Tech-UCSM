"""
Script de registro masivo de alumnos desde Excel/ODS.

Uso:
    python bulk_register.py --file lista_completa.ods --dry-run
    python bulk_register.py --file lista_completa.ods --api https://eleonor-backend.onrender.com

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
    seen_emails = set()
    seen_usernames = set()

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
        correo = str(row.get("Correo", "")).strip().lower()

        if not nombres or not ap_paterno or not correo or correo == "nan":
            print(f"⚠️  Fila con Id={raw_id} incompleta (falta nombre/apellido/correo), la salto.")
            continue

        username = " ".join(f"{nombres} {ap_paterno} {ap_materno}".split())  # colapsa espacios extra

        if correo in seen_emails or username.lower() in seen_usernames:
            print(f"⚠️  Fila duplicada en archivo para {username} <{correo}>, se omite.")
            continue

        seen_emails.add(correo)
        seen_usernames.add(username.lower())

        students.append({
            "id_excel": int(raw_id),
            "username": username,
            "email": correo,
        })

    return students


def register_student(api_base: str, student: dict, school: str = None, classroom: str = None) -> tuple[str, str]:
    payload = {
        "username": student["username"],
        "email": student["email"],
        "password": DEFAULT_PASSWORD,
        "role": "student",
    }
    if school:
        payload["school"] = school
    if classroom:
        payload["classroom"] = classroom

    try:
        resp = requests.post(
            f"{api_base}/api/auth/register",
            json=payload,
            timeout=15,
        )
    except requests.RequestException as e:
        return "FAIL", f"Error de conexión: {e}"

    if resp.status_code == 200:
        return "OK", "Registrado exitosamente"
    else:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text

        detail_str = str(detail).lower()
        if "ya está en uso" in detail_str or "ya está registrado" in detail_str:
            return "EXISTS", f"Ya registrado previo ({detail})"

        return "FAIL", f"{resp.status_code}: {detail}"


def main():
    parser = argparse.ArgumentParser(description="Registro masivo de alumnos desde Excel/ODS")
    parser.add_argument("--file", required=True, help="Ruta al archivo .xlsx o .ods")
    parser.add_argument("--api", default="http://localhost:8000", help="URL base del backend")
    parser.add_argument("--school", default=None, help="Nombre de la institución educativa (opcional)")
    parser.add_argument("--classroom", default=None, help="Aula / Grado / Sección (opcional)")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué se registraría, sin llamar al API")
    args = parser.parse_args()

    students = load_rows(args.file)
    print(f"📋 {len(students)} alumnos únicos con Estado=FINALIZADO listos para registrar.\n")

    if args.dry_run:
        for s in students:
            print(f"  [DRY-RUN] {s['username']} <{s['email']}>")
        print("\nNada se registró (modo --dry-run). Corre sin esa flag para registrar de verdad.")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = f"reporte_registro_{timestamp}.csv"

    ok_count = 0
    exists_count = 0
    fail_count = 0

    with open(report_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id_excel", "username", "email", "resultado", "detalle"])

        for s in students:
            status, detail = register_student(args.api, s, args.school, args.classroom)
            if status == "OK":
                icon = "✅"
                ok_count += 1
            elif status == "EXISTS":
                icon = "ℹ️"
                exists_count += 1
            else:
                icon = "❌"
                fail_count += 1

            print(f"{icon} {s['username']} <{s['email']}> — {detail}")
            writer.writerow([s["id_excel"], s["username"], s["email"], status, detail])

            time.sleep(REQUEST_DELAY_SECONDS)

    print(f"\n🏁 Proceso finalizado.")
    print(f"   - ✅ Registrados nuevos: {ok_count}")
    print(f"   - ℹ️ Omitidos (ya existían): {exists_count}")
    print(f"   - ❌ Fallidos con error: {fail_count}")
    print(f"📄 Reporte detallado guardado en: {report_path}")


if __name__ == "__main__":
    main()