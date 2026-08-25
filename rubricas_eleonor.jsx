import { useState } from "react";

const MODULES = [
  {
    id: "razonamiento",
    label: "Razonamiento",
    color: "#F59E0B",
    bgLight: "#FEF3C7",
    bgDark: "#92400E",
    icon: "⚡",
    submodules: [
      {
        name: "Razonamiento Lógico",
        skill: "razonamiento-deductivo",
        descripcion: "Capacidad para identificar premisas, aplicar reglas lógicas y llegar a conclusiones válidas.",
        dimensiones: [
          {
            nombre: "Identificación de premisas",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "No distingue premisas de conclusiones. Mezcla datos sin estructura." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica premisas explícitas pero omite las implícitas o secundarias." },
              { nivel: 3, label: "Competente", desc: "Extrae correctamente las premisas clave y reconoce su jerarquía argumentativa." },
              { nivel: 4, label: "Experto", desc: "Identifica premisas ocultas, detecta ambigüedades y evalúa su solidez epistémica." },
            ],
            irt_b: [-1.5, -0.5, 0.5, 1.5], irt_a: [1.2, 1.4, 1.6, 1.8],
          },
          {
            nombre: "Aplicación de reglas deductivas",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Comete falacias básicas (afirmar el consecuente, negar el antecedente)." },
              { nivel: 2, label: "En desarrollo", desc: "Aplica modus ponens correctamente, pero falla en silogismos complejos." },
              { nivel: 3, label: "Competente", desc: "Maneja con precisión modus tollens y silogismos de 3+ proposiciones." },
              { nivel: 4, label: "Experto", desc: "Detecta falacias formales e informales. Usa lógica modal básica." },
            ],
            irt_b: [-1.0, 0.0, 0.8, 1.8], irt_a: [1.1, 1.3, 1.5, 1.7],
          },
          {
            nombre: "Validez vs. verdad de conclusiones",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Confunde argumento válido con argumento verdadero." },
              { nivel: 2, label: "En desarrollo", desc: "Distingue validez en casos simples; falla bajo paradojas." },
              { nivel: 3, label: "Competente", desc: "Evalúa validez y solidez de forma independiente en cualquier argumento." },
              { nivel: 4, label: "Experto", desc: "Aplica esta distinción para refutar argumentos circulares o sofísticos." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.0], irt_a: [1.0, 1.2, 1.5, 1.9],
          },
        ],
        vectores: { analitico: 0.8, mecanico: 0.4, estrategico: 0.3 },
      },
      {
        name: "Abstracción de Patrones",
        skill: "abstraccion-inductiva",
        descripcion: "Capacidad para detectar regularidades, generalizar reglas y aplicarlas a nuevos contextos.",
        dimensiones: [
          {
            nombre: "Detección de regularidades",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Solo detecta patrones obvios (secuencias numéricas lineales)." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica patrones de 2 variables; falla ante ruido o discontinuidades." },
              { nivel: 3, label: "Competente", desc: "Detecta patrones multivariable y discrimina ruido de señal." },
              { nivel: 4, label: "Experto", desc: "Construye hipótesis de patrón mínimo (parsimonia). Detecta excepciones estadísticas." },
            ],
            irt_b: [-1.2, -0.2, 0.7, 1.7], irt_a: [1.3, 1.5, 1.7, 1.9],
          },
          {
            nombre: "Generalización inductiva",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Generaliza a partir de 1-2 casos (inducción débil)." },
              { nivel: 2, label: "En desarrollo", desc: "Reconoce la necesidad de múltiples instancias pero subpondera contraejemplos." },
              { nivel: 3, label: "Competente", desc: "Formula reglas generales con conciencia de sus límites y condiciones de aplicación." },
              { nivel: 4, label: "Experto", desc: "Valida inductivamente con falsación activa. Ajusta reglas ante nuevas evidencias." },
            ],
            irt_b: [-0.8, 0.2, 1.0, 1.8], irt_a: [1.2, 1.4, 1.6, 1.8],
          },
        ],
        vectores: { analitico: 0.7, intuitivo: 0.5, divergente: 0.3 },
      },
      {
        name: "Resolución de Ambigüedad",
        skill: "tolerancia-ambiguedad",
        descripcion: "Capacidad para operar con información incompleta y tomar decisiones bajo incertidumbre.",
        dimensiones: [
          {
            nombre: "Tolerancia a la incertidumbre",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Paralización o decisión impulsiva ante información ambigua." },
              { nivel: 2, label: "En desarrollo", desc: "Solicita aclaraciones sistemáticamente; baja autonomía ante ambigüedad." },
              { nivel: 3, label: "Competente", desc: "Opera bajo incertidumbre con hipótesis de trabajo explícitas." },
              { nivel: 4, label: "Experto", desc: "Cuantifica subjetivamente la incertidumbre. Decide con riesgo calculado." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.0], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
          {
            nombre: "Resolución estructurada",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Sin estrategia. Elige la primera opción disponible." },
              { nivel: 2, label: "En desarrollo", desc: "Usa heurísticas simples (mayoría, similitud). No evalúa riesgo." },
              { nivel: 3, label: "Competente", desc: "Aplica marcos de decisión (árbol de decisión, análisis de escenarios)." },
              { nivel: 4, label: "Experto", desc: "Combina múltiples marcos y metacogniza sobre su proceso decisional." },
            ],
            irt_b: [-0.8, 0.3, 1.1, 2.1], irt_a: [1.0, 1.3, 1.5, 1.7],
          },
        ],
        vectores: { estrategico: 0.7, analitico: 0.5, intuitivo: 0.4 },
      },
    ],
  },
  {
    id: "aprendizaje",
    label: "Aprendizaje",
    color: "#10B981",
    bgLight: "#D1FAE5",
    bgDark: "#065F46",
    icon: "💡",
    submodules: [
      {
        name: "Metacognición y Control",
        skill: "metacognicion",
        descripcion: "Conciencia y regulación activa de los propios procesos de aprendizaje y pensamiento.",
        dimensiones: [
          {
            nombre: "Conciencia metacognitiva",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "No identifica sus propias fortalezas ni brechas de conocimiento." },
              { nivel: 2, label: "En desarrollo", desc: "Reconoce qué sabe/no sabe post-tarea; limitada prospección." },
              { nivel: 3, label: "Competente", desc: "Monitorea activamente su comprensión durante la tarea. Detecta errores en tiempo real." },
              { nivel: 4, label: "Experto", desc: "Planifica estratégicamente según su perfil cognitivo. Alta precisión de autoevaluación calibrada." },
            ],
            irt_b: [-1.0, 0.0, 0.9, 1.9], irt_a: [1.2, 1.4, 1.7, 2.0],
          },
          {
            nombre: "Autorregulación del aprendizaje",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Aprendizaje reactivo. Sin planificación ni ajuste de estrategias." },
              { nivel: 2, label: "En desarrollo", desc: "Ajusta estrategias post-fracaso pero no preventivamente." },
              { nivel: 3, label: "Competente", desc: "Establece metas, monitorea progreso y ajusta métodos en tiempo real." },
              { nivel: 4, label: "Experto", desc: "Diseña sistemas personales de aprendizaje. Transfiere autorregulación a dominios nuevos." },
            ],
            irt_b: [-0.8, 0.2, 1.0, 2.0], irt_a: [1.1, 1.3, 1.6, 1.9],
          },
        ],
        vectores: { analitico: 0.6, estrategico: 0.7, mecanico: 0.3 },
      },
      {
        name: "Estrategias de Aprendizaje",
        skill: "estrategias-cognitivas",
        descripcion: "Repertorio y aplicación efectiva de técnicas de procesamiento y retención de información.",
        dimensiones: [
          {
            nombre: "Diversidad estratégica",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Usa una única estrategia (ej: lectura repetida) para todo tipo de contenido." },
              { nivel: 2, label: "En desarrollo", desc: "Conoce 2-3 estrategias pero las aplica sin criterio de selección." },
              { nivel: 3, label: "Competente", desc: "Selecciona estrategias según el tipo de material y objetivo de aprendizaje." },
              { nivel: 4, label: "Experto", desc: "Combina y adapta estrategias. Evalúa su efectividad con métricas personales." },
            ],
            irt_b: [-1.0, 0.0, 0.8, 1.8], irt_a: [1.0, 1.2, 1.5, 1.8],
          },
          {
            nombre: "Procesamiento profundo",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Procesamiento superficial: memorización literal sin comprensión." },
              { nivel: 2, label: "En desarrollo", desc: "Parafrasea y resume correctamente pero no elabora ni conecta conceptos." },
              { nivel: 3, label: "Competente", desc: "Elabora, relaciona y aplica conocimiento a contextos nuevos." },
              { nivel: 4, label: "Experto", desc: "Genera esquemas conceptuales propios. Enseña y transfiere conocimiento con precisión." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.1], irt_a: [1.1, 1.4, 1.6, 1.8],
          },
        ],
        vectores: { analitico: 0.5, mecanico: 0.6, estrategico: 0.5 },
      },
      {
        name: "Transferencia de Conocimiento",
        skill: "transferencia-aprendizaje",
        descripcion: "Capacidad de aplicar conocimiento adquirido en dominios o contextos novedosos.",
        dimensiones: [
          {
            nombre: "Transferencia cercana",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Solo aplica en el contexto de aprendizaje original." },
              { nivel: 2, label: "En desarrollo", desc: "Transfiere a contextos muy similares con ayuda externa." },
              { nivel: 3, label: "Competente", desc: "Transfiere autónomamente a contextos con diferencias moderadas." },
              { nivel: 4, label: "Experto", desc: "Reconoce la estructura profunda de los problemas independientemente de su superficie." },
            ],
            irt_b: [-1.2, -0.2, 0.8, 1.8], irt_a: [1.1, 1.3, 1.5, 1.7],
          },
          {
            nombre: "Transferencia lejana (interdisciplinar)",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "No establece conexiones entre dominios distintos." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica analogías superficiales entre dominios." },
              { nivel: 3, label: "Competente", desc: "Aplica principios de un dominio para resolver problemas en otro distinto." },
              { nivel: 4, label: "Experto", desc: "Construye marcos teóricos unificadores. Pensamiento interdisciplinar sistemático." },
            ],
            irt_b: [0.0, 0.8, 1.5, 2.3], irt_a: [1.2, 1.5, 1.7, 1.9],
          },
        ],
        vectores: { divergente: 0.7, intuitivo: 0.5, estrategico: 0.6 },
      },
    ],
  },
  {
    id: "criterio",
    label: "Criterio",
    color: "#6366F1",
    bgLight: "#EEF2FF",
    bgDark: "#3730A3",
    icon: "⚖️",
    submodules: [
      {
        name: "Juicio Ético",
        skill: "juicio-etico",
        descripcion: "Capacidad para identificar dimensiones morales y razonar sobre dilemas con pluralismo de valores.",
        rubrica_llm: "Evalúa si la respuesta: (1) identifica las partes afectadas, (2) menciona al menos 2 marcos éticos en tensión, (3) justifica su posición con argumentos, no preferencias personales, (4) reconoce la legitimidad de posiciones contrarias.",
        dimensiones: [
          {
            nombre: "Identificación del dilema ético",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "No distingue el componente ético del componente práctico del problema." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica que hay un conflicto de valores pero lo reduce a 'bueno vs malo'." },
              { nivel: 3, label: "Competente", desc: "Mapea las partes afectadas, sus intereses y los valores en tensión con precisión." },
              { nivel: 4, label: "Experto", desc: "Aplica múltiples marcos (deontología, consecuencialismo, virtud) y evidencia el meta-nivel del dilema." },
            ],
            irt_b: [-0.8, 0.2, 1.0, 2.0], irt_a: [1.0, 1.2, 1.5, 1.7],
          },
          {
            nombre: "Argumentación ética",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Justifica con preferencias personales o costumbre social." },
              { nivel: 2, label: "En desarrollo", desc: "Invoca principios éticos pero sin coherencia interna o consistencia." },
              { nivel: 3, label: "Competente", desc: "Construye argumentos coherentes con un marco ético explícito y defiende ante objeciones." },
              { nivel: 4, label: "Experto", desc: "Dialoga entre marcos éticos. Reconoce los límites de cada uno y propone síntesis." },
            ],
            irt_b: [-0.3, 0.7, 1.3, 2.2], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
        ],
        vectores: { analitico: 0.5, estrategico: 0.4, divergente: 0.6 },
      },
      {
        name: "Análisis Crítico",
        skill: "autocritica-cognitiva",
        descripcion: "Capacidad para evaluar fuentes, detectar sesgos y cuestionar las propias creencias.",
        rubrica_llm: "Evalúa si: (1) cuestiona la fuente o la validez de la afirmación, (2) distingue hecho de opinión, (3) identifica al menos un sesgo potencial (confirmación, disponibilidad, autoridad), (4) propone criterios de verificación.",
        dimensiones: [
          {
            nombre: "Evaluación de fuentes",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Acepta información sin cuestionar la fuente o el método." },
              { nivel: 2, label: "En desarrollo", desc: "Cuestiona fuentes obvias (redes sociales) pero acepta fuentes de autoridad sin crítica." },
              { nivel: 3, label: "Competente", desc: "Evalúa credibilidad, sesgo y metodología en cualquier tipo de fuente." },
              { nivel: 4, label: "Experto", desc: "Triangula evidencias. Detecta conflictos de interés y condicionamientos epistemológicos." },
            ],
            irt_b: [-1.0, 0.0, 0.9, 1.8], irt_a: [1.2, 1.4, 1.6, 1.9],
          },
          {
            nombre: "Detección de sesgos propios",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "No reconoce la influencia de sus sesgos en su razonamiento." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica sesgos retrospectivamente pero no durante el proceso." },
              { nivel: 3, label: "Competente", desc: "Monitorea activamente sus sesgos. Aplica estrategias de debiasing." },
              { nivel: 4, label: "Experto", desc: "Arquitectura de toma de decisiones diseñada para minimizar sesgos sistemáticamente." },
            ],
            irt_b: [0.0, 0.8, 1.5, 2.2], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
        ],
        vectores: { analitico: 0.9, mecanico: 0.2, estrategico: 0.5 },
      },
      {
        name: "Criterio Decisional",
        skill: "decision-estructurada",
        descripcion: "Calidad del proceso de toma de decisiones bajo presión, información incompleta o conflicto de valores.",
        rubrica_llm: "Evalúa si: (1) define el problema antes de buscar soluciones, (2) considera al menos 3 alternativas, (3) evalúa consecuencias de 2° orden, (4) es coherente con criterios declarados anteriormente en la conversación.",
        dimensiones: [
          {
            nombre: "Estructuración del problema",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Salta a soluciones sin definir el problema. Confunde síntomas con causas." },
              { nivel: 2, label: "En desarrollo", desc: "Define el problema pero de forma incompleta; omite restricciones relevantes." },
              { nivel: 3, label: "Competente", desc: "Formula el problema con claridad, incluyendo restricciones, criterios de éxito y partes involucradas." },
              { nivel: 4, label: "Experto", desc: "Reencuadra el problema cuando la definición inicial es subóptima (problem reframing)." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.1], irt_a: [1.0, 1.3, 1.5, 1.8],
          },
          {
            nombre: "Evaluación de alternativas",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Considera solo la primera alternativa que se le ocurre." },
              { nivel: 2, label: "En desarrollo", desc: "Evalúa 2 alternativas con criterios no sistemáticos." },
              { nivel: 3, label: "Competente", desc: "Genera 3+ alternativas, las evalúa con criterios explícitos y ponderados." },
              { nivel: 4, label: "Experto", desc: "Diseña criterios de evaluación antes de generar alternativas. Evalúa consecuencias de 2° y 3° orden." },
            ],
            irt_b: [-0.3, 0.7, 1.4, 2.2], irt_a: [1.1, 1.4, 1.6, 1.9],
          },
        ],
        vectores: { estrategico: 0.8, analitico: 0.6, intuitivo: 0.3 },
      },
    ],
  },
  {
    id: "adaptabilidad",
    label: "Adaptabilidad",
    color: "#EC4899",
    bgLight: "#FCE7F3",
    bgDark: "#831843",
    icon: "🔄",
    submodules: [
      {
        name: "Flexibilidad Cognitiva",
        skill: "flexibilidad-cognitiva",
        descripcion: "Capacidad para cambiar de perspectiva, estrategia o marco mental ante nueva información.",
        dimensiones: [
          {
            nombre: "Cambio de perspectiva",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Visión rígida. Insiste en su perspectiva inicial ante evidencia contraria." },
              { nivel: 2, label: "En desarrollo", desc: "Adopta perspectivas alternativas cuando se las presentan explícitamente." },
              { nivel: 3, label: "Competente", desc: "Busca activamente perspectivas contrarias a la suya para enriquecer su análisis." },
              { nivel: 4, label: "Experto", desc: "Mantiene simultáneamente perspectivas contradictorias sin colapsar en una sola (pensamiento dialéctico)." },
            ],
            irt_b: [-0.8, 0.2, 1.0, 2.0], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
          {
            nombre: "Actualización de modelos mentales",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Ignora información que contradice su modelo mental previo." },
              { nivel: 2, label: "En desarrollo", desc: "Actualiza modelos solo ante evidencia muy robusta y explícita." },
              { nivel: 3, label: "Competente", desc: "Actualiza modelos ante evidencia moderada. Velocidad de actualización calibrada." },
              { nivel: 4, label: "Experto", desc: "Actualiza modelos bayesianamente: proporcional a la fortaleza de la evidencia." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.1], irt_a: [1.2, 1.4, 1.7, 1.9],
          },
        ],
        vectores: { divergente: 0.7, intuitivo: 0.5, analitico: 0.4 },
      },
      {
        name: "Respuesta al Cambio",
        skill: "respuesta-cambio",
        descripcion: "Gestión emocional y conductual ante situaciones de cambio, presión o ruptura de expectativas.",
        rubrica_llm: "Evalúa si: (1) reconoce la emoción asociada al cambio, (2) no confunde reacción emocional con evaluación racional, (3) identifica oportunidades en el nuevo escenario, (4) propone acciones concretas de adaptación.",
        dimensiones: [
          {
            nombre: "Gestión emocional ante el cambio",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Reacción de rechazo o parálisis. Conductual determinado por el impacto emocional." },
              { nivel: 2, label: "En desarrollo", desc: "Reconoce la emoción pero necesita tiempo para regularla antes de actuar." },
              { nivel: 3, label: "Competente", desc: "Regula activamente la emoción y mantiene capacidad ejecutiva durante el cambio." },
              { nivel: 4, label: "Experto", desc: "Transforma la emoción en energía adaptativa. Lidera a otros durante el cambio." },
            ],
            irt_b: [-0.3, 0.7, 1.3, 2.2], irt_a: [1.0, 1.2, 1.5, 1.8],
          },
          {
            nombre: "Identificación de oportunidades",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Solo ve amenazas y pérdidas en el cambio. Marco mental de déficit." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica oportunidades cuando el contexto es favorable; blind spot en adversidad." },
              { nivel: 3, label: "Competente", desc: "Evalúa sistemáticamente tanto riesgos como oportunidades en cualquier cambio." },
              { nivel: 4, label: "Experto", desc: "Crea activamente condiciones para capitalizar el cambio. Mentalidad proactiva de crecimiento." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.0], irt_a: [1.1, 1.3, 1.5, 1.7],
          },
        ],
        vectores: { estrategico: 0.6, divergente: 0.5, intuitivo: 0.6 },
      },
      {
        name: "Adaptación Estratégica",
        skill: "adaptacion-estrategica",
        descripcion: "Capacidad para rediseñar planes y metas ante cambios estructurales del entorno.",
        dimensiones: [
          {
            nombre: "Replanteo estratégico",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Mantiene el plan original a pesar de que el entorno lo invalida." },
              { nivel: 2, label: "En desarrollo", desc: "Modifica tácticas pero preserva estrategia incluso cuando es inviable." },
              { nivel: 3, label: "Competente", desc: "Rediseña estrategia completa cuando las condiciones lo requieren sin perder el objetivo de fondo." },
              { nivel: 4, label: "Experto", desc: "Diseña estrategias adaptativas desde el inicio (robustez, optionalidad, pivots planificados)." },
            ],
            irt_b: [0.0, 0.8, 1.5, 2.3], irt_a: [1.1, 1.4, 1.6, 1.8],
          },
        ],
        vectores: { estrategico: 0.9, analitico: 0.4, divergente: 0.5 },
      },
    ],
  },
  {
    id: "autonomia",
    label: "Autonomía",
    color: "#EF4444",
    bgLight: "#FEE2E2",
    bgDark: "#7F1D1D",
    icon: "👤",
    submodules: [
      {
        name: "Autogestión del Aprendizaje",
        skill: "autogestion-aprendizaje",
        descripcion: "Capacidad para planificar, ejecutar y evaluar el propio proceso de aprendizaje sin supervisión externa.",
        rubrica_llm: "Evalúa si: (1) define objetivos de aprendizaje propios, no impuestos, (2) identifica recursos y estrategias por iniciativa propia, (3) establece criterios de éxito medibles, (4) prevé cómo evaluará su progreso.",
        dimensiones: [
          {
            nombre: "Iniciativa en el aprendizaje",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Aprendizaje puramente reactivo: solo aprende cuando se le asigna explícitamente." },
              { nivel: 2, label: "En desarrollo", desc: "Busca información por curiosidad puntual pero sin sistema ni continuidad." },
              { nivel: 3, label: "Competente", desc: "Identifica sus propias brechas y diseña planes de aprendizaje autodirigido." },
              { nivel: 4, label: "Experto", desc: "Sistema de aprendizaje continuo con metas, métricas y revisiones periódicas. Aprende a aprender." },
            ],
            irt_b: [-0.8, 0.2, 1.0, 2.0], irt_a: [1.2, 1.4, 1.7, 1.9],
          },
          {
            nombre: "Gestión de recursos propios",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Depende completamente de recursos provistos por otros." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica recursos básicos pero no los filtra ni los integra críticamente." },
              { nivel: 3, label: "Competente", desc: "Construye un ecosistema de recursos personalizados y los actualiza activamente." },
              { nivel: 4, label: "Experto", desc: "Crea y comparte recursos originales. Contribuye al aprendizaje de otros." },
            ],
            irt_b: [-0.5, 0.5, 1.2, 2.0], irt_a: [1.1, 1.3, 1.5, 1.8],
          },
        ],
        vectores: { estrategico: 0.7, analitico: 0.4, mecanico: 0.5 },
      },
      {
        name: "Iniciativa Operativa",
        skill: "iniciativa-accion",
        descripcion: "Tendencia a actuar proactivamente, asumir responsabilidades y generar cambios sin esperar instrucciones.",
        rubrica_llm: "Evalúa si: (1) propone acciones concretas sin que se le soliciten, (2) asume responsabilidad del resultado, (3) no transfiere la carga de decisión a terceros, (4) persiste ante los primeros obstáculos.",
        dimensiones: [
          {
            nombre: "Proactividad",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Espera instrucciones explícitas para actuar. Mínima iniciativa espontánea." },
              { nivel: 2, label: "En desarrollo", desc: "Actúa por iniciativa propia en situaciones familiares; pasivo en territorios nuevos." },
              { nivel: 3, label: "Competente", desc: "Identifica necesidades no declaradas y actúa antes de que se vuelvan urgentes." },
              { nivel: 4, label: "Experto", desc: "Genera cambios sistémicos sin mandato. Crea oportunidades donde otros ven vacíos." },
            ],
            irt_b: [-0.3, 0.7, 1.4, 2.2], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
          {
            nombre: "Responsabilidad sobre resultados",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Atribuye resultados negativos a factores externos (locus externo)." },
              { nivel: 2, label: "En desarrollo", desc: "Asume responsabilidad parcial; tiende a compartir la culpa." },
              { nivel: 3, label: "Competente", desc: "Asume plena responsabilidad de sus acciones y sus consecuencias." },
              { nivel: 4, label: "Experto", desc: "Asume responsabilidad incluso por sistemas que solo influenció. Locus interno robusto." },
            ],
            irt_b: [0.0, 0.8, 1.5, 2.3], irt_a: [1.0, 1.2, 1.5, 1.7],
          },
        ],
        vectores: { estrategico: 0.6, divergente: 0.5, analitico: 0.4 },
      },
      {
        name: "Autodirección Personal",
        skill: "autodireccion-identidad",
        descripcion: "Claridad de valores, metas personales y capacidad de actuar alineado con ellos de forma consistente.",
        rubrica_llm: "Evalúa si: (1) hace referencia a valores propios (no sociales o impuestos), (2) sus elecciones son coherentes entre sí, (3) puede justificar sus prioridades con argumentos personales, (4) no se contradice con posiciones anteriores en el examen.",
        dimensiones: [
          {
            nombre: "Claridad de valores personales",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Valores ambiguos o contradictorios. Decisiones guiadas por presión social." },
              { nivel: 2, label: "En desarrollo", desc: "Identifica sus valores cuando se le pregunta pero no los usa para guiar decisiones." },
              { nivel: 3, label: "Competente", desc: "Toma decisiones consistentemente alineadas con valores explícitos y articulados." },
              { nivel: 4, label: "Experto", desc: "Sistema de valores jerarquizado, revisado y refinado. Guía a otros en la clarificación de valores." },
            ],
            irt_b: [0.2, 1.0, 1.7, 2.4], irt_a: [1.1, 1.3, 1.6, 1.8],
          },
          {
            nombre: "Consistencia identitaria bajo presión",
            niveles: [
              { nivel: 1, label: "Inicial", desc: "Cambia posición y valores ante cualquier presión social o autoridad." },
              { nivel: 2, label: "En desarrollo", desc: "Mantiene posición ante presión baja; cede ante presión moderada." },
              { nivel: 3, label: "Competente", desc: "Mantiene valores y posición incluso en contextos adversariales, con argumentación." },
              { nivel: 4, label: "Experto", desc: "La presión externa refina y clarifica (no erosiona) su sistema de valores." },
            ],
            irt_b: [0.5, 1.2, 1.9, 2.6], irt_a: [1.2, 1.4, 1.7, 1.9],
          },
        ],
        vectores: { estrategico: 0.5, analitico: 0.5, divergente: 0.6 },
      },
    ],
  },
];

