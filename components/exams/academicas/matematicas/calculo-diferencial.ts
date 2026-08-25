import { Question } from "../../types"

export const calculoDiferencial: Question[] = [
    {
        id: 1,
        text: "Explique intuitivamente qué representa la Derivada de una función en un punto.",
        options: [],
        correctAnswer: "La pendiente de la recta tangente, o la tasa de cambio instantánea.",
        type: "open-ended",
        skill: "concepto-derivada"
    },
    {
        id: 2,
        text: "Si la derivada de la posición es la velocidad, ¿qué es la derivada de la velocidad?",
        options: [
            { id: "A", text: "Desplazamiento" },
            { id: "B", text: "Aceleración" },
            { id: "C", text: "Jerk" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "aplicacion-fisica"
    },
    {
        id: 3,
        text: "Calcule el límite: lim(x->infinity) de (3x^2 + 1) / (2x^2 - x)",
        options: [
            { id: "A", text: "0" },
            { id: "B", text: "3/2" },
            { id: "C", text: "Infinito" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "limites"
    },
    {
        id: 4,
        text: "¿Para qué sirve encontrar los puntos donde la primera derivada es cero?",
        options: [],
        correctAnswer: "Para hallar máximos y mínimos (puntos críticos).",
        type: "open-ended",
        skill: "optimizacion"
    },
    {
        id: 5,
        text: "La regla de la cadena se usa para derivar funciones...",
        options: [
            { id: "A", text: "Polinómicas simples" },
            { id: "B", text: "Compuestas (f(g(x)))" },
            { id: "C", text: "Trigonométricas solamente" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "tecnica-derivacion"
    },
    {
        id: 6,
        text: "Si una función es continua en todo su dominio, ¿es necesariamente derivable en todo su dominio? Dé un contraejemplo si no.",
        options: [],
        correctAnswer: "No. Ejemplo: |x| en x=0 (es pico).",
        type: "open-ended",
        skill: "teoria-continuidad"
    },
    {
        id: 7,
        text: "Derivada de f(x) = ln(x^2 + 1)",
        options: [
            { id: "A", text: "1 / (x^2 + 1)" },
            { id: "B", text: "2x / (x^2 + 1)" },
            { id: "C", text: "2x" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "calculo-operativo"
    },
    {
        id: 8,
        text: "En un problema de optimización (ej: maximizar área de un corral), ¿cuál es el primer paso lógico antes de derivar?",
        options: [],
        correctAnswer: "Plantear la ecuación objetivo y las restricciones.",
        type: "open-ended",
        skill: "modelado-matematico"
    }
]
