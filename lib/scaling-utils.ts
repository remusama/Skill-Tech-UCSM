/**
 * Utilidades de escalamiento HÍBRIDO para el Avatar de Eleonor (SkillTech).
 * 
 * Este sistema utiliza un tamaño de escenario base fijo ( Mundo Interno )
 * y escala el contenedor externamente ( Cámara ) mediante CSS transform.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 1. ESCENARIO BASE (Mundo Interno Fijo)
// Reducido de 1440x2500 a 1080x1920 para ahorrar VRAM y ciclos de GPU.
export const BASE_STAGE_WIDTH = 1080;
export const BASE_STAGE_HEIGHT = 1920;

// 2. LIMITACIONES DE ESCALA (Clamp)
export const MIN_STAGE_SCALE = 0.05;
export const MAX_STAGE_SCALE = 2.0;

// 3. PERFORMANCE
// Nota: 1.5 es alto para tablets. Bajamos a 1.2 para un balance óptimo de nitidez/velocidad.
export const MAX_RENDERER_RESOLUTION = 1.2;

/**
 * Determina el tipo de dispositivo para lógica de interfaz auxiliar.
 */
export const getDeviceType = (width: number): DeviceType => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

/**
 * Calcula el factor de escala externo para que el escenario fijo encaje en el viewport.
 * BLOQUEO DE PROPORCIÓN: Usamos la altura como referencia principal para asegurar 
 * que Eleonor siempre se vea de cuerpo completo.
 */
export const calculateStageScale = (
    viewportWidth: number,
    viewportHeight: number
): number => {
    // Calculamos cuánto deberíamos escalar el escenario de 2500px para que quepa en el alto del dispositivo
    // Forzamos la escala basada en altura para evitar el efecto "Squeeze" (aplastado).
    const scale = viewportHeight / BASE_STAGE_HEIGHT;

    return Math.min(Math.max(scale, MIN_STAGE_SCALE), MAX_STAGE_SCALE);
};

/**
 * Limita el devicePixelRatio para evitar sobrecargar la GPU en móviles de alta densidad.
 */
export const getSafeResolution = (dpr: number): number => {
    return Math.min(dpr || 1, MAX_RENDERER_RESOLUTION);
};

/**
 * Devuelve la configuración completa necesaria para inicializar y escalar el escenario.
 */
export interface StageConfig {
    scale: number;
    width: number;
    height: number;
    resolution: number;
}

export const getStageConfig = (
    viewportWidth: number,
    viewportHeight: number,
    dpr: number = 1
): StageConfig => {
    return {
        scale: calculateStageScale(viewportWidth, viewportHeight),
        width: BASE_STAGE_WIDTH,
        height: BASE_STAGE_HEIGHT,
        resolution: getSafeResolution(dpr),
    };
};

// Escala fija interna del modelo dentro del escenario de 2500px de alto.
// 0.20 es un tamaño que permite ver rostro y torso con margen para el HUD.
export const FIXED_AVATAR_MODEL_SCALE = 0.20;
