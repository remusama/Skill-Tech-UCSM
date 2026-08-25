import { Question } from "../../types";

export const razonamiento_ambiguedad: Question[] = [
    {
        id: 1,
        text: "Un profesor pide 'hacer la presentación más bonita' para mañana sin dar ejemplos. ¿Cómo actúas ante esta falta de claridad sin paralizarte?",
        type: "multiple-choice",
        options: [
            { id: "preguntar-paralisis", text: "No hacer nada y esperar hasta que el profesor te conteste un correo dándote instrucciones exactas" },
            { id: "hipotesis-accion", text: "Tomar una decisión razonable (ej. poner más imágenes y menos texto), avanzar con esa idea y preparar argumentos para defenderla mañana" },
            { id: "ignorar", text: "Ignorar su comentario porque no te dio reglas claras" },
            { id: "quejarse", text: "Ir a la dirección a quejarte de que el profesor no sabe enseñar" }
        ],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 2,
        text: "Te asignan a un proyecto desordenado a la mitad y los miembros originales no están. Describe tu plan para avanzar asumiendo que debes tomar riesgos.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 3,
        text: "Lideras un baile pero la música cambia cada semana, y tus compañeros ansiosos quieren cancelar. ¿Cuál es tu postura para manejar esta incertidumbre?",
        type: "multiple-choice",
        options: [
            { id: "posponer", text: "Rendirse y cancelar la coreografía hasta que la escuela decida la música final" },
            { id: "aislar-riesgo", text: "Aislar el problema: practicar los pasos básicos que funcionan con cualquier canción y dejar los arreglos finales para el último minuto" },
            { id: "cambiar-tech", text: "Rebelarse y poner otra música totalmente distinta aunque los descalifiquen" },
            { id: "micro-management", text: "Estar todos los días persiguiendo al director de la escuela para que no cambie la música" }
        ],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 4,
        text: "Te avisan a las 11 PM que el rival hará una maqueta gigante y tú debes hacer algo mejor, sin indicaciones ni presupuesto. ¿Cuál es tu primera acción ordenada?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 5,
        text: "El promedio del salón subió, pero los alumnos más brillantes reprobaron. ¿Cómo presentas esta información confusa al director en 15 minutos sin pánico?",
        type: "multiple-choice",
        options: [
            { id: "ocultar", text: "Mostrar solo que el promedio subió para que el director esté feliz y no pregunte más" },
            { id: "sinceridad-estructurada", text: "Presentar la contradicción de forma clara, ofrecer un par de ideas de por qué pasó, y pedir 24 horas para investigarlo a fondo" },
            { id: "panico", text: "Decirle que es una crisis absoluta y que hay que correr al maestro" },
            { id: "promediar", text: "Inventar datos para que todo parezca normal" }
        ],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 6,
        text: "Tienes 50% de ganar un concurso o 50% de hacer el ridículo frente a la escuela. ¿Cómo usarías un 'análisis de escenarios' para decidir si participar?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 7,
        text: "A 10 minutos de tu obra escolar, las luces fallan intermitentemente. ¿Qué forma de pensar usas para decidir si cancelar o continuar?",
        type: "multiple-choice",
        options: [
            { id: "paralisis", text: "Sentarte a esperar los 10 minutos a ver si el problema se arregla mágicamente" },
            { id: "riesgo-controlado", text: "Evaluar rápido si el error impide seguir actuando; si no es tan grave, avisarle a los actores que improvisen si se apagan y seguir adelante" },
            { id: "miedo", text: "Cancelar el evento de inmediato ante el primer parpadeo de luz, sin revisar" },
            { id: "azar", text: "Echar un volado (lanzar una moneda) con tus amigos para ver qué hacen" }
        ],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 8,
        text: "Debes elegir un compañero para un rol nuevo en un club sin nadie con experiencia previa. ¿Cómo estructuras el proceso para elegir a la persona correcta?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 9,
        text: "Las reglas del concurso son confusas sobre si se permite usar cierto software y algunos profesores lo ven peligroso. ¿Cómo traduces esta regla gris en un plan?",
        type: "multiple-choice",
        options: [
            { id: "cancelar", text: "Cancelar el proyecto y no participar en el concurso para evitar regaños" },
            { id: "arquitectura-modular", text: "Hacer el proyecto de forma que esa parte del software se pueda quitar fácilmente en el último minuto si finalmente los jueces lo prohíben" },
            { id: "ignorar", text: "Usar el software a escondidas y esperar a que nadie se dé cuenta" },
            { id: "delegar", text: "Hacer que otro compañero lo entregue para que lo regañen a él" }
        ],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    },
    {
        id: 10,
        text: "Un profesor devuelve tu ensayo pidiendo 'más chispa' sin ser claro. ¿Cómo traduces esta instrucción confusa en 3 pasos ejecutables para tu texto?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "tolerancia-ambiguedad"
    }
];
