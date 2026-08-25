import { Question } from "../../types";

export const aprendizaje_metacognicion: Question[] = [
    {
        id: 1,
        text: "Estudiaste química por 3 horas y te sientes confiado. Antes de dormir, ¿qué acción harías para comprobar si realmente aprendiste el tema?",
        type: "multiple-choice",
        options: [
            { id: "leer-de-nuevo", text: "Volver a leer tus apuntes de principio a fin para sentirte seguro" },
            { id: "construir", text: "Cerrar los libros e intentar resolver un problema en una hoja en blanco desde cero" },
            { id: "test-trivial", text: "Hacer un test básico en internet con opciones fáciles de adivinar" },
            { id: "dormir", text: "Ir a dormir directamente asumiendo que tu cerebro ya hizo el trabajo" }
        ],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 2,
        text: "Siempre olvidas meter una libreta a la mochila aunque te lo recuerden. ¿Cómo usarías la autoevaluación para arreglar esto hoy mismo?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 3,
        text: "Aprendes a tocar un instrumento y tras 2 semanas te frustras porque no avanzas. ¿Cuál es la mejor estrategia de autorregulación en este punto?",
        type: "multiple-choice",
        options: [
            { id: "rendirse", text: "Guardar el instrumento y asumir que no tienes talento musical" },
            { id: "mas-tiempo", text: "Obligarte a practicar el doble de horas al día aunque te duelan las manos" },
            { id: "diagnosticar", text: "Pausar, identificar qué acorde o postura específica te está bloqueando, y buscar un tutorial diferente o pedirle ayuda a alguien" },
            { id: "memorizar", text: "Tocar notas al azar rápido para que parezca que estás avanzando" }
        ],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 4,
        text: "El profesor pregunta si entendieron un tema difícil. Crees que sí, pero no estás seguro de poder hacerlo solo. ¿Cómo respondes demostrando madurez?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 5,
        text: "El experimento de ciencias de tu grupo falló gravemente. ¿Cómo usas tu madurez analítica para evitar que se culpen y se centren en aprender del error?",
        type: "multiple-choice",
        options: [
            { id: "justificar", text: "Hacer un discurso explicando por qué tus instrucciones sí eran correctas y alguien más las hizo mal" },
            { id: "proceso", text: "Analizar los pasos que siguieron para ver en qué momento falló la lógica de todo el equipo, sin atacar a nadie personalmente" },
            { id: "ignorar", text: "Solo limpiar el desastre rápido y no volver a hablar del tema" },
            { id: "culpar-sistema", text: "Echarle la culpa a que los materiales de la escuela eran baratos" }
        ],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 6,
        text: "Debes leer un libro larguísimo que evaluarán a fin de año. ¿Cómo organizas tu lectura para recordar la historia meses después?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 7,
        text: "Lees un capítulo de física y no entiendes nada de los conceptos. ¿Qué acción demuestra que sabes cómo regular tu propio aprendizaje?",
        type: "multiple-choice",
        options: [
            { id: "suponer", text: "Seguir leyendo las siguientes 20 páginas esperando que en algún momento tenga sentido" },
            { id: "detener-ajustar", text: "Detener la lectura, identificar qué palabras o fórmulas no entiendes, y buscar un video explicativo básico antes de seguir con el libro" },
            { id: "copiar-pegar", text: "Copiar las preguntas de tarea en una IA y entregar las respuestas sin leer nada" },
            { id: "quejarse", text: "Quejarte con tus padres diciendo que el profesor no sabe enseñar" }
        ],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 8,
        text: "Tras una mala calificación en un examen oral frente al salón, ¿cómo analizas en casa qué falló realmente sin buscar excusas?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 9,
        text: "Lees algo escolar y notas al final de la página que te distrajiste y no entendiste nada. ¿Cuál es la acción correcta para arreglar esto?",
        type: "multiple-choice",
        options: [
            { id: "re-leer", text: "Volver a la primera línea y leer otra vez forzándote a mirar las letras muy fuerte" },
            { id: "marcas", text: "Buscar exactamente en qué línea te diste cuenta de que perdiste atención, leer desde ahí y explicar en voz alta de qué trataba antes de seguir" },
            { id: "ignorar", text: "Pasar a la siguiente página asumiendo que lo que leíste no era importante" },
            { id: "subrayar", text: "Subrayar toda la página de amarillo para sentir que al menos hiciste algo útil" }
        ],
        correctAnswer: "",
        skill: "metacognicion"
    },
    {
        id: 10,
        text: "Explica cómo te das cuenta de que tu forma de estudiar de memoria ya no funciona al pasar a un año escolar más exigente.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "metacognicion"
    }
];
