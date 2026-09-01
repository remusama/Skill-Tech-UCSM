// Detectar dinámicamente la IP/Host de la máquina que sirve el frontend para evitar configurar env vars en red local
const getDynamicApiBaseUrl = (): string => {
    if (typeof window !== "undefined" && window.location.hostname) {
        // Si accedemos por IP local (ej: 192.168.x.x) o dominio, apuntamos al backend en el mismo host, puerto 8000
        return `http://${window.location.hostname}:8000`;
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const API_BASE_URL = getDynamicApiBaseUrl();

export const API_URL = `${API_BASE_URL}/api`;

// Audio is disabled by default. Enable it explicitly only when voice playback is wanted.
export const VOICE_PLAYBACK_ENABLED = process.env.NEXT_PUBLIC_TTS_ENABLED === "true";
