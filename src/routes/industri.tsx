import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSimulation } from "@/lib/simulation-store";
import { fmtNum, fmtRm, mainSectorOf, MAIN_SECTORS } from "@/lib/io-model";

export const Route = createFileRoute("/industri")({
  head: () => ({
    meta: [
      { title: "119 Industri · Input-Output Selangor" },
      { name: "description", content: "Kedudukan impak simulasi bagi 119 industri piawai Input-Output Selangor." },
      { property: "og:title", content: "119 Industri · Input-Output Selangor" },
      { property: "og:description", content: "Kedudukan KDNK, import, pekerjaan dan produktiviti bagi 119 industri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryPage,
});

const COLS = [
  { key: "gdp", label: "KDNK" },
  { key: "imports", label: "Import" },
  { key: "jobs", label: "Pekerjaan" },
  { key: "productivity", label: "Produktiviti" },
] as const;

function IndustryPage() {
  const { results } = useSimulation();
  const [sort, setSort] = useState<(typeof COLS)[number]["key"]>("gdp");
  const [group, setGroup] = useState("Semua");
  const rows = useMemo(
    () => results
      .filter((r) => group === "Semua" || mainSectorOf(r.sector) === group)
      .sort((a, b) => b[sort] - a[sort] || a.sector - b.sector),
    [results, sort, group],
  );
  const fmt = (k: string, v: number) => (k === "jobs" ? fmtNum(v) : k === "productivity" ? fmtNum(v, 2) : fmtRm(v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">119 Industri</h1>
        <p className="text-sm text-muted-foreground">Klik tajuk lajur untuk menukar kedudukan.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Semua", ...MAIN_SECTORS.map((s) => s.key)].map((g) => (
          <button key={g} onClick={() => setGroup(g)}
            className={`rounded-sm border px-3 py-1.5 text-sm ${group === g ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>{g}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">#</th><th className="p-3">Industri</th><th className="p-3">Sektor</th>
              {COLS.map((c) => (
                <th key={c.key} className="p-3 text-right">
                  <button onClick={() => setSort(c.key)} className={sort === c.key ? "text-primary underline" : ""}>{c.label}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.sector} className="border-t border-border">
                <td className="p-3 font-mono text-muted-foreground">{r[sort] > 0 ? i + 1 : "-"}</td>
                <td className="p-3"><span className="mr-2 font-mono text-xs text-muted-foreground">{r.sector}</span>{r.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{mainSectorOf(r.sector)}</td>
                {COLS.map((c) => <td key={c.key} className="p-3 text-right font-mono">{fmt(c.key, r[c.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
