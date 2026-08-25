import { Question } from "../../types"

export const circuitosElectricos: Question[] = [
    {
        id: 1,
        text: "Ley de Ohm: Si mantienes el voltaje constante y duplicas la resistencia, ¿qué pasa con la corriente?",
        options: [
            { id: "A", text: "Se duplica" },
            { id: "B", text: "Se reduce a la mitad" },
            { id: "C", text: "Se mantiene igual" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "ley-ohm"
    },
    {
        id: 2,
        text: "Explique la diferencia entre Corriente Directa (DC) y Alterna (AC).",
        options: [],
        correctAnswer: "DC: flujo en un solo sentido. AC: flujo oscila/cambia de sentido periódicamente.",
        type: "open-ended",
        skill: "tipos-corriente"
    },
    {
        id: 3,
        text: "Un capacitor sirve principalmente para:",
        options: [
            { id: "A", text: "Disipar calor" },
            { id: "B", text: "Almacenar energía en campo eléctrico / Bloquear DC" },
            { id: "C", text: "Amplificar señal" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "componentes-pasivos"
    },
    {
        id: 4,
        text: "¿Qué función cumple un Diodo en un circuito rectificador?",
        options: [],
        correctAnswer: "Permitir paso de corriente en un solo sentido, convirtiendo AC en pulsos DC.",
        type: "open-ended",
        skill: "semiconductores"
    },
    {
        id: 5,
        text: "Leyes de Kirchhoff: La suma de corrientes que entran a un nodo es igual a...",
        options: [
            { id: "A", text: "Cero" },
            { id: "B", text: "La suma de las que salen" },
            { id: "C", text: "El voltaje total" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "analisis-nodos"
    },
    {
        id: 6,
        text: "¿Por qué la transmisión de energía a largas distancias se hace en Alto Voltaje?",
        options: [],
        correctAnswer: "Para reducir la corriente y así minimizar las pérdidas por calor (efecto Joule, I^2*R).",
        type: "open-ended",
        skill: "potencia-eficiencia"
    },
    {
        id: 7,
        text: "En un circuito RLC, ¿qué es la 'Resonancia'?",
        options: [],
        correctAnswer: "Cuando las reactancias inductiva y capacitiva se anulan, maximizando la corriente a cierta frecuencia.",
        type: "open-ended",
        skill: "circuitos-ac"
    },
    {
        id: 8,
        text: "Un transistor funciona básicamente como:",
        options: [
            { id: "A", text: "Una batería infinita" },
            { id: "B", text: "Un interruptor o amplificador controlado por corriente/voltaje" },
            { id: "C", text: "Una resistencia variable manual" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "electronica-activa"
    }
]
