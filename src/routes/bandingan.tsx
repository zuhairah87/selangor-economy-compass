import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSimulation } from "@/lib/simulation-store";
import { byMainSector, demandFromEntries, fmtNum, fmtRm, simulate, totals } from "@/lib/io-model";

export const Route = createFileRoute("/bandingan")({
  head: () => ({
    meta: [
      { title: "Bandingan Senario · Input-Output Selangor" },
      { name: "description", content: "Bandingkan impak KDNK, import, pekerjaan dan produktiviti antara senario simulasi Selangor." },
      { property: "og:title", content: "Bandingan Senario · Input-Output Selangor" },
      { property: "og:description", content: "Perbandingan sisi-ke-sisi impak ekonomi bagi setiap senario." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Compare,
});

const METRICS = [
  { key: "demand", label: "Kejutan", unit: "RM ribu" },
  { key: "output", label: "Output", unit: "RM ribu" },
  { key: "gdp", label: "KDNK", unit: "RM ribu" },
  { key: "imports", label: "Import", unit: "RM ribu" },
  { key: "jobs", label: "Pekerjaan", unit: "FTE" },
  { key: "productivity", label: "Produktiviti", unit: "RM ribu/pekerja" },
  { key: "gdpPerRm", label: "KDNK per RM", unit: "pengganda" },
  { key: "jobsPerM", label: "Pekerjaan per RM1 juta", unit: "FTE" },
] as const;
type MKey = (typeof METRICS)[number]["key"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Compare() {
  const { scenarios } = useSimulation();
  const filled = scenarios.filter((s) => s.entries.length);
  const [picked, setPicked] = useState<string[] | null>(null);
  const sel = picked ?? filled.slice(0, 4).map((s) => s.id);
  const [chartMetric, setChartMetric] = useState<"gdp" | "imports" | "jobs">("gdp");

  const data = useMemo(
    () =>
      filled
        .filter((s) => sel.includes(s.id))
        .map((s) => {
          const res = simulate(demandFromEntries(s.entries));
          const t = totals(res);
          return {
            id: s.id,
            name: s.name,
            t: { ...t, gdpPerRm: t.demand ? t.gdp / t.demand : 0, jobsPerM: t.demand ? (t.jobs / t.demand) * 1000 : 0 },
            sectors: byMainSector(res),
          };
        }),
    [filled, sel],
  );

  if (!filled.length)
    return (
      <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Belum ada senario berisi. Masukkan input dalam sekurang-kurangnya dua senario di{" "}
        <Link to="/simulasi" className="font-medium text-primary underline">Simulasi</Link>.
      </div>
    );

  const fmt = (k: MKey, v: number) =>
    k === "jobs" || k === "jobsPerM" ? fmtNum(v, k === "jobsPerM" ? 1 : 0) : k === "productivity" || k === "gdpPerRm" ? fmtNum(v, 2) : fmtRm(v);
  const best = (k: MKey) => {
    const vals = data.map((d) => d.t[k]);
    return k === "imports" ? Math.min(...vals) : Math.max(...vals);
  };
  const chartData = data[0]?.sectors.map((s, i) => ({
    name: s.name,
    ...Object.fromEntries(data.map((d) => [d.name, d.sectors[i]![chartMetric]])),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Bandingan Senario</h1>
        <p className="text-sm text-muted-foreground">Setiap senario dikira berasingan melalui model I-O. Nilai terbaik ditanda (import: paling rendah).</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filled.map((s) => {
          const on = sel.includes(s.id);
          return (
            <button key={s.id}
              onClick={() => setPicked(on ? sel.filter((x) => x !== s.id) : [...sel, s.id].slice(-5))}
              className={`rounded-sm border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
              {s.name}
            </button>
          );
        })}
        <span className="self-center text-xs text-muted-foreground">Pilih sehingga 5</span>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Penunjuk</th>
              {data.map((d, i) => (
                <th key={d.id} className="p-3 text-right">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {METRICS.map((m) => {
              const b = best(m.key);
              return (
                <tr key={m.key} className="border-t border-border">
                  <td className="p-3 font-sans">{m.label} <span className="text-xs text-muted-foreground">({m.unit})</span></td>
                  {data.map((d) => {
                    const v = d.t[m.key];
                    const win = data.length > 1 && m.key !== "demand" && v === b && v !== 0;
                    return (
                      <td key={d.id} className={`p-3 text-right ${win ? "bg-accent/25 font-semibold" : ""}`}>{fmt(m.key, v)}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="rounded-sm border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Mengikut sektor utama</h2>
          <div className="flex gap-1">
            {(["gdp", "imports", "jobs"] as const).map((k) => (
              <button key={k} onClick={() => setChartMetric(k)}
                className={`rounded-sm px-3 py-1 text-sm ${chartMetric === k ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {k === "gdp" ? "KDNK" : k === "imports" ? "Import" : "Pekerjaan"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtNum(v)} />
              <Tooltip formatter={(v: number) => fmtNum(v, 2)} />
              <Legend />
              {data.map((d, i) => <Bar key={d.id} dataKey={d.name} fill={COLORS[i]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
