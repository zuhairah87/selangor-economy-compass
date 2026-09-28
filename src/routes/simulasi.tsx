import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSimulation } from "@/lib/simulation-store";
import { MSIC, SECTOR_NAMES, fmtNum } from "@/lib/io-model";

export const Route = createFileRoute("/simulasi")({
  head: () => ({
    meta: [
      { title: "Simulasi · Input-Output Selangor" },
      { name: "description", content: "Masukkan nilai perbelanjaan mengikut kod MSIC untuk mensimulasi impak ekonomi Selangor." },
      { property: "og:title", content: "Simulasi · Input-Output Selangor" },
      { property: "og:description", content: "Sehingga 10 senario perbelanjaan mengikut kod MSIC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SimulationPage,
});

function SimulationPage() {
  const { scenarios, setScenarios } = useSimulation();
  const [active, setActive] = useState("s1");
  const [q, setQ] = useState("");
  const [value, setValue] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const sc = scenarios.find((s) => s.id === active)!;

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return MSIC.filter((m) => m.code.includes(s) || m.desc.toLowerCase().includes(s)).slice(0, 12);
  }, [q]);

  const update = (fn: (e: typeof sc.entries) => typeof sc.entries) =>
    setScenarios((all) => all.map((s) => (s.id === active ? { ...s, entries: fn(s.entries) } : s)));

  const add = () => {
    const v = parseFloat(value.replace(/,/g, ""));
    if (!picked || !v) return;
    update((e) => [...e, { id: crypto.randomUUID(), msic: picked, value: v }]);
    setPicked(null); setQ(""); setValue("");
  };

  const loadSample = () =>
    update(() => [
      { id: crypto.randomUUID(), msic: "41001", value: 50_000_000 },
      { id: crypto.randomUUID(), msic: "26101", value: 120_000_000 },
      { id: crypto.randomUUID(), msic: "01120", value: 5_000_000 },
    ].filter((e) => MSIC.some((m) => m.code === e.msic)));

  const total = (s: typeof sc) => s.entries.reduce((a, e) => a + e.value, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Senario</p>
        {scenarios.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`flex w-full justify-between rounded-sm px-3 py-2 text-left text-sm ${s.id === active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
            <span>{s.name}</span>
            <span className="font-mono text-xs opacity-75">{s.entries.length || ""}</span>
          </button>
        ))}
        <p className="pt-3 text-xs text-muted-foreground">Semua senario dijumlahkan ke papan pemuka.</p>
      </aside>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{sc.name}</h1>
            <p className="text-sm text-muted-foreground">Jumlah: <span className="font-mono font-semibold text-foreground">RM {fmtNum(total(sc))}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadSample} className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-secondary">Isi contoh</button>
            <button onClick={() => update(() => [])} className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-secondary">Kosongkan</button>
            <Link to="/" className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Lihat papan pemuka →</Link>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Tambah perbelanjaan</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px_auto]">
            <div className="relative">
              <input value={picked ? `${picked} · ${MSIC.find((m) => m.code === picked)?.desc}` : q}
                onChange={(e) => { setPicked(null); setQ(e.target.value); }}
                placeholder="Cari kod MSIC atau penerangan (cth. padi, 41001)"
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
              {!picked && matches.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-border bg-popover shadow-lg">
                  {matches.map((m) => (
                    <li key={m.code}>
                      <button onClick={() => setPicked(m.code)} className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary">
                        <span className="font-mono text-primary">{m.code}</span> {m.desc}
                        <span className="block text-xs text-muted-foreground">→ {m.sector}. {SECTOR_NAMES[m.sector - 1]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Nilai (RM)" inputMode="decimal"
              className="rounded-sm border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring" />
            <button onClick={add} disabled={!picked || !value}
              className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">Tambah</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">MSIC</th><th className="p-3">Penerangan</th><th className="p-3">Sektor I-O</th><th className="p-3 text-right">Nilai (RM)</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {sc.entries.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Belum ada input dalam senario ini.</td></tr>}
              {sc.entries.map((e) => {
                const m = MSIC.find((x) => x.code === e.msic);
                return (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-3 font-mono">{e.msic}</td>
                    <td className="p-3">{m?.desc}</td>
                    <td className="p-3 text-muted-foreground">{m ? `${m.sector}. ${SECTOR_NAMES[m.sector - 1]}` : "-"}</td>
                    <td className="p-3 text-right">
                      <input type="number" value={e.value}
                        onChange={(ev) => update((all) => all.map((x) => (x.id === e.id ? { ...x, value: Number(ev.target.value) } : x)))}
                        className="w-40 rounded-sm border border-input bg-background px-2 py-1 text-right font-mono" />
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => update((all) => all.filter((x) => x.id !== e.id))} className="text-xs text-destructive hover:underline">Buang</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
