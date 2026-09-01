export function rawToT_Male(domainRaw: number, isDomain: boolean): number {
  const mean = isDomain ? 96 : 16;
  const sd = isDomain ? 18 : 4.5;
  return Math.round(50 + 10 * (domainRaw - mean) / sd);
}
export const maleFacetToT = rawToT_Male;
export const maleDomainToT = rawToT_Male;
