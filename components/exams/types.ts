export type Option = {
    id: string
    text: string
    image?: string // Opcional, para preguntas con imágenes
}

export type Question = {
    id: number
    text: string
    options: Option[]
    correctAnswer: string // En preguntas abiertas, esto puede ser vacío o una guía para la IA
    skill?: string // Habilidad que evalúa la pregunta (ej: "razonamiento-logico", "memoria-corto-plazo")
    type?: "multiple-choice" | "image-matrix" | "input-text" | "yes-no" | "open-ended" // Añadido open-ended
    stimulus?: string | string[] // Para mostrar estímulos (imágenes, secuencias)
    formula?: string // Para mostrar fórmulas LaTeX
}

export type ExamData = {
    area: string
    subtopic: string
    questions: Question[]
}
