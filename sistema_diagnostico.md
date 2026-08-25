# 🧠 Sistema de Diagnóstico de Skill-Tech

El sistema de diagnóstico de exámenes de **Skill-Tech** es un motor inteligente impulsado por IA que no solo evalúa si una respuesta es correcta o incorrecta, sino que analiza el **patrón de razonamiento** del usuario, su nivel de adaptabilidad y genera un perfil cognitivo detallado.

A continuación, se explica el flujo completo de cómo funciona este sistema, desde que el usuario envía sus respuestas hasta que Eleonor entrega su retroalimentación.

---

## 1. Recepción del Examen (`router.py`)
El flujo comienza cuando el cliente (la aplicación web) envía las respuestas del examen al servidor a través del endpoint `POST /api/diagnosis/`. 
Este payload (`ExamSubmission`) incluye:
- El área evaluada (Ej: *Matemáticas*, *Ciencias*).
- Las respuestas crudas (Pregunta, Respuesta del usuario, Tipo).
- El tiempo total (`totalTime`) empleado.

## 2. Enrutamiento Especializado de Agentes (`agents/__init__.py`)
Una vez recibidos los datos, el sistema no usa un solo prompt genérico. En su lugar, delega el análisis a un **Agente Especializado** dependiendo del área del examen (Ej: `MathAgent`, `ScienceAgent`, `VocationalAgent`, etc.).
- Existe un diccionario de registro `AGENTS` que mapea cada área a la instancia de su agente correspondiente.
- Si el área es transversal o especial (como *Adaptabilidad* o *Criterio*), se utiliza un `SpecialistAgent` con una personalidad e instrucción única.

## 3. Análisis Cognitivo con Gemini (`base_agent.py`)
Cada agente especializado hereda de `BaseAgent`, el cual se encarga de orquestar la comunicación asíncrona con la API de **Gemini 1.5 Flash**.
El agente inyecta un *System Prompt* estricto y fuerza a la IA a responder con un **esquema JSON estructurado** que incluye métricas vitales:

*   **`nivel`** (0-100): Puntuación general de la habilidad.
*   **`razonamiento_tipo`**: Clasifica cómo piensa el usuario (analítico, divergente, intuitivo, mecánico o estratégico).
*   **`razonamiento_vector`**: Desglosa las dimensiones cognitivas en flotantes (0-1).
*   **`metricas_base`**: Precisión, consistencia, velocidad normalizada y tasa de error conceptual.
*   **`fatiga_score`** y **`potencial_score`**: Ayudan a entender el estado del usuario.
*   **`puntos_fuertes`** y **`errores`**: Retroalimentación textual cualitativa.

> [!TIP]
> Si la API de Gemini sufre un límite de cuota (Error 429), `BaseAgent` implementa un sistema de reintentos automáticos (Backoff exponencial) para asegurar que el diagnóstico no se pierda.

## 4. Actualización de la Memoria y Habilidades (`skills.py` y DB)
Con el análisis JSON generado por Gemini, el sistema actualiza el estado del usuario en la base de datos de PostgreSQL:
- Se llama a la función `update_user_skills()` la cual toma el resultado y recalcula el nivel del usuario en dicha área.
- Se guarda el registro histórico (`ExamResult`) permitiendo graficar la "Evolución de Aprendizaje" y las tendencias a lo largo del tiempo.

## 5. Síntesis y Voz de Eleonor (`eleonor_synthesizer.py`)
Skill-Tech busca una experiencia inmersiva. Después de calcular los resultados crudos, el servidor invoca al **Agente Sintetizador** de Eleonor (`ELEONOR_SYNTH.generate_spoken_diagnosis`).
- Este agente toma el resultado estéril y matemático de Gemini y lo **humaniza**.
- Genera un guion corto, empático y constructivo diseñado para ser leído en voz alta por el motor TTS (Text-to-Speech) del frontend (como Microsoft Edge TTS).

## 6. Integración con el Motor de Rutas (Journey Router)
Finalmente, el diagnóstico sirve como la **base obligatoria** para la generación de rutas de aprendizaje. 
En `journey_router.py`, cuando el usuario solicita una ruta de aprendizaje para un área, el sistema verifica primero que exista un diagnóstico reciente y profundo. 
Luego, los agentes `INTERPRETE` y `ARQUITECTO` utilizan los vectores de razonamiento, puntos débiles y fuertes del diagnóstico para crear una ruta de 5 sesiones **completamente a la medida** del cerebro del usuario.

---

### Resumen del Flujo de Datos 🌊

1. 👤 **Usuario** -> *(Envía respuestas)* -> 🌐 `router.py`
2. 🌐 `router.py` -> *(Enruta por área)* -> 🤖 `AGENTS["area"]`
3. 🤖 `BaseAgent` -> *(Consulta prompt a IA)* -> 🧠 **API Gemini 1.5**
4. 🧠 **API Gemini 1.5** -> *(Retorna JSON Cognitivo)* -> 🤖 `BaseAgent`
5. 🤖 `BaseAgent` -> *(Guarda en DB)* -> 🗄️ **PostgreSQL (UserSkills)**
6. 🌐 `router.py` -> *(Solicita guion)* -> 🎙️ `EleonorSynthesizer`
7. 🌐 `router.py` -> *(Devuelve respuesta al cliente)* -> 👤 **Usuario (UI / TTS)**
