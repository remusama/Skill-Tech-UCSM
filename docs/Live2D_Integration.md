# 🎨 Documentación Especializada: Integración Live2D (Eleonor)

**Componente Principal:** `AvatarDisplay.tsx`  
**Librerías Core:** `pixi.js`, `pixi-live2d-display`, `live2dcubismcore`  
**Modelo Base:** Tubasa (Modificado como Eleonor)

---

## 1. Arquitectura de Renderizado (`AvatarDisplay.tsx`)

El avatar no es un video ni un GIF; es un modelo vectorial 2D renderizado en tiempo real usando **WebGL** a través de PixiJS.

### Carga del Modelo
La carga se realiza en tres etapas críticas:
1.  **Inyección de Scripts**: Se cargan dinámicamente los scripts del SDK de Cubism (`live2dcubismcore.min.js`) y el plugin de Pixi (`pixi-live2d-display.min.js`) desde `/public/live2d-libs/`.
2.  **Inicialización de PIXI.Application**: Se crea un lienzo (Canvas) transparente.
3.  **Carga del Modelo**: `PIXI.live2d.Live2DModel.from('/models/Tubasa/TUBASA_014.model3.json')`.

### Sistema de Escalado Responsivo (`scaling-utils.ts`)
Para asegurar que Eleonor se vea bien en móviles y escritorio, no usamos CSS puro para el tamaño del canvas interno.
- **Base Canvas**: 1440x1200 (Resolución nativa alta).
- **Transform CSS**: El contenedor aplica `transform: scale(...)` calculado dinámicamente basado en el `window.innerWidth`.
- **Posicionamiento**: El modelo se ancla al centro-inferior (`anchor.set(0.5, 1.0)`) para que siempre esté "de pie" en el borde inferior de la pantalla.

---

## 2. Sistema de Control de Movimiento (The Update Loop)

El "alma" del movimiento reside en el `internalModel.update`. Hemos interceptado este método para inyectar matemáticas personalizadas (procedural animation) sobre los movimientos stock.

### Respiración y Vida (Idle)
Incluso cuando no hace nada, Eleonor está viva:
```typescript
// Ciclo de respiración suave (onda seno lenta)
const breath = (Math.sin(now / 600) + 1) / 2;
// Oscilación sutil de la cabeza (Figure-8)
const hX = Math.sin(now / 2500) * 4;
const hY = Math.cos(now / 1800) * 2;
```

### Interpolación de Expresiones (Lerp)
Las expresiones no cambian de golpe (pop-in). Usamos una **Máquina de Estados de Transición**:
1.  **STABLE**: Mantiene la expresión actual.
2.  **EXITING**: Lleva los parámetros actuales a 0 gradualmente.
3.  **ENTERING**: Lleva los parámetros de la nueva expresión de 0 al valor objetivo.

Esto permite transiciones suaves entre "Enojo" y "Feliz" sin pasar por estados deformes intermedios.

---

## 3. Sincronización Labial (Lip-Sync) Espectral

A diferencia de sistemas que usan "visemas" (formas de boca predefinidas para A, E, I, O, U), Eleonor usa **Lip-Sync basado en Volumen**.

### Flujo de Datos
1.  **Fuente**: `EleonorAIChat.tsx` reproduce el audio.
2.  **Análisis**: Un `AnalyserNode` (Web Audio API) extrae la frecuencia de datos (FFT).
3.  **Cálculo**: Se calcula el promedio de volumen de las frecuencias vocales.
4.  **Evento**: Se dispara `window.dispatchEvent('avatar-speaking', { volume })`.
5.  **Reacción**: `AvatarDisplay` recibe el volumen y suaviza el valor (`vSmooth`) para evitar movimientos erráticos (jitter).
6.  **Parámetro**: Se mapea a `ParamMouthOpenY`.

```typescript
// Suavizado del movimiento de boca
vSmooth.current += (vTarget - vSmooth.current) * 0.3;
core.setParameterValueById('ParamMouthOpenY', vSmooth.current);
```

---

## 4. Diccionario de Expresiones

Las expresiones se definen manualmente en `MANUAL_EXPRESSION_DATA`. Modifican parámetros directos del modelo Cubism.

| Expresión | Parámetros Clave Modificados | Efecto Visual |
| :--- | :--- | :--- |
| **Feliz** | `ParamEyeRSmile`, `ParamMouthForm` | Ojos arqueados, comisuras bucales arriba. |
| **Enojo** | `Param86`, `ParamBodyAngleX` | Cejas fruncidas, cuerpo tenso hacia adelante. |
| **Tristeza** | `ParamEyeBallY`, `ParamMouthForm` | Mirada baja, boca curvada hacia abajo. |
| **Coqueta** | `ParamAngleZ`, `ParamBodyAngleZ` | Cabeza ladeada, mirada de reojo. |
| **Mentira** | `ParamEyeBallX`, `ParamAngleZ` | Ojos esquivos (lado), cabeza girada. |

---

## 5. Cómo Añadir Nuevas Expresiones

1.  Abre un visor de modelos Live2D (como Cubism Viewer).
2.  Identifica los ID de parámetros que quieres cambiar (ej: `ParamCheek`).
3.  Añade una entrada en `MANUAL_EXPRESSION_DATA` en `AvatarDisplay.tsx`:

```typescript
'NuevaEmocion': { 
    ParamCheek: 1.0, // Sonrojo
    ParamEyeLOpen: 0.8 // Ojo un poco cerrado
}
```
4.  Asegúrate de que el backend pueda enviar el tag `[emocion: NuevaEmocion]`.

---

## 6. Solución de Problemas Comunes

- **El modelo no carga**: Verificar que los archivos `.moc3` y texturas estén en `/public/models/Tubasa/` y que el path en el JSON sea relativo correcto.
- **Boca no se mueve**: Verificar que el navegador no haya bloqueado el `AudioContext` (requiere interacción del usuario primero).
- **Expresiones rígidas**: Ajustar el `lerpFactor` en `AvatarDisplay` (actualmente 0.15). Menor valor = más suave pero lento.
