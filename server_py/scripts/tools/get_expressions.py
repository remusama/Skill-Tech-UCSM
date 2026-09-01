import websockets
import json
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


PLUGIN_NAME = "EleonorAI"
PLUGIN_DEVELOPER = "JosueHF"
TOKEN_FILE = "vts_token.json"
VTS_URL = "ws://localhost:8001"


async def autenticar_y_listar():
    token = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r") as f:
            token = json.load(f).get("authenticationToken")

    try:
        async with websockets.connect(VTS_URL) as ws:
            # --- Autenticación ---
            auth_payload = {
                "apiName": "VTubeStudioPublicAPI",
                "apiVersion": "1.0",
                "requestID": "authRequest",
                "messageType": "AuthenticationRequest",
                "data": {
                    "pluginName": PLUGIN_NAME,
                    "pluginDeveloper": PLUGIN_DEVELOPER,
                    "authenticationToken": token
                }
            }
            await ws.send(json.dumps(auth_payload))
            response = json.loads(await ws.recv())

            if not response.get("data", {}).get("authenticated"):
                print("Token no válido o ausente. Solicitando uno nuevo...")
                token_payload = {
                    "apiName": "VTubeStudioPublicAPI",
                    "apiVersion": "1.0",
                    "requestID": "tokenRequest",
                    "messageType": "AuthenticationTokenRequest",
                    "data": {
                        "pluginName": PLUGIN_NAME,
                        "pluginDeveloper": PLUGIN_DEVELOPER
                    }
                }
                await ws.send(json.dumps(token_payload))
                response = json.loads(await ws.recv())

                if "authenticationToken" in response.get("data", {}):
                    token = response["data"]["authenticationToken"]
                    with open(TOKEN_FILE, "w") as f:
                        json.dump({"authenticationToken": token}, f)
                    print(
                        f"Nuevo token guardado en {TOKEN_FILE}. Por favor, acepta los permisos en VTube Studio y vuelve a ejecutar el script.")
                else:
                    print("Error al solicitar el token. Revisa VTube Studio.")
                return

            # --- Si la autenticación es exitosa, pedir expresiones ---
            expr_request = {
                "apiName": "VTubeStudioPublicAPI",
                "apiVersion": "1.0",
                "requestID": "expresiones",
                "messageType": "ExpressionStateRequest",
                "data": {}
            }
            await ws.send(json.dumps(expr_request))
            expr_response = json.loads(await ws.recv())

            expresiones = [e['file'] for e in expr_response.get("data", {}).get("expressions", [])]

            print(json.dumps(expresiones, indent=4))

    except ConnectionRefusedError:
        print(json.dumps(
            {"error": "No se pudo conectar a VTube Studio. Asegúrate de que esté en ejecución y el servidor API esté habilitado."}))
    except Exception as e:
        print(json.dumps({"error": f"Ha ocurrido un error inesperado: {e}"}))

if __name__ == "__main__":
    asyncio.run(autenticar_y_listar())
