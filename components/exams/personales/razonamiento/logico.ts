import { Question } from "../../types";

export const razonamiento_logico: Question[] = [
    {
        id: 1,
        text: "Un compañero afirma: 'Si llueve, las calles se mojan. Las calles están mojadas, luego llovió'. Evaluando su lógica, ¿qué respondes?",
        type: "multiple-choice",
        options: [
            { id: "aprobar", text: "Darle la razón, su lógica es impecable" },
            { id: "rechazar-falacia", text: "Explicarle que es una falacia, porque alguien pudo haber lavado la calle con una manguera (hay otras causas posibles)" },
            { id: "dudar", text: "Pedirle que mire el pronóstico del clima de ayer" },
            { id: "aceptar-condicional", text: "Aceptar solo si él estaba afuera cuando pasó" }
        ],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 2,
        text: "Alguien argumenta: 'Los equipos ganadores son altos. Nuestro equipo es altísimo, tenemos el campeonato garantizado'. Identifica el fallo lógico.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 3,
        text: "Regla: 'si repruebas, el profesor llama a tus padres'. A los padres de Juan NO los llamaron. ¿Qué deduces con lógica pura?",
        type: "multiple-choice",
        options: [
            { id: "servidor-ok", text: "Que Juan NO reprobó matemáticas" },
            { id: "servidor-fallo", text: "Que Juan reprobó pero el profesor se olvidó de llamar" },
            { id: "bd-error", text: "Que el teléfono de los padres no servía" },
            { id: "inconcluso", text: "Que no se puede saber nada de su calificación sin más datos" }
        ],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 4,
        text: "Alguien dice: 'Quienes reprobaron no tomaron esta bebida'. Usando lógica estricta, ¿por qué esto no garantiza que tomarla te hará aprobar?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 5,
        text: "Argumento: 'Si estudiamos 5 horas, sacaremos un 10. No sacamos un 10'. ¿Cuál es la única conclusión válida aplicando lógica pura?",
        type: "multiple-choice",
        options: [
            { id: "presupuesto-no-subio", text: "Que entonces no estudiaron 5 horas" },
            { id: "marketing-inutil", text: "Que estudiar no sirve para nada" },
            { id: "datos-mal", text: "Que el profesor calificó mal el examen" },
            { id: "necesitamos-mas", text: "Que necesitaban estudiar 10 horas en lugar de 5" }
        ],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 6,
        text: "Un compañero copió y sacó 10, diciendo que su método es 'muy lógico'. ¿Por qué el resultado final no hace que su decisión fuera correcta?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 7,
        text: "Frase: 'Ningún teléfono excelente es barato. Tu teléfono actual es muy caro'. ¿Se puede deducir de ahí que tu teléfono es excelente?",
        type: "multiple-choice",
        options: [
            { id: "si-logico", text: "Sí, es una conclusión válida y directa" },
            { id: "no-invalido", text: "No, es una falacia. Algo puede ser caro y malo al mismo tiempo" },
            { id: "depende", text: "Depende de la marca del teléfono" },
            { id: "quiza", text: "Es muy probable, pero no es una certeza lógica" }
        ],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 8,
        text: "Describe cuando alguien te intentó convencer con un argumento que sonaba muy inteligente, pero estaba basado en mentiras o suposiciones falsas.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 9,
        text: "Regla: 'Solo se falta en viernes con comprobante médico'. Tus amigos te invitan a faltar para ir al cine. ¿Qué respondes basado en la lógica?",
        type: "multiple-choice",
        options: [
            { id: "rechazar", text: "Rechazarlo, ya que una película no cumple la condición necesaria y estricta (el comprobante médico)" },
            { id: "aprobar", text: "Ir a la película si de verdad todos tus amigos van" },
            { id: "escalar", text: "Preguntarle al director si puedes ir" },
            { id: "ignorar", text: "Faltar sin decirle nada a nadie" }
        ],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    },
    {
        id: 10,
        text: "Regla 1: 'Si es VIP, recibe mochila'. Regla 2: 'Con mochila, te sientas atrás'. Un VIP se enoja por sentarse atrás. Demuestra lógicamente por qué el torneo actuó bien.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "razonamiento-deductivo"
    }
];
