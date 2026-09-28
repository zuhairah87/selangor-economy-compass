import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSimulation } from "@/lib/simulation-store";
import { byMainSector, fmtNum, fmtRm, totals } from "@/lib/io-model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Papan Pemuka · Input-Output Selangor" },
      { name: "description", content: "KDNK, import, pekerjaan dan produktiviti hasil simulasi Input-Output Selangor." },
      { property: "og:title", content: "Papan Pemuka · Input-Output Selangor" },
      { property: "og:description", content: "Impak KDNK, import, pekerjaan dan produktiviti bagi 119 sektor Selangor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const INDICATORS = [
  { key: "gdp", label: "KDNK", unit: "RM ribu" },
  { key: "imports", label: "Import", unit: "RM ribu" },
  { key: "jobs", label: "Pekerjaan", unit: "pekerjaan (FTE)" },
  { key: "productivity", label: "Produktiviti", unit: "RM ribu / pekerja" },
] as const;
type IndKey = (typeof INDICATORS)[number]["key"];

function Dashboard() {
  const { results } = useSimulation();
  const [ind, setInd] = useState<IndKey>("gdp");
  const t = totals(results);
  const sectors = byMainSector(results);
  const indicator = INDICATORS.find((i) => i.key === ind)!;
  const fmt = (v: number) => (ind === "jobs" ? fmtNum(v) : ind === "productivity" ? fmtNum(v, 2) : fmtRm(v));

  const top = useMemo(
    () => [...results].filter((r) => r[ind] > 0).sort((a, b) => b[ind] - a[ind]).slice(0, 10),
    [results, ind],
  );
  const empty = t.demand === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Negeri Selangor · Jadual I-O</p>
          <h1 className="font-display text-3xl font-bold">Impak Ekonomi Simulasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jumlah perbelanjaan dimasukkan: <span className="font-mono font-semibold text-foreground">RM {fmtNum(t.demand * 1000)}</span>
          </p>
        </div>
        <Link to="/simulasi" className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">
          {empty ? "Mula simulasi →" : "Ubah simulasi →"}
        </Link>
      </div>

      {empty && (
        <div className="rounded-sm border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          Tiada input lagi. Pergi ke <Link to="/simulasi" className="font-medium text-primary underline">Simulasi</Link> dan masukkan nilai pelaburan/perbelanjaan mengikut kod MSIC untuk menjana papan pemuka.
        </div>
      )}

      <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {INDICATORS.map((i) => (
          <button
            key={i.key}
            onClick={() => setInd(i.key)}
            className={`bg-card p-5 text-left transition ${ind === i.key ? "outline outline-2 -outline-offset-2 outline-primary" : "hover:bg-secondary"}`}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{i.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">
              {i.key === "jobs" ? fmtNum(t.jobs) : i.key === "productivity" ? fmtNum(t.productivity, 2) : fmtRm(t[i.key])}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{i.unit}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-sm border border-border bg-card p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold">{indicator.label} mengikut sektor utama</h2>
          <p className="text-xs text-muted-foreground">{indicator.unit}</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectors} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtNum(v)} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey={ind} fill="var(--chart-1)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">10 industri teratas</h2>
          <p className="text-xs text-muted-foreground">Kedudukan mengikut {indicator.label}</p>
          <ol className="mt-4 space-y-2">
            {top.length === 0 && <li className="text-sm text-muted-foreground">-</li>}
            {top.map((r, i) => {
              const pct = (r[ind] / top[0]![ind]) * 100;
              return (
                <li key={r.sector} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate"><span className="mr-2 font-mono text-muted-foreground">{i + 1}.</span>{r.name}</span>
                    <span className="font-mono">{fmt(r[ind])}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-secondary"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Sektor</th>
              <th className="p-3 text-right">Output (RM ribu)</th>
              <th className="p-3 text-right">KDNK (RM ribu)</th>
              <th className="p-3 text-right">Import (RM ribu)</th>
              <th className="p-3 text-right">Pekerjaan</th>
              <th className="p-3 text-right">Produktiviti</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {[...sectors, { name: "Jumlah", ...t }].map((s) => (
              <tr key={s.name} className={`border-t border-border ${s.name === "Jumlah" ? "font-semibold" : ""}`}>
                <td className="p-3 font-sans">{s.name}</td>
                <td className="p-3 text-right">{fmtRm(s.output)}</td>
                <td className="p-3 text-right">{fmtRm(s.gdp)}</td>
                <td className="p-3 text-right">{fmtRm(s.imports)}</td>
                <td className="p-3 text-right">{fmtNum(s.jobs)}</td>
                <td className="p-3 text-right">{fmtNum(s.productivity, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
