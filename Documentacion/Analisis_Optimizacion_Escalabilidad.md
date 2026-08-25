# Auditoría Técnica: SkillTech - Optimización y Escalabilidad

## 1. Optimización de Carga (User Experience & Performance)

### 🚀 Frontend & Assets
*   **Gestión de Modelos Live2D:** 
    *   *Estado:* Los modelos `.model3.json` y sus texturas son pesados. El componente `AvatarDisplay` carga scripts de forma imperativa en un hook.
    *   **Mejora:** Implementar un **Asset Manager** que pre-cargue las texturas en el navegador mientras el usuario está en la pantalla de Login. Usar compresión `Basis Universal` para las texturas si es posible.
*   **Next.js Image Optimization:**
    *   *Estado:* `unoptimized: true` está activo.
    *   **Mejora:** Activar la optimización automática para servir formatos modernos (WebP/AVIF). Esto reduciría drásticamente el peso de fondos y logos en dispositivos móviles.
*   **Code Splitting Agresivo:**
    *   *Mejora:* Usar `Suspense` y `dynamic` imports por cada módulo del Dashboard (`SkillMap`, `Achievements`). Actualmente, el bundle principal de la aplicación puede ser innecesariamente grande al cargar todo el grid de inicio.
*   **Critical CSS:**
    *   *Mejora:* Extraer los estilos del HUD e Input bar para que se pinten antes de que cargue el pesado motor de PixiJS, evitando el "layout shift".

### ⚡ Backend Performance
*   **Streaming & TTS:**
    *   *Estado:* El TTS se genera después de que el LLM termina o por bloques.
    *   **Mejora:** Sincronizar el streaming de texto con el de audio mediante **Websockets** o **Server-Sent Events** más optimizados, evitando múltiples peticiones HTTP `POST /api/tts` que añaden latencia de red.

---

## 2. Escalabilidad (Arquitectura & Crecimiento)

### 🗄️ Persistencia de Datos
*   **De SQLite a PostgreSQL:**
    *   *Motivo:* SQLite es excelente para desarrollo unipersonal, pero para un "Ecosistema de Aprendizaje" con múltiples usuarios concurrentes, PostgreSQL gestionará mejor los bloqueos de escritura y permitirá búsquedas vectoriales (importante para la memoria de Eleonor a largo plazo).
*   **Indexación:**
    *   *Mejora:* Crear índices específicos en la base de datos para `user_id` y `timestamp` en las tablas de historial y mensajes, previniendo degradación al llegar a miles de registros.

### 👤 Multi-Tenancy (Seguridad y Privacidad)
*   **Estado Global vs Estado de Sesión:**
    *   *Estado:* El backend usa variables globales (`eleonor_state`) en algunos módulos, lo que causaría colisiones de personalidad entre diferentes usuarios.
    *   **Mejora:** Eliminar variables globales en el servidor. Cada petición debe recibir un `context_id` (vía JWT) y recuperar su estado específico de un caché rápido (como Redis) o de la base de datos.

### 🧠 Inteligencia Artificial
*   **Abstracción de LLM (Gateway/Proxy):**
    *   *Mejora:* Crear una clase base `LLMProvider` para no depender directamente de la librería de OpenAI. Esto permitiría cambiar a Anthropic, Google Gemini o modelos locales (Llama 3) sin reescribir la lógica de chat.
*   **Orquestación de Agentes:**
    *   *Mejora:* Implementar una cola de tareas (Task Queue) para los diagnósticos profundos que tardan más de 5 segundos, evitando que el usuario espere con la interfaz bloqueada.

---

## 3. Resumen de Próximos Pasos Recomendados

| Categoría | Acción Inmediata | Impacto |
| :--- | :--- | :--- |
| **Carga** | Activar Next Images & Carga Lazy de Componentes | ⬇️ Peso Bundle (~30%) |
| **Escalabilidad** | Implementar JWT & Scoping de DB por Usuario | ⬆️ Seguridad & Privacidad |
| **Mantenimiento** | Refactor a Patrón Service-Repository en Python | ⬆️ Facilidad de testeo |
| **UX** | Implementar Websockets para Chat + TTS | ⬇️ Latencia Percibida |

> [!NOTE]
> El proyecto tiene una base visual muy sólida y premium. El mayor reto actual es la transición de un prototipo de "usuario único" a una plataforma multi-usuario escalable y con carga progresiva de activos pesados (Live2D).
