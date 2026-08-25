# 📘 Documentación Técnica Maestra: Eleonor AI

**Versión:** 2.0  
**Estado:** Producción / Desarrollo Activo  
**Frameworks:** Next.js (React) + FastAPI (Python)

---

## 1. Visión del Proyecto
**Eleonor** no es simplemente un chatbot; es una **Entidad Digital Interactiva** diseñada para actuar como mentora académica y compañera de aprendizaje. A diferencia de los asistentes tradicionales, Eleonor posee:
- **Presencia Visual**: Un avatar Live2D que mantiene contacto visual y reacciona emocionalmente.
- **Voz Natural**: Capacidad de habla fluida con entonación humana (OpenAI/Edge-TTS).
- **Escucha Activa**: Sistema de reconocimiento de voz de alta fidelidad (Whisper).
- **Conciencia Situacional**: Rastreo de la "tensión" y el "compromiso" del usuario.

---

## 2. Arquitectura del Sistema
El sistema sigue una arquitectura **Cerebro-Cuerpo (Brain-Body)** desacoplada:

### El Cuerpo (Frontend - Cliente)
- **Tecnología**: Next.js 14, React 18, Tailwind CSS.
- **Responsabilidad**: Renderizado visual, captura de input (micrófono/texto), reproducción de audio, sincronización labial.
- **Componentes Clave**:
    - `AvatarDisplay.tsx`: Gestiona el modelo Live2D (PixiJS) y su movimiento.
    - `EleonorAIChat.tsx`: Orquestador de la UI, maneja el estado del chat y la comunicación con el API.
    - `components/profile/`: Gestión de identidad del usuario, configuraciones (`Settings.tsx`) y visualización de progreso.


### El Cerebro (Backend - Servidor)
- **Tecnología**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy.
- **Responsabilidad**: Procesamiento cognitivo, generación de voz, transcripción de audio, gestión de memoria y persistencia de usuarios.
- **Módulos Clave**:
    - `main.py`: API Gateway y configuración de CORS.
    - `routers/`: Endpoints modulares para usuarios (`user.py`), chat, etc.
    - `core/`: Lógica de negocio, agentes de diagnóstico (`gemini_pro_diagnostic`) y conexión DB (`database.py`).
    - `personality.py`: Definición del "Alma" (Prompts y comportamiento).
    - `stt.py` / `tts.py`: Módulos de percepción y voz.

---

## 3. Desglose Técnico del Backend (`/server_py`)

El backend es el núcleo inteligente. Se ejecuta en `http://localhost:8000`.

### 🧠 `main.py` (El Núcleo)
Gestiona las rutas API y mantiene el estado de la sesión (memoria de corto plazo).
- **Endpoint `/chat`**: Recibe texto o comandos.
    - Mantiene un historial de conversación (`conversation_history`).
    - Inyecta el "System Prompt" definido en `personality.py`.
    - Detecta comandos de emociones en la respuesta del LLM (ej: `[emocion: Feliz]`).
- **Endpoint `/stt`**: 
    - Recibe archivos de audio (`blob` wav/webm) desde el frontend.
    - Los guarda temporalmente y los procesa con Whisper.
- **Endpoint `/tts`**:
    - Recibe texto y estado emocional.
    - Genera audio en tiempo real y lo devuelve en base64.

### 🗣️ `tts.py` (Text-to-Speech Tri-Motor)
Implementa una estrategia híbrida para la generación de voz:
1.  **ElevenLabs (Premium)**: Usado para la voz de alta fidelidad "Nova".
2.  **Motor OpenAI**: Usa el modelo `tts-1` con la voz `nova`.
    - *Ventaja*: Calidad humana superior, matices emocionales.
    - *Uso*: Respuestas principales.
2.  **Motor Secundario (Edge-TTS)**: Usa Microsoft Edge Read Aloud.
    - *Ventaja*: Gratuito, extremadamente rápido, soporta SSML.
    - *Uso*: Fallback o respuestas rápidas.
    - *Modos SSML*: Configurados perfiles como `neutral_atenta`, `calma_acompañante`, `directiva_suave`.

### 👂 `stt.py` (Speech-to-Text)
Utiliza **OpenAI Whisper** (vía API) para transformar audio en texto.
- Supera las limitaciones de la API nativa del navegador (`WebSpeechAPI`) en cuanto a precisión y soporte de idiomas.
- Maneja archivos temporales de forma automática para evitar fugas de memoria.

