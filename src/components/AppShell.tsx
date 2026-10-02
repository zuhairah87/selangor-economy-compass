import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Papan Pemuka" },
  { to: "/simulasi", label: "Simulasi" },
  { to: "/bandingan", label: "Bandingan" },
  { to: "/industri", label: "119 Industri" },
  { to: "/sektor-utama", label: "Sektor Utama" },
  { to: "/kaedah", label: "Kaedah" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-sm bg-accent font-mono text-sm font-bold text-accent-foreground">
              IO
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-tight">Input-Output Selangor</div>
              <div className="text-xs opacity-75">Simulasi impak ekonomi · 119 sektor</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-sm px-3 py-1.5 text-sm opacity-80 transition hover:bg-primary-foreground/10 hover:opacity-100"
                activeProps={{ className: "bg-primary-foreground/15 !opacity-100 font-medium" }}
                activeOptions={{ exact: true }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
