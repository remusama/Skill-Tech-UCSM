import { Question } from "../../types"

export const estadistica: Question[] = [
    {
        id: 1,
        text: "Mencione una situación real donde el promedio (media) sea engañoso y sea mejor usar la mediana.",
        options: [],
        correctAnswer: "Salarios (desigualdad), Precios de casas (valores extremos distorsionan la media).",
        type: "open-ended",
        skill: "interpretacion-datos"
    },
    {
        id: 2,
        text: "Si dos eventos son independientes, la probabilidad de que ocurran ambos (A y B) es:",
        options: [
            { id: "A", text: "P(A) + P(B)" },
            { id: "B", text: "P(A) * P(B)" },
            { id: "C", text: "P(A) / P(B)" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "probabilidad-basica"
    },
    {
        id: 3,
        text: "¿Qué indica una Desviación Estándar alta en un conjunto de datos?",
        options: [],
        correctAnswer: "Los datos están muy dispersos respecto a la media.",
        type: "open-ended",
        skill: "dispersion"
    },
    {
        id: 4,
        text: "Explique la diferencia entre Correlación y Causalidad con un ejemplo.",
        options: [],
        correctAnswer: "Correlación: dos variables se mueven juntas. Causalidad: una provoca la otra. Ej: Helados y robos (correlacionan por calor, no causalidad).",
        type: "open-ended",
        skill: "pensamiento-critico"
    },
    {
        id: 5,
        text: "La distribución Normal (Campana de Gauss) es simétrica respecto a:",
        options: [
            { id: "A", text: "El eje Y" },
            { id: "B", text: "La media" },
            { id: "C", text: "La varianza" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "distribuciones"
    },
    {
        id: 6,
        text: "Si lanzas una moneda 10 veces y salen 10 caras, ¿cuál es la probabilidad de que la próxima sea cara?",
        options: [
            { id: "A", text: "Menor al 50% (ley de promedios)" },
            { id: "B", text: "50% (eventos independientes)" },
            { id: "C", text: "Mayor al 50% (racha)" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "falacia-jugador"
    },
    {
        id: 7,
        text: "¿Qué es un 'Falso Positivo' en una prueba médica?",
        options: [],
        correctAnswer: "El test dice que tienes la enfermedad, pero estás sano.",
        type: "open-ended",
        skill: "interpretacion-errores"
    },
    {
        id: 8,
        text: "El Teorema del Límite Central establece que la distribución de las medias muestrales tiende a ser normal si...",
        options: [
            { id: "A", text: "La muestra es suficientemente grande" },
            { id: "B", text: "La población es normal" },
            { id: "C", text: "Siempre es normal" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "teoremas-fundamentales"
    }
]
