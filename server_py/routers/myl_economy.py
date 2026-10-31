"""
myl_economy.py
--------------
Router de la Plataforma de Tokenomía MYL y Solana Token-2022.
Implementa:
- Contabilidad estricta en números enteros (0 decimales en toda la plataforma).
- Módulo A: Dashboard & Billetera Personal (efectivo QR/MDF vs saldo digital, ventana móvil 2 sesiones, bono).
- Módulo B: Mesa de Control de Casa (materiales a la carta, aportes de los 12 miembros en vivo, matriz de cohesión).
- Módulo C: Tienda Oficial e Impulsos (precios dinámicos por demanda, antiacaparamiento máx 2, bloqueo por fase).
- Módulo D: Mercado Secundario P2P (cuota escalonada quemada en Solana, alerta de intercambio desigual > 30%).
- Consola del Gestor (Pestañas 1, 2 y 3: Macroeconomía, Desglose por Casa/Alumno, Auditoría de Mercado).
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server_py.memoria.database import (
    get_db, User, MylLedgerEntry, MylMaterial, MylHouseOrder,
    MylOrderContribution, MylStoreItem, MylActiveImpulse, MylP2POrder,
    MylMacroeconomicState
)
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/myl", tags=["Economía MYL"])

# ── REGLAS DE NEGOCIO Y CONSTANTES ───────────────────────────────────────────
HOUSE_BONUS_MULTIPLIERS = {
    1: {"multiplier": 1.2, "payout_myl": 6, "label": "1.º Puesto (+20%)"},
    2: {"multiplier": 1.0, "payout_myl": 5, "label": "2.º Puesto (Base)"},
    3: {"multiplier": 1.0, "payout_myl": 5, "label": "3.º Puesto (Base)"},
    4: {"multiplier": 0.8, "payout_myl": 4, "label": "4.º Puesto (-20%)"},
}

def get_house_rankings(db: Session):
    """Calcula las puntuaciones de ventana móvil (St-1 + St) y ranking de las 4 casas."""
    # Simulación calibrada de ventana móvil para las 4 casas oficiales
    return [
        {"house": "APEX", "rank": 1, "st_prev": 28, "st_curr": 24, "total_pts": 52, "diff_up": 0, "diff_down": 4},
        {"house": "IGNIS", "rank": 2, "st_prev": 24, "st_curr": 24, "total_pts": 48, "diff_up": -4, "diff_down": 6},
        {"house": "NEXUS", "rank": 3, "st_prev": 22, "st_curr": 20, "total_pts": 42, "diff_up": -6, "diff_down": 4},
        {"house": "VISIO", "rank": 4, "st_prev": 18, "st_curr": 20, "total_pts": 38, "diff_up": -4, "diff_down": 0},
    ]


# ── MÓDULO A: DASHBOARD & BILLETERA PERSONAL ────────────────────────────────
@router.get("/me")
def get_student_wallet_dashboard(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve la liquidez personal en enteros (efectivo vs digital) y estado competitivo de casa."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    house = user.house or "APEX"
    rankings = get_house_rankings(db)
    house_stat = next((r for r in rankings if r["house"] == house), rankings[0])
    rank = house_stat["rank"]
    bonus_info = HOUSE_BONUS_MULTIPLIERS.get(rank, HOUSE_BONUS_MULTIPLIERS[2])

    # Transacciones recientes en libro mayor
    ledger = (
        db.query(MylLedgerEntry)
        .filter(MylLedgerEntry.user_id == user.id)
        .order_by(MylLedgerEntry.timestamp.desc())
        .limit(10)
        .all()
    )

    # Impulsos activos
    active_impulses = (
        db.query(MylActiveImpulse)
        .filter(MylActiveImpulse.user_id == user.id, MylActiveImpulse.status == "active")
        .all()
    )

    cash = int(user.myl_balance_cash or 0)
    digital = int(user.myl_balance_digital or 0)
    total = cash + digital

    return {
        "user_id": user.id,
        "full_name": user.full_name or user.username,
        "username": user.username,
        "email": user.email,
        "house": house,
        "solana_wallet_address": user.solana_wallet_address,
        "balances": {
            "total_myl": total,
            "cash_myl": cash,
            "digital_myl": digital,
            "decimals": 0, # CONTABILIDAD ESTRICTA EN ENTEROS
        },
        "house_status": {
            "house": house,
            "rank": rank,
            "st_prev": house_stat["st_prev"],
            "st_curr": house_stat["st_curr"],
            "total_pts": house_stat["total_pts"],
            "diff_up": house_stat["diff_up"],
            "diff_down": house_stat["diff_down"],
            "bonus_projection": bonus_info,
        },
        "session_metrics": {
            "house_points_earned": user.myl_house_points_session or 0,
            "house_points_cap": 3, # Tope máximo de 3 puntos de casa por sesión
            "points_capped": (user.myl_house_points_session or 0) >= 3,
        },
        "active_impulses": [
            {"id": ai.id, "item_code": ai.item_code, "status": ai.status, "session": ai.session_number}
            for ai in active_impulses
        ],
        "recent_ledger": [
            {
                "id": entry.id,
                "amount": entry.amount,
                "entry_type": entry.entry_type,
                "status": entry.status,
                "description": entry.description,
                "solana_tx": entry.solana_tx_signature,
                "date": entry.timestamp.strftime("%d/%m/%Y %H:%M"),
            }
            for entry in ledger
        ],
    }


# ── MÓDULO B: MESA DE CONTROL DE LA CASA (MATERIALES Y PRESUPUESTO) ─────────
@router.get("/house-desk")
def get_house_desk(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve el catálogo de materiales, el carrito grupal y los aportes en vivo de los 12 miembros."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    house = user.house or "APEX"

    # 1. Catálogo de materiales
    materials = db.query(MylMaterial).all()

    # 2. Hoja de pedido grupal de la casa
    order = db.query(MylHouseOrder).filter_by(house=house, session_number=1).first()
    if not order:
        order = MylHouseOrder(house=house, session_number=1, total_cost_myl=48, total_collected_myl=0, status="draft")
        db.add(order)
        db.commit()
        db.refresh(order)

    # 3. Lista de los integrantes oficiales de esta casa (filtrando por la casa exacta del usuario)
    house_students = db.query(User).filter(User.house == house).all()
    # Si la lista supera 12 o incluye usuarios de prueba, priorizamos al usuario actual y los miembros principales
    contributions_map = {
        c.user_id: c.amount_myl
        for c in db.query(MylOrderContribution).filter_by(order_id=order.id).all()
    }

    # Si hay más de 12, garantizamos que el usuario actual esté siempre incluido entre los miembros visibles
    if len(house_students) > 12:
        me_list = [s for s in house_students if s.id == user.id]
        others = [s for s in house_students if s.id != user.id]
        house_students = (me_list + others)[:12]

    members_status = []
    total_collected = 0
    for s in house_students:
        contrib = contributions_map.get(s.id, 0)
        total_collected += contrib
        members_status.append({
            "user_id": s.id,
            "full_name": s.full_name or s.username,
            "avatar_url": s.avatar_url,
            "amount_myl": contrib,
            "digital_balance": s.myl_balance_digital or 0,
            "is_free_rider": (contrib == 0), # Alerta visual de cohesión
            "is_me": (s.id == user.id),
        })

    # Actualizar total recaudado si hubo cambio
    if order.total_collected_myl != total_collected:
        order.total_collected_myl = total_collected
        db.commit()

    is_covered = order.total_collected_myl >= order.total_cost_myl

    return {
        "house": house,
        "session_number": order.session_number,
        "order": {
            "id": order.id,
            "status": order.status,
            "total_cost_myl": order.total_cost_myl,
            "total_collected_myl": order.total_collected_myl,
            "benchmark_gasto": 48, # Gasto de referencia estimado
            "techo_presupuestario": 50, # Techo del 60% (~50 MYL)
            "is_covered": is_covered,
            "can_checkout": is_covered and order.status == "draft",
            "items": order.items_json or [],
        },
        "members_contributions": members_status,
        "materials_catalog": [
            {
                "id": m.id,
                "name": m.name,
                "category": m.category,
                "cost_myl": m.cost_myl,
                "stock": m.stock,
                "description": m.description,
            }
            for m in materials
        ],
    }


class ContributeRequest(BaseModel):
    amount_myl: int = Field(gt=0, description="Cantidad entera positiva en MYL")

@router.post("/house-desk/contribute")
def contribute_to_house_order(
    req: ContributeRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Transfiere MYL enteros del saldo digital del alumno al pozo de materiales de su casa."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    amount = int(req.amount_myl)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="El aporte debe ser un número entero mayor a 0.")

    if (user.myl_balance_digital or 0) < amount:
        raise HTTPException(status_code=400, detail="Saldo digital insuficiente en MYL.")

    house = user.house or "APEX"
    order = db.query(MylHouseOrder).filter_by(house=house, session_number=1).first()
    if not order or order.status != "draft":
        raise HTTPException(status_code=400, detail="No hay una orden de materiales abierta para aportar.")

    # 1. Descontar saldo digital del alumno
    user.myl_balance_digital -= amount

    # 2. Registrar o sumar aporte
    contrib = db.query(MylOrderContribution).filter_by(order_id=order.id, user_id=user.id).first()
    if contrib:
        contrib.amount_myl += amount
        contrib.updated_at = datetime.utcnow()
    else:
        contrib = MylOrderContribution(order_id=order.id, user_id=user.id, amount_myl=amount)
        db.add(contrib)

    # 3. Sumar a la orden de casa
    order.total_collected_myl += amount

    # 4. Registrar en libro mayor
    ledger = MylLedgerEntry(
        user_id=user.id,
        house=house,
        amount=-amount,
        entry_type="burn_material_contribution",
        status="confirmed",
        description=f"Aporte a Hoja de Pedido de materiales ({house})",
    )
    db.add(ledger)
    db.commit()

    return {
        "status": "success",
        "message": f"Has aportado {amount} MYL con éxito al pedido de Casa {house}.",
        "new_balance_digital": user.myl_balance_digital,
        "order_total_collected": order.total_collected_myl,
        "is_covered": order.total_collected_myl >= order.total_cost_myl,
    }


@router.post("/house-desk/checkout")
def checkout_house_order(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Confirma la orden de despacho físico si los fondos cubren el 100%."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    house = user.house or "APEX"
    order = db.query(MylHouseOrder).filter_by(house=house, session_number=1).first()
    if not order:
        raise HTTPException(status_code=404, detail="No se encontró la orden.")

    if order.status != "draft":
        raise HTTPException(status_code=400, detail=f"La orden ya se encuentra en estado: {order.status}")

    if order.total_collected_myl < order.total_cost_myl:
        missing = order.total_cost_myl - order.total_collected_myl
        raise HTTPException(
            status_code=400,
            detail=f"Fondos insuficientes: Faltan {missing} MYL para cubrir el costo total."
        )

    order.status = "paid"
    order.paid_at = datetime.utcnow()

    # Actualizar estado macroeconómico (quema por materiales)
    macro = db.query(MylMacroeconomicState).first()
    if macro:
        macro.session_burned_myl += order.total_cost_myl

    db.commit()

    return {
        "status": "success",
        "message": f"¡Orden de Casa {house} confirmada y pagada! Despacho físico autorizado.",
        "order_id": order.id,
        "paid_at": order.paid_at.isoformat(),
    }


# ── MÓDULO C: TIENDA OFICIAL E IMPULSOS (MERCADO PRIMARIO) ───────────────────
@router.get("/store")
def get_store_catalog(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Lista de artículos de la tienda con precios dinámicos y temporizador de fase."""
    items = db.query(MylStoreItem).all()
    user_impulses = (
        db.query(MylActiveImpulse)
        .filter(MylActiveImpulse.user_id == user_id, MylActiveImpulse.status == "active")
        .all()
    )
    user_counts = {}
    for imp in user_impulses:
        user_counts[imp.item_code] = user_counts.get(imp.item_code, 0) + 1

    macro = db.query(MylMacroeconomicState).first()
    active_phase = macro.active_phase if macro else "Apertura"
    is_market_locked = (active_phase == "Actividad Grupal")

    return {
        "active_phase": active_phase,
        "is_market_locked": is_market_locked,
        "items": [
            {
                "id": it.id,
                "code": it.code,
                "title": it.title,
                "item_type": it.item_type,
                "target_scope": it.target_scope,
                "base_price_myl": it.base_price_myl,
                "current_price_myl": it.current_price_myl,
                "high_demand": bool(it.high_demand),
                "description": it.description,
                "units_active_user": user_counts.get(it.code, 0),
                "can_buy": (user_counts.get(it.code, 0) < 2) and not is_market_locked,
            }
            for it in items
        ],
    }


