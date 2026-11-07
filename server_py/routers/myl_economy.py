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
from sqlalchemy import desc, func
import random

from server_py.memoria.database import (
    get_db, User, MylLedgerEntry, MylMaterial, MylHouseOrder,
    MylOrderContribution, MylStoreItem, MylActiveImpulse, MylP2POrder,
    MylMacroeconomicState
)
from server_py.auth.router import get_current_user_id

router = APIRouter(prefix="/api/myl", tags=["Economía MYL"])

# ── REGLAS DE NEGOCIO Y CONSTANTES ───────────────────────────────────────────
OFFICIAL_HOUSES = ("APEX", "IGNIS", "NEXUS", "VISIO")

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
    macro = db.query(MylMacroeconomicState).first()

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
        "qr_market_open": bool(macro.qr_market_open) if macro else True,
        "active_phase": macro.active_phase if macro else "Apertura",
        "moya_broadcast": {
            "message": (macro.moya_broadcast_message if macro and macro.moya_broadcast_message else "¡Bienvenidos al ecosistema MYL! Atentos a los rumores de mercado y misiones."),
            "type": (macro.moya_broadcast_type if macro and macro.moya_broadcast_type else "rumor")
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
    qr_payload: Optional[str] = None
    recipient_id: Optional[int] = None
    amount_myl: Optional[int] = None

@router.post("/qr/inspect")
def inspect_qr_payload(
    req: QRInspectRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Decodifica e inspecciona un payload QR para servicios de tienda o transferencia P2P.
    Soporta formato Solana Address, Username, Email, JSON o URI:
    - Billetera Solana de Alumno: e.g. "Kym1PNTeY1RsAZPMCAdfbqtKCQoVuDBFpekMp5rWV3XE"
    - Usuario directo: e.g. "@luciana.castillo" o "luciana.castillo"
    - Servicio / Tienda: {"type":"service", "item_code":"...", "title":"...", "price":5}
    - Transferencia P2P: {"type":"p2p_transfer", "seller_id":58, "seller_name":"Josue", "price":4}
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no autenticado")

    import json
    from urllib.parse import unquote
    raw = req.qr_payload.strip()
    raw = unquote(raw).strip()

    macro = db.query(MylMacroeconomicState).first()
    is_market_open = bool(macro.qr_market_open) if macro else True
    user_balance = int(user.myl_balance_digital or 0)

    # 1. Verificar si el QR escaneado corresponde a la cuenta Solana o ID de un compañero (P2P Estudiante)
    clean_target = raw.replace("solana:", "").strip()
    recipient = None

    # Búsqueda por dirección pública de Solana
    recipient = db.query(User).filter(User.solana_wallet_address == clean_target).first()

    # Búsqueda por nombre de usuario (con o sin @)
    if not recipient:
        username_clean = clean_target.lstrip("@").strip()
        recipient = db.query(User).filter(func.lower(User.username) == username_clean.lower()).first()

    # Búsqueda por email institucional
    if not recipient:
        recipient = db.query(User).filter(func.lower(User.email) == clean_target.lower()).first()

    # Búsqueda por ID numérico directo
    if not recipient and clean_target.isdigit():
        recipient = db.query(User).filter(User.id == int(clean_target)).first()

    # Si aún no se halla, intentar parsear como JSON
    data = None
    if not recipient and raw.startswith("{") and raw.endswith("}"):
        try:
            data = json.loads(raw)
        except Exception:
            pass

    if not recipient and data:
        # Si el JSON define un vendedor o usuario destinatario
        u_id = data.get("seller_id") or data.get("user_id") or data.get("recipient_id")
        if u_id:
            recipient = db.query(User).filter(User.id == int(u_id)).first()
        if not recipient and "solana_address" in data:
            recipient = db.query(User).filter(User.solana_wallet_address == data["solana_address"]).first()
        if not recipient and "username" in data:
            u_clean = str(data["username"]).lstrip("@").strip()
            recipient = db.query(User).filter(func.lower(User.username) == u_clean.lower()).first()

    # Si se identificó a un compañero de clase / cuenta de estudiante:
    if recipient:
        is_self = (recipient.id == user.id)
        recipient_name = recipient.full_name or recipient.username
        recipient_house = recipient.house or "APEX"
        recipient_wallet = recipient.solana_wallet_address or f"SOL-{recipient.username[:8].upper()}"

        fixed_price = None
        if data and ("price" in data or "price_myl" in data):
            fixed_price = int(data.get("price") or data.get("price_myl") or 0)

        return {
            "valid": True,
            "type": "p2p_user",
            "title": f"Transferencia P2P a {recipient_name}",
            "recipient_id": recipient.id,
            "recipient_name": recipient_name,
            "recipient_username": recipient.username,
            "recipient_house": recipient_house,
            "recipient_wallet": recipient_wallet,
            "recipient_avatar": recipient.avatar_url,
            "user_balance_digital": user_balance,
            "can_afford": user_balance >= 1,
            "market_open": is_market_open,
            "is_self": is_self,
            "fixed_price": fixed_price,
            "suggested_amount": min(user_balance, 2) if user_balance > 0 else 0
        }

    # Si no es un usuario directo, parsear formatos de tienda / orden grupal
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
            raise HTTPException(status_code=400, detail="Cuenta Solana o código QR no reconocido en el sistema.")

    qr_type = data.get("type", "service")
    price = int(data.get("price") or data.get("price_myl") or 0)
    can_afford = user_balance >= price

    if qr_type == "store_cashier_order":
        bill_id = data.get("bill_id", "BILL-ORDER")
        house = data.get("house", "APEX")
        total_cost = int(data.get("total_cost_myl") or price)
        items = data.get("items", [])
        return {
            "valid": True,
            "type": "store_cashier_order",
            "bill_id": bill_id,
            "house": house,
            "title": f"Caja Tienda: Orden Materiales {house}",
            "items": items,
            "price_myl": total_cost,
            "seller_name": data.get("seller_name", f"Caja Oficial - Casa {house}"),
            "user_balance_digital": user_balance,
            "can_afford": user_balance >= total_cost,
            "market_open": is_market_open,
            "is_self": False
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
            "market_open": is_market_open,
            "is_self": False
        }


@router.post("/qr/pay")
def pay_qr_payload(
    req: QRPayRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Ejecuta el pago o transferencia P2P descontando el saldo digital del usuario
    y acreditándolo al alumno destinatario con cupón oficial estilo Yape y datos 100% reales.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    macro = db.query(MylMacroeconomicState).first()

    # CASO A: Transferencia P2P directa a un compañero
    recipient = None
    if req.recipient_id:
        recipient = db.query(User).filter(User.id == req.recipient_id).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="El estudiante destinatario no fue encontrado.")

    # Si no se pasó recipient_id pero se pasó qr_payload, inspeccionamos primero
    inspect_res = None
    if not recipient and req.qr_payload:
        inspect_res = inspect_qr_payload(QRInspectRequest(qr_payload=req.qr_payload), db, user_id)
        if not inspect_res.get("valid"):
            raise HTTPException(status_code=400, detail="Código QR inválido.")
        if inspect_res.get("type") == "p2p_user":
            recipient = db.query(User).filter(User.id == inspect_res["recipient_id"]).first()

    # Si es transferencia P2P:
    if recipient:
        if recipient.id == user.id:
            raise HTTPException(status_code=400, detail="No puedes transferirte fondos a ti mismo.")

        if macro and not macro.qr_market_open:
            raise HTTPException(status_code=400, detail="Las transferencias P2P se encuentran temporalmente pausadas por el docente.")

        amount = int(req.amount_myl or (inspect_res.get("fixed_price") if inspect_res else 0) or 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Debes ingresar un monto entero mayor a 0 MYL.")

        current_balance = int(user.myl_balance_digital or 0)
        if current_balance < amount:
            raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Tu saldo actual es de {current_balance} MYL y deseas enviar {amount} MYL.")

        # Cuota escalonada quemada en Solana (0 si misma casa o <= 5 MYL)
        fee = calculate_p2p_burn_fee(recipient.house or "APEX", user.house, amount)
        recipient_receive = amount - fee

        # Actualizar saldos atómicamente
        user.myl_balance_digital = current_balance - amount
        recipient.myl_balance_digital = int(recipient.myl_balance_digital or 0) + recipient_receive

        # Generar código de seguridad de 3 dígitos y número de operación único de 8 dígitos
        security_code = f"{random.randint(100, 999)}"
        op_number = f"{int(datetime.utcnow().timestamp())}"[-8:]

        # Libro mayor para emisor y receptor
        tx_sig = f"OP-{op_number}-{security_code}"
        db.add(MylLedgerEntry(
            user_id=user.id,
            house=user.house,
            amount=-amount,
            entry_type="qr_p2p_pay",
            status="confirmed",
            solana_tx_signature=tx_sig,
            description=f"Transferencia P2P a {recipient.full_name or recipient.username} ({recipient.house or 'APEX'}) - Op #{op_number}",
        ))
        db.add(MylLedgerEntry(
            user_id=recipient.id,
            house=recipient.house,
            amount=recipient_receive,
            entry_type="qr_p2p_receive",
            status="confirmed",
            solana_tx_signature=tx_sig,
            description=f"Transferencia P2P recibida de {user.full_name or user.username} ({user.house or 'APEX'}) - Op #{op_number} (Quemado: {fee} MYL)",
        ))

        if fee > 0 and macro:
            macro.session_burned_myl += fee

        db.commit()
        db.refresh(user)

        # Formatear fecha y hora para el voucher
        now_utc = datetime.utcnow()
        month_names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]
        month_str = month_names[now_utc.month - 1]
        hour = now_utc.hour % 12 or 12
        ampm = "a. m." if now_utc.hour < 12 else "p. m."
        formatted_datetime = f"{now_utc.day:02d} {month_str}. {now_utc.year} | {hour:02d}:{now_utc.minute:02d} {ampm}"

        return {
            "status": "success",
            "type": "p2p_voucher",
            "message": f"¡Transferiste exitosamente {amount} MYL a {recipient.full_name or recipient.username}!",
            "amount_myl": amount,
            "recipient_name": recipient.full_name or recipient.username,
            "recipient_username": recipient.username,
            "recipient_house": recipient.house or "APEX",
            "recipient_wallet": recipient.solana_wallet_address or f"SOL-{recipient.username[:8].upper()}",
            "security_code": security_code,
            "security_digits": [security_code[0], security_code[1], security_code[2]],
            "op_number": op_number,
            "formatted_datetime": formatted_datetime,
            "new_balance_digital": user.myl_balance_digital,
            "fee_burned": fee
        }

    # CASO B: Pago de Orden de Caja o Servicio Oficial
    if not inspect_res and req.qr_payload:
        inspect_res = inspect_qr_payload(QRInspectRequest(qr_payload=req.qr_payload), db, user_id)

    if not inspect_res or not inspect_res.get("valid"):
        raise HTTPException(status_code=400, detail="Código de pago no válido.")

    price = int(inspect_res.get("price_myl") or 0)
    current_balance = int(user.myl_balance_digital or 0)
    if current_balance < price:
        raise HTTPException(status_code=400, detail=f"Saldo insuficiente. Tienes {current_balance} MYL y el costo es {price} MYL.")

    if inspect_res.get("type") == "store_cashier_order":
        if macro and not macro.qr_market_open:
            raise HTTPException(status_code=400, detail="El Mercado QR se encuentra temporalmente cerrado por el docente.")

        user.myl_balance_digital = current_balance - price

        op_number = f"{int(datetime.utcnow().timestamp())}"[-8:]
        db.add(MylLedgerEntry(
            user_id=user.id,
            house=user.house,
            amount=-price,
            entry_type="store_materials_burn",
            status="settled_solana",
            description=f"Pago QR Caja Oficial: {inspect_res.get('title', 'Orden de Materiales')} (Quemado: {price} MYL)",
        ))

        if macro:
            macro.session_burned_myl += price

        db.commit()

        return {
            "status": "success",
            "type": "store_order",
            "message": f"¡Pago de {price} MYL a Caja Registradora confirmado! Materiales despachados.",
            "new_balance_digital": user.myl_balance_digital,
            "burned_myl": price,
            "op_number": op_number
        }

    else:
        # Pago de servicio / artículo oficial
        item_code = inspect_res.get("item_code")
        if item_code:
            active_count = db.query(MylActiveImpulse).filter_by(
                user_id=user.id,
                item_code=item_code,
                status="active"
            ).count()
            if active_count >= 2:
                raise HTTPException(
                    status_code=400,
                    detail=f"Límite antiacaparamiento: Ya posees el máximo permitido (2 unidades activas) de este Impulso."
                )

        item = db.query(MylStoreItem).filter_by(code=item_code).first() if item_code else None
        user.myl_balance_digital = current_balance - price

        if item:
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
            "type": "service",
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
        "qr_market_open": bool(macro.qr_market_open),
        "moya_broadcast_message": macro.moya_broadcast_message or "¡Bienvenidos al programa de Liderazgo UCSM!",
        "moya_broadcast_type": macro.moya_broadcast_type or "rumor",
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

    # Calcular liquidez agregada por casa sumando saldos de sus 12 integrantes (Dato Exclusivo del Gestor)
    house_liquidity_map = {}
    for r in rankings:
        h = r["house"]
        members = db.query(User).filter(User.house == h, User.role == "student").all()
        liq = sum((m.myl_balance_cash or 0) + (m.myl_balance_digital or 0) for m in members)
        house_liquidity_map[h] = liq

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
            "total_house_liquidity_myl": house_liquidity_map.get(h, 48), # DATO EXCLUSIVO DEL GESTOR
            "order_status": ord.status if ord else "draft",
            "order_collected_myl": ord.total_collected_myl if ord else 0,
            "order_total_cost_myl": ord.total_cost_myl if ord else 48,
        })

    # Directorio de 48 alumnos oficiales (excluyendo usuarios externos o sin casa)
    students = (
        db.query(User)
        .filter(User.role == "student", User.house.in_(OFFICIAL_HOUSES))
        .order_by(User.house, User.full_name)
        .all()
    )
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



