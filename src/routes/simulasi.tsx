import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const { scenarios, setScenarios, calculate, dirty } = useSimulation();
  const navigate = useNavigate();
  const [review, setReview] = useState(false);
  const [active, setActive] = useState("s1");
  const [q, setQ] = useState("");
  const [value, setValue] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const sc = scenarios.find((s) => s.id === active)!;

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return MSIC.filter((m) => m.code.includes(s) || m.desc.toLowerCase().includes(s) || m.descEn.toLowerCase().includes(s)).slice(0, 12);
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
            {dirty && <p className="text-xs font-medium text-accent-foreground bg-accent/30 inline-block px-2 py-0.5 rounded-sm">Perubahan belum dikira</p>}
            <p className="text-sm text-muted-foreground">Jumlah: <span className="font-mono font-semibold text-foreground">RM {fmtNum(total(sc))}</span></p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadSample} className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-secondary">Isi contoh</button>
            <button onClick={() => update(() => [])} className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-secondary">Kosongkan</button>
            <button onClick={() => setReview(true)} className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Semak & kira impak →</button>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Tambah perbelanjaan</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px_auto]">
            <div className="relative">
              <input value={picked ? `${picked} · ${MSIC.find((m) => m.code === picked)?.desc}` : q}
                onChange={(e) => { setPicked(null); setQ(e.target.value); }}
                placeholder="Cari kod MSIC / keterangan BM atau English (cth. padi, paddy, 41001)"
                className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
              {!picked && matches.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-border bg-popover shadow-lg">
                  {matches.map((m) => (
                    <li key={m.code}>
                      <button onClick={() => setPicked(m.code)} className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary">
                        <span className="font-mono text-primary">{m.code}</span> {m.desc}
                        {m.descEn && <span className="block text-xs italic text-muted-foreground">{m.descEn}</span>}
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
                    <td className="p-3">{m?.desc}{m?.descEn && <span className="block text-xs italic text-muted-foreground">{m.descEn}</span>}</td>
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
      {review && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={() => setReview(false)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-sm bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold">Semak industri dipilih</h2>
            <p className="text-sm text-muted-foreground">Kejutan permintaan akhir yang akan dihantar ke model I-O (Input Calc → S LINK).</p>
            {(() => {
              const agg = new Map<number, number>();
              scenarios.forEach((s) => s.entries.forEach((e) => {
                const m = MSIC.find((x) => x.code === e.msic);
                if (m) agg.set(m.sector, (agg.get(m.sector) ?? 0) + e.value);
              }));
              const list = [...agg.entries()].sort((a, b) => b[1] - a[1]);
              const sum = list.reduce((a, [, v]) => a + v, 0);
              return (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-px bg-border text-sm">
                    {scenarios.filter((s) => s.entries.length).map((s) => (
                      <div key={s.id} className="flex justify-between bg-card p-2"><span>{s.name} ({s.entries.length})</span><span className="font-mono">RM {fmtNum(total(s))}</span></div>
                    ))}
                  </div>
                  <table className="mt-4 w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Sektor I-O (119)</th><th className="py-2 text-right">Kejutan (RM)</th></tr></thead>
                    <tbody>
                      {list.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">Tiada input.</td></tr>}
                      {list.map(([sec, v]) => (
                        <tr key={sec} className="border-t border-border"><td className="py-2"><span className="mr-2 font-mono text-xs text-muted-foreground">{sec}</span>{SECTOR_NAMES[sec - 1]}</td><td className="py-2 text-right font-mono">{fmtNum(v)}</td></tr>
                      ))}
                      <tr className="border-t-2 border-foreground font-semibold"><td className="py-2">Jumlah</td><td className="py-2 text-right font-mono">{fmtNum(sum)}</td></tr>
                    </tbody>
                  </table>
                  <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => setReview(false)} className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-secondary">Kembali ubah</button>
                    <button disabled={!list.length} onClick={() => { calculate(); setReview(false); navigate({ to: "/" }); }}
                      className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">Kira impak</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
