import { Question } from "../../types"

export const biologiaCelular: Question[] = [
    {
        id: 1,
        text: "Si las mitocondrias de una célula dejaran de funcionar, ¿qué proceso vital se detendría inmediatamente?",
        options: [
            { id: "A", text: "La síntesis de proteínas" },
            { id: "B", text: "La producción de ATP (Respiración Celular)" },
            { id: "C", text: "La división celular" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "organelos-funcion"
    },
    {
        id: 2,
        text: "Explique la diferencia entre Mitosis y Meiosis en términos de resultado genético.",
        options: [],
        correctAnswer: "Mitosis: clones idénticos. Meiosis: variabilidad genética y reducción cromosómica.",
        type: "open-ended",
        skill: "ciclo-celular"
    },
    {
        id: 3,
        text: "El dogma central de la biología molecular establece el flujo de información: ADN -> ... -> ...",
        options: [
            { id: "A", text: "ARN -> Proteína" },
            { id: "B", text: "Proteína -> ARN" },
            { id: "C", text: "Lípido -> Carbohidrato" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "genetica-molecular"
    },
    {
        id: 4,
        text: "¿Por qué las membranas celulares son 'semipermeables'? ¿Qué ventaja da esto?",
        options: [],
        correctAnswer: "Controla qué entra/sale, mantiene homeostasis.",
        type: "open-ended",
        skill: "membrana-transporte"
    },
    {
        id: 5,
        text: "En la fotosíntesis, la planta toma CO2 y agua para producir:",
        options: [
            { id: "A", text: "Energía y Oxígeno" },
            { id: "B", text: "Glucosa y Oxígeno" },
            { id: "C", text: "Proteínas y CO2" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "metabolismo"
    },
    {
        id: 6,
        text: "¿Qué es una célula madre y por qué es importante en medicina regenerativa?",
        options: [],
        correctAnswer: "Célula no diferenciada capaz de convertirse en otros tipos.",
        type: "open-ended",
        skill: "biotecnologia"
    },
    {
        id: 7,
        text: "La apoptosis es la 'muerte celular programada'. ¿Por qué un organismo querría matar sus propias células?",
        options: [],
        correctAnswer: "Eliminar células dañadas, evitar cáncer, desarrollo embrionario.",
        type: "open-ended",
        skill: "regulacion-celular"
    },
    {
        id: 8,
        text: "Diferencia principal entre célula Procariota y Eucariota.",
        options: [
            { id: "A", text: "La procariota no tiene núcleo definido" },
            { id: "B", text: "La eucariota es más pequeña" },
            { id: "C", text: "La procariota tiene mitocondrias" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "taxonomia-celular"
    }
]
