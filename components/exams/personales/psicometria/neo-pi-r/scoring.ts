import { DOMAINS, getFacetForItem, REVERSE_SCORED } from "./facetKey";
export type LikertValue = 0 | 1 | 2 | 3 | 4;
export function scoreItem(itemNumber: number, response: LikertValue): number {
  return REVERSE_SCORED[itemNumber] ? 4 - response : response;
}
export function computeRawScores(answers: Record<number, LikertValue>) {
  const facetRaw: number[][] = DOMAINS.map(() => Array(6).fill(0));
  for (const [itemStr, response] of Object.entries(answers)) {
    const item = Number(itemStr);
    const { domain, facetIndex } = getFacetForItem(item);
    facetRaw[DOMAINS.indexOf(domain)][facetIndex] += scoreItem(item, response as LikertValue);
  }
  const domainRaw = facetRaw.map((facets) => facets.reduce((a, b) => a + b, 0));
  return { facetRaw, domainRaw };
}
export function tLevel(t: number): "Bajo" | "Promedio" | "Alto" {
  if (t < 45) return "Bajo";
  if (t > 55) return "Alto";
  return "Promedio";
}
