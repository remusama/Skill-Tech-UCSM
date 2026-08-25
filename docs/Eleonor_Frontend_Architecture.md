# 🎨 Arquitectura del Frontend de Eleonor

Esta documentación detalla la infraestructura visual e interactiva de Eleonor, un avatar Live2D renderizado en tiempo real integrado en una aplicación Next.js con una arquitectura de portal persistente.

---

## 1. Stack Tecnológico de Interfaz

Eleonor no es una aplicación web tradicional; es un motor de renderizado gráfico de alta fidelidad envuelto en React.

*   **Framework:** Next.js 14+ (App Router).
*   **Motor de Renderizado:** PixiJS v7.
*   **SDK Gráfico:** Live2D Cubism SDK v4+.
*   **Animaciones:** Framer Motion (para transiciones de UI) y Procedural Math (para el movimiento del avatar).
*   **Estilos:** Tailwind CSS con una estética de "Sleek Dark Mode" y efectos de glassmorphism.

---

## 2. Arquitectura de Renderizado Persistente

Para evitar que el avatar se "reinicie" o "destruya" al navegar entre páginas, utilizamos un **Portal Global**.

### El Guardian del Stage (`AvatarDisplay.tsx`)
Eleonor no reside dentro de las páginas. Se renderiza mediante `createPortal` directamente en el `document.body` desde el `RootLayout`. Esto permite:
*   Que el contexto de WebGL se mantenga activo permanentemente.
*   Que las transiciones de voz no se corten al cambiar de ruta.
*   Que el modelo "recuerde" su posición y expresión actual a través de toda la aplicación.

---

## 3. El Motor Live2D (Visual Core)

Ubicación: `components/avatar/AvatarDisplay.tsx`

El avatar es un modelo vectorial renderizado mediante WebGL. El frontend intercepta el ciclo de vida de renderizado de PixiJS para inyectar realismo.

### Ciclo deVida Procedural (`internalModel.update`)
Interceptamos el método `update` original del modelo para añadir:
*   **Respiración:** Una onda seno suave en `ParamBreath`.
*   **Parpadeo Natural:** Un generador de números aleatorios para tiempos de espera entre parpadeos.
*   **Micro-movimientos:** Oscilaciones en `ParamAngleX/Y` que simulan que Eleonor nos está mirando.

### Máquina de Estados de Expresiones
Las expresiones no se activan de golpe. Implementamos un sistema de **Lerp (Linear Interpolation)**:
1.  **State EXITING:** Los parámetros de la expresión anterior vuelven a 0.
2.  **State ENTERING:** Los parámetros de la nueva expresión suben gradualmente.
Esto garantiza que Eleonor nunca tenga "saltos" visuales bruscos en su rostro.

---

## 4. Sincronización de Voz y Lip-Sync

El frontend utiliza la **Web Audio API** para sincronizar el movimiento de la boca con el audio generado por el backend.

### Flujo de Análisis Espectral:
1.  **Captura:** En `Onboarding.tsx` o `EleonorAIChat.tsx`, se crea un `AudioContext`.
2.  **FFT (Fast Fourier Transform):** Un `AnalyserNode` descompone el audio en frecuencias.
3.  **Filtrado Vocal:** Se aislan las frecuencias bajas (Bass) y medias (Mid) para calcular el volumen efectivo.
4.  **Evento de Puente:** Se dispara un `CustomEvent('avatar-speaking')` con el valor de volumen calculado.
5.  **Mapeo Gráfico:** `AvatarDisplay` escucha el evento y mapea el volumen al parámetro `ParamMouthOpenY` del modelo Live2D, aplicando un suavizado (`vSmooth`) para evitar el jitter (temblor).

---

## 5. El Sistema de Presencia y Persistencia (Eleonor Context)

Ubicación: `contexts/eleonor-context.tsx`

Toda la visibilidad y comportamiento de Eleonor se rige por una **Máquina de Estados de Presencia** sincronizada con la base de datos a través de `server_py/core/database.py`.

### Persistencia del Estado (Eleonor Model)
A diferencia de versiones anteriores, el estado emocional de Eleonor (`valence`, `tension`, `engagement`) es persistente:
*   **Base de Datos (SQLAlchemy):** Los estados se almacenan en la tabla `eleonor_sessions`.
*   **Sincronización:** El backend carga el estado al inicio de cada interacción y persiste los deltas calculados por el LLM al finalizar el streaming.
*   **Memoria Episódica:** Se integra con `EleonorHistory` para recordar hitos y tendencias de rendimiento del usuario.

### Estados de Presencia:

