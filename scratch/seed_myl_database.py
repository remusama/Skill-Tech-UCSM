import hashlib
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from server_py.memoria.database import (
    SessionLocal, init_db, User,
    MylMaterial, MylStoreItem, MylMacroeconomicState, MylHouseOrder, MylLedgerEntry
)
from server_py.scripts.auto_migrate import run_auto_migrations

# Simulación determinista de dirección Solana para el piloto
def generate_solana_devnet_address(username: str, user_id: int) -> str:
    raw = f"solana_ucsm_{user_id}_{username}".encode("utf-8")
    h = hashlib.sha256(raw).hexdigest()
    # Solana base58-like address (32-44 chars)
    chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    num = int(h, 16)
    res = []
    while num > 0 and len(res) < 44:
        res.append(chars[num % 58])
        num //= 58
    return "".join(res)[:44]

# Casas mapping de ALL_48_STUDENTS
STUDENT_HOUSES = {
    # APEX
    "Alyce Nayeli Valdivia Sanz": "APEX",
    "Brescia Avril Oviedo Rodríguez": "APEX",
    "César Alejandro Campos García": "APEX",
    "Cristel Umiyauri Huaylla": "APEX",
    "Dalessandra Cuervo Quispe": "APEX",
    "Diana Sophia Chichizola Bustamante": "APEX",
    "Edgar Miranda Ccolqque": "APEX",
    "Edison Omar Amanqui Galarza": "APEX",
    "Fabricio Andre Espinoza Santander": "APEX",
    "Fernanda Josselyn Rodriguez Del Carpio": "APEX",
    "Franco Cruz Abado": "APEX",
    "Gloria Mia Isabel Callenova Caceres": "APEX",
    # IGNIS
    "Ikerzon Herbeth Quispe Choquepuma": "IGNIS",
    "James Stephano Alejandro Cosi Rosello": "IGNIS",
    "Javier Zavaleta Gutierrez": "IGNIS",
    "José Manuel Flor Cruz": "IGNIS",
    "Juan Francisco Herrera Vargas": "IGNIS",
    "Julio Gabriel Rodriguez Valdivia": "IGNIS",
    "Karelia Axde Delgado Cornejo": "IGNIS",
    "Keith Vladimir Chura Diaz": "IGNIS",
    "Kiara Yasumy Zapata Pocco": "IGNIS",
    "Lucas Adriel Bustamante Mena": "IGNIS",
    "Luciana Castillo Alvarez": "IGNIS",
    "Maria Jose Limazca Quispe": "IGNIS",
    # NEXUS
    "Mariajose Talavera Cardenas": "NEXUS",
    "Mariel Dayana Millio Mendoza": "NEXUS",
    "Matias Jose Arteaga Espinoza": "NEXUS",
    "Nadieshda Mariana Flores Barriga": "NEXUS",
    "Paolo Del Piero Hernani Delgado": "NEXUS",
    "Piero Alexander Silvestre Gutierrez": "NEXUS",
    "Piero Farith Vega Baca": "NEXUS",
    "Ricardo Enrique Rondón Pacheco": "NEXUS",
    "Rodrigo Jhonatan Agüero Condori": "NEXUS",
    "Rubí Alexandra Contreras Villarroel": "NEXUS",
    "Ruth Evelyn Calli Choqque": "NEXUS",
    "Sheyla Saida Arqque Quispe": "NEXUS",
    # VISIO
    "Sonia Lazarte Arredondo": "VISIO",
    "Stefano Lopez Flores": "VISIO",
    "Stephano Samuel Pinto Rivera": "VISIO",
    "Camila Beltran Huanca": "VISIO",
    "Claudia Velasco Quispe": "VISIO",
    "Daniela Valeriano Ramos": "VISIO",
    "Denis Arturo Yana Palazuelos": "VISIO",
    "Arjum Jhostim Sarayasi Huarilloclla": "VISIO",
    "123": "APEX",
    "santiago": "IGNIS",
    "LuisA": "NEXUS",
    "Joaquin": "VISIO",
}

