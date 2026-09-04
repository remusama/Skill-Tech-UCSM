// Obtener la URL base del backend priorizando variables de entorno (Producción / Netlify)
const getDynamicApiBaseUrl = (): string => {
    // 1. Prioridad absoluta: Variable de entorno configurada (Netlify/Vercel/Render)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Fallback para desarrollo local (IP en red local ej. 192.168.x.x o localhost)
    if (typeof window !== "undefined" && window.location.hostname) {
        return `http://${window.location.hostname}:8000`;
    }

    // 3. Fallback por defecto (SSR / desarrollo local)
    return "http://localhost:8000";
};

export const API_BASE_URL = getDynamicApiBaseUrl();

export const API_URL = `${API_BASE_URL}/api`;

