import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';

const PLUGIN_NAME = "EleonorAI";
const PLUGIN_DEVELOPER = "JosueHF";
const TOKEN_FILE = "vts_token.json";
const VTS_URL = "ws://localhost:8001";

// Mapea el nombre simple de la expresión al nombre del archivo real
const expressionFileMap: { [key: string]: string } = {
    'coqueta': 'coqueta.exp3.json',
    'Enojo': 'Enojo.exp3.json',
    'Feliz': 'Feliz.exp3.json',
    'Mentira': 'Mentira.exp3.json',
    'Prueba': 'Prueba.exp3.json',
    'Tristeza': 'Tristeza.exp3.json',
    'Tristeza2': 'Tristeza2.exp3.json',
};

// Función para obtener el token de autenticación
async function getToken(): Promise<string | null> {
    try {
        // La ruta al token, asumiendo que el script se ejecuta desde la raíz del proyecto
        const tokenPath = path.join(process.cwd(), TOKEN_FILE);
        const data = await fs.readFile(tokenPath, 'utf-8');
        return JSON.parse(data).authenticationToken;
    } catch (error) {
        console.warn(`[VTS Service] Could not read token file: ${TOKEN_FILE}. You may need to run the Python script first.`);
        return null;
    }
}

// Función para autenticarse con VTube Studio
function authenticate(ws: WebSocket, token: string): Promise<boolean> {
    return new Promise((resolve) => {
        const authRequest = {
            apiName: "VTubeStudioPublicAPI",
            apiVersion: "1.0",
            requestID: "eleonor-auth",
            messageType: "AuthenticationRequest",
            data: {
                pluginName: PLUGIN_NAME,
                pluginDeveloper: PLUGIN_DEVELOPER,
                authenticationToken: token,
            },
        };

        ws.send(JSON.stringify(authRequest));

        const onAuthResponse = (data: string) => {
            const response = JSON.parse(data);
            if (response.messageType === 'AuthenticationResponse' && response.data.authenticated) {
                console.log('[VTS Service] Authenticated successfully.');
                ws.off('message', onAuthResponse); // Limpiar el listener
                resolve(true);
            } else if (response.messageType === 'AuthenticationResponse') {
                console.error('[VTS Service] Authentication failed.');
                ws.off('message', onAuthResponse);
                resolve(false);
            }
        };

        ws.on('message', onAuthResponse);
    });
}

// Función para activar/desactivar una expresión
function controlExpression(ws: WebSocket, expressionFile: string, active: boolean): Promise<void> {
    return new Promise((resolve) => {
        const request = {
            apiName: "VTubeStudioPublicAPI",
            apiVersion: "1.0",
            requestID: `eleonor-expr-${expressionFile}`,
            messageType: "ExpressionActivationRequest",
            data: {
                expressionFile: expressionFile,
                active: active,
            },
        };
        ws.send(JSON.stringify(request));
        // No necesitamos esperar una respuesta para esta solicitud
        resolve();
    });
}

/**
 * Activa una expresión en VTube Studio por su nombre simple.
 * Esta función es "dispara y olvida" para no bloquear la respuesta del chat.
 * @param expressionName El nombre de la expresión (ej. 'Feliz')
 */
export function triggerVtsExpression(expressionName: string): void {
    const expressionFile = expressionFileMap[expressionName];
    if (!expressionFile) {
        console.warn(`[VTS Service] Expression "${expressionName}" not found in map.`);
        return;
    }

    // Envolver la lógica en una función asíncrona auto-ejecutable
    (async () => {
        let ws: WebSocket | null = null;
        try {
            const token = await getToken();
            if (!token) {
                return; // El error ya se logueó en getToken
            }

            ws = new WebSocket(VTS_URL);

            ws.on('open', async () => {
                const isAuthenticated = await authenticate(ws!, token);
                if (isAuthenticated) {
                    console.log(`[VTS Service] Triggering expression: ${expressionName}`);
                    await controlExpression(ws!, expressionFile, true);
                    await new Promise(resolve => setTimeout(resolve, 4000)); // Mantener por 4s
                    await controlExpression(ws!, expressionFile, false);
                }
                // Cerrar la conexión después de la operación
                ws!.close();
            });

            ws.on('error', (error) => {
                console.error('[VTS Service] WebSocket error:', error.message);
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                }
            });

        } catch (error) {
            console.error('[VTS Service] Failed to trigger expression:', error);
            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.close();
            }
        }
    })();
}
