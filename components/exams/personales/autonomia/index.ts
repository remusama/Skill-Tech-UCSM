import { Question } from "../../types";

export * from "./autogestion"
export * from "./iniciativa"
export * from "./autodireccion"

// AUTONOMÍA - Capacidad de operación independiente
export const autonomia: Question[] = [
    {
        id: 1,
        text: "Tu líder está inaccesible por 3 días y surge una decisión importante. No hay procedimiento establecido. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "esperar", text: "Esperar su regreso" },
            { id: "decidir", text: "Decidir y documentar razonamiento" },
            { id: "consultar", text: "Buscar consenso con pares" }
        ],
        correctAnswer: "",
        skill: "iniciativa-decisional"
    },
    {
        id: 2,
        text: "¿Cómo sabes cuándo puedes decidir por tu cuenta versus cuándo necesitas aprobación?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "calibracion-de-autoridad"
    },
    {
        id: 3,
        text: "Detectas un problema que nadie ha mencionado y no está en tu área. ¿Actúas?",
        type: "multiple-choice",
        options: [
            { id: "ignorar", text: "No es mi responsabilidad" },
            { id: "alertar", text: "Alertar al área correspondiente" },
            { id: "resolver", text: "Resolverlo directamente" }
        ],
        correctAnswer: "",
        skill: "ownership-expandido"
    },
    {
        id: 4,
        text: "Describe una ocasión donde resolviste algo significativo sin que nadie te lo pidiera.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "proactividad-estrategica"
    },
    {
        id: 5,
        text: "Tienes una instrucción clara pero crees que hay un mejor camino. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "seguir", text: "Seguir la instrucción exacta" },
            { id: "mejorar", text: "Implementar mi mejora y notificar después" },
            { id: "proponer", text: "Proponer alternativa y esperar feedback" }
        ],
        correctAnswer: "",
        skill: "balance-obediencia-criterio"
    },
    {
        id: 6,
        text: "¿Qué información necesitas antes de sentirte cómodo tomando una decisión autónoma?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "suficiencia-informativa"
    },
    {
        id: 7,
        text: "Un proyecto no tiene dueño claro y está fallando. ¿Cuál es tu rol?",
        type: "multiple-choice",
        options: [
            { id: "observar", text: "Observar hasta que alguien lo tome" },
            { id: "tomar", text: "Tomar ownership inmediatamente" },
            { id: "organizar", text: "Convocar para asignar responsable" }
        ],
        correctAnswer: "",
        skill: "liderazgo-situacional"
    },
    {
        id: 8,
        text: "Explica cómo diferencias entre 'trabajar independientemente' y 'desconectarte del equipo'.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autonomia-colaborativa"
    },
    {
        id: 9,
        text: "Tienes recursos sin usar y detectas una oportunidad no planificada. ¿Los cambiarias? (La oportunidad puede fallar y dejarte sin recursos.)",
        type: "multiple-choice",
        options: [
            { id: "plan", text: "No, seguir el plan original" },
            { id: "reasignar", text: "Sí, capitalizar la oportunidad" },
            { id: "consultar", text: "Proponer cambio al plan" }
        ],
        correctAnswer: "",
        skill: "agilidad-de-recursos"
    },
    {
        id: 10,
        text: "¿Cómo manejas situaciones donde nadie te supervisa ni da feedback por semanas?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogobierno"
    }
]
