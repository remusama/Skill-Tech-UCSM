import { Question } from "../../types";

export const razonamiento_abstraccion: Question[] = [
    {
        id: 1,
        text: "Siempre te duele la cabeza los martes si hubo deportes pesados el lunes. Un amigo sugiere tomar una pastilla cada martes por si acaso. ¿Cuál es tu postura lógica?",
        type: "multiple-choice",
        options: [
            { id: "apoyar", text: "Apoyarla, porque así previenes el problema antes de que ocurra" },
            { id: "rechazar-causa", text: "Rechazarla, porque solo ataca el síntoma temporalmente y no la causa real (el cansancio del lunes)" },
            { id: "escalar", text: "Preguntarle al profesor de deportes qué pastilla tomar" },
            { id: "automatizar", text: "Tomar pastillas todos los días para estar seguro" }
        ],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 2,
        text: "Un nuevo método mejora calificaciones en dos salones pero hace reprobar al tercero. ¿Cómo analizas si funciona evitando conclusiones apresuradas?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 3,
        text: "Un compañero sacó 10 en matemáticas usando pluma roja, así que ahora la usa para todos sus ensayos. ¿Cuál es el riesgo de esta generalización?",
        type: "multiple-choice",
        options: [
            { id: "riesgo-contexto", text: "Asumir que lo que funcionó en una situación específica (matemáticas) funcionará igual en contextos totalmente diferentes (donde el color rojo significa mala ortografía)" },
            { id: "riesgo-color", text: "El color rojo asusta a los profesores" },
            { id: "sin-riesgo", text: "Ninguno, es una decisión basada en hechos comprobados" },
            { id: "riesgo-tecnico", text: "Que se le acabe la tinta rápido" }
        ],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 4,
        text: "Tu técnica para predecir exámenes falló al cambiar de profesor. Explica cómo usarías este fallo para crear una nueva regla o mejorar tu técnica.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 5,
        text: "El recibo de luz subió. Notas que sube cuando tu hermano invita amigos a jugar videojuegos. ¿Cómo aplicas la navaja de Ockham para dar una explicación?",
        type: "multiple-choice",
        options: [
            { id: "hipotesis-compleja", text: "Asumir que los vecinos se están robando la luz usando cables secretos" },
            { id: "hipotesis-simple", text: "Buscar la explicación que requiere menos suposiciones: 4 teles y consolas prendidas toda la tarde gastan mucha luz" },
            { id: "hipotesis-hardware", text: "Creer que la compañía de luz tiene sus máquinas defectuosas este mes" },
            { id: "ignorar", text: "Ignorarlo como simple casualidad matemática" }
        ],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 6,
        text: "Lograste calmar tres peleas invitando pizza, pero en la cuarta falló y se enojaron más. ¿Cómo usas esto para mejorar tu regla sobre arreglar peleas?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 7,
        text: "Alguien en pánico afirma que 'todos odian' el baile. Al revisar, notas 15 quejas de 500 asistentes. ¿Cómo comunicas esta realidad objetivamente?",
        type: "multiple-choice",
        options: [
            { id: "alarma", text: "Entrar en pánico con él y cancelar futuros bailes" },
            { id: "dimensionar", text: "Presentar el hecho de que solo el 3% se quejó, y proponer hablar con ellos para mejorar, pero sin tratarlo como un fracaso general" },
            { id: "descartar", text: "Insultar a los que se quejaron porque el 97% estuvo feliz" },
            { id: "compensar", text: "Devolverle el dinero de las entradas a todos los asistentes" }
        ],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 8,
        text: "Llegas a un salón sin conocer las reglas. Notas que si el profesor trae corbata hay examen, y si trae suéter hay trabajo grupal. ¿Cómo deduces estas reglas invisibles?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 9,
        text: "Un amigo dice: 'Estudié matemáticas tres veces con resúmenes y reprobé, por tanto estudiar no sirve'. ¿Cómo desarmas esa afirmación con lógica?",
        type: "multiple-choice",
        options: [
            { id: "refutar-muestra", text: "Señalando que tres intentos con la misma técnica fallida no prueban que todas las técnicas de estudio sean inútiles" },
            { id: "estar-de-acuerdo", text: "Dándole la razón, la evidencia de sus tres fracasos es definitiva" },
            { id: "cambiar-tema", text: "Proponiéndole estudiar historia en vez de matemáticas" },
            { id: "atacar-seleccion", text: "Diciéndole que simplemente no tiene cerebro para los números" }
        ],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    },
    {
        id: 10,
        text: "Notas que los equipos ganadores usan tenis caros y entrenan juntos desde primaria. ¿Cómo diseñarías una prueba lógica para hallar la causa real de su éxito?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "abstraccion-inductiva"
    }
];
