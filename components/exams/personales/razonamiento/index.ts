import { Question } from "../../types"

export * from "./logico"
export * from "./abstraccion"
export * from "./ambiguedad"

export const razonamiento: Question[] = [
    {
        id: 1,
        text: "Debes escalar un sistema para una operación crítica. ¿Cuál priorizas?",
        // ... rest of original content
        type: "multiple-choice",
        options: [
            { id: "estable", text: "Estabilidad y lentitud" },
            { id: "veloz", text: "Velocidad y fragilidad" },
            { id: "flexible", text: "Flexibilidad aunque esté incompleto" }
        ],
        correctAnswer: "",
        skill: "prioratizacion-estructural"
    },
    {
        id: 2,
        text: "¿Qué costo específico asumes durante los primeros seis meses de implementación?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "analisis-de-trade-offs"
    },
    {
        id: 3,
        text: "Un reporte contiene datos contradictorios y la entrega es en una hora. ¿Cómo procedes?",
        type: "multiple-choice",
        options: [
            { id: "omitir", text: "Omitir la contradicción" },
            { id: "incluir-nota", text: "Incluir la contradicción con una nota" },
            { id: "retrasar", text: "Retrasar la entrega" }
        ],
        correctAnswer: "",
        skill: "gestion-incertidumbre"
    },
    {
        id: 4,
        text: "Debes trazar una ruta en territorio desconocido con poco combustible. ¿Qué priorizas?",
        type: "multiple-choice",
        options: [
            { id: "mapeo-total", text: "Mapeo previo exhaustivo" },
            { id: "ruta-directa", text: "Avance directo y reactivo" }
        ],
        correctAnswer: "",
        skill: "abstraccion-topologica"
    },
    {
        id: 5,
        text: "Un patrón falla por sexta vez sin causa aparente. El sistema global reporta 'OK'. ¿Qué haces?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "diagnostico-de-sistemas"
    },
    {
        id: 6,
        text: "Debes resolver un fallo recurrente. ¿Qué solución implementas?",
        type: "multiple-choice",
        options: [
            { id: "adaptar", text: "Adaptar una solución previa parcial" },
            { id: "nuevo", text: "Diseñar una solución total desde cero" }
        ],
        correctAnswer: "",
        skill: "modelo-mental-operativo"
    },
    {
        id: 7,
        text: "Una mejora duplica la eficiencia pero requiere 48 horas de inactividad total. ¿Cuándo intervienes?",
        type: "multiple-choice",
        options: [
            { id: "inmediato", text: "Intervención inmediata" },
            { id: "planificado", text: "Esperar baja demanda" },
            { id: "no-intervenir", text: "No intervenir por ahora" }
        ],
        correctAnswer: "",
        skill: "analisis-sistemico"
    },
    {
        id: 8,
        text: "Al explicar un mecanismo complejo, ¿comienzas por los componentes o por el resultado final?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "jerarquizacion-de-informacion"
    },
    {
        id: 9,
        text: "Hay dos fallos: uno visual que afecta la confianza y otro de datos que es silencioso. ¿Cuál reparas hoy?",
        type: "multiple-choice",
        options: [
            { id: "visual", text: "Fallo de percepción visual" },
            { id: "datos", text: "Fallo de integridad de datos" }
        ],
        correctAnswer: "",
        skill: "criterio-de-impacto"
    },
    {
        id: 10,
        text: "Un error irreversible tiene un 0.1% de probabilidad de ocurrir. ¿Cómo lo manejas en el diseño?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "gestion-de-riesgo-logico"
    }
]
