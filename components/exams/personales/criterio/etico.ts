import { Question } from "../../types";

export const criterio_etico: Question[] = [
    {
        id: 1,
        text: "Tu sistema de elección de jugadores penaliza a los más bajos pero aumenta las victorias. El entrenador presiona para usarlo. ¿Cómo analizas éticamente esto?",
        type: "multiple-choice",
        options: [
            { id: "lanzar", text: "Usarlo de todos modos porque ganar es lo único importante" },
            { id: "renunciar", text: "Salir del equipo inmediatamente sin dar explicaciones" },
            { id: "mapear", text: "Identificar los valores en choque (ganar vs ser justos), hablar con los afectados y buscar una solución que equilibre ambas cosas" },
            { id: "ocultar", text: "Usarlo pero esconder la fórmula para que nadie se dé cuenta de la desventaja" }
        ],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 2,
        text: "Un tramposo ofrece pagar la graduación si le pasas respuestas, salvando la fiesta. Identifica los valores éticos en choque y justifica tu decisión.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 3,
        text: "Te piden rastrear en secreto el uso del celular de tu grupo escolar 'para ser productivos'. ¿Cuál es la respuesta ética más responsable?",
        type: "multiple-choice",
        options: [
            { id: "hacerlo", text: "El líder manda, así que lo haces" },
            { id: "negarse-dialogar", text: "Negarte por el derecho a la privacidad y proponer mejor medir qué partes del trabajo ya entregó cada uno" },
            { id: "denunciar", text: "Acusarlo con el director para que lo expulsen" },
            { id: "sabotear", text: "Aceptar pero instalarle un virus a su propia computadora" }
        ],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 4,
        text: "Encuentras un error de calificación en el profesor más estricto que baja puntos a quien lo cuestiona. ¿Cómo equilibras hacer lo correcto y protegerte?",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 5,
        text: "Programas un juego donde el jugador debe sacrificar a un personaje mayor o joven. ¿Qué enfoque demuestra madurez ante este dilema ético?",
        type: "multiple-choice",
        options: [
            { id: "nino", text: "Salvar al joven porque tiene más 'puntos de vida' futuros" },
            { id: "anciano", text: "Salvar al mayor por respeto a la experiencia" },
            { id: "meta-analisis", text: "Reconocer que ambas opciones son terribles y enfocar tu esfuerzo en programar formas de evitar llegar a ese escenario en primer lugar (prevenir en vez de elegir)" },
            { id: "aleatorio", text: "Hacer que el juego elija al azar para no tener la culpa" }
        ],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 6,
        text: "Haces una encuesta anónima pero logras descubrir quién escribió los peores comentarios. Argumenta qué harías con esa información.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 7,
        text: "Tu compañero de equipo plagia su ensayo y lo junta con el tuyo. Si lo delatas reprueba, si callas podrían expulsar a ambos. ¿Cómo resuelves este dilema?",
        type: "multiple-choice",
        options: [
            { id: "silencio", text: "Callar por lealtad al amigo y esperar que el profesor no lo note" },
            { id: "delatar", text: "Ir directo con el profesor y pedir que repruebe solo a él" },
            { id: "confrontar", text: "Hablar con él, exigirle que lo reescriba hoy mismo o asumirá la culpa, dándole un plazo antes de entregar" },
            { id: "extorsionar", text: "Pedirle que haga tu tarea todo el mes a cambio de tu silencio" }
        ],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 8,
        text: "Justifica por qué basar decisiones en 'todos los demás lo hacen así' es un argumento ético y lógico débil.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 9,
        text: "Organizas un concurso con tiempos estrictos que causan que los equipos se lastimen al correr. ¿Cuál es tu responsabilidad ética como organizador?",
        type: "multiple-choice",
        options: [
            { id: "ninguna", text: "Ninguna, la responsabilidad de correr es de los participantes" },
            { id: "avisar-gobierno", text: "Cancelar todo el evento de inmediato" },
            { id: "redisenar", text: "Modificar las reglas, quitar puntos por correr en pasillos y dar más tiempo para traslados" },
            { id: "premiar", text: "Dar puntos extra a los que lleguen aún más rápido sin importar cómo" }
        ],
        correctAnswer: "",
        skill: "juicio-etico"
    },
    {
        id: 10,
        text: "Diseña una lista de pasos para debatir y resolver decisiones injustas en grupo sin terminar en gritos ni emociones extremas.",
        type: "open-ended",
        options: [],
        correctAnswer: "",
        skill: "juicio-etico"
    }
];
