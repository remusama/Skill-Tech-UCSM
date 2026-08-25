import { Question } from "../../types"

export const fisiologiaMedica: Question[] = [
    {
        id: 1,
        text: "Defina 'Homeostasis' con un ejemplo fisiológico.",
        options: [],
        correctAnswer: "Mantenimiento del equilibrio interno. Ej: Sudar para bajar la temperatura corporal.",
        type: "open-ended",
        skill: "homeostasis"
    },
    {
        id: 2,
        text: "Un potencial de acción neuronal sigue la ley del 'todo o nada'. ¿Qué significa?",
        options: [
            { id: "A", text: "Que la neurona siempre dispara al máximo o no dispara" },
            { id: "B", text: "Que se puede disparar a medias" },
            { id: "C", text: "Que depende de la voluntad" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "neurofisiologia"
    },
    {
        id: 3,
        text: "¿Qué hace la Insulina cuando sube el nivel de azúcar en sangre?",
        options: [],
        correctAnswer: "Facilita la entrada de glucosa a las células y su almacenamiento como glucógeno, bajando la glucemia.",
        type: "open-ended",
        skill: "endocrino"
    },
    {
        id: 4,
        text: "El intercambio de gases (O2 y CO2) en los pulmones ocurre por:",
        options: [
            { id: "A", text: "Difusión simple (diferencia de presión)" },
            { id: "B", text: "Transporte activo (gasto de ATP)" },
            { id: "C", text: "Osmosis" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "respiratorio"
    },
    {
        id: 5,
        text: "Si los riñones fallan, ¿qué sustancias tóxicas se acumulan en la sangre?",
        options: [
            { id: "A", text: "Glucosa y Lípidos" },
            { id: "B", text: "Urea y Creatinina" },
            { id: "C", text: "Oxígeno" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "renal"
    },
    {
        id: 6,
        text: "Mecanismo de 'Feedback Negativo' en la regulación hormonal.",
        options: [],
        correctAnswer: "El producto final de un proceso inhibe su propia producción para mantener estabilidad (Ej: T3/T4 inhiben TSH).",
        type: "open-ended",
        skill: "sistemas-control"
    },
    {
        id: 7,
        text: "En una situación de peligro ('lucha o huida'), el sistema Simpático provoca:",
        options: [
            { id: "A", text: "Miosis y bradicardia" },
            { id: "B", text: "Midriasis, taquicardia y broncodilatación" },
            { id: "C", text: "Sueño y digestión" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "sistema-nervioso-autonomo"
    },
    {
        id: 8,
        text: "¿Por qué el tipo de sangre O- es donante universal?",
        options: [],
        correctAnswer: "Porque sus glóbulos rojos no tienen antígenos A, B ni Rh, por lo que no provocan rechazo inmunológico.",
        type: "open-ended",
        skill: "inmunologia"
    }
]
