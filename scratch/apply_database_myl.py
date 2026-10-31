import os

target = 'server_py/memoria/database.py'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add fields to User
old_user_tail = """    # Preferencias del usuario.
    preferences = Column(
        JSON,
        default={
            "theme": "dark",
            "email_notifications": True,
            "push_notifications": True,
            "language": "es",
            "data_density": "comfortable",
        },
    )"""

new_user_tail = """    # Preferencias del usuario.
    preferences = Column(
        JSON,
        default={
            "theme": "dark",
            "email_notifications": True,
            "push_notifications": True,
            "language": "es",
            "data_density": "comfortable",
        },
    )

    # Economía MYL & Solana Token-2022
    solana_wallet_address = Column(String(64), nullable=True, index=True)
    house = Column(String(32), nullable=True, index=True) # APEX, IGNIS, NEXUS, VISIO
    myl_balance_cash = Column(Integer, default=0) # Efectivo en Mano (fichas físicas en MDF / QR)
    myl_balance_digital = Column(Integer, default=0) # Saldo Digital conciliado en cuenta
    myl_house_points_session = Column(Integer, default=0) # Puntos de Casa individuales sesión (tope 3)"""

if old_user_tail in text:
    text = text.replace(old_user_tail, new_user_tail)
elif old_user_tail.replace('\n', '\r\n') in text:
    text = text.replace(old_user_tail.replace('\n', '\r\n'), new_user_tail.replace('\n', '\r\n'))
else:
    print("Could not find old_user_tail")

# 2. Add MYL models before init_db
old_init_db = """def init_db():
    \"\"\"Registra los modelos y crea las tablas que aún no existan.\"\"\""""

new_models_and_init = """class MylLedgerEntry(Base):
    \"\"\"Libro Mayor Contable en Enteros Estrictos para transacciones de MYL y Solana.\"\"\"
    __tablename__ = "myl_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    house = Column(String(32), nullable=True, index=True)
    amount = Column(Integer, nullable=False) # STRICT 0 decimales
    entry_type = Column(String(64), nullable=False) # 'mint_bono', 'mint_merito', 'burn_material', 'burn_impulso', 'p2p_transfer', 'p2p_fee_burned'
    status = Column(String(32), default="confirmed", index=True) # 'confirmed', 'pending_solana', 'settled_solana'
    solana_tx_signature = Column(String(128), nullable=True)
    description = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class MylMaterial(Base):
    \"\"\"Catálogo de Insumos a la Carta para la Mesa de Control de Casa (Módulo B).\"\"\"
    __tablename__ = "myl_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), default="basico") # 'basico', 'avanzado', 'especial'
    cost_myl = Column(Integer, nullable=False) # Entero estricto
    stock = Column(Integer, default=50)
    description = Column(String(255), nullable=True)


class MylHouseOrder(Base):
    \"\"\"Hoja de Pedido Digital / Carrito Grupal de Casa (Módulo B).\"\"\"
    __tablename__ = "myl_house_orders"

    id = Column(Integer, primary_key=True, index=True)
    house = Column(String(32), nullable=False, index=True) # 'APEX', 'IGNIS', 'NEXUS', 'VISIO'
    session_number = Column(Integer, default=1, index=True)
    total_cost_myl = Column(Integer, default=0)
    total_collected_myl = Column(Integer, default=0)
    items_json = Column(JSON, default=[]) # [{material_id, name, qty, subtotal}]
    status = Column(String(32), default="draft") # 'draft', 'paid', 'delivered'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)


class MylOrderContribution(Base):
    \"\"\"Aportes individuales en tiempo real de los 12 miembros de casa para la orden grupal.\"\"\"
    __tablename__ = "myl_order_contributions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("myl_house_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    amount_myl = Column(Integer, default=0) # Entero
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class MylStoreItem(Base):
    \"\"\"Tienda Oficial e Impulsos (Módulo C) con motor de precios dinámicos.\"\"\"
    __tablename__ = "myl_store_items"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(128), nullable=False)
    item_type = Column(String(32), default="impulso") # 'impulso_fichas', 'impulso_bono', 'impulso_apoyo', 'nft', 'voto'
    target_scope = Column(String(32), default="individual") # 'individual' o 'grupal'
    base_price_myl = Column(Integer, nullable=False)
    current_price_myl = Column(Integer, nullable=False)
    units_sold_session = Column(Integer, default=0)
    high_demand = Column(Integer, default=0) # 1 si supera rotación
    description = Column(String(255), nullable=True)


class MylActiveImpulse(Base):
    \"\"\"Registro de impulsos activos adquiridos por alumnos o mesas de casa.\"\"\"
    __tablename__ = "myl_active_impulses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    house = Column(String(32), nullable=True)
    item_code = Column(String(64), nullable=False)
    session_number = Column(Integer, default=1)
    status = Column(String(32), default="active") # 'active', 'consumed', 'settled'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class MylP2POrder(Base):
    \"\"\"Mercado Secundario P2P entre Alumnos (Módulo D).\"\"\"
    __tablename__ = "myl_p2p_orders"

    id = Column(Integer, primary_key=True, index=True)
    seller_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    seller_house = Column(String(32), nullable=False)
    buyer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    buyer_house = Column(String(32), nullable=True)
    asset_name = Column(String(128), nullable=False)
    price_myl = Column(Integer, nullable=False) # Entero
    burn_fee_myl = Column(Integer, default=0) # Cuota 0, 1 o 2 quemada en Solana
    is_unequal_trade = Column(Integer, default=0) # 1 si difiere > 30% del histórico
    status = Column(String(32), default="open", index=True) # 'open', 'completed', 'cancelled'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class MylMacroeconomicState(Base):
    \"\"\"Consola del Gestor Pestaña 1: Agregados macroeconómicos y fases.\"\"\"
    __tablename__ = "myl_macroeconomic_state"

    id = Column(Integer, primary_key=True, index=True)
    edition_total_cap_myl = Column(Integer, default=7000)
    edition_emitted_myl = Column(Integer, default=1840)
    session_number = Column(Integer, default=1)
    session_cap_myl = Column(Integer, default=500)
    session_emitted_myl = Column(Integer, default=384)
    session_burned_myl = Column(Integer, default=312)
    active_phase = Column(String(64), default="Apertura") # 'Apertura', 'Bloque Individual', 'Ventana de Mercado', 'Actividad Grupal', 'Cierre'
    reference_rate_text = Column(String(64), default="1 Punto de Casa = 2 MYL")
    alert_status = Column(String(32), default="green") # 'green', 'yellow', 'red'
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    \"\"\"Registra los modelos y crea las tablas que aún no existan.\"\"\""""

if old_init_db in text:
    text = text.replace(old_init_db, new_models_and_init)
elif old_init_db.replace('\n', '\r\n') in text:
    text = text.replace(old_init_db.replace('\n', '\r\n'), new_models_and_init.replace('\n', '\r\n'))
else:
    print("Could not find old_init_db")

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated server_py/memoria/database.py with MYL models!")

