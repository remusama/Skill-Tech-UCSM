export type Domain = "N" | "E" | "O" | "A" | "C";
export const DOMAINS: Domain[] = ["N", "E", "O", "A", "C"];
export const FACET_NAMES: Record<Domain, string[]> = {
  N: ["Ansiedad", "Hostilidad", "Depresión", "Ansiedad Social", "Impulsividad", "Vulnerabilidad"],
  E: ["Calidez", "Gregarismo", "Asertividad", "Actividad", "Búsqueda de sensaciones", "Emociones positivas"],
  O: ["Fantasía", "Estética", "Sentimientos", "Acciones", "Ideas", "Valores"],
  A: ["Confianza", "Franqueza", "Altruismo", "Complacencia", "Modestia", "Benevolencia"],
  C: ["Competencia", "Orden", "Sentido del deber", "Aspiraciones de logro", "Autodisciplina", "Reflexión"],
};
export function getFacetForItem(itemNumber: number): { domain: Domain; facetIndex: number } {
  const posInCycle = (itemNumber - 1) % 30;
  const domain = DOMAINS[posInCycle % 5];
  const facetIndex = Math.floor(posInCycle / 5);
  return { domain, facetIndex };
}
export const REVERSE_SCORED: Record<number, boolean> = {};