| Estado | Descripción | Comportamiento en Pantalla |
| :--- | :--- | :--- |
| `INTRO_ACTIVE` | Onboarding inicial | Bloqueo de UI, enfoque total en el avatar. |
| `GUIDE_ACTIVE` | Tour del sistema | Eleonor se mueve al lateral y resalta elementos de la UI. |
| `INTERVENTION` | Chat activo | Eleonor vuelve al centro y activa el modo de escucha. |
| `IDLE_VISIBLE` | Reposo | Se queda en su zona asignada del grid sin interrumpir. |
| `IDLE_HIDDEN` | Oculto | El componente existe pero su opacidad es 0 y `pointer-events: none`. |

---

## 6. Interacción Proactiva y Sensores

Eleonor no es una imagen estática; reacciona físicamente al entorno del usuario utilizando sensores de hardware y periféricos.

### Seguimiento del Cursor (Mouse Tracking)
El modelo utiliza un sistema de normalización de coordenadas para seguir al usuario con la mirada y el cuerpo:
*   **Normalización:** Las coordenadas `(x, y)` del ratón se transforman al rango `[-1, 1]`.
*   **Mapeo de Parámetros:** 
    *   `ParamAngleX/Y`: Rotación de la cabeza (hasta 25°).
    *   `ParamBodyAngleX`: Rotación del torso (hasta 10°).
    *   `ParamEyeBallX/Y`: Movimiento preciso de las pupilas.
*   **Suavizado (Lerp):** Se aplica una interpolación lineal para que el movimiento sea orgánico y no mecánico.

### Soporte de Giroscopio y Acelerómetro
En dispositivos móviles (Tablets/Smartphones), Eleonor utiliza la **Device Orientation API**:
*   **Ejes de Control:** 
    *   `Gamma` (Roll): Controla la mirada lateral.
    *   `Beta` (Pitch): Controla la mirada vertical, ajustando 45° como el punto neutro de visión.
*   **Prioridad:** El giroscopio domina sobre el toque táctil en móviles para crear la sensación de que Eleonor "vive" dentro del dispositivo y reacciona a su inclinación física.
*   **Permisión:** Implementa un flujo de `requestPermission` específico para Safari/iOS.

### Micro-Interacciones (Saccades & Micro-movements)
Para evitar el "valle inquietante", inyectamos imperfecciones humanas:
*   **Saccades:** Movimientos aleatorios y rápidos de los ojos realizados cada 0.5 - 2.5 segundos.
*   **Brisa Virtual:** Una oscilación de baja frecuencia basada en ruido perlin que simula un ligero balanceo natural del cuerpo.

---

## 7. Cinematografía y Responsividad

### Sistema de Cámaras (`scaling-utils.ts`)
No redimensionamos el canvas con CSS. Usamos un escenario base de **1080x1920** (16:9 vertical) y aplicamos configuraciones de cámara:
*   **Cámara INTRO:** Plano medio (`scale: 0.4`, `yOffset: 180`).
*   **Cámara GUIDE:** Cuerpo completo (`scale: 0.35`, `yOffset: 100`).
*   **Cámara ASSISTANT:** Primer plano enfocado (`scale: 0.45`, `yOffset: 250`).
*   **Cámara HIDDEN:** Desplaza al modelo a `y: 2000` (fuera de pantalla).

### Optimización de Rendimiento
Para asegurar que funcione en tablets y móviles:
*   **Resolution Clamp:** Limitamos la resolución del renderizador a un máximo de `1.2x` para evitar el agotamiento de memoria en dispositivos con pantallas Retina de alta densidad.
*   **Auto-Pause:** El Ticker de PixiJS se detiene automáticamente cuando el estado es `IDLE_HIDDEN` para ahorrar batería y CPU.

---

## 8. Comunicación Backend-Frontend y Protocolo SSE

El frontend interactúa con el backend mediante un canal de **Server-Sent Events (SSE)** avanzado (`/api/chat/stream`).

### El Protocolo de Orquestación
El stream no solo envía texto; envía metadatos estructurados para controlar al avatar en tiempo real:
1.  **`[DECISION]`**: El modelo decide si responder (`yes`, `minimal`, `redirect`, `pause`).
2.  **`[ANALISIS]`**: Bloque JSON con deltas de estado emocional (`valence_delta`, `tension_delta`, `engagement_delta`).
3.  **`[TEXTO]`**: El contenido verbal que se muestra al usuario y se procesa para Lip-Sync.

### Persistencia de Conversación
Todos los mensajes se guardan automáticamente en la tabla `chat_messages`, recuperando los últimos 10 turnos para mantener la continuidad cognitiva.

---

## 9. Guía de Interacción Estética
Toda la UI del frontend está diseñada con:
*   **BlurFade:** Todas las entradas y salidas de texto tienen un fade con desenfoque.
*   **MagicCard:** Las tarjetas informativas tienen gradientes dinámicos que siguen el cursor.
*   **Z-Index Dinámico:** Eleonor navega entre capas (detrás del texto en chat, pero delante del fondo en el dashboard).
