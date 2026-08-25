import { Question } from "../../types"

export const farmacologiaBasica: Question[] = [
    {
        id: 1,
        text: "Diferencia entre Farmacocinética y Farmacodinamia.",
        options: [],
        correctAnswer: "Cinética: Lo que el cuerpo hace al fármaco (ADME). Dinamia: Lo que el fármaco hace al cuerpo (mecanismo).",
        type: "open-ended",
        skill: "conceptos-basicos"
    },
    {
        id: 2,
        text: "La 'Biodisponibilidad' de un fármaco intravenoso es del:",
        options: [
            { id: "A", text: "50%" },
            { id: "B", text: "100%" },
            { id: "C", text: "Variable" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "vias-administracion"
    },
    {
        id: 3,
        text: "¿Qué significa que un fármaco sea 'Agonista'?",
        options: [],
        correctAnswer: "Que se une a un receptor y lo activa, imitando la señal natural.",
        type: "open-ended",
        skill: "receptores"
    },
    {
        id: 4,
        text: "El metabolismo de 'Primer Paso' ocurre principalmente en:",
        options: [
            { id: "A", text: "El Riñón" },
            { id: "B", text: "El Hígado" },
            { id: "C", text: "El Estómago" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "metabolismo"
    },
    {
        id: 5,
        text: "Los antibióticos curan infecciones virales (como la gripe). ¿Verdadero o Falso? Explique.",
        options: [],
        correctAnswer: "Falso. Los antibióticos matan bacterias, no virus.",
        type: "open-ended",
        skill: "uso-racional"
    },
    {
        id: 6,
        text: "El Índice Terapéutico es la relación entre:",
        options: [
            { id: "A", text: "Dosis tóxica y Dosis efectiva" },
            { id: "B", text: "Precio y Calidad" },
            { id: "C", text: "Efecto Placebo y Real" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "seguridad"
    },
    {
        id: 7,
        text: "¿Qué es la 'Resistencia Antibiótica' y cómo se genera?",
        options: [],
        correctAnswer: "Bacterias mutan y sobreviven al fármaco, usualmente por uso indebido o incompleto del tratamiento.",
        type: "open-ended",
        skill: "salud-publica"
    },
    {
        id: 8,
        text: "Un fármaco AINE (como ibuprofeno) actúa inhibiendo:",
        options: [
            { id: "A", text: "La replicación de ADN" },
            { id: "B", text: "La enzima Ciclooxigenasa (inflamación)" },
            { id: "C", text: "Los receptores de insulina" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "mecanismo-accion"
    }
]
