# Plan de Implementación: Backend de Exámenes e Integración de SkillMap

Este plan detalla los pasos para transicionar Skill-Tech de una demostración estática a una plataforma dinámica basada en datos, donde los exámenes, los agentes de IA y Eleonor estén plenamente integrados.

## Revisión del Usuario Requerida

> [!IMPORTANT]
> Este plan asume la introducción de una base de datos ligera (SQLite) para la fase inicial. Por favor, confirma si prefieres un motor de base de datos diferente (ej: PostgreSQL).

> [!WARNING]
> La interfaz del SkillMap actualmente usa datos estáticos. Integrarla con el backend requerirá modificar `SkillMap.tsx` y `QuizInterface.tsx` para comunicarse con la nueva API.

> [!NOTE]
> Se incluirán nuevos agentes de diagnóstico para las áreas de **Razonamiento, Aprendizaje, Criterio, Adaptabilidad y Autonomía** definidos en `QuizData.tsx`.

---

## Cambios Propuestos

### [Backend] Lógica Central y Persistencia

#### [NUEVO] [database.py](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/server_py/core/database.py)
*   Inicializar base de datos SQLite usando SQLAlchemy.
*   Definir modelos para: `UserSkills`, `ExamResults`, y `EleonorHistory`.
*   **Regla para `EleonorHistory`**: No almacena logs de chat ni respuestas crudas. Almacena tendencias (`summary`), señales (`signals`: ["razonamiento_up"]) e hitos cognitivos comprimidos.

#### [NUEVO] [skill_logic.py](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/server_py/core/skill_logic.py)
*   Crear un sistema de mapeo para traducir las salidas JSON de los agentes de IA a categorías de SkillMap.
*   Implementar lógica para actualizar puntajes de habilidades (promedios ponderados o cambios incrementales).

#### [MODIFICAR] [diagnosis.py](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/server_py/routers/diagnosis.py)
*   Reemplazar `session_diagnoses` (en memoria) con commits a la base de datos.
*   Disparar actualizaciones de `skill_logic` tras un diagnóstico exitoso.

#### [MODIFICAR] [diagnosis_ai.py](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/server_py/core/diagnosis_ai.py)
*   Expandir el diccionario `AGENTS` para incluir las nuevas personas: `razonamiento`, `aprendizaje`, `criterio`, `adaptabilidad` y `autonomia`.

#### [MODIFICAR] [unified_synthesizer.py](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/server_py/core/gemini_pro_diagnostic/unified_synthesizer.py)
*   Implementar inyección de "Estados Comprimidos": Eleonor consume un `skill_snapshot` y `trend` (ej: `{ "razonamiento": "alto_estable", "trend": "+" }`) en lugar de datos técnicos.
*   Evitar inyección directa de resultados de examen para prevenir el 'Token Death' por contexto histórico.

---

### [UX] Estrategia de Feedback de Eleonor (Bucle Constante)

#### Reglas de Interacción
*   **Omnisciencia Natural**: Eleonor habla como si "ya supiera" el estado del usuario. Evitar "Según tu último test..." o "Sacaste 80%".
*   **Lectura de Patrones**: El feedback se enfoca en "Estás tomando decisiones con más estructura" o "Te cuesta soltar planes", manteniendo el tono humano y conversacional.

---

### [Arquitectura] Consideraciones de Optimización de Contexto
*   El **SkillMap** actúa como fuente única de verdad (Single Source of Truth).
*   El historial cognitivo se condensa periódicamente (**Rolling Summary**) para mantener los prompts cortos y precisos.

### [Frontend] Integración de UI

#### [NUEVO] [skills.ts](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/lib/api/skills.ts)
*   Funciones de ayuda para obtener datos de habilidades y enviar resultados de exámenes.

#### [MODIFICAR] [SkillMap.tsx](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/components/dashboard/SkillMap.tsx)
*   Reemplazar constantes estáticas con hooks de estado y `useEffect` para obtener datos del backend.
*   Añadir estados de carga y manejo de errores para la obtención de datos.

#### [MODIFICAR] [QuizInterface.tsx](file:///c:/Users/PC/OneDrive/Documentos/App/skill-tech%20(2)/skill-tech/components/quiz/QuizInterface.tsx)
*   Actualizar la función `handleFinishQuiz` para asegurar que envía los datos correctos y maneja la respuesta persistente.

---

## Plan de Verificación

### Pruebas Automatizadas
*   **Pruebas Unitarias de Backend**:
    *   `pytest server_py/tests/test_skill_logic.py`: Verificar que el JSON de la IA se mapea correctamente a puntajes de habilidades.
    *   `pytest server_py/tests/test_database.py`: Verificar operaciones CRUD de la DB para habilidades y exámenes.
*   **Integración de API**:
    *   Probar el endpoint `/api/diagnosis` usando Postman o `curl` para asegurar que ocurran las actualizaciones en la DB.

### Verificación Manual
1.  **Ejecución de Examen Mock**: Completar un quiz en la interfaz y verificar que la pantalla de "Procesamiento" muestra el nivel correcto.
2.  **Actualización de SkillMap**: Navegar al SkillMap y comprobar si los gráficos han cambiado basándose en los resultados del examen.
3.  **Feedback de Eleonor**: Preguntar a Eleonor "¿Cómo voy?" y verificar que mencione progresos relacionados con el examen reciente (sin revelar puntajes técnicos).
