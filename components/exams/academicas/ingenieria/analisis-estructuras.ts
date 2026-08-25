import { Question } from "../../types"

export const analisisEstructuras: Question[] = [
    {
        id: 1,
        text: "Diferencia intuitiva entre Esfuerzo (Stress) y Deformación (Strain).",
        options: [],
        correctAnswer: "Esfuerzo: Fuerza interna por área. Deformación: Cambio de forma/tamaño relativo.",
        type: "open-ended",
        skill: "mecanica-materiales"
    },
    {
        id: 2,
        text: "Una estructura es 'Hiperestática' cuando:",
        options: [
            { id: "A", text: "Se puede resolver solo con ecuaciones de equilibrio (suma F = 0)" },
            { id: "B", text: "Tiene más incógnitas/apoyos que ecuaciones de equilibrio disponibles" },
            { id: "C", text: "Es inestable y se cae" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "estatica"
    },
    {
        id: 3,
        text: "¿Qué representa el Momento Flector en una viga?",
        options: [],
        correctAnswer: "La tendencia interna a doblarse/flexionarse en un punto.",
        type: "open-ended",
        skill: "vigas"
    },
    {
        id: 4,
        text: "El hormigón (concreto) es excelente resistiendo compresión, pero pésimo en _____, por eso se le agrega acero.",
        options: [
            { id: "A", text: "Torsión" },
            { id: "B", text: "Tracción" },
            { id: "C", text: "Calor" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "propiedades-materiales"
    },
    {
        id: 5,
        text: "¿Qué es el Pandeo (Buckling) en una columna?",
        options: [],
        correctAnswer: "Inestabilidad súbita bajo carga axial donde la columna se dobla lateralmente antes de romperse.",
        type: "open-ended",
        skill: "estabilidad"
    },
    {
        id: 6,
        text: "En una armadura (truss), asumimos idealmente que las barras solo trabajan a:",
        options: [
            { id: "A", text: "Flexión y Corte" },
            { id: "B", text: "Tracción y Compresión (Fuerza Axial)" },
            { id: "C", text: "Torsión" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "armaduras"
    },
    {
        id: 7,
        text: "La Ley de Hooke (F = kx) es válida solo:",
        options: [
            { id: "A", text: "En el rango elástico del material" },
            { id: "B", text: "Hasta el punto de ruptura" },
            { id: "C", text: "Para materiales plásticos" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "elasticidad"
    },
    {
        id: 8,
        text: "¿Por qué los puentes suelen tener juntas de expansión?",
        options: [],
        correctAnswer: "Para permitir cambios de longitud por temperatura sin generar esfuerzos térmicos dañinos.",
        type: "open-ended",
        skill: "diseno-estructural"
    }
]
