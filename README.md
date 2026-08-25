# Skill-Tech V0: Eleonor AI

**Skill-Tech V0** es una plataforma educativa de próxima generación impulsada por **Eleonor**, un avatar de Inteligencia Artificial persistente con capacidades de diagnóstico cognitivo y empatía emocional.

Este proyecto integra un frontend inmersivo en **Next.js** con un "cerebro" backend en **FastAPI (Python)**, combinando renderizado gráfico en tiempo real (Live2D), modelos de lenguaje (LLMs) y síntesis de voz (TTS) para crear una experiencia de aprendizaje personalizada.

## 🚀 Características Principales

*   **Avatar Interactivo (Live2D):** Eleonor no es un video, es un modelo vectorial que te sigue con la mirada, respira y reacciona a tu voz y emociones.
*   **Diagnóstico Cognitivo Dual:** Utiliza un enjambre de agentes de IA (Gemini Flash) para analizar tus fortalezas en tiempo real sin que te des cuenta.
*   **Memoria Persistente:** Eleonor recuerda quién eres, tus metas y tu estado de ánimo entre sesiones.
*   **Interfaz Inmersiva:** UI futurista "Glassmorphism" con transiciones fluidas y efectos de partículas.
*   **Voz y Oído Natural:** Habla con Eleonor usando tu micrófono (Whisper STT) y escucha respuestas con entonación humana (OpenAI/Edge TTS).

## 📂 Estructura del Proyecto

*   `/skill-tech` (Raíz Frontend): Aplicación Next.js, componentes React, y lógica de cliente.
*   `/server_py` (Cerebro Backend): API FastAPI, agentes de diagnóstico, gestión de base de datos y lógica de IA.

## 📚 Documentación

Para entender a profundidad como funciona cada sistema, consulta los siguientes manuales:

*   **[Manual General y Arquitectura](Eleonor_Documentation.md)**: Visión general técnica del sistema completo.
*   **[Cerebro Backend](Eleonor_Backend_Brain.md)**: Cómo funciona la IA, los agentes de diagnóstico y el motor emocional.
*   **[Arquitectura Frontend](Eleonor_Frontend_Architecture.md)**: Detalles sobre el renderizado, manejo de estados y UI.
*   **[Integración Live2D](Live2D_Integration.md)**: Todo sobre el modelo visual, expresiones y animaciones.

## 🛠️ Instalación y Ejecución

### Requisitos
*   Node.js 18+
*   Python 3.10+
*   Clave de API de OpenAI (configurada en `.env`)

### 1. Iniciar el Cerebro (Backend)
```bash
cd server_py
# Instalar dependencias (si es la primera vez)
pip install -r requirements.txt
# Iniciar servidor
python main.py
```
*El backend correrá en `http://localhost:8000`*

### 2. Iniciar la Interfaz (Frontend)
```bash
# En una nueva terminal, en la raíz del proyecto
npm install
npm run dev
```
*La aplicación estará disponible en `http://localhost:3000`*

## 🤝 Contribución
Este es un proyecto privado en desarrollo activo. Por favor, revisa `improvement_proposals.md` para ver las áreas de mejora identificadas.