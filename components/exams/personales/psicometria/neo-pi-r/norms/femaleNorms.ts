export function rawToT_Female(domainRaw: number, isDomain: boolean): number {
  const mean = isDomain ? 98 : 16.5;
  const sd = isDomain ? 17 : 4.3;
  return Math.round(50 + 10 * (domainRaw - mean) / sd);
}
export const femaleFacetToT = rawToT_Female;
export const femaleDomainToT = rawToT_Female;
