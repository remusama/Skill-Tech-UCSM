import { Question } from "../../types";

export * from "./metacognicion"
export * from "./estrategia"
export * from "./transferencia"

// APRENDIZAJE - Velocidad y profundidad de asimilación
export const aprendizaje: Question[] = [
    {
        id: 1,
        text: "Te asignan un proyecto con tecnología que desconoces totalmente. Entregas en 2 semanas. ¿Cómo aprendes?",
        type: "multiple-choice",
        options: [
            { id: "fundamentos", text: "Estudiar fundamentos teóricos primero" },
            { id: "practica", text: "Comenzar a construir inmediatamente" },
            { id: "hibrido", text: "Alternar teoría y práctica en ciclos cortos" }
        ],
        correctAnswer: "",
        skill: "estrategia-de-aprendizaje"
    },
    {
        id: 2,
        text: "Describe el último concepto complejo que aprendiste. ¿Cuál fue el momento 'click' que lo hizo comprensible?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 3,
        text: "Un experto te explica algo que no entiendes. Después de su tercera explicación sigues confundido. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "fingir", text: "Fingir que entendí" },
            { id: "preguntar", text: "Preguntar de forma diferente" },
            { id: "investigar", text: "Investigar por mi cuenta después" }
        ],
        correctAnswer: "",
        skill: "honestidad-intelectual"
    },
    {
        id: 4,
        text: "¿Cómo identificas si realmente comprendiste algo versus si solo memorizaste el patrón?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "profundidad-de-comprension"
    },
    {
        id: 5,
        text: "Cometes un error grave por un vacío de conocimiento. ¿Cuál es tu primera acción?",
        type: "multiple-choice",
        options: [
            { id: "corregir", text: "Corregir el error rápidamente" },
            { id: "estudiar", text: "Estudiar para entender la raíz" },
            { id: "ambos", text: "Corregir y luego estudiar a fondo" }
        ],
        correctAnswer: "",
        skill: "aprendizaje-desde-error"
    },
    {
        id: 6,
        text: "Explica cómo aprenderías un sistema complejo que tiene documentación obsoleta y código heredado.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "aprendizaje-inverso"
    },
    {
        id: 7,
        text: "Tienes 5 horas para aprender lo suficiente sobre un tema y dar una presentación. ¿Cómo organizas el tiempo?",
        type: "multiple-choice",
        options: [
            { id: "lineal", text: "1h investigar, 2h profundizar, 2h preparar" },
            { id: "practicar", text: "3h investigar, 2h practicar presentación" },
            { id: "iterativo", text: "Ciclos de 30min: investigar-practicar-ajustar" }
        ],
        correctAnswer: "",
        skill: "aprendizaje-bajo-restriccion"
    },
    {
        id: 8,
        text: "¿Cuál es tu señal personal de que necesitas desaprender algo que creías correcto?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "desaprendizaje"
    },
    {
        id: 9,
        text: "Alguien junior te pregunta sobre algo que no dominas. ¿Cómo respondes?",
        type: "multiple-choice",
        options: [
            { id: "admitir", text: "Admitir ignorancia y buscar juntos" },
            { id: "generalizar", text: "Dar respuesta general no específica" },
            { id: "redirigir", text: "Redirigir a quien sí sabe" }
        ],
        correctAnswer: "",
        skill: "humildad-epistémica"
    },
    {
        id: 10,
        text: "Describe tu proceso para conectar conocimiento nuevo con lo que ya sabías.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "integracion-cognitiva"
    }
]