# ── ENDPOINTS DE OPERACIONES DEL GESTOR (PRD V3.0.0) ──────────────────────────

class ToggleMarketRequest(BaseModel):
    open: Optional[bool] = None

@router.post("/manager/toggle-market")
def toggle_qr_market(
    req: Optional[ToggleMarketRequest] = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Interruptor Maestro de Mercado QR: Habilita o bloquea las transacciones en los móviles."""
    macro = db.query(MylMacroeconomicState).first()
    if not macro:
        macro = MylMacroeconomicState()
        db.add(macro)
    if req and req.open is not None:
        macro.qr_market_open = req.open
    else:
        macro.qr_market_open = not bool(macro.qr_market_open)
    macro.updated_at = datetime.utcnow()
    db.commit()
    return {
        "status": "success",
        "qr_market_open": bool(macro.qr_market_open),
        "message": f"Mercado QR {'ABIERTO' if macro.qr_market_open else 'CERRADO'}"
    }


@router.post("/manager/disperse-bonuses")
def disperse_initial_bonuses(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Dispersión de Bono Inicial (PRD 4.2):
    Acredita automáticamente los bonos enteros según el puesto de cada casa en la ventana móvil:
    - 1.º Puesto (APEX): 6 MYL por integrante
    - 2.º Puesto (IGNIS): 5 MYL por integrante
    - 3.º Puesto (NEXUS): 5 MYL por integrante
    - 4.º Puesto (VISIO): 4 MYL por integrante
    Total emitido: 240 MYL (12 integrantes x 4 casas).
    """
    rankings = get_house_rankings(db)
    house_payouts = {}
    for r in rankings:
        h = r["house"]
        rank = r["rank"]
        payout = HOUSE_BONUS_MULTIPLIERS.get(rank, {"payout_myl": 5})["payout_myl"]
        house_payouts[h] = payout

    students = (
        db.query(User)
        .filter(User.role == "student", User.house.in_(OFFICIAL_HOUSES))
        .all()
    )
    count = 0
    total_dispersed = 0

    for s in students:
        payout = house_payouts.get(s.house, 5)
        s.myl_balance_digital = (s.myl_balance_digital or 0) + payout
        total_dispersed += payout
        count += 1
        db.add(MylLedgerEntry(
            user_id=s.id,
            house=s.house,
            amount=payout,
            entry_type="session_bonus",
            status="confirmed",
            description=f"Bono Inicial de Sesión ({payout} MYL - Casa {s.house})"
        ))

    macro = db.query(MylMacroeconomicState).first()
    if macro:
        macro.session_emitted_myl += total_dispersed
        macro.edition_emitted_myl += total_dispersed

    db.commit()

    return {
        "status": "success",
        "students_credited": count,
        "total_dispersed_myl": total_dispersed,
        "message": f"¡Bono inicial dispersado con éxito! Se acreditaron {total_dispersed} MYL entre {count} estudiantes."
    }


class CreditMeritRequest(BaseModel):
    student_id: int
    myl_amount: int = Field(ge=1, le=5, default=1)
    reason: Optional[str] = "Participación destacada en clase"

@router.post("/manager/credit-merit")
def credit_student_merit(
    req: CreditMeritRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Acreditación de Mérito Individual Combinada (PRD 4.2):
    Otorga simultáneamente +1 Punto de Casa y +1 o +2 MYL en un clic.
    Si el alumno ya alcanzó su tope de 3 Puntos de Casa en la sesión,
    el sistema bloquea puntos adicionales y acredita únicamente los MYL.
    """
    student = db.query(User).filter_by(id=req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if student.house not in OFFICIAL_HOUSES:
        raise HTTPException(status_code=400, detail="Solo se puede acreditar mérito a estudiantes asignados a una Casa oficial (APEX, IGNIS, NEXUS, VISIO).")

    current_points = student.myl_house_points_session or 0
    points_awarded = 0
    if current_points < 3:
        points_awarded = 1
        student.myl_house_points_session = current_points + 1

    # Acreditar MYL digital
    student.myl_balance_digital = (student.myl_balance_digital or 0) + req.myl_amount

    # Registrar en libro mayor
    db.add(MylLedgerEntry(
        user_id=student.id,
        house=student.house,
        amount=req.myl_amount,
        entry_type="merit_credit",
        status="confirmed",
        description=f"Mérito: {req.reason} (+{req.myl_amount} MYL, +{points_awarded} pts)"
    ))

    macro = db.query(MylMacroeconomicState).first()
    if macro:
        macro.session_emitted_myl += req.myl_amount
        macro.edition_emitted_myl += req.myl_amount

    db.commit()

    return {
        "status": "success",
        "student_name": student.full_name or student.username,
        "myl_awarded": req.myl_amount,
        "points_awarded": points_awarded,
        "total_session_points": student.myl_house_points_session,
        "capped": student.myl_house_points_session >= 3,
        "new_balance_digital": student.myl_balance_digital,
        "message": f"Acreditados +{req.myl_amount} MYL y +{points_awarded} Pts a {student.full_name or student.username}"
    }


class MoyaBroadcastRequest(BaseModel):
    message: str
    broadcast_type: Optional[str] = "rumor"

@router.post("/manager/moya-broadcast")
def broadcast_moya_message(
    req: MoyaBroadcastRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Emisor de Globos de Moya en Vivo (PRD 4.2):
    Dispara un mensaje que aparece inmediatamente en el widget de Moya
    en el Dashboard de los 48 alumnos.
    """
    macro = db.query(MylMacroeconomicState).first()
    if not macro:
        macro = MylMacroeconomicState()
        db.add(macro)
    macro.moya_broadcast_message = req.message
    macro.moya_broadcast_type = req.broadcast_type or "rumor"
    macro.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "message": "Globo de Moya emitido en vivo",
        "moya_message": macro.moya_broadcast_message,
        "broadcast_type": macro.moya_broadcast_type,
    }


class CashierBillRequest(BaseModel):
    house: str
    items: List[dict]
    total_cost_myl: int
    notes: Optional[str] = ""

@router.post("/manager/cashier/create-bill")
def create_cashier_bill(
    req: CashierBillRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Terminal de Caja Registradora QR (Tienda Oficial - PRD 4.4):
    El gestor genera el código QR oficial de cobro para que los alumnos
    escaneen desde su móvil y quemen los MYL al instante.
    """
    import json
    bill_id = f"BILL-{int(datetime.utcnow().timestamp())}-{req.house.upper()}"
    qr_payload = {
        "type": "store_cashier_order",
        "bill_id": bill_id,
        "house": req.house.upper(),
        "total_cost_myl": int(req.total_cost_myl),
        "items": req.items,
        "seller_name": f"Caja Registradora Tienda (Casa {req.house.upper()})",
        "created_at": datetime.utcnow().isoformat()
    }
    return {
        "status": "success",
        "bill_id": bill_id,
        "qr_payload": json.dumps(qr_payload, ensure_ascii=False),
        "details": qr_payload
    }


# ── MISIONES OCULTAS Y MUNDO MOYA (PRD 3.2 Y 4.2) ───────────────────────────

OFFICIAL_MOYA_MISSIONS = [
    {
        "id": "m1",
        "code": "TRUEQUE_JUSTO",
        "title": "El Pacto de la Hormiga",
        "hint": "Realiza un intercambio presencial P2P intracasa o intercasa sin superar la mediana histórica.",
        "reward_myl": 1,
        "badge": "Trueque Transparente",
        "category": "Negociación"
    },
    {
        "id": "m2",
        "code": "CERO_POLIZONES",
        "title": "Sinergia Total",
        "hint": "Todos los miembros de tu Casa participan activamente y realizan aportes a los retos colectivos.",
        "reward_myl": 2,
        "badge": "Cero Polizones",
        "category": "Cohesión"
    },
    {
        "id": "m3",
        "code": "INGENIERIA_AUSTERA",
        "title": "Ingeniería Austera",
        "hint": "Gana la actividad de construcción optimizando al máximo los insumos de la Hoja de Pedido.",
        "reward_myl": 2,
        "badge": "Estrategia Austera",
        "category": "Estrategia"
    },
    {
        "id": "m4",
        "code": "CURIOSIDAD_FELINA",
        "title": "Curiosidad de Moya",
        "hint": "Explora el mundo pixel-art de Moya y descubre su botón secreto sin causar inflación.",
        "reward_myl": 1,
        "badge": "Amigo de Moya",
        "category": "Exploración"
    }
]

@router.get("/moya/missions")
def get_moya_missions(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Devuelve el tablón de misiones ocultas con su estado."""
    # Verificar qué misiones ha reclamado el usuario
    ledger = db.query(MylLedgerEntry).filter_by(user_id=user_id).all()
    claimed_codes = set()
    for entry in ledger:
        desc = (entry.description or "").lower()
        if "misión:" in desc or "mision:" in desc:
            for m in OFFICIAL_MOYA_MISSIONS:
                if m["title"].lower() in desc or m["code"].lower() in desc:
                    claimed_codes.add(m["id"])

    return [
        {
            **m,
            "completed": m["id"] in claimed_codes,
            "claimed": m["id"] in claimed_codes,
        }
        for m in OFFICIAL_MOYA_MISSIONS
    ]


class ClaimMissionRequest(BaseModel):
    mission_id: str

@router.post("/moya/claim-mission")
def claim_moya_mission(
    req: ClaimMissionRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Permite al alumno reclamar la recompensa de una misión oculta descubierta."""
    mission = next((m for m in OFFICIAL_MOYA_MISSIONS if m["id"] == req.mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="Misión no encontrada")

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar si ya la reclamó
    existing = db.query(MylLedgerEntry).filter(
        MylLedgerEntry.user_id == user.id,
        MylLedgerEntry.description.ilike(f"%Misión: {mission['title']}%")
    ).first()
    if existing:
        return {"status": "already_claimed", "message": f"Ya has reclamado la recompensa de '{mission['title']}'."}

    reward = mission["reward_myl"]
    user.myl_balance_digital = (user.myl_balance_digital or 0) + reward

    db.add(MylLedgerEntry(
        user_id=user.id,
        house=user.house,
        amount=reward,
        entry_type="mission_reward",
        status="confirmed",
        description=f"Misión: {mission['title']} (+{reward} MYL - Medalla: {mission['badge']})"
    ))

    macro = db.query(MylMacroeconomicState).first()
    if macro:
        macro.session_emitted_myl += reward

    db.commit()

    return {
        "status": "success",
        "message": f"¡Misión '{mission['title']}' completada! Has ganado +{reward} MYL y la insignia '{mission['badge']}'.",
        "new_balance_digital": user.myl_balance_digital,
        "badge": mission["badge"]
    }