class BuyStoreItemRequest(BaseModel):
    item_code: str

@router.post("/store/buy")
def buy_store_item(
    req: BuyStoreItemRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Compra de consumible o declaración de Impulso con validación de tope antiacaparamiento (máx 2)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    macro = db.query(MylMacroeconomicState).first()
    if macro and macro.active_phase == "Actividad Grupal":
        raise HTTPException(status_code=400, detail="Mercado Bloqueado: No se pueden comprar Impulsos durante la Actividad Grupal.")

    item = db.query(MylStoreItem).filter_by(code=req.item_code).first()
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado en la tienda.")

    # Validación antiacaparamiento (máx 2 unidades del mismo impulso activas)
    current_active = (
        db.query(MylActiveImpulse)
        .filter_by(user_id=user.id, item_code=req.item_code, status="active")
        .count()
    )
    if current_active >= 2:
        raise HTTPException(status_code=400, detail="Límite Antiacaparamiento: Ya posees el tope máximo de 2 unidades activas de este Impulso.")

    price = item.current_price_myl
    if (user.myl_balance_digital or 0) < price:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Este artículo cuesta {price} MYL.")

    # 1. Cobro
    user.myl_balance_digital -= price

    # 2. Registrar impulso activo
    new_impulse = MylActiveImpulse(
        user_id=user.id,
        house=user.house,
        item_code=item.code,
        session_number=macro.session_number if macro else 1,
        status="active"
    )
    db.add(new_impulse)

    # 3. Ajuste del motor de precios dinámicos por demanda
    item.units_sold_session += 1
    if item.units_sold_session >= 5: # Umbral de rotación
        item.current_price_myl = item.base_price_myl + 2
        item.high_demand = 1
    elif item.units_sold_session >= 3:
        item.current_price_myl = item.base_price_myl + 1
        item.high_demand = 1

    # 4. Quema / Registro en libro mayor
    ledger = MylLedgerEntry(
        user_id=user.id,
        house=user.house,
        amount=-price,
        entry_type=f"burn_{item.item_type}",
        status="settled_solana",
        description=f"Compra en Tienda: {item.title}",
    )
    db.add(ledger)

    if macro:
        macro.session_burned_myl += price

    db.commit()

    return {
        "status": "success",
        "message": f"¡Compra completada! Has activado {item.title} por {price} MYL.",
        "new_balance_digital": user.myl_balance_digital,
        "active_units": current_active + 1,
    }


# ── MÓDULO D: MERCADO SECUNDARIO P2P (INTERCAMBIO ENTRE ALUMNOS) ─────────────
def calculate_p2p_burn_fee(seller_house: str, buyer_house: Optional[str], price_myl: int) -> int:
    """Calcula la cuota escalonada en enteros quemada en Solana."""
    # Exención Intracasa
    if buyer_house and seller_house == buyer_house:
        return 0
    if price_myl <= 5:
        return 0 # Exento
    elif price_myl <= 20:
        return 1 # Cuota fija 1 MYL
    else:
        return 2 # Cuota fija 2 MYL


@router.get("/p2p")
def get_p2p_market(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve órdenes P2P abiertas, historial de auditoría y precio de referencia."""
    user = db.query(User).filter(User.id == user_id).first()
    my_house = user.house if user else "APEX"

    orders = (
        db.query(MylP2POrder)
        .filter(MylP2POrder.status == "open")
        .order_by(MylP2POrder.created_at.desc())
        .all()
    )

    completed = (
        db.query(MylP2POrder)
        .filter(MylP2POrder.status == "completed")
        .order_by(MylP2POrder.completed_at.desc())
        .limit(10)
        .all()
    )

    # Calcular precio de referencia (mediana histórica)
    prices = [c.price_myl for c in completed] if completed else [4]
    prices.sort()
    market_median_price = prices[len(prices) // 2]

    orders_out = []
    for ord in orders:
        burn_fee = calculate_p2p_burn_fee(ord.seller_house, my_house, ord.price_myl)
        # Desviación mayor a 30%
        is_unequal = abs(ord.price_myl - market_median_price) / max(market_median_price, 1) > 0.30
        orders_out.append({
            "id": ord.id,
            "asset_name": ord.asset_name,
            "seller_user_id": ord.seller_user_id,
            "seller_house": ord.seller_house,
            "is_my_house": (ord.seller_house == my_house),
            "is_my_order": (ord.seller_user_id == user_id),
            "price_myl": ord.price_myl,
            "burn_fee_myl": burn_fee,
            "is_unequal_trade": is_unequal,
            "date": ord.created_at.strftime("%d/%m %H:%M"),
        })

    return {
        "market_median_price": market_median_price,
        "my_house": my_house,
        "open_orders": orders_out,
        "recent_completed": [
            {
                "id": c.id,
                "asset_name": c.asset_name,
                "price_myl": c.price_myl,
                "fee_burned": c.burn_fee_myl,
                "seller_house": c.seller_house,
                "buyer_house": c.buyer_house,
                "is_unequal": bool(c.is_unequal_trade),
                "date": c.completed_at.strftime("%d/%m %H:%M") if c.completed_at else "",
            }
            for c in completed
        ],
    }


class CreateP2POrderRequest(BaseModel):
    asset_name: str
    price_myl: int = Field(gt=0, description="Precio entero en MYL")

@router.post("/p2p/create")
def create_p2p_order(
    req: CreateP2POrderRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Publica una orden en el mercado P2P."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    price = int(req.price_myl)
    if price <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser un número entero mayor a 0.")

    order = MylP2POrder(
        seller_user_id=user.id,
        seller_house=user.house or "APEX",
        asset_name=req.asset_name,
        price_myl=price,
        status="open"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "status": "success",
        "message": f"Orden de venta publicada por {price} MYL.",
        "order_id": order.id,
    }


@router.post("/p2p/buy/{order_id}")
def buy_p2p_order(
    order_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Compra una orden P2P liquidando la cuota quemada en Solana."""
    buyer = db.query(User).filter(User.id == user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Comprador no encontrado")

    order = db.query(MylP2POrder).filter_by(id=order_id, status="open").first()
    if not order:
        raise HTTPException(status_code=404, detail="La orden no existe o ya no está disponible.")

    if order.seller_user_id == buyer.id:
        raise HTTPException(status_code=400, detail="No puedes comprar tu propia orden.")

    seller = db.query(User).filter_by(id=order.seller_user_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado.")

    # Cálculo de cuota quemada en Solana
    fee = calculate_p2p_burn_fee(order.seller_house, buyer.house, order.price_myl)
    total_cost = order.price_myl

    if (buyer.myl_balance_digital or 0) < total_cost:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Necesitas {total_cost} MYL.")

    # Transferencia neta
    seller_receive = order.price_myl - fee
    buyer.myl_balance_digital -= total_cost
    seller.myl_balance_digital += seller_receive

    order.buyer_user_id = buyer.id
    order.buyer_house = buyer.house
    order.burn_fee_myl = fee
    order.status = "completed"
    order.completed_at = datetime.utcnow()

    # Registrar en libro mayor
    db.add(MylLedgerEntry(
        user_id=buyer.id,
        house=buyer.house,
        amount=-total_cost,
        entry_type="p2p_buy",
        status="confirmed",
        description=f"Compra P2P: {order.asset_name} a @{seller.username}",
    ))
    db.add(MylLedgerEntry(
        user_id=seller.id,
        house=seller.house,
        amount=seller_receive,
        entry_type="p2p_sell",
        status="confirmed",
        description=f"Venta P2P: {order.asset_name} a @{buyer.username} (Cuota quemada: {fee} MYL)",
    ))

    macro = db.query(MylMacroeconomicState).first()
    if fee > 0 and macro:
        macro.session_burned_myl += fee

    db.commit()

    return {
        "status": "success",
        "message": f"¡Intercambio P2P completado! Has adquirido {order.asset_name}. Cuota quemada: {fee} MYL.",
        "new_balance_digital": buyer.myl_balance_digital,
        "fee_burned_myl": fee,
    }


# ── MÓDULO E: PASARELA QR DE SERVICIOS Y TRANSFERENCIAS P2P DIRECTAS ───────
class QRInspectRequest(BaseModel):
    qr_payload: str

class QRPayRequest(BaseModel):
    qr_payload: str

@router.post("/qr/inspect")
def inspect_qr_payload(
    req: QRInspectRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Decodifica e inspecciona un payload QR para servicios de tienda o transferencia P2P.
    Soporta formato JSON o URI:
    - Servicio / Tienda: {"type":"service", "item_code":"...", "title":"...", "price":5}
    - Transferencia P2P: {"type":"p2p_transfer", "seller_id":58, "seller_name":"Josue", "asset_name":"Insumo A", "price":4}
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no autenticado")

    import json
    raw = req.qr_payload.strip()

    # Intentar parsear JSON
    data = None
    if raw.startswith("{") and raw.endswith("}"):
        try:
            data = json.loads(raw)
        except Exception:
            pass

    # Si no es JSON puro, intentar parsear formato clave-valor estilo token: myl://pay?item=...&price=...
    if not data and "myl://" in raw:
        try:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(raw)
            qs = parse_qs(parsed.query)
            data = {k: v[0] for k, v in qs.items()}
        except Exception:
            pass

    if not data:
        # Si es un item_code directo de tienda (ej: IMPULSO_BONO)
        item = db.query(MylStoreItem).filter_by(code=raw).first()
        if item:
            data = {
                "type": "service",
                "item_code": item.code,
                "title": item.title,
                "price": int(item.current_price_myl),
                "description": item.description,
                "seller_name": "Tienda Oficial UCSM"
            }
        else:
            raise HTTPException(status_code=400, detail="Formato de código QR no reconocido o inválido.")

    qr_type = data.get("type", "service")
    price = int(data.get("price") or data.get("price_myl") or 0)
    user_balance = int(user.myl_balance_digital or 0)
    can_afford = user_balance >= price

    if qr_type == "p2p_transfer":
        seller_id = data.get("seller_id")
        seller = db.query(User).filter_by(id=seller_id).first() if seller_id else None
        seller_name = seller.full_name or seller.username if seller else data.get("seller_name", "Compañero")
        asset_name = data.get("asset_name") or data.get("offer", "Activo / Insumo")

        return {
            "valid": True,
            "type": "p2p_transfer",
            "title": f"Transferencia P2P: {asset_name}",
            "asset_name": asset_name,
            "seller_id": seller_id,
            "seller_name": seller_name,
            "seller_house": seller.house if seller else data.get("seller_house", "APEX"),
            "price_myl": price,
            "user_balance_digital": user_balance,
            "can_afford": can_afford,
            "is_self": (seller_id == user.id) if seller_id else False
        }

    else:
        # Es un servicio / artículo oficial
        item_code = data.get("item_code") or data.get("code")
        item = db.query(MylStoreItem).filter_by(code=item_code).first() if item_code else None
        title = item.title if item else data.get("title", "Servicio General")
        price = int(item.current_price_myl) if item else price
        description = item.description if item else data.get("description", "Pago de servicio mediante saldo digital MYL.")

        return {
            "valid": True,
            "type": "service",
            "item_code": item_code,
            "title": title,
            "description": description,
            "price_myl": price,
            "seller_name": "Tienda Oficial / Servicios UCSM",
            "user_balance_digital": user_balance,
            "can_afford": user_balance >= price,
            "is_self": False
        }


@router.post("/qr/pay")
def pay_qr_payload(
    req: QRPayRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Ejecuta el pago del QR descontando el saldo digital del usuario y acreditándolo
    al vendedor (si es P2P) o registrando la compra de servicio en el libro mayor.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Inspeccionamos para validar
    inspect_res = inspect_qr_payload(QRInspectRequest(qr_payload=req.qr_payload), db, user_id)
    if not inspect_res.get("valid"):
        raise HTTPException(status_code=400, detail="Código QR inválido.")

    if inspect_res.get("is_self"):
        raise HTTPException(status_code=400, detail="No puedes transferirte fondos a ti mismo.")

    price = int(inspect_res["price_myl"])
    if (user.myl_balance_digital or 0) < price:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Tienes {user.myl_balance_digital} MYL y el costo es {price} MYL.")

    macro = db.query(MylMacroeconomicState).first()

    if inspect_res["type"] == "p2p_transfer":
        seller_id = inspect_res.get("seller_id")
        seller = db.query(User).filter_by(id=seller_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="El vendedor destinatario no fue encontrado.")

        # Cuota escalonada
        fee = calculate_p2p_burn_fee(seller.house or "APEX", user.house, price)
        seller_receive = price - fee

        # Descontar al comprador
        user.myl_balance_digital -= price
        # Acreditar al vendedor
        seller.myl_balance_digital = (seller.myl_balance_digital or 0) + seller_receive

        # Registrar en libro mayor
        db.add(MylLedgerEntry(
            user_id=user.id,
            house=user.house,
            amount=-price,
            entry_type="qr_p2p_pay",
            status="confirmed",
            description=f"Pago QR a {seller.full_name or seller.username}: {inspect_res['asset_name']}",
        ))
        db.add(MylLedgerEntry(
            user_id=seller.id,
            house=seller.house,
            amount=seller_receive,
            entry_type="qr_p2p_receive",
            status="confirmed",
            description=f"Cobro QR de {user.full_name or user.username}: {inspect_res['asset_name']} (Quemado: {fee} MYL)",
        ))

        if fee > 0 and macro:
            macro.session_burned_myl += fee

        db.commit()

        return {
            "status": "success",
            "message": f"¡Pago exitoso de {price} MYL a {seller.full_name or seller.username}! Se transfirió el activo {inspect_res['asset_name']}.",
            "new_balance_digital": user.myl_balance_digital,
            "fee_burned": fee
        }

    else:
        # Pago de servicio / artículo oficial
        item_code = inspect_res.get("item_code")
        item = db.query(MylStoreItem).filter_by(code=item_code).first() if item_code else None

        user.myl_balance_digital -= price

        if item:
            # Registrar impulso si aplica
            new_impulse = MylActiveImpulse(
                user_id=user.id,
                house=user.house,
                item_code=item.code,
                session_number=macro.session_number if macro else 1,
                status="active"
            )
            db.add(new_impulse)
            item.units_sold_session += 1

        db.add(MylLedgerEntry(
            user_id=user.id,
            house=user.house,
            amount=-price,
            entry_type="qr_service_pay",
            status="settled_solana",
            description=f"Pago QR Servicio: {inspect_res['title']}",
        ))

        if macro:
            macro.session_burned_myl += price

        db.commit()

        return {
            "status": "success",
            "message": f"¡Pago de servicio confirmado! Has pagado {price} MYL por {inspect_res['title']}.",
            "new_balance_digital": user.myl_balance_digital,
        }


# ── GENERADOR DE TOKEN / CÓDIGO QR P2P PERSONALIZADO ────────────────────────
class GenerateP2PQRRequest(BaseModel):
    asset_name: str
    price_myl: int = Field(gt=0, description="Precio entero en MYL")

@router.post("/qr/generate-p2p")
def generate_p2p_qr_token(
    req: GenerateP2PQRRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Genera el token JSON y URI compatible con el escáner QR para cobrar un objeto/servicio.
    Contiene:
    - Nombre del vendedor
    - Precio en MYL (entero)
    - Nombre del objeto / lo que ofrece
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    import json
    price = int(req.price_myl)
    payload_data = {
        "type": "p2p_transfer",
        "seller_id": user.id,
        "seller_name": user.full_name or user.username,
        "seller_house": user.house or "APEX",
        "asset_name": req.asset_name,
        "price": price,
        "created_at": datetime.utcnow().isoformat()
    }

    qr_payload_string = json.dumps(payload_data, ensure_ascii=False)

    return {
        "status": "success",
        "qr_payload": qr_payload_string,
        "details": payload_data
    }


# ── CONSOLA DEL GESTOR (DASHBOARD ADMINISTRATIVO) ───────────────────────────
@router.get("/manager/macro")
def get_manager_macro_view(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Pestaña 1: Agregados macroeconómicos, ritmo de quema, semáforo y control de fases."""
    macro = db.query(MylMacroeconomicState).first()
    if not macro:
        macro = MylMacroeconomicState()
        db.add(macro)
        db.commit()
        db.refresh(macro)

    circulating = max(0, macro.session_emitted_myl - macro.session_burned_myl)
    burn_rate_pct = round((macro.session_burned_myl / max(macro.session_emitted_myl, 1)) * 100, 1)

    # Semáforo de emisión
    if macro.session_emitted_myl <= 384:
        alert_status = "green"
    elif macro.session_emitted_myl <= 420:
        alert_status = "yellow"
    else:
        alert_status = "red"

    return {
        "edition_total_cap_myl": macro.edition_total_cap_myl, # 7,000 MYL
        "edition_emitted_myl": macro.edition_emitted_myl,
        "edition_remaining_myl": macro.edition_total_cap_myl - macro.edition_emitted_myl,
        "session_number": macro.session_number,
        "session_cap_myl": macro.session_cap_myl, # 500 MYL
        "session_emitted_myl": macro.session_emitted_myl,
        "session_burned_myl": macro.session_burned_myl,
        "circulating_myl": circulating,
        "burn_rate_pct": burn_rate_pct,
        "burn_target_pct": "75% - 85%",
        "alert_status": alert_status,
        "active_phase": macro.active_phase,
        "reference_rate_text": macro.reference_rate_text, # "1 Punto de Casa = 2 MYL"
        "phases_available": [
            "Apertura",
            "Bloque Individual",
            "Ventana de Mercado",
            "Actividad Grupal",
            "Cierre"
        ],
    }


class UpdatePhaseRequest(BaseModel):
    new_phase: str

@router.post("/manager/phase")
def update_session_phase(
    req: UpdatePhaseRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Interruptor maestro para cambiar de fase operativa de sesión."""
    macro = db.query(MylMacroeconomicState).first()
    if not macro:
        raise HTTPException(status_code=404, detail="Estado macroeconómico no encontrado")

    macro.active_phase = req.new_phase
    macro.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "active_phase": macro.active_phase,
        "message": f"Fase cambiada a: {macro.active_phase}",
    }


@router.get("/manager/breakdown")
def get_manager_breakdown(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Pestaña 2: Desglose por Casa (Ventana Móvil) y por Participante (Directorio de 48 Alumnos)."""
    rankings = get_house_rankings(db)
    orders = {o.house: o for o in db.query(MylHouseOrder).filter_by(session_number=1).all()}

    houses_breakdown = []
    for r in rankings:
        h = r["house"]
        ord = orders.get(h)
        houses_breakdown.append({
            "house": h,
            "rank": r["rank"],
            "st_prev": r["st_prev"],
            "st_curr": r["st_curr"],
            "total_pts": r["total_pts"],
            "order_status": ord.status if ord else "draft",
            "order_collected_myl": ord.total_collected_myl if ord else 0,
            "order_total_cost_myl": ord.total_cost_myl if ord else 48,
        })

    # Directorio de alumnos
    students = db.query(User).filter(User.role == "student").order_by(User.house, User.full_name).all()
    students_list = [
        {
            "id": s.id,
            "full_name": s.full_name or s.username,
            "username": s.username,
            "house": s.house,
            "cash_myl": s.myl_balance_cash or 0,
            "digital_myl": s.myl_balance_digital or 0,
            "total_myl": (s.myl_balance_cash or 0) + (s.myl_balance_digital or 0),
            "session_house_points": s.myl_house_points_session or 0,
            "effort_index_ratio": "50% Bono / 50% Mérito",
            "solana_wallet": s.solana_wallet_address,
        }
        for s in students
    ]

    return {
        "houses": houses_breakdown,
        "students_total": len(students_list),
        "students": students_list,
    }


@router.get("/manager/market")
def get_manager_market_view(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Pestaña 3: Monitor de rotación de tienda, feed P2P en tiempo real y auditoría de intercambios desiguales."""
    store_items = db.query(MylStoreItem).all()
    p2p_orders = db.query(MylP2POrder).order_by(MylP2POrder.created_at.desc()).limit(20).all()
    unequal_alerts = [ord for ord in p2p_orders if ord.is_unequal_trade == 1]

    return {
        "store_rotation": [
            {
                "code": it.code,
                "title": it.title,
                "current_price_myl": it.current_price_myl,
                "units_sold": it.units_sold_session,
                "high_demand": bool(it.high_demand),
            }
            for it in store_items
        ],
        "p2p_feed": [
            {
                "id": p.id,
                "asset": p.asset_name,
                "seller_house": p.seller_house,
                "buyer_house": p.buyer_house,
                "price_myl": p.price_myl,
                "fee_burned_myl": p.burn_fee_myl,
                "is_unequal": bool(p.is_unequal_trade),
                "status": p.status,
                "date": p.created_at.strftime("%d/%m %H:%M"),
            }
            for p in p2p_orders
        ],
        "unequal_trade_audit_count": len(unequal_alerts),
    }