def seed_myl_system():
    print("1. Creando tablas en base de datos...")
    init_db()

    print("2. Ejecutando migraciones de columnas...")
    run_auto_migrations()

    db = SessionLocal()
    try:
        # A. Asignar casas, billeteras y saldos iniciales (8 MYL: 4 digital + 4 efectivo)
        users = db.query(User).filter(User.role == "student").all()
        print(f"3. Configurando {len(users)} estudiantes para la economía MYL...")
        for u in users:
            name = u.full_name or u.username or ""
            house = STUDENT_HOUSES.get(name)
            if not house:
                # Default round-robin
                house = ["APEX", "IGNIS", "NEXUS", "VISIO"][u.id % 4]
            u.house = house
            if not u.solana_wallet_address:
                u.solana_wallet_address = generate_solana_devnet_address(name, u.id)
            if u.myl_balance_digital is None or u.myl_balance_digital == 0:
                u.myl_balance_digital = 4 # Saldo digital conciliado
            if u.myl_balance_cash is None or u.myl_balance_cash == 0:
                u.myl_balance_cash = 4 # Efectivo en mano (fichas MDF / QR)
            if u.myl_house_points_session is None:
                u.myl_house_points_session = 0

        # B. Semilla de Materiales a la Carta (Módulo B)
        mat_count = db.query(MylMaterial).count()
        if mat_count == 0:
            print("4. Sembrando catálogo de materiales a la carta...")
            initial_materials = [
                # Básicos indispensables
                MylMaterial(name="Kit Estándar de Prototipado MDF", category="basico", cost_myl=4, stock=20, description="Placas cortadas en láser para ensamble estructural básico"),
                MylMaterial(name="Set de Conectores y Fijaciones", category="basico", cost_myl=2, stock=30, description="Uniones modulares para ensambles de equipo"),
                MylMaterial(name="Pliego de Cartulinas Técnicas e Hitos", category="basico", cost_myl=1, stock=40, description="Guías visuales y diagramación de prototipos"),
                MylMaterial(name="Cinta de Sujeción y Adhesivos Rápidos", category="basico", cost_myl=1, stock=50, description="Insumo básico de montaje"),
                # Avanzados o especiales
                MylMaterial(name="Módulo Actuador Dinámico / Mecanismo", category="avanzado", cost_myl=6, stock=12, description="Componente cinemático especial para el reto de sesión"),
                MylMaterial(name="Kit de Sensores y Señalética LED", category="avanzado", cost_myl=5, stock=15, description="Indicadores luminosos para prototipo funcional"),
                MylMaterial(name="Chasis Reforzado de Acrílico Cristal", category="especial", cost_myl=8, stock=8, description="Acabado premium para presentación de jurado"),
                MylMaterial(name="Paquete de Fichas de Bonificación Modular", category="especial", cost_myl=6, stock=10, description="Tokens de ampliación de funcionalidades"),
            ]
            db.add_all(initial_materials)

        # C. Semilla de Tienda Oficial e Impulsos (Módulo C)
        store_count = db.query(MylStoreItem).count()
        if store_count == 0:
            print("5. Sembrando artículos e impulsos de Tienda Oficial...")
            initial_store = [
                MylStoreItem(
                    code="IMPULSO_FICHAS",
                    title="Impulso Fichas (Individual)",
                    item_type="impulso_fichas",
                    target_scope="individual",
                    base_price_myl=2,
                    current_price_myl=2,
                    description="Triplica el cobro a 6 MYL si aciertas el reto individual (ganancia +4 MYL). Si fallas, recibes 0 MYL."
                ),
                MylStoreItem(
                    code="IMPULSO_BONO",
                    title="Impulso Bono (Grupal)",
                    item_type="impulso_bono",
                    target_scope="grupal",
                    base_price_myl=12,
                    current_price_myl=12,
                    description="Otorga +24 MYL (+2 por integrante) en la siguiente sesión si la casa queda en 1.º o 2.º puesto."
                ),
                MylStoreItem(
                    code="IMPULSO_APOYO",
                    title="Impulso Apoyo (Grupal)",
                    item_type="impulso_apoyo",
                    target_scope="grupal",
                    base_price_myl=6,
                    current_price_myl=6,
                    description="Canje directo por un recurso del programa: pista técnica, tiempo extra (+5 min) o mentoría breve."
                ),
                MylStoreItem(
                    code="INSIGNIA_NFT_LIDER",
                    title="Insignia Digital de Casa (NFT)",
                    item_type="nft",
                    target_scope="individual",
                    base_price_myl=5,
                    current_price_myl=5,
                    description="Distintivo conmemorativo coleccionable certificado en Solana para el perfil del estudiante."
                ),
            ]
            db.add_all(initial_store)

        # D. Semilla de Estado Macroeconómico (Consola Gestor)
        macro = db.query(MylMacroeconomicState).first()
        if not macro:
            print("6. Inicializando estado macroeconómico global...")
            macro = MylMacroeconomicState(
                edition_total_cap_myl=7000,
                edition_emitted_myl=1840,
                session_number=1,
                session_cap_myl=500,
                session_emitted_myl=384,
                session_burned_myl=312,
                active_phase="Apertura",
                reference_rate_text="1 Punto de Casa = 2 MYL",
                alert_status="green"
            )
            db.add(macro)

        # E. Inicializar carritos de mesa para las 4 casas si no existen
        for h in ["APEX", "IGNIS", "NEXUS", "VISIO"]:
            order = db.query(MylHouseOrder).filter_by(house=h, session_number=1).first()
            if not order:
                order = MylHouseOrder(
                    house=h,
                    session_number=1,
                    total_cost_myl=48, # Gasto de referencia
                    total_collected_myl=0,
                    items_json=[
                        {"material_id": 1, "name": "Kit Estándar de Prototipado MDF", "qty": 6, "subtotal": 24},
                        {"material_id": 2, "name": "Set de Conectores y Fijaciones", "qty": 6, "subtotal": 12},
                        {"material_id": 3, "name": "Pliego de Cartulinas Técnicas e Hitos", "qty": 6, "subtotal": 6},
                        {"material_id": 4, "name": "Cinta de Sujeción y Adhesivos Rápidos", "qty": 6, "subtotal": 6},
                    ],
                    status="draft"
                )
                db.add(order)

        db.commit()
        print("¡Economía MYL inicializada exitosamente en base de datos con 0 decimales!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_myl_system()

