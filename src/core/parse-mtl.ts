export type RGB = [number, number, number];

export function parseMtl(contents: string): Map<string, RGB> {
  const out = new Map<string, RGB>();
  let current: string | null = null;

  for (const rawLine of contents.split("\n")) {
    const hashAt = rawLine.indexOf("#");
    const stripped = hashAt >= 0 ? rawLine.slice(0, hashAt) : rawLine;
    const line = stripped.trim();
    if (line.length === 0) continue;

    const parts = line.split(/\s+/);
    const head = parts[0];

    if (head === "newmtl") {
      const name = parts[1];
      if (!name || name.length === 0) {
        throw new Error(`parseMtl: newmtl with no name in line: ${line}`);
      }
      current = name;
      continue;
    }

    if (head === "Kd") {
      const r = Number(parts[1]);
      const g = Number(parts[2]);
      const b = Number(parts[3]);
      for (const c of [r, g, b]) {
        if (!Number.isFinite(c)) {
          throw new Error(
            `parseMtl: Kd has non-finite channel in line: ${line}`,
          );
        }
        if (c < 0 || c > 1) {
          throw new Error(
            `parseMtl: Kd channel out of [0,1] in line: ${line}`,
          );
        }
      }
      if (current !== null) {
        out.set(current, [r, g, b]);
      }
      continue;
    }
    // Everything else (Ka, Ks, Ke, Ns, d, Tr, illum, map_*, ...) ignored.
  }

  return out;
}
