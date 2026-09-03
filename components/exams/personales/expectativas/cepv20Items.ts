export type CepvDimension = "aprendizaje_aplicabilidad" | "metodologia_vivencial" | "facilitacion_conduccion" | "interaccion_social_networking";
export type CepvItem = { id: number; text: string; dimension: CepvDimension };
export type CepvOpen = { id: number; text: string };
export const CEPV_DIMENSION_LABELS: Record<CepvDimension, string> = {
  aprendizaje_aplicabilidad: "Expectativas de Aprendizaje y Aplicabilidad Práctica",
  metodologia_vivencial: "Metodología Vivencial, Dinámica e Inmersión",
  facilitacion_conduccion: "Facilitación y Conducción Experta",
  interaccion_social_networking: "Interacción Social, Cohesión y Networking",
};
export const cepvLikertItems: CepvItem[] = [
  { id: 1, text: "Espero adquirir herramientas concretas que pueda implementar de inmediato en mi actividad profesional o personal.", dimension: "aprendizaje_aplicabilidad" },
  { id: 2, text: "Confío en que los contenidos abordados superarán la teoría convencional y se enfocarán en la resolución de problemas reales.", dimension: "aprendizaje_aplicabilidad" },
  { id: 3, text: "Espero que este programa me permita identificar áreas de mejora personal que antes no había reconocido.", dimension: "aprendizaje_aplicabilidad" },
  { id: 4, text: "Considero que el valor de los aprendizajes justificará plenamente el tiempo invertido en participar.", dimension: "aprendizaje_aplicabilidad" },
  { id: 5, text: "Espero desarrollar una comprensión más estratégica y crítica respecto al tema central del programa.", dimension: "aprendizaje_aplicabilidad" },
  { id: 6, text: "Espero participar en actividades y ejercicios prácticos desafiantes que estimulen la participación activa.", dimension: "metodologia_vivencial" },
  { id: 7, text: "Espero que la metodología fomente el aprendizaje a través de la reflexión y la experiencia directa.", dimension: "metodologia_vivencial" },
  { id: 8, text: "Confío en que el ritmo y la secuencia de las sesiones mantendrán un nivel alto de motivación y energía.", dimension: "metodologia_vivencial" },
  { id: 9, text: "Espero contar con un ambiente de seguridad psicológica para expresar dudas, errores y puntos de vista.", dimension: "metodologia_vivencial" },
  { id: 10, text: "Espero que los materiales, dinámicas y recursos utilizados sean innovadores y pertinentes.", dimension: "metodologia_vivencial" },
  { id: 11, text: "Espero que los facilitadores demuestren un sólido dominio temático y experiencia de campo demostrada.", dimension: "facilitacion_conduccion" },
  { id: 12, text: "Confío en que los facilitadores sabrán guiar adecuadamente el debriefing (análisis reflexivo) tras cada actividad.", dimension: "facilitacion_conduccion" },
  { id: 13, text: "Espero recibir retroalimentación constructiva y personalizada por parte de los líderes del programa.", dimension: "facilitacion_conduccion" },
  { id: 14, text: "Espero que los facilitadores atiendan de forma ágil y empática las inquietudes individuales del grupo.", dimension: "facilitacion_conduccion" },
  { id: 15, text: "Confío en que el equipo organizador mantendrá un estricto cumplimiento del programa y de la logística pautada.", dimension: "facilitacion_conduccion" },
  { id: 16, text: "Espero generar contactos profesionales valiosos y relaciones de colaboración con otros asistentes.", dimension: "interaccion_social_networking" },
  { id: 17, text: "Espero que las dinámicas grupales faciliten la confianza rápida y el trabajo en equipo auténtico.", dimension: "interaccion_social_networking" },
  { id: 18, text: "Confío en que los demás compañeros estarán comprometidos activamente con las actividades propuestas.", dimension: "interaccion_social_networking" },
  { id: 19, text: "Espero intercambiar experiencias y perspectivas diversas que enriquezcan mi propia visión.", dimension: "interaccion_social_networking" },
  { id: 20, text: "Espero que se consolide un sentido de comunidad que continúe tras finalizar el evento.", dimension: "interaccion_social_networking" },
];
export const cepvOpenQuestions: CepvOpen[] = [
  { id: 21, text: "Expectativa prioritaria: ¿Cuál es el objetivo o resultado personal número uno que espera alcanzar al término de esta experiencia?" },
  { id: 22, text: "Preocupaciones o barreras anticipadas: ¿Existe algún aspecto técnico, físico o personal que le preocupe de cara al desarrollo del programa?" },
  { id: 23, text: "Criterio de éxito: ¿Qué debería suceder durante el evento para que usted considere que la experiencia fue extraordinaria?" },
];
