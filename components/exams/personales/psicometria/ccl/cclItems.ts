export type CCLDimension =
  | "mando_crisis"
  | "vision_inspiracion"
  | "empatia_vinculo"
  | "decision_participativa"
  | "altos_estandares"
  | "coaching_desarrollo";

export type CCLItem = {
  id: number;
  text: string;
  dimension: CCLDimension;
};

export const CCL_DIMENSION_LABEL: Record<CCLDimension, string> = {
  mando_crisis: "Mando en crisis",
  vision_inspiracion: "Visión e inspiración",
  empatia_vinculo: "Empatía y vínculo",
  decision_participativa: "Decisión participativa",
  altos_estandares: "Altos estándares (pace-setting)",
  coaching_desarrollo: "Coaching y desarrollo de personas",
};

const DIMENSION_ORDER: CCLDimension[] = [
  "mando_crisis",
  "vision_inspiracion",
  "empatia_vinculo",
  "decision_participativa",
  "altos_estandares",
  "coaching_desarrollo",
];

export function getDimensionForItem(itemNumber: number): CCLDimension {
  return DIMENSION_ORDER[(itemNumber - 1) % 6];
}

const RAW_TEXTS: string[] = [
  "Cuando surge una crisis, tomo el control de la situación con rapidez y claridad.",
  "Comunico con claridad hacia dónde va el equipo y por qué.",
  "Me tomo el tiempo de entender cómo se siente cada miembro de mi equipo.",
  "Antes de decidir algo importante, pido la opinión de mi equipo.",
  "Exijo un alto nivel de desempeño a mí mismo/a y a mi equipo.",
  "Invierto tiempo en el desarrollo profesional de cada persona de mi equipo.",
  "Mantengo la calma y ayudo a mi equipo a mantenerla cuando ocurre un imprevisto grave.",
  "Logro que las personas se entusiasmen con los objetivos a largo plazo.",
  "Ajusto mi forma de comunicarme según el estado emocional de la persona.",
  "Prefiero llegar a acuerdos por consenso en vez de imponer mi criterio.",
  "Establezco metas ambiciosas y las persigo con constancia.",
  "Doy retroalimentación específica para ayudar a otros a mejorar.",
  "Doy instrucciones claras y directas cuando el tiempo apremia.",
  "Uso el propósito del equipo para motivar en momentos difíciles.",
  "Las personas de mi equipo sienten que pueden contarme sus problemas.",
  "Delego decisiones en las personas que tienen más experiencia en el tema.",
  "Doy el ejemplo trabajando con el mismo ritmo que espero del equipo.",
  "Identifico las fortalezas de cada persona y las potencio.",
  "Soy capaz de tomar decisiones difíciles bajo presión sin paralizarme.",
  "Ayudo a que cada persona entienda cómo su trabajo contribuye a la meta general.",
  "Reconozco cuando alguien está pasando por un momento difícil, incluso sin que me lo diga.",
  "Escucho activamente las propuestas de mi equipo antes de definir una solución.",
  "Me cuesta delegar tareas porque prefiero asegurarme de que se hagan bien.",
  "Acompaño a mi equipo en el largo plazo, más allá de resultados inmediatos.",
  "En momentos de emergencia, prioricé la acción inmediata por encima de largas discusiones.",
  "Propongo ideas que despiertan el interés y compromiso del equipo.",
  "Priorizo el bienestar del equipo por encima de los resultados inmediatos cuando es necesario.",
  "Genero espacios de discusión abierta para resolver desacuerdos.",
  "Corrijo rápidamente cualquier desviación de los estándares de calidad.",
  "Fomento que las personas asuman nuevos retos para crecer.",
  "Después de una crisis, reviso lo ocurrido para prevenir que se repita.",
  "Transmito confianza en el futuro incluso cuando hay incertidumbre.",
  "Construyo relaciones de confianza duraderas con las personas que dirijo.",
  "Considero que las mejores decisiones surgen del trabajo colectivo.",
  "Espero que el equipo mantenga un ritmo de trabajo elevado en todo momento.",
  "Dedico tiempo a enseñar y transferir conocimiento a mi equipo.",
];

export const cclItems: CCLItem[] = RAW_TEXTS.map((text, idx) => ({
  id: idx + 1,
  text,
  dimension: getDimensionForItem(idx + 1),
}));
