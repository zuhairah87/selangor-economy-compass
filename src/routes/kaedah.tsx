import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kaedah")({
  head: () => ({
    meta: [
      { title: "Kaedah · Input-Output Selangor" },
      { name: "description", content: "Bagaimana papan pemuka mengira KDNK, import, pekerjaan dan produktiviti daripada jadual I-O Selangor." },
      { property: "og:title", content: "Kaedah · Input-Output Selangor" },
      { property: "og:description", content: "Aliran pengiraan: Simulasi → Input Calc → S LINK → Backend IO → Papan pemuka." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Method,
});

const steps = [
  ["Simulasi", "Pengguna memasukkan nilai (RM) bagi setiap kod MSIC, sehingga 10 senario."],
  ["MSIC / BMBI", "Setiap kod MSIC 5-digit dipadankan kepada satu daripada 119 sektor I-O. BMBI ialah jadual padanan (MSIC 2008 BM/BI → sektor I-O) yang membina senarai MSIC."],
  ["Input Calc", "Nilai MSIC dijumlahkan (SUMIF) kepada 119 sektor bagi setiap senario, kemudian 10 senario dijumlahkan."],
  ["S LINK", "Vektor jumlah permintaan 119 sektor yang dihantar ke Backend IO (dibahagi 1,000 → RM ribu)."],
  ["Backend IO", "Jadual I-O Selangor → pekali input (A) → matriks songsang Leontief (I−A)⁻¹ → pengganda KDNK, import, pekerjaan & pampasan pekerja."],
  ["Papan pemuka", "Impak = pengganda × permintaan. Produktiviti = KDNK ÷ pekerjaan. Dijumlah kepada 5 sektor utama dan disusun mengikut 119 industri."],
];

function Method() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Kaedah pengiraan</h1>
      <ol className="space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-sm border border-border bg-card p-4">
            <span className="font-mono text-2xl font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
            <div><div className="font-semibold">{t}</div><p className="text-sm text-muted-foreground">{d}</p></div>
          </li>
        ))}
      </ol>
      <div className="rounded-sm border border-border bg-secondary p-4 font-mono text-sm leading-7">
        x = (I − A)⁻¹ · d<br />
        KDNK<sub>i</sub> = v<sub>i</sub> · x<sub>i</sub> &nbsp; Import<sub>i</sub> = m<sub>i</sub> · x<sub>i</sub><br />
        Pekerjaan<sub>i</sub> = e<sub>i</sub> · x<sub>i</sub> × 1000 &nbsp; Produktiviti = KDNK / Pekerjaan
      </div>
      <p className="text-xs text-muted-foreground">Nota: Pekerjaan merujuk kepada full-time equivalent (FTE) — 1 pekerja = 40 jam/minggu.</p>
    </div>
  );
}
