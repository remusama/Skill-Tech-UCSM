import { Question } from "../../types"

export const quimicaOrganica: Question[] = [
    {
        id: 1,
        text: "¿Por qué el carbono es el elemento base de la vida y la química orgánica?",
        options: [],
        correctAnswer: "Tetravalencia, capacidad de formar cadenas largas y estables.",
        type: "open-ended",
        skill: "fundamentos-quimica"
    },
    {
        id: 2,
        text: "Diferencia estructural y de reactividad entre un Alcano y un Alqueno.",
        options: [],
        correctAnswer: "Alcano: enlaces simples (saturado). Alqueno: enlace doble (insaturado, más reactivo).",
        type: "open-ended",
        skill: "grupos-funcionales"
    },
    {
        id: 3,
        text: "Identifique el grupo funcional en: CH3-COOH",
        options: [
            { id: "A", text: "Aldehído" },
            { id: "B", text: "Ácido Carboxílico" },
            { id: "C", text: "Cetona" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "identificacion-grupos"
    },
    {
        id: 4,
        text: "La isometría óptica se da cuando un carbono es 'quiral'. ¿Qué significa esto?",
        options: [
            { id: "A", text: "Que tiene doble enlace" },
            { id: "B", text: "Que está unido a 4 grupos diferentes" },
            { id: "C", text: "Que forma un anillo" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "estereoquimica"
    },
    {
        id: 5,
        text: "Explique brevemente el mecanismo de una saponificación (hacer jabón).",
        options: [],
        correctAnswer: "Hidrólisis de un éster (grasa) en medio básico.",
        type: "open-ended",
        skill: "mecanismos-reaccion"
    },
    {
        id: 6,
        text: "El benceno es muy estable debido a:",
        options: [
            { id: "A", text: "Sus enlaces triples" },
            { id: "B", text: "La resonancia de sus electrones pi" },
            { id: "C", text: "Su alta electronegatividad" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "aromaticidad"
    },
    {
        id: 7,
        text: "Si oxidas un alcohol primario suavemente obtienes un aldehído; si lo oxidas fuerte obtienes...",
        options: [
            { id: "A", text: "Una cetona" },
            { id: "B", text: "Un ácido carboxílico" },
            { id: "C", text: "Un éter" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "reacciones-redox"
    },
    {
        id: 8,
        text: "¿Cuál es la función principal de los carbohidratos en los seres vivos?",
        options: [],
        correctAnswer: "Fuente de energía inmediata y estructura.",
        type: "open-ended",
        skill: "biomoleculas"
    },
    {
        id: 9,
        text: "Proponga una síntesis simple para obtener etanol a partir de glucosa.",
        options: [],
        correctAnswer: "Fermentación.",
        type: "open-ended",
        skill: "procesos-industriales"
    }
]
