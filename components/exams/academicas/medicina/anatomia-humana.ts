import { Question } from "../../types"

export const anatomiaHumana: Question[] = [
    {
        id: 1,
        text: "Si un paciente sufre daño en el lóbulo frontal del cerebro, ¿qué funciones se verían principalmente afectadas?",
        options: [],
        correctAnswer: "Toma de decisiones, control de impulsos, personalidad, planificación.",
        type: "open-ended",
        skill: "neuroanatomia-funcional"
    },
    {
        id: 2,
        text: "Mencione las tres partes principales del intestino delgado en orden.",
        options: [
            { id: "A", text: "Duodeno, Yeyuno, Íleon" },
            { id: "B", text: "Ciego, Colon, Recto" },
            { id: "C", text: "Yeyuno, Íleon, Duodeno" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "anatomia-digestiva"
    },
    {
        id: 3,
        text: "El corazón bombea sangre oxigenada al cuerpo a través de:",
        options: [
            { id: "A", text: "La arteria pulmonar" },
            { id: "B", text: "La vena cava" },
            { id: "C", text: "La arteria aorta" },
        ],
        correctAnswer: "C",
        type: "multiple-choice",
        skill: "sistema-circulatorio"
    },
    {
        id: 4,
        text: "¿Cuál es la función del diafragma en la respiración?",
        options: [],
        correctAnswer: "Se contrae y baja para aumentar el volumen torácico, permitiendo la entrada de aire (presión negativa).",
        type: "open-ended",
        skill: "mecanica-respiratoria"
    },
    {
        id: 5,
        text: "El hueso más largo y fuerte del cuerpo es:",
        options: [
            { id: "A", text: "Húmero" },
            { id: "B", text: "Fémur" },
            { id: "C", text: "Tibia" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "osteologia"
    },
    {
        id: 6,
        text: "Diferencia entre Ligamento y Tendón.",
        options: [],
        correctAnswer: "Ligamento: une hueso con hueso. Tendón: une músculo con hueso.",
        type: "open-ended",
        skill: "tejidos-conectivos"
    },
    {
        id: 7,
        text: "El hígado produce Bilis, la cual sirve para:",
        options: [
            { id: "A", text: "Digerir proteínas" },
            { id: "B", text: "Emulsionar grasas" },
            { id: "C", text: "Regular el azúcar" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "fisiologia-digestiva"
    },
    {
        id: 8,
        text: "¿Por qué el ventrículo izquierdo del corazón tiene una pared muscular más gruesa que el derecho?",
        options: [],
        correctAnswer: "Porque debe bombear sangre a todo el cuerpo (alta presión), mientras el derecho solo a los pulmones (baja presión).",
        type: "open-ended",
        skill: "cardiovascular"
    }
]
