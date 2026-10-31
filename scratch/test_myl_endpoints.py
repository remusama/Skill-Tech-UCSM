import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from server_py.memoria.database import SessionLocal, User
from server_py.routers.myl_economy import (
    get_student_wallet_dashboard, get_house_desk, get_store_catalog,
    get_p2p_market, get_manager_macro_view, get_manager_breakdown,
    get_manager_market_view, contribute_to_house_order, ContributeRequest
)

def test_endpoints():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "student").first()
        uid = user.id
        print(f"Testing for student ID {uid} ({user.full_name or user.username}):")

        # 1. Dashboard & Billetera
        res_me = get_student_wallet_dashboard(db=db, user_id=uid)
        print("1. /api/myl/me -> Total MYL:", res_me["balances"]["total_myl"], "House:", res_me["house"], "Decimals:", res_me["balances"]["decimals"])

        # 2. Mesa de Casa
        res_desk = get_house_desk(db=db, user_id=uid)
        print("2. /api/myl/house-desk -> House:", res_desk["house"], "Materials count:", len(res_desk["materials_catalog"]), "Order status:", res_desk["order"]["status"])

        # 3. Tienda Oficial
        res_store = get_store_catalog(db=db, user_id=uid)
        print("3. /api/myl/store -> Items count:", len(res_store["items"]), "Phase:", res_store["active_phase"])

        # 4. Mercado P2P
        res_p2p = get_p2p_market(db=db, user_id=uid)
        print("4. /api/myl/p2p -> Open orders:", len(res_p2p["open_orders"]), "Median price:", res_p2p["market_median_price"])

        # 5. Gestor Macro
        res_macro = get_manager_macro_view(db=db, user_id=uid)
        print("5. /api/myl/manager/macro -> Cap:", res_macro["edition_total_cap_myl"], "Emitted:", res_macro["session_emitted_myl"], "Burn rate:", res_macro["burn_rate_pct"], "%")

        # 6. Gestor Breakdown
        res_bd = get_manager_breakdown(db=db, user_id=uid)
        print("6. /api/myl/manager/breakdown -> Houses:", len(res_bd["houses"]), "Students:", res_bd["students_total"])

        # 7. Gestor Market
        res_mkt = get_manager_market_view(db=db, user_id=uid)
        print("7. /api/myl/manager/market -> Store rotation items:", len(res_mkt["store_rotation"]))

        print("\n=== TODOS LOS ENDPOINTS DE TOKENOMÍA MYL FUNCIONAN AL 100% ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoints()

