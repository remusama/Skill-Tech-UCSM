import websockets
import json
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


# --- Configuración ---
PLUGIN_NAME = "EleonorAI"
PLUGIN_DEVELOPER = "JosueHF"
TOKEN_FILE = "vts_token.json"
VTS_URL = "ws://localhost:8001"

EXPRESSION_FILES = [
    "coqueta.exp3.json",
    "Enojo.exp3.json",
    "Feliz.exp3.json",
    "Mentira.exp3.json",
    "Prueba.exp3.json",
    "Tristeza.exp3.json",
    "Tristeza2.exp3.json"
]

# --- Funciones de Utilidad ---


def cargar_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            return json.load(f).get("authenticationToken")
    return None


async def autenticar(ws, token):
    auth_request = {
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "auth_cycle_request",
        "messageType": "AuthenticationRequest",
        "data": {
            "pluginName": PLUGIN_NAME,
            "pluginDeveloper": PLUGIN_DEVELOPER,
            "authenticationToken": token
        }
    }
    await ws.send(json.dumps(auth_request))
    response = await ws.recv()
    data = json.loads(response)
    if data.get("data", {}).get("authenticated"):
        print("✅ Autenticación exitosa.")
        return True
    else:
        print("❌ Fallo en la autenticación.")
        return False


async def controlar_expresion(ws, expression_file, activar):
    status_text = "Activando" if activar else "Desactivando"
    request = {
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": f"set-expression-{expression_file}",
        "messageType": "ExpressionActivationRequest",
        "data": {
            "expressionFile": expression_file,
            "active": activar
        }
    }
    await ws.send(json.dumps(request))
    # Solo imprimir el estado cuando se activa o desactiva durante el ciclo principal
    if 'Reseteando' not in status_text:
        print(f"⏯️  {status_text}: {expression_file}")


async def resetear_expresiones(ws):
    print("\n🔄 Reseteando todas las expresiones a 'false'...")
    # Usamos un texto especial en status_text para evitar la impresión detallada
    for expression_file in EXPRESSION_FILES:
        await controlar_expresion(ws, expression_file, False)
    print("✅ Expresiones reseteadas.")

# --- Lógica Principal ---


async def ciclar_expresiones():
    token = cargar_token()
    if not token:
        print(f"❌ Token no encontrado en '{TOKEN_FILE}'. Ejecuta el script de autenticación primero.")
        return

    async with websockets.connect(VTS_URL) as ws:
        print("🔌 Conectado a VTube Studio.")

        if not await autenticar(ws, token):
            return

        # --- Reseteo Inicial ---
        await resetear_expresiones(ws)

        print("\n--- Iniciando ciclo de expresiones (Activa -> Espera 4s -> Desactiva -> Espera 1s) ---")
        print("Presiona Ctrl+C para detener.")
        try:
            while True:
                for expression_file in EXPRESSION_FILES:
                    # Activar la expresión
                    await controlar_expresion(ws, expression_file, True)
                    await asyncio.sleep(4)  # Mantener la expresión activa

                    # Desactivar la expresión
                    await controlar_expresion(ws, expression_file, False)
                    await asyncio.sleep(1)   # Pausa antes de la siguiente

        except KeyboardInterrupt:
            print("\n🛑 Ciclo de expresiones detenido por el usuario.")
        except Exception as e:
            print(f"\n❌ Error durante el ciclo: {e}")

# --- Ejecución ---
if __name__ == "__main__":
    asyncio.run(ciclar_expresiones())
