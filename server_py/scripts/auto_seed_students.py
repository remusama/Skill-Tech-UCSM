"""
auto_seed_students.py
---------------------
Script que se ejecuta automáticamente al iniciar el backend (server_py/main.py).
Garantiza que la lista de 48 estudiantes esté registrada en la base de datos (PostgreSQL/Supabase o SQLite).
Si los usuarios ya existen, los omite limpiamente sin duplicar.
"""

import logging
import os
import glob
import unicodedata
import uuid
import bcrypt
from sqlalchemy.orm import Session
from server_py.memoria.database import SessionLocal, User, EleonorSession

logger = logging.getLogger(__name__)

DEFAULT_PASSWORD = "12345678"

def remove_accents(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).replace("ñ", "n").replace("Ñ", "n")

# Lista por defecto de 48 estudiantes
DEFAULT_48_STUDENTS = [
    {"username": "Denis Arturo Yana Palazuelos", "email": "denis.yana@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Keith Vladimir Chura Diaz", "email": "keith.chura@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Sonia Lazarte Arredondo", "email": "sonia.lazarte@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Piero Farith Vega Baca", "email": "piero.vega@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "James Stephano Alejandro Cosi Rosello", "email": "james.cosi@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Kiara Yasumy Zapata Pocco", "email": "kiara.zapata@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Nadieshda Mariana Flores Barriga", "email": "nadieshda.flores@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Stephano Samuel Pinto Rivera", "email": "stephano.pinto@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Ricardo Enrique Rondón Pacheco", "email": "ricardo.rondon@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Dalessandra Cuervo Quispe", "email": "dalessandra.cuervo@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Paolo Del Piero Hernani Delgado", "email": "paolo.hernani@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Arjum Jhostim Sarayasi Huarilloclla", "email": "arjum.sarayasi@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Edison Omar Amanqui Galarza", "email": "edison.amanqui@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Fabricio Andre Espinoza Santander", "email": "fabricio.espinoza@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Daniela Valeriano Ramos", "email": "daniela.valeriano@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Mariajose Talavera Cardenas", "email": "mariajose.talavera@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º A"},
    {"username": "Franco Cruz Abado", "email": "franco.cruz@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Ikerzon Herbeth Quispe Choquepuma", "email": "ikerzon.quispe@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Javier Zavaleta Gutierrez", "email": "javier.zavaleta@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Julio Gabriel Rodriguez Valdivia", "email": "julio.rodriguez@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Matias Jose Arteaga Espinoza", "email": "matias.arteaga@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "César Alejandro Campos García", "email": "cesar.campos@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Luciana Castillo Alvarez", "email": "luciana.castillo@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Camila Beltran Huanca", "email": "camila.beltran@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Karelia Axde Delgado Cornejo", "email": "karelia.delgado@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Juan Francisco Herrera Vargas", "email": "juan.herrera@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Rodrigo Jhonatan Agüero Condori", "email": "rodrigo.aguero@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Piero Alexander Silvestre Gutierrez", "email": "piero.silvestre@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Maria Jose Limazca Quispe", "email": "maria.limazca@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Stefano Lopez Flores", "email": "stefano.lopez@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Rubí Alexandra Contreras Villarroel", "email": "rubi.contreras@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Ruth Evelyn Calli Choqque", "email": "ruth.calli@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º B"},
    {"username": "Gloria Mia Isabel Callenova Caceres", "email": "gloria.callenova@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Edgar Miranda Ccolqque", "email": "edgar.miranda@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Cristel Umiyauri Huaylla", "email": "cristel.umiyauri@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Fernanda Josselyn Rodriguez Del Carpio", "email": "fernanda.rodriguez@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Sheyla Saida Arqque Quispe", "email": "sheyla.arqque@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Diana Sophia Chichizola Bustamante", "email": "diana.chichizola@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Mariel Dayana Millio Mendoza", "email": "mariel.millio@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Lucas Adriel Bustamante Mena", "email": "lucas.bustamante@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "José Manuel Flor Cruz", "email": "jose.flor@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Claudia Velasco Quispe", "email": "claudia.velasco@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Alyce Nayeli Valdivia Sanz", "email": "alyce.valdivia@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Jimena Isabel Luque Berroa", "email": "jimena.luque@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Daniel Elias Zapana Daza", "email": "daniel.zapana@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Brescia Avril Oviedo Rodríguez", "email": "brescia.oviedo@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Sashenka Sofie Bernedo Ccanccapa", "email": "sashenka.bernedo@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
    {"username": "Nurit Tatiana Castro Cuela", "email": "nurit.castro@liderazgo.ucsm.pe", "school": "UCSM", "classroom": "5º C"},
]


def parse_ods_native(file_path):
    """Parsea archivos .ods directamente usando zipfile y xml.etree (sin requerir pandas u odfpy)."""
    import zipfile
    import xml.etree.ElementTree as ET
    try:
        with zipfile.ZipFile(file_path) as z:
            content = z.read("content.xml")
        root = ET.fromstring(content)
        ns = {
            "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
            "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
        }
        tables = root.findall(".//table:table", ns)
        if not tables:
            return None
        rows = tables[0].findall(".//table:table-row", ns)

        header_found = False
        col_map = {}
        students = []

        for r in rows:
            cells = r.findall(".//table:table-cell", ns)
            row_vals = []
            for c in cells:
                repeat = int(c.attrib.get("{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated", 1))
                txt_elems = c.findall(".//text:p", ns)
                val = " ".join([e.text for e in txt_elems if e.text]).strip()
                if repeat > 10 and not val:
                    continue
                for _ in range(repeat):
                    row_vals.append(val)

            if not header_found:
                if "Nombres" in row_vals and "Ap. Paterno" in row_vals:
                    header_found = True
                    col_map = {name: idx for idx, name in enumerate(row_vals)}
                continue

            if len(row_vals) > max(col_map.values(), default=0):
                estado = row_vals[col_map["Estado"]].upper() if "Estado" in col_map else "FINALIZADO"
                if estado and estado != "FINALIZADO":
                    continue
                nombres = row_vals[col_map["Nombres"]]
                ap_pat = row_vals[col_map["Ap. Paterno"]]
                ap_mat = row_vals[col_map["Ap. Materno"]] if "Ap. Materno" in col_map else ""

                if not nombres or not ap_pat:
                    continue

                username = f"{nombres.title()} {ap_pat.title()} {ap_mat.title()}".strip()
                raw_correo = row_vals[col_map["Correo"]] if "Correo" in col_map and col_map["Correo"] < len(row_vals) else ""

                if raw_correo and "@" in raw_correo:
                    correo = raw_correo.lower()
                else:
                    fn = remove_accents(nombres.split()[0].lower())
                    ap = remove_accents(ap_pat.split()[0].lower())
                    correo = f"{fn}.{ap}@liderazgo.ucsm.pe"

                students.append({
                    "username": username,
                    "email": correo,
                    "school": "UCSM",
                    "classroom": "5º A"
                })

        return students if students else None
    except Exception as e:
        logger.warning(f"[AutoSeedStudents] Error al parsear .ods nativo: {e}")
        return None


def load_students_from_file():
    """Intenta cargar estudiantes desde un archivo ODS/XLSX en public o usuario_registro si existe."""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        search_dirs = [
            os.path.join(base_dir, "public"),
            os.path.join(base_dir, "usuario_registro")
        ]
        excel_files = []
        for d in search_dirs:
            if os.path.exists(d):
                excel_files.extend(glob.glob(os.path.join(d, "*.ods")) + glob.glob(os.path.join(d, "*.xlsx")))

        if not excel_files:
            return None

        file_path = excel_files[0]
        if file_path.endswith(".ods"):
            ods_parsed = parse_ods_native(file_path)
            if ods_parsed:
                return ods_parsed

        import pandas as pd
        df = pd.read_excel(file_path)

        # Soporte para ambas estructuras de columnas
        has_req = all(c in df.columns for c in ["Ap. Paterno", "Ap. Materno", "Nombres"])
        if not has_req:
            return None

        students = []
        for _, row in df.iterrows():
            estado = str(row.get("Estado", "")).strip().upper()
            if estado and estado != "FINALIZADO":
                continue

            nombres = str(row.get("Nombres", "")).strip()
            ap_paterno = str(row.get("Ap. Paterno", "")).strip()
            ap_materno = str(row.get("Ap. Materno", "")).strip()

            if not nombres or not ap_paterno:
                continue

            username = " ".join(f"{nombres} {ap_paterno} {ap_materno}".split()).title()
            raw_correo = str(row.get("Correo", "")).strip().lower()

            if raw_correo and raw_correo != "nan" and "@" in raw_correo:
                correo = raw_correo
            else:
                first_name = remove_accents(nombres.split()[0].lower())
                ap_pat_clean = remove_accents(ap_paterno.split()[0].lower())
                correo = f"{first_name}.{ap_pat_clean}@liderazgo.ucsm.pe"

            students.append({
                "username": username,
                "email": correo,
                "school": "UCSM",
                "classroom": "5º A"
            })

        return students if students else None
    except Exception as e:
        logger.warning(f"[AutoSeedStudents] No se pudo leer archivo excel: {e}")
        return None


def auto_seed_students():
    """
    Se ejecuta al iniciar el backend. Registra los 48 alumnos en la base de datos si no existen
    y remueve usuarios anteriores con dominio de correo obsoleto (@ucsm.edu.pe).
    """
    db: Session = SessionLocal()
    try:
        # Purgar usuarios antiguos con dominio obsoleto @ucsm.edu.pe
        old_users = db.query(User).filter(User.email.like("%@ucsm.edu.pe")).all()
        if old_users:
            for old_u in old_users:
                db.query(EleonorSession).filter(EleonorSession.user_id == old_u.id).delete()
                db.delete(old_u)
            db.commit()
            logger.info(f"[AutoSeedStudents] 🧹 Eliminados {len(old_users)} usuarios antiguos con dominio @ucsm.edu.pe.")
            print(f"[AutoSeedStudents] 🧹 Eliminados {len(old_users)} usuarios antiguos con dominio @ucsm.edu.pe.")

        students = load_students_from_file() or DEFAULT_48_STUDENTS
        hashed_password = bcrypt.hashpw(DEFAULT_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        created = 0
        skipped = 0

        for s in students:
            username = s["username"].strip()
            email = s["email"].strip().lower()

            existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
            if existing:
                if not existing.secure_token:
                    existing.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
                    db.commit()
                    logger.info(f"[AutoSeedStudents] 🔑 Generado secure_token para usuario existente: {existing.username}")
                skipped += 1
                continue

            new_user = User(
                username=username,
                email=email,
                hashed_password=hashed_password,
                role="student",
                school=s.get("school", "UCSM"),
                classroom=s.get("classroom", "5º A"),
                has_onboarded=0,
                secure_token=f"SKILL-{uuid.uuid4().hex[:12].upper()}"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            session = EleonorSession(id=f"sess_{new_user.id}", user_id=new_user.id)
            db.add(session)
            db.commit()

            created += 1

        # Barrido final: Asegurar que NINGÚN usuario en la base de datos se quede sin secure_token
        users_without_token = db.query(User).filter((User.secure_token == None) | (User.secure_token == "")).all()
        if users_without_token:
            tokens_generated = 0
            for u in users_without_token:
                u.secure_token = f"SKILL-{uuid.uuid4().hex[:12].upper()}"
                tokens_generated += 1
            db.commit()
            logger.info(f"[AutoSeedStudents] 🔑 Generados {tokens_generated} tokens QR de seguridad para usuarios sin token.")
            print(f"[AutoSeedStudents] 🔑 Generados {tokens_generated} tokens QR de seguridad para usuarios sin token.")

        logger.info(f"[AutoSeedStudents] ✅ Proceso completado — {created} estudiantes registrados nuevos, {skipped} ya existían.")
        print(f"[AutoSeedStudents] ✅ Proceso completado — {created} estudiantes registrados nuevos, {skipped} ya existían.")

        from server_py.routers.mentor_agents import seed_base_agents
        seed_base_agents(db)
        print("[AutoSeedAgents] ✅ Agentes base de IA verificados y sincronizados en la base de datos.")

    except Exception as e:
        db.rollback()
        logger.error(f"[AutoSeedStudents] ⚠️ Error al registrar estudiantes: {e}")
        print(f"[AutoSeedStudents] ⚠️ Error al registrar estudiantes: {e}")
    finally:
        db.close()

# Alias para retrocompatibilidad
auto_seed_40_students = auto_seed_students

if __name__ == "__main__":
    auto_seed_students()

