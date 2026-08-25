import { Question } from "../../types";

export * from "./flexibilidad"
export * from "./cambio"
export * from "./estrategica"

// ADAPTABILIDAD - Flexibilidad y respuesta al cambio
export const adaptabilidad: Question[] = [
    {
        id: 1,
        text: "A mitad de proyecto cambian completamente los requisitos. Tu trabajo de 3 semanas es inútil. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "resistir", text: "Argumentar por los requisitos originales" },
            { id: "adaptar", text: "Comenzar de nuevo inmediatamente" },
            { id: "salvar", text: "Buscar qué se puede reutilizar" }
        ],
        correctAnswer: "",
        skill: "tolerancia-al-cambio"
    },
    {
        id: 2,
        text: "Describe una situación donde tuviste que abandonar una solución en la que habías invertido mucho. ¿Cómo lo decidiste?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "sunk-cost-awareness"
    },
    {
        id: 3,
        text: "Tu área se reorganiza y tu rol cambia drásticamente. No elegiste esto. ¿Cuál es tu actitud?",
        type: "multiple-choice",
        options: [
            { id: "resistencia", text: "Cumplir lo mínimo mientras busco salir" },
            { id: "aceptacion", text: "Aceptación y exploración del nuevo rol" },
            { id: "negociacion", text: "Negociar elementos del cambio" }
        ],
        correctAnswer: "",
        skill: "flexibilidad-estructural"
    },
    {
        id: 4,
        text: "¿Qué haces cuando tu método comprobado ya no funciona en un nuevo contexto?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "transferencia-adaptativa"
    },
    {
        id: 5,
        text: "En medio de una crisis, aparece información que invalida tu plan. Faltan 2 horas para ejecutar. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "continuar", text: "Continuar con el plan original" },
            { id: "improvisar", text: "Improvisar rápidamente un plan viable" },
            { id: "postponer", text: "Posponer y replanificar" }
        ],
        correctAnswer: "",
        skill: "adaptacion-bajo-presion"
    },
    {
        id: 6,
        text: "Explica cómo distingues entre 'adaptarte' y 'perder tu esencia' ante presiones externas.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "identidad-vs-flexibilidad"
    },
    {
        id: 7,
        text: "Tu equipo adopta una metodología que consideras inferior. ¿Cómo procedes?",
        type: "multiple-choice",
        options: [
            { id: "conformidad", text: "Adoptar sin cuestionar" },
            { id: "sabotaje", text: "Usar mi método en paralelo" },
            { id: "experimental", text: "Probar de buena fe y evaluar" }
        ],
        correctAnswer: "",
        skill: "apertura-experimental"
    },
    {
        id: 8,
        text: "¿Cuál es tu señal interna de que estás resistiendo un cambio necesario?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autoconciencia-adaptativa"
    },
    {
        id: 9,
        text: "Tres prioridades urgentes compiten simultáneamente. Solo puedes atender dos. ¿Cómo decides?",
        type: "multiple-choice",
        options: [
            { id: "impacto", text: "Por impacto esperado" },
            { id: "stakeholder", text: "Por quien las pide" },
            { id: "tiempo", text: "Por lo que se puede completar más rápido" }
        ],
        correctAnswer: "",
        skill: "repriorizacion-dinamica"
    },
    {
        id: 10,
        text: "Describe un momento donde cambiar de opinión públicamente fue lo correcto.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "consistencia-flexible"
    }
]
