import { Question } from "../../types"

export const algebraLineal: Question[] = [
    {
        id: 1,
        text: "¿Qué significa geométricamente que el determinante de una matriz 3x3 sea cero?",
        options: [],
        correctAnswer: "Que el volumen formado por los vectores es cero (son coplanares/dependientes).",
        type: "open-ended",
        skill: "interpretacion-geometrica"
    },
    {
        id: 2,
        text: "Dos vectores son linealmente dependientes si:",
        options: [
            { id: "A", text: "Su producto punto es cero" },
            { id: "B", text: "Uno es múltiplo escalar del otro" },
            { id: "C", text: "Tienen longitudes diferentes" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "dependencia-lineal"
    },
    {
        id: 3,
        text: "Explique qué es un 'Autovalor' (Eigenvalue) y un 'Autovector'.",
        options: [],
        correctAnswer: "Un vector que no cambia de dirección al aplicarle la transformación, solo se escala por el autovalor.",
        type: "open-ended",
        skill: "eigen-theory"
    },
    {
        id: 4,
        text: "Si tenemos un sistema de ecuaciones Ax=b donde A es cuadrada e invertible, la solución es:",
        options: [
            { id: "A", text: "Única" },
            { id: "B", text: "Infinita" },
            { id: "C", text: "No existe" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "sistemas-lineales"
    },
    {
        id: 5,
        text: "El método de Gram-Schmidt sirve para:",
        options: [
            { id: "A", text: "Calcular el determinante" },
            { id: "B", text: "Ortogonalizar una base" },
            { id: "C", text: "Invertir una matriz" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "algoritmos-matriciales"
    },
    {
        id: 6,
        text: "¿Por qué no se puede multiplicar una matriz 2x3 por una 2x3?",
        options: [],
        correctAnswer: "Las columnas de la primera deben coincidir con las filas de la segunda.",
        type: "open-ended",
        skill: "operaciones-matriciales"
    },
    {
        id: 7,
        text: "La Matriz Identidad actúa en la multiplicación de matrices como el número ___ en los reales.",
        options: [
            { id: "A", text: "0" },
            { id: "B", text: "1" },
            { id: "C", text: "-1" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "propiedades-algebraicas"
    },
    {
        id: 8,
        text: "Mencione una aplicación real del Álgebra Lineal (ej: en computación, física, economía).",
        options: [],
        correctAnswer: "Gráficos 3D, Google PageRank, Mecánica Cuántica, ML.",
        type: "open-ended",
        skill: "aplicacion-contextual"
    }
]
