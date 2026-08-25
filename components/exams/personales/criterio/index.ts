import { Question } from "../../types"

export * from "./etico"
export * from "./analitico"
export * from "./decisional"

// CRITERIO - Capacidad de juicio y discernimiento
export const criterio: Question[] = [
    {
        id: 1,
        text: "Recibes dos solicitudes urgentes: una de un cliente que genera 60% de ingresos y otra de un equipo interno bloqueado. Solo puedes atender una ahora. ¿Cuál eliges?",
        type: "multiple-choice",
        options: [
            { id: "cliente", text: "Cliente principal (impacto económico)" },
            { id: "interno", text: "Equipo interno (desbloqueante)" },
            { id: "evaluar", text: "Pedir más información antes de decidir" }
        ],
        correctAnswer: "",
        skill: "juicio-bajo-presion"
    },
    {
        id: 2,
        text: "Describe una situación donde una regla existente no encajaba con el problema real.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "criterio-normativo"
    },
    {
        id: 3,
        text: "Tienes evidencia sólida de que una decisión popular está equivocada, pero cuestionarla generará conflicto. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "silencio", text: "Guardar silencio y ejecutar" },
            { id: "confrontar", text: "Confrontar directamente" },
            { id: "alternativa", text: "Proponer alternativa sin atacar la decisión" }
        ],
        correctAnswer: "",
        skill: "coraje-intelectual"
    },
    {
        id: 4,
        text: "En un proyecto, dos métricas clave muestran tendencias opuestas. ¿Cómo decides cuál priorizar y por qué?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "interpretacion-de-senales"
    },
    {
        id: 5,
        text: "Un colega comete un error que podrías resolver sin que nadie lo note. ¿Expones el error?",
        type: "multiple-choice",
        options: [
            { id: "resolver-silencio", text: "Resolverlo en silencio" },
            { id: "exponer", text: "Exponerlo inmediatamente" },
            { id: "privado", text: "Hablarlo en privado primero" }
        ],
        correctAnswer: "",
        skill: "etica-operacional"
    },
    {
        id: 6,
        text: "¿Qué criterio usas para decidir cuándo algo es 'suficientemente bueno' versus cuando necesita ser perfecto?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "umbral-de-calidad"
    },
    {
        id: 7,
        text: "Descubres que una práctica común en tu área es ineficiente pero nadie la cuestiona. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "continuar", text: "Mantener el status quo" },
            { id: "proponer", text: "Proponer cambio con evidencia" },
            { id: "implementar", text: "Cambiarla directamente en mi trabajo" }
        ],
        correctAnswer: "",
        skill: "pensamiento-independiente"
    },
    {
        id: 8,
        text: "Menciona un momento donde confiaste en tu intuición sobre los datos. ¿Qué pasó?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "balance-intuicion-evidencia"
    },
    {
        id: 9,
        text: "Tienes recursos para mejorar algo existente 30% o crear algo nuevo con 50% de probabilidad de éxito. ¿Qué escoges?",
        type: "multiple-choice",
        options: [
            { id: "mejorar", text: "Mejora incremental garantizada" },
            { id: "nuevo", text: "Innovación con riesgo" }
        ],
        correctAnswer: "",
        skill: "apetito-de-riesgo"
    },
    {
        id: 10,
        text: "¿Cómo decides cuándo una decisión requiere consenso versus cuando debes tomarla unilateralmente?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "arquitectura-decisional"
    }
]
