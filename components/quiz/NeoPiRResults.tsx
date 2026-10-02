"use client";

import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { FACET_NAMES, DOMAINS } from "@/components/exams/personales/psicometria/neo-pi-r/facetKey";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS: Record<string, string> = { N: "#65a30d", E: "#64748b", O: "#ca8a04", A: "#4d7c0f", C: "#16a34a" };

export function NeoPiRResults({ result, onExit }: { result: any; onExit?: () => void }) {
  const domainT = result.domains as Record<string, number>;
  const facetsT = result.facets as number[][];
  const data = DOMAINS.map((d) => ({ name: d, value: domainT[d] ?? 50 }));

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-[#012216] dark:via-[#023320] dark:via-40% dark:to-[#3c5a21] z-[250] custom-scrollbar transition-colors">
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <BackgroundAnimation />
      </div>
      
      <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
        <h2 className="text-2xl font-black italic text-slate-900 dark:text-white uppercase">NEO PI-R — Perfil T (media 50 ±10)</h2>
        <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-widest mt-1">Bajo &lt;45 · Promedio 45-55 · Alto &gt;55 — Baremo por sexo: {result.gender}</p>
        
        <Card className="mt-6 p-6 bg-white dark:bg-[#063924]/60 border border-slate-200 dark:border-[#0b4a30] backdrop-blur-xl rounded-2xl shadow-sm dark:shadow-none">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fill: "currentColor", fontSize: 12 }} className="text-slate-700 dark:text-white" />
                <YAxis domain={[20, 80]} tick={{ fill: "currentColor" }} className="text-slate-700 dark:text-white" />
                <Tooltip 
                  formatter={(value: any) => [`${value}`, "Puntuación T "]}
                  contentStyle={{ 
                    backgroundColor: "var(--tooltip-bg, #ffffff)", 
                    borderColor: "var(--tooltip-border, #cbd5e1)", 
                    borderRadius: "12px", 
                    color: "var(--tooltip-color, #0f172a)" 
                  }}
                  // Solución limpia usando estilos en línea condicionales o inyectados por clases globales de Tailwind en el contenedor padre si aplica, 
                  // o usando variables CSS manejadas por el tema oscuro:
                />
                <Bar dataKey="value">
                  {data.map((e) => <Cell key={e.name} fill={COLORS[e.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs">
            {data.map((d, di) => (
              <span key={d.name} className="text-slate-700 dark:text-white/70">
                <span className="inline-block w-3 h-3 rounded-sm mr-1 shadow-xs" style={{ background: COLORS[d.name] }} />
                {d.name} ({["Neuroticismo","Extraversión","Apertura","Amabilidad","Responsabilidad"][di]}): <b className="text-slate-900 dark:text-white">T {d.value}</b>
              </span>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-5 gap-4 mt-6">
          {DOMAINS.map((d, di) => (
            <Card key={d} className="p-4 bg-white dark:bg-[#063924]/60 border border-slate-200 dark:border-[#0b4a30] backdrop-blur-xl rounded-2xl shadow-sm dark:shadow-none">
              <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">{d} — {["Neuroticismo","Extraversión","Apertura","Amabilidad","Responsabilidad"][di]}</h3>
              <p className="text-[10px] text-amber-600 dark:text-[#d0b04d] font-bold mt-0.5">Puntuación T: {domainT[d]}</p>
              <ul className="mt-2 text-xs text-slate-600 dark:text-white/60 space-y-1">
                {FACET_NAMES[d].map((f, fi) => (
                  <li key={f} className="flex justify-between items-center border-t border-slate-100 dark:border-[#0b4a30]/40 pt-1">
                    <span className="truncate pr-2 text-[11px]">{f}</span>
                    <b className="text-slate-900 dark:text-white text-[11px]">{facetsT[di][fi]}</b>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {onExit && (
          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline" 
              onClick={onExit} 
              className="bg-white hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200 text-slate-800 border-slate-300 dark:bg-[#0b3320]/80 dark:border-[#14532d] dark:text-white/70 dark:hover:bg-[#114d2e] dark:hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6 shadow-sm dark:shadow-none"
            >
              Volver
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}