import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MSIC, simulate, SECTOR_NAMES } from "./io-model";

export type Entry = { id: string; msic: string; value: number };
export type Scenario = { id: string; name: string; entries: Entry[] };

const KEY = "selangor-io-scenarios-v1";
const defaultScenarios = (): Scenario[] =>
  Array.from({ length: 10 }, (_, i) => ({ id: `s${i + 1}`, name: `Simulasi ${i + 1}`, entries: [] }));

type Ctx = {
  scenarios: Scenario[];
  setScenarios: (fn: (s: Scenario[]) => Scenario[]) => void;
  calculated: Scenario[] | null; // snapshot used by the dashboard
  calculate: () => void;
  dirty: boolean;
  demand: number[]; // S LINK: RM per 119 sector (sum of all simulations)
  results: ReturnType<typeof simulate>;
};
const SimCtx = createContext<Ctx | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [scenarios, setState] = useState<Scenario[]>(defaultScenarios);
  const [calculated, setCalculated] = useState<Scenario[] | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
      const c = localStorage.getItem(KEY + "-calc");
      if (c) setCalculated(JSON.parse(c));
    } catch {}
  }, []);
  const calculate = () => {
    setCalculated(scenarios);
    localStorage.setItem(KEY + "-calc", JSON.stringify(scenarios));
  };
  const dirty = JSON.stringify(scenarios) !== JSON.stringify(calculated ?? defaultScenarios());
  const setScenarios = (fn: (s: Scenario[]) => Scenario[]) =>
    setState((prev) => {
      const next = fn(prev);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

  // Input Calc: SUMIF each simulation's MSIC entries into 119 sectors, then total (S LINK)
  const demand = useMemo(() => {
    const d = new Array(SECTOR_NAMES.length).fill(0);
    const byCode = new Map(MSIC.map((m) => [m.code, m.sector]));
    for (const s of calculated ?? [])
      for (const e of s.entries) {
        const sec = byCode.get(e.msic);
        if (sec) d[sec - 1] += e.value || 0;
      }
    return d;
  }, [calculated]);
  const results = useMemo(() => simulate(demand), [demand]);

  return (
    <SimCtx.Provider value={{ scenarios, setScenarios, calculated, calculate, dirty, demand, results }}>{children}</SimCtx.Provider>
  );
}

export function useSimulation() {
  const c = useContext(SimCtx);
  if (!c) throw new Error("useSimulation outside provider");
  return c;
}
