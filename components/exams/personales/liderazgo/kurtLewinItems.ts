export type LeadershipStyle = "autoritario" | "democratico" | "laissez-faire";

export type LewinItem = {
  id: number;
  text: string;
  style: LeadershipStyle;
};

export const kurtLewinItems: LewinItem[] = [
  { id: 1, text: "Un mando que mantiene relaciones amistosas con su personal le cuesta imponer disciplina.", style: "autoritario" },
  { id: 2, text: "Los empleados obedecen mejor a los mandos amistosos que a los que no lo son.", style: "democratico" },
  { id: 3, text: "Los contactos y comunicaciones personales deben reducirse a un mínimo por parte del jefe.", style: "laissez-faire" },
  { id: 4, text: "Un mando debe hacer sentir siempre a su personal que él es el que manda.", style: "autoritario" },
  { id: 5, text: "Un mando debe hacer reuniones para resolver desacuerdos sobre problemas importantes.", style: "democratico" },
  { id: 6, text: "Un mando no debe implicarse en la solución de diferencias de opiniones entre sus subordinados.", style: "laissez-faire" },
  { id: 7, text: "Castigar la desobediencia a los reglamentos es una de las formas más eficientes para mantener la disciplina.", style: "autoritario" },
  { id: 8, text: "Es conveniente explicar el porqué de los objetivos y de las políticas de la empresa.", style: "democratico" },
  { id: 9, text: "Cuando un subordinado no está de acuerdo con la solución que su superior da a un problema, lo mejor es pedir al subordinado que sugiera una mejor alternativa y atenerse a ella.", style: "laissez-faire" },
  { id: 10, text: "Cuando se discuten asuntos importantes, el supervisor no debe permitir al subordinado que manifieste sus diferencias de opiniones, excepto en privado.", style: "autoritario" },
  { id: 11, text: "Un mando debe hacer malabarismos por conseguir el apoyo de sus subordinados en las decisiones importantes.", style: "democratico" },
  { id: 12, text: "Un mando no debe preocuparse por las diferencias de opinión que tenga con su personal; se atiene a sus propios puntos de vista aunque se opongan a otros.", style: "laissez-faire" },
  { id: 13, text: "Un subordinado debe lealtad en primer lugar a su mando inmediato.", style: "autoritario" },
  { id: 14, text: "Cuando un subordinado critica a su jefe, lo mejor es discutir dichas diferencias en forma exhaustiva.", style: "democratico" },
  { id: 15, text: "Al supervisor le basta obtener datos de cada unidad bajo su supervisión para comparar resultados y detectar fácilmente las deficiencias.", style: "laissez-faire" },
  { id: 16, text: "Cuando se fijan objetivos, un mando no debe confiar mucho en las recomendaciones de sus subordinados.", style: "autoritario" },
  { id: 17, text: "Se considera que el mando es un buen mando si satisface los intereses de sus subordinados.", style: "democratico" },
  { id: 18, text: "Cuando se llevan a cabo reuniones para fijar objetivos, sería aconsejable que no se incluyeran a los empleados.", style: "laissez-faire" },
  { id: 19, text: "Un mando no debe posponer las correcciones a sus empleados.", style: "autoritario" },
  { id: 20, text: "Los empleados que no cooperan en las decisiones deben ser tomados en cuenta.", style: "democratico" },
  { id: 21, text: "En la toma de decisiones, lo mejor es no interferir.", style: "laissez-faire" },
  { id: 22, text: "Un mando que da órdenes y las aclara apenas puede quejarse si éstas no se cumplen.", style: "autoritario" },
  { id: 23, text: "Cuando los empleados consideran que los directivos son incompetentes, es mejor buscar en otra parte sus propias directrices.", style: "democratico" },
  { id: 24, text: "Las cosas se deben dejar que sigan su curso, sin intervención del mando.", style: "laissez-faire" },
  { id: 25, text: "Usted considera que octubre es el mejor mes para hacer ciertas reparaciones. La mayoría de los trabajadores prefiere noviembre. Usted decide que será octubre.", style: "autoritario" },
  { id: 26, text: "Usted considera que octubre es el mejor mes para hacer ciertas reparaciones. La mayoría de los trabajadores prefiere noviembre. Usted somete el asunto a votación.", style: "democratico" },
  { id: 27, text: "Usted considera que octubre es el mejor mes para hacer ciertas reparaciones. La mayoría de los trabajadores prefiere noviembre. Usted hace lo que piensa el grupo.", style: "laissez-faire" },
  { id: 28, text: "Usted considera que octubre es el mejor mes para hacer ciertas reparaciones. La mayoría de los trabajadores prefiere noviembre. Usted deja que se organicen para decidir entre ellos.", style: "autoritario" },
  { id: 29, text: "El líder tiene en cuenta las opiniones de sus subordinados antes de decidir.", style: "democratico" },
  { id: 30, text: "El líder deja hacer a sus subordinados sin inmiscuirse.", style: "laissez-faire" },
  { id: 31, text: "El líder establece las normas y exige su cumplimiento estricto.", style: "autoritario" },
  { id: 32, text: "El líder fomenta la participación activa del grupo.", style: "democratico" },
  { id: 33, text: "El líder proporciona información solo cuando se la solicitan.", style: "laissez-faire" },
];
