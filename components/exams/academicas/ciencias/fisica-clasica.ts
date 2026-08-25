import { Question } from "../../types"

export const fisicaClasica: Question[] = [
    {
        id: 1,
        text: "Un bloque de 2 kg es empujado sobre una superficie sin fricción con fuerza constante de 10 N. Explique qué sucede con su velocidad y aceleración en el tiempo.",
        options: [],
        correctAnswer: "Aceleración constante de 5 m/s2, velocidad aumenta linealmente.",
        type: "open-ended",
        skill: "concepto-dinamica"
    },
    {
        id: 2,
        text: "En un choque elástico entre dos bolas de igual masa, una en reposo y otra en movimiento, ¿qué ocurre con sus velocidades? Explique el principio.",
        options: [],
        correctAnswer: "Intercambian velocidades. Conservación de momentum y energía cinética.",
        type: "open-ended",
        skill: "conservacion-energia"
    },
    {
        id: 3,
        text: "Un proyectil lanzado verticalmente alcanza su altura máxima. En ese punto exacto, ¿cuánto valen su velocidad y su aceleración?",
        options: [
            { id: "A", text: "V=0, a=0" },
            { id: "B", text: "V=0, a=9.8 m/s² hacia abajo" },
            { id: "C", text: "V=max, a=0" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "cinematica-lanzamiento"
    },
    {
        id: 4,
        text: "Si la Tierra perdiera repentinamente su gravedad, ¿qué trayectoria seguiría la Luna?",
        options: [
            { id: "A", text: "Caería hacia el Sol" },
            { id: "B", text: "Saldría disparada en línea recta tangente a su órbita" },
            { id: "C", text: "Se detendría en el espacio" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "leyes-newton-inercia"
    },
    {
        id: 5,
        text: "Diseñe un experimento simple para calcular el coeficiente de fricción entre un libro y una mesa usando solo una regla.",
        options: [],
        correctAnswer: "Inclinar mesa hasta que deslice, medir ángulo.",
        type: "open-ended",
        skill: "diseno-experimental"
    },
    {
        id: 6,
        text: "Un patinador gira y cierra sus brazos, aumentando su velocidad de giro. Esto se debe a la conservación de:",
        options: [
            { id: "A", text: "Energía Cinética" },
            { id: "B", text: "Momentum Angular" },
            { id: "C", text: "Momentum Lineal" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "momentum-angular"
    },
    {
        id: 7,
        text: "Diferencia fundamental entre Peso y Masa.",
        options: [],
        correctAnswer: "Masa es cantidad de materia (invariable), Peso es fuerza gravitatoria (variable).",
        type: "open-ended",
        skill: "conceptos-basicos"
    },
    {
        id: 8,
        text: "Si un objeto se mueve a velocidad constante en línea recta, la fuerza neta sobre él es:",
        options: [
            { id: "A", text: "Constante y positiva" },
            { id: "B", text: "Cero" },
            { id: "C", text: "Depende de la masa" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "primera-ley-newton"
    }
]