const NIVEL_COLORS = ["#94A3B8", "#60A5FA", "#34D399", "#F59E0B"];
const NIVEL_BG = ["#F1F5F9", "#EFF6FF", "#ECFDF5", "#FFFBEB"];

export default function RubricasEleonor() {
  const [activeModule, setActiveModule] = useState(0);
  const [activeSubmodule, setActiveSubmodule] = useState(0);
  const [expandedDim, setExpandedDim] = useState(null);

  const mod = MODULES[activeModule];
  const sub = mod.submodules[activeSubmodule];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "1rem 0" }}>
      <h2 className="sr-only">Rúbricas de análisis psicológico para el sistema Eleonor</h2>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>Motor Cognitivo Eleonor · Estándar Psicométrico</p>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>Rúbricas de evaluación cognitiva</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "6px 0 0" }}>Parámetros IRT, vectores cognitivos y rúbricas LLM para los 5 módulos personales.</p>
      </div>

      {/* Module tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        {MODULES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => { setActiveModule(i); setActiveSubmodule(0); setExpandedDim(null); }}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: activeModule === i ? `1.5px solid ${m.color}` : "0.5px solid var(--color-border-tertiary)",
              background: activeModule === i ? m.bgLight : "var(--color-background-primary)",
              color: activeModule === i ? m.color : "var(--color-text-secondary)",
              fontSize: 13, fontWeight: activeModule === i ? 500 : 400, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Submodule tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {mod.submodules.map((s, i) => (
          <button
            key={i}
            onClick={() => { setActiveSubmodule(i); setExpandedDim(null); }}
            style={{
              padding: "5px 12px", borderRadius: 6,
              border: activeSubmodule === i ? `1.5px solid ${mod.color}` : "0.5px solid var(--color-border-tertiary)",
              background: activeSubmodule === i ? "var(--color-background-secondary)" : "transparent",
              color: activeSubmodule === i ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontSize: 12, fontWeight: activeSubmodule === i ? 500 : 400, cursor: "pointer",
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Submodule header card */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: mod.color, fontWeight: 500, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {mod.label} · Módulo {activeSubmodule + 1 < 10 ? "0" + (activeSubmodule + 1) : activeSubmodule + 1}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 6px", color: "var(--color-text-primary)" }}>{sub.name}</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{sub.descripcion}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 4px", fontWeight: 500 }}>Vectores cognitivos</p>
            {Object.entries(sub.vectores).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", width: 72, textTransform: "capitalize" }}>{k}</span>
                <div style={{ flex: 1, height: 4, background: "var(--color-background-secondary)", borderRadius: 2 }}>
                  <div style={{ width: `${v * 100}%`, height: "100%", background: mod.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", width: 26 }}>{Math.round(v * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {sub.rubrica_llm && (
          <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.9rem", background: "var(--color-background-secondary)", borderRadius: 8, borderLeft: `3px solid ${mod.color}` }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: mod.color, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rúbrica LLM (inyectar en prompt)</p>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>{sub.rubrica_llm}</p>
          </div>
        )}
      </div>

      {/* Dimensions */}
      {sub.dimensiones.map((dim, di) => (
        <div key={di} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, marginBottom: "0.75rem", overflow: "hidden" }}>
          <button
            onClick={() => setExpandedDim(expandedDim === di ? null : di)}
            style={{
              width: "100%", textAlign: "left", padding: "0.875rem 1.25rem",
              background: "none", border: "none", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{dim.nombre}</p>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                IRT calibrado · a: [{dim.irt_a.join(", ")}] · b: [{dim.irt_b.join(", ")}]
              </p>
            </div>
            <i className={`ti ti-chevron-${expandedDim === di ? "up" : "down"}`} style={{ fontSize: 16, color: "var(--color-text-secondary)" }} aria-hidden="true" />
          </button>

          {expandedDim === di && (
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "1rem 1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {dim.niveles.map((n) => (
                  <div key={n.nivel} style={{ background: NIVEL_BG[n.nivel - 1], border: `0.5px solid ${NIVEL_COLORS[n.nivel - 1]}`, borderRadius: 8, padding: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, background: NIVEL_COLORS[n.nivel - 1], color: "#fff", borderRadius: 4, padding: "2px 6px" }}>N{n.nivel}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{n.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.55 }}>{n.desc}</p>
                    <p style={{ fontSize: 10, color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
                      b={dim.irt_b[n.nivel - 1]} · a={dim.irt_a[n.nivel - 1]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* IRT summary */}
      <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "0.75rem 1rem", marginTop: "0.5rem" }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nota de implementación IRT</p>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Los parámetros <strong>b</strong> (dificultad) y <strong>a</strong> (discriminación) son valores pre-calibrados para ingresar en <code style={{ fontSize: 11, background: "var(--color-background-primary)", padding: "1px 4px", borderRadius: 3 }}>KNOWN_ITEMS</code> de <code style={{ fontSize: 11, background: "var(--color-background-primary)", padding: "1px 4px", borderRadius: 3 }}>irt.py</code>. Eliminan la calibración ciega por heurísticas de longitud de texto.
        </p>
      </div>
    </div>
  );
}