---

## 4. Desglose Técnico del Frontend (`/skill-tech`)

### 🎨 `AvatarDisplay.tsx` (Motor Live2D)
- **Librería**: `pixi-live2d-display` sobre `PixiJS`.
- **Modelo**: Carga el modelo `Eleonor` (derivado de Tubasa).
- **Lip-Sync (Sincronización Labial)**:
    - No usa visemas pre-calculados.
    - **Análisis Espectral**: Utiliza `AudioContext` y un `AnalyserNode` para leer la amplitud del audio en tiempo real.
    - Modifica el parámetro `ParamMouthOpenY` del modelo basándose en el volumen instantáneo.
- **Motion Manager**:
    - `breath`: Respiración automática.
    - `tapBody`: Reacción a toques.
    - `expression`: Cambios de expresión facial disparados por tags del backend.

### 💬 `EleonorAIChat.tsx` (Controlador)
- **Gestión de Estado**: Usa `useState` y `useRef` para manejar la cola de mensajes, estado de grabación y reproducción.
- **Grabadora de Voz**:
    - Implementa `MediaRecorder` API.
    - Captura chunks de audio y los ensambla en un `Blob` para enviar al backend.
- **Ciclo de Vida del Mensaje**:
    1. Usuario habla -> `MediaRecorder` graba.
    2. Audio -> Backend `/stt` -> Texto.
    3. Texto -> Backend `/chat` -> Respuesta (Texto + Emoción).
    4. Respuesta -> Backend `/tts` -> Audio (Base64).
    5. Frontend -> Reproduce Audio + Anima Avatar.

---

## 5. Flujo de Datos (The Loop)

1.  **Input**: El usuario presiona el micrófono. El frontend graba audio.
2.  **Transmisión**: El audio se envía a `http://localhost:8000/api/stt`.
3.  **Percepción**: Whisper transcribe el audio a texto ("Hola Eleonor").
4.  **Cognición**:
    - `main.py` recibe "Hola Eleonor".
    - Agrega contexto (historial + prompt de personalidad).
    - Llama a GPT-4o-mini.
5.  **Respuesta**:
    - GPT genera: "¡Hola! [emocion: Feliz] ¿En qué trabajamos hoy?".
    - El backend extrae la emoción (`Feliz`) y limpia el texto verbal.
6.  **Síntesis**:
    - `tts.py` convierte "¿En qué trabajamos hoy?" a audio (MP3 Base64).
7.  **Actuación**:
    - El frontend recibe JSON: `{ text: "...", audio: "...", emotion: "Feliz" }`.
    - `AvatarDisplay` cambia la expresión a 'Feliz'.
    - El audio se reproduce.
    - El algoritmo de Lip-Sync mueve la boca del avatar al ritmo de la voz.

---

## 6. Configuración y Despliegue

### Requisitos Previos
- Node.js 18+
- Python 3.10+
- Clave API de OpenAI (`OPENAI_API_KEY`)

### Instalación Backend
```bash
cd server_py
pip install -r requirements.txt
# Asegurar tener ffmpeg instalado si es necesario para audio
```

### Ejecución
1.  **Terminal 1 (Backend)**:
    ```bash
    cd server_py
    python main.py
    # Corre en localhost:8000
    ```
2.  **Terminal 2 (Frontend)**:
    ```bash
    npm run dev
    # Corre en localhost:3000
    ```

---

## 7. Próximos Pasos (Roadmap)
- [x] **Memoria Persistente**: Implementación de base de datos SQLite con SQLAlchemy para perfiles de usuario y configuración.
- [ ] **Memoria Vectorial (RAG)**: Integrar ChromaDB para que Eleonor recuerde hechos específicos de sesiones pasadas a largo plazo.
- [ ] **Intervenciones Meta-Cognitivas**: Introducir mini-juegos breves generados dinámicamente para observar la flexibilidad cognitiva y la reacción ante el cambio de reglas ("LA IDEA").
- [ ] **Visión**: Integrar capacidad de ver la pantalla o webcam del usuario (GPT-4 Vision).
- [ ] **Modo Tutor Proactivo**: Que Eleonor inicie la conversación si detecta inactividad o "frustración" (vía análisis de voz).
