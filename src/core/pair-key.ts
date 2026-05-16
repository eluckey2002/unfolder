export const canonicalPairKey = (a: number, b: number): string =>
  a < b ? `${a},${b}` : `${b},${a}`;
