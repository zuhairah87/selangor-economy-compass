import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { fmtNum, LINKAGES, MAIN_SECTORS, type Linkage } from "@/lib/io-model";

export const Route = createFileRoute("/sektor-utama")({
  head: () => ({
    meta: [
      { title: "Sektor Utama · Input-Output Selangor" },
      { name: "description", content: "Kedudukan sektor utama Selangor berdasarkan rangkaian ke belakang dan ke hadapan." },
      { property: "og:title", content: "Sektor Utama · Input-Output Selangor" },
      { property: "og:description", content: "Rangkaian ke belakang dan ke hadapan bagi 119 industri Selangor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KeySectors,
});

const TYPES: Linkage["type"][] = ["Sektor Utama", "Rangkaian Ke Belakang", "Rangkaian Ke Hadapan", "Lemah"];
const TYPE_COLOR: Record<Linkage["type"], string> = {
  "Sektor Utama": "var(--chart-2)",
  "Rangkaian Ke Belakang": "var(--chart-1)",
  "Rangkaian Ke Hadapan": "var(--chart-3)",
  Lemah: "var(--destructive)",
};
const TYPE_DESC: Record<Linkage["type"], string> = {
  "Sektor Utama": "BL > 1 dan FL > 1",
  "Rangkaian Ke Belakang": "BL > 1 sahaja",
  "Rangkaian Ke Hadapan": "FL > 1 sahaja",
  Lemah: "BL ≤ 1 dan FL ≤ 1",
};

function KeySectors() {
  const [sort, setSort] = useState<"blIdx" | "flIdx" | "sum">("sum");
  const [type, setType] = useState<Linkage["type"] | "Semua">("Semua");
  const [group, setGroup] = useState("Semua");
  const rows = useMemo(
    () =>
      LINKAGES.filter((l) => (type === "Semua" || l.type === type) && (group === "Semua" || l.main === group)).sort((a, b) =>
        sort === "sum" ? b.blIdx + b.flIdx - (a.blIdx + a.flIdx) : b[sort] - a[sort],
      ),
    [sort, type, group],
  );
  const counts = Object.fromEntries(TYPES.map((t) => [t, LINKAGES.filter((l) => l.type === t).length]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Kedudukan Sektor Utama</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Rangkaian ke belakang (BL) mengukur sejauh mana sesuatu industri membeli input daripada industri lain; rangkaian ke hadapan (FL) mengukur sejauh mana outputnya digunakan oleh industri lain. Indeks &gt; 1 bermaksud melebihi purata Selangor.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(type === t ? "Semua" : t)}
            className={`bg-card p-4 text-left ${type === t ? "outline outline-2 -outline-offset-2 outline-primary" : "hover:bg-secondary"}`}>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />{t}
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">{counts[t]}</div>
            <div className="text-xs text-muted-foreground">{TYPE_DESC[t]}</div>
          </button>
        ))}
      </div>

      <section className="rounded-sm border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Peta rangkaian (BL vs FL)</h2>
        <div className="mt-4 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis type="number" dataKey="blIdx" name="BL" domain={["auto", "auto"]} tick={{ fontSize: 11 }}
                label={{ value: "Rangkaian ke belakang (BL)", position: "insideBottom", offset: -10, fontSize: 12 }} />
              <YAxis type="number" dataKey="flIdx" name="FL" domain={["auto", "auto"]} tick={{ fontSize: 11 }}
                label={{ value: "Rangkaian ke hadapan (FL)", angle: -90, position: "insideLeft", fontSize: 12 }} />
              <ZAxis range={[40, 40]} />
              <ReferenceLine x={1} stroke="var(--foreground)" strokeDasharray="4 4" />
              <ReferenceLine y={1} stroke="var(--foreground)" strokeDasharray="4 4" />
              <Tooltip content={({ payload }) => {
                const p = payload?.[0]?.payload as Linkage | undefined;
                return p ? (
                  <div className="rounded-sm border border-border bg-popover p-2 text-xs shadow">
                    <div className="font-semibold">{p.sector}. {p.name}</div>
                    <div className="font-mono">BL {fmtNum(p.blIdx, 3)} · FL {fmtNum(p.flIdx, 3)}</div>
                    <div className="text-muted-foreground">{p.type}</div>
                  </div>
                ) : null;
              }} />
              {TYPES.map((t) => (
                <Scatter key={t} data={rows.filter((r) => r.type === t)} fill={TYPE_COLOR[t]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

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
              <th className="p-3 text-right">Pengganda output</th>
              {([["blIdx", "Indeks BL"], ["flIdx", "Indeks FL"], ["sum", "BL + FL"]] as const).map(([k, l]) => (
                <th key={k} className="p-3 text-right">
                  <button onClick={() => setSort(k)} className={sort === k ? "text-primary underline" : ""}>{l}</button>
                </th>
              ))}
              <th className="p-3">Klasifikasi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.sector} className="border-t border-border">
                <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                <td className="p-3"><span className="mr-2 font-mono text-xs text-muted-foreground">{r.sector}</span>{r.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{r.main}</td>
                <td className="p-3 text-right font-mono">{fmtNum(r.bl, 3)}</td>
                <td className={`p-3 text-right font-mono ${r.blIdx > 1 ? "font-semibold" : "text-muted-foreground"}`}>{fmtNum(r.blIdx, 3)}</td>
                <td className={`p-3 text-right font-mono ${r.flIdx > 1 ? "font-semibold" : "text-muted-foreground"}`}>{fmtNum(r.flIdx, 3)}</td>
                <td className="p-3 text-right font-mono">{fmtNum(r.blIdx + r.flIdx, 3)}</td>
                <td className="p-3 text-xs">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[r.type] }} />{r.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Kaedah Rasmussen: BL = jumlah lajur matriks songsang Leontief ÷ purata; FL = jumlah baris ÷ purata.</p>
    </div>
  );
}
