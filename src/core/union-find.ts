export interface UnionFind {
  find: (x: number) => number;
  /** Returns true if `a` and `b` were in different sets (the union happened). */
  union: (a: number, b: number) => boolean;
}

export const makeUnionFind = (n: number): UnionFind => {
  const parent = new Array<number>(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const rank = new Array<number>(n).fill(0);

  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    let cur = x;
    while (parent[cur] !== r) {
      const next = parent[cur];
      parent[cur] = r;
      cur = next;
    }
    return r;
  };

  const union = (a: number, b: number): boolean => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
    } else {
      parent[rb] = ra;
      rank[ra]++;
    }
    return true;
  };

  return { find, union };
};
