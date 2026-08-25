import { Question } from "../../types";

export const autonomia_autogestion: Question[] = [
    {
        id: 1,
        text: "El profesor pide un proyecto de un tema que no enseñó y exige que lo investiguen. ¿Cuál es tu reacción ante esta falta de recursos?",
        type: "multiple-choice",
        options: [
            { id: "esperar", text: "Esperar a que el profesor se arrepienta y les dé el material" },
            { id: "quejarse", text: "Quejarte con los padres de familia sobre lo injusta que es la escuela" },
            { id: "autogestion", text: "Buscar tus propios recursos (videos en YouTube, foros, libros de la biblioteca) y ponerte a aprender por tu cuenta" },
            { id: "ignorar", text: "No hacer el proyecto y decir que era imposible" }
        ],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 2,
        text: "Aprendes a editar videos por tu cuenta. ¿Cómo evalúas si estás mejorando de verdad sin un profesor que te califique?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 3,
        text: "Llevas meses intentando aprender un truco por tu cuenta y te estancas. ¿Qué estrategia demuestra autonomía y madurez para lograrlo?",
        type: "multiple-choice",
        options: [
            { id: "abandonar", text: "Rendirte porque claramente no tienes talento para eso" },
            { id: "comunidad", text: "Entrar a foros o grupos, subir un video de cómo lo estás haciendo y pedirle consejos específicos a la comunidad" },
            { id: "pagar-todo", text: "Rogarle a tus padres que te compren la patineta más cara del mundo creyendo que eso lo solucionará" },
            { id: "re-leer", text: "Volver a ver el mismo tutorial básico del primer día" }
        ],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 4,
        text: "Relata una ocasión en la que investigaste por tu cuenta más allá de lo pedido en clase, solo por curiosidad sobre el tema.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 5,
        text: "Intentas reparar tu computadora y hallas un foro donde alguien preguntó por el mismo error raro, pero nadie respondió. ¿Qué haces?",
        type: "multiple-choice",
        options: [
            { id: "ignorar", text: "Rendirte y tirar la computadora a la basura" },
            { id: "esperar", text: "Dejar un comentario diciendo '¿Alguien lo solucionó?' y esperar meses a ver si responden" },
            { id: "investigar-aportar", text: "Investigar, probar varias cosas hasta arreglarlo por ti mismo, y luego volver a ese foro para escribir la respuesta y ayudar a otros en el futuro" },
            { id: "preguntar-lo-mismo", text: "Abrir un nuevo tema preguntando exactamente lo mismo para ver si tienes más suerte" }
        ],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 6,
        text: "Aprendiendo algo nuevo por tu cuenta, ¿cómo sabes si un tutorial de YouTube o artículo es realmente confiable?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 7,
        text: "Quieres aprender inglés en un año estudiando solo en casa. ¿Cómo diseñas una rutina diaria para practicar sin depender solo de tu fuerza de voluntad?",
        type: "multiple-choice",
        options: [
            { id: "sistema-robusto", text: "Configurando tu celular en inglés, agendando 20 minutos diarios innegociables para practicar y comprometiéndote a hablar con un amigo extranjero cada semana" },
            { id: "emocion", text: "Viendo videos motivacionales todas las mañanas para inspirarte a estudiar" },
            { id: "maratones", text: "Dejando todo para el final del año y estudiando 12 horas diarias el último mes" },
            { id: "nada", text: "Imprimiendo frases motivacionales para pegar en tu pared" }
        ],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 8,
        text: "Si diseñaras un campamento en casa para aprender a programar un juego, ¿qué 3 pasos medibles usarías para saber que tuviste éxito?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 9,
        text: "Das una tutoría sobre un tema que creías dominar, pero notas que solo sabes lo básico. ¿Cómo usas esto para obligarte a aprender de verdad?",
        type: "multiple-choice",
        options: [
            { id: "evitar", text: "Explicarles solo lo básico y prohibir que hagan preguntas difíciles" },
            { id: "crecer", text: "Usar la presión de la tutoría para obligarte a estudiar los casos más difíciles, e investigar junto con ellos si hacen una pregunta que no sabes" },
            { id: "cancelar", text: "Cancelar la tutoría admitiendo que eres un fraude" },
            { id: "inventar", text: "Inventar respuestas falsas muy seguro de ti mismo para que crean que eres un genio" }
        ],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    },
    {
        id: 10,
        text: "Justifica por qué aprender por tu cuenta requiere crear hábitos diarios estrictos en vez de solo esperar a 'tener ganas'.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "autogestion-aprendizaje"
    }
];
