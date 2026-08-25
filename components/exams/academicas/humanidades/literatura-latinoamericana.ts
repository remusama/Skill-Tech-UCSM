import { Question } from "../../types"

export const literaturaLatinoamericana: Question[] = [
    {
        id: 1,
        text: "¿Qué es el 'Realismo Mágico' y cómo se diferencia de la fantasía pura? Cite una obra clave.",
        options: [],
        correctAnswer: "Lo mágico se trata como cotidiano/real. Cien Años de Soledad. Diferente a fantasía donde la magia sorprende o es otro mundo.",
        type: "open-ended",
        skill: "teoria-literaria"
    },
    {
        id: 2,
        text: "En 'Crónica de una muerte anunciada', la fatalidad es inevitable. ¿Qué rol juega el honor en esta tragedia?",
        options: [],
        correctAnswer: "El honor obliga a los gemelos a matar, aunque no quieran. Es una fuerza social opresiva.",
        type: "open-ended",
        skill: "analisis-tematico"
    },
    {
        id: 3,
        text: "Jorge Luis Borges es conocido por explorar temas como:",
        options: [
            { id: "A", text: "El realismo social y la pobreza" },
            { id: "B", text: "El infinito, los laberintos y los espejos" },
            { id: "C", text: "El romance gótico" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "autores"
    },
    {
        id: 4,
        text: "El 'Boom Latinoamericano' (años 60-70) puso la literatura de la región en el mapa mundial. Mencione dos autores principales.",
        options: [],
        correctAnswer: "García Márquez, Cortázar, Vargas Llosa, Fuentes.",
        type: "open-ended",
        skill: "historia-literaria"
    },
    {
        id: 5,
        text: "La estructura de 'Rayuela' de Cortázar es innovadora porque:",
        options: [
            { id: "A", text: "Está escrita en verso" },
            { id: "B", text: "Se puede leer en diferentes órdenes (no lineal)" },
            { id: "C", text: "No tiene final" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "estructura-narrativa"
    },
    {
        id: 6,
        text: "En la poesía de Pablo Neruda, ¿cómo evoluciona su estilo desde 'Veinte poemas de amor...' hasta 'Canto General'?",
        options: [],
        correctAnswer: "De lo romántico/personal a lo político/social y épico americano.",
        type: "open-ended",
        skill: "evolucion-estilistica"
    },
    {
        id: 7,
        text: "¿Qué figura retórica se usa en: 'Sus cabellos son de oro'?",
        options: [
            { id: "A", text: "Hipérbole" },
            { id: "B", text: "Metáfora" },
            { id: "C", text: "Oxímoron" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "figuras-literarias"
    },
    {
        id: 8,
        text: "La literatura indigenista (ej: José María Arguedas) busca:",
        options: [
            { id: "A", text: "Entretener a las élites" },
            { id: "B", text: "Exponer la realidad, cultura y opresión del poblador andino" },
            { id: "C", text: "Imitar modelos europeos" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "corrientes-literarias"
    }
]
