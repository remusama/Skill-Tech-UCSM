import { Question } from "../../types"

export const filosofiaModerna: Question[] = [
    {
        id: 1,
        text: "Interprete la frase de Descartes: 'Pienso, luego existo'. ¿Qué duda trata de resolver?",
        options: [],
        correctAnswer: "La duda sobre la realidad. La única certeza es la propia psique dudando/pensando.",
        type: "open-ended",
        skill: "epistemologia"
    },
    {
        id: 2,
        text: "El Nihilismo de Nietzsche sostiene que:",
        options: [
            { id: "A", text: "La vida tiene un sentido divino oculto" },
            { id: "B", text: "Los valores tradicionales han perdido su validez ('Dios ha muerto')" },
            { id: "C", text: "La ciencia resolverá todos los problemas morales" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "filosofia-existencial"
    },
    {
        id: 3,
        text: "Kant propuso que no vemos el mundo como es (noúmeno), sino como...:",
        options: [
            { id: "A", text: "Dios quiere que lo veamos" },
            { id: "B", text: "Nuestras estructuras mentales (espacio/tiempo) nos permiten verlo (fenómeno)" },
            { id: "C", text: "Una ilusión total" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "idealismo-trascendental"
    },
    {
        id: 4,
        text: "Explique el 'Imperativo Categórico' moral.",
        options: [],
        correctAnswer: "Actúa solo según aquella máxima que puedas querer que se convierta en ley universal.",
        type: "open-ended",
        skill: "etica"
    },
    {
        id: 5,
        text: "¿Cuál es la diferencia entre Racionalismo (Descartes) y Empirismo (Hume)?",
        options: [],
        correctAnswer: "Racionalismo: conocimiento viene de la razón/ideas innatas. Empirismo: viene de la experiencia sensorial.",
        type: "open-ended",
        skill: "historia-filosofia"
    },
    {
        id: 6,
        text: "Para Marx, el motor de la historia es:",
        options: [
            { id: "A", text: "El desarrollo de las ideas" },
            { id: "B", text: "La lucha de clases (materialismo histórico)" },
            { id: "C", text: "La voluntad de poder" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "filosofia-politica"
    },
    {
        id: 7,
        text: "Jean-Paul Sartre dijo 'Estamos condenados a ser libres'. ¿Qué implicación tiene esto para la responsabilidad personal?",
        options: [],
        correctAnswer: "Responsabilidad total. No hay excusas (determinismo o dios) para nuestros actos.",
        type: "open-ended",
        skill: "existencialismo"
    },
    {
        id: 8,
        text: "¿Qué es una falacia 'Ad Hominem'?",
        options: [],
        correctAnswer: "Atacar a la persona que argumenta en lugar de refutar el argumento.",
        type: "open-ended",
        skill: "logica"
    }
]
