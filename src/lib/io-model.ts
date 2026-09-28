import model from "@/data/io-model.json";
import msicRaw from "@/data/msic.json";

export type Msic = { code: string; desc: string; sector: number };
export const MSIC: Msic[] = (msicRaw as [string, string, number][]).map(([code, desc, sector]) => ({
  code,
  desc,
  sector,
}));

export const SECTOR_NAMES: string[] = model.names;

// 5 main sectors (same grouping as Backend IO L1240:L1244)
export const MAIN_SECTORS = [
  { key: "Pertanian", idx: range(1, 12) },
  { key: "Perlombongan & Pengkuarian", idx: range(13, 16) },
  { key: "Pembuatan", idx: range(17, 85) },
  { key: "Pembinaan", idx: range(89, 92) },
  { key: "Perkhidmatan", idx: [...range(86, 88), ...range(93, 119)] },
] as const;

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export function mainSectorOf(sector: number) {
  return MAIN_SECTORS.find((s) => (s.idx as readonly number[]).includes(sector))?.key ?? "-";
}

export type SectorResult = {
  sector: number;
  name: string;
  demand: number; // RM'000
  output: number; // RM'000
  gdp: number; // RM'000
  imports: number; // RM'000
  jobs: number;
  ce: number; // RM'000
  productivity: number; // RM'000 per worker
};

/**
 * Replicates Backend IO!E1240:J1358:
 *  d = S LINK / 1000  (RM -> RM'000)
 *  Output  = L · d
 *  KDNK    = diag(va)  · L · d
 *  Import  = diag(imp) · L · d
 *  Kerja   = diag(emp) · L · d × 1000
 *  Produktiviti = KDNK / Kerja
 */
export function simulate(demandRm: number[]): SectorResult[] {
  const d = demandRm.map((v) => (v || 0) / 1000);
  const L = model.L as number[][];
  return SECTOR_NAMES.map((name, i) => {
    let x = 0;
    const row = L[i]!;
    for (let j = 0; j < d.length; j++) if (d[j]) x += row[j]! * d[j]!;
    const gdp = model.va[i]! * x;
    const jobs = model.emp[i]! * x * 1000;
    return {
      sector: i + 1,
      name,
      demand: d[i]!,
      output: x,
      gdp,
      imports: model.imp[i]! * x,
      jobs,
      ce: model.ce[i]! * x,
      productivity: jobs > 0 ? gdp / jobs : 0,
    };
  });
}

export function totals(rows: SectorResult[]) {
  const t = rows.reduce(
    (a, r) => ({
      output: a.output + r.output,
      gdp: a.gdp + r.gdp,
      imports: a.imports + r.imports,
      jobs: a.jobs + r.jobs,
      ce: a.ce + r.ce,
      demand: a.demand + r.demand,
    }),
    { output: 0, gdp: 0, imports: 0, jobs: 0, ce: 0, demand: 0 },
  );
  return { ...t, productivity: t.jobs > 0 ? t.gdp / t.jobs : 0 };
}

export function byMainSector(rows: SectorResult[]) {
  return MAIN_SECTORS.map((s) => {
    const sub = rows.filter((r) => (s.idx as readonly number[]).includes(r.sector));
    return { name: s.key, ...totals(sub) };
  });
}

export const fmtRm = (v: number) =>
  v.toLocaleString("ms-MY", { maximumFractionDigits: v < 100 ? 2 : 0 });
export const fmtNum = (v: number, d = 0) => v.toLocaleString("ms-MY", { maximumFractionDigits: d });
