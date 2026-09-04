"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { FACET_NAMES, DOMAINS } from "@/components/exams/personales/psicometria/neo-pi-r/facetKey";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS: Record<string, string> = { N: "#baef00", E: "#c0c0ba", O: "#d0b04d", A: "#85a02f", C: "#cae13c" };

export function NeoPiRResults({ result, onExit }: { result: any; onExit?: () => void }) {
  const domainT = result.domains as Record<string, number>;
  const facetsT = result.facets as number[][];
  const data = DOMAINS.map((d) => ({ name: d, value: domainT[d] ?? 50 }));

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
        <h2 className="text-2xl font-black italic text-white uppercase">NEO PI-R — Perfil T (media 50 ±10)</h2>
        <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Bajo &lt;45 · Promedio 45-55 · Alto &gt;55 — Baremo por sexo: {result.gender}</p>
        
        <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 12 }} />
                <YAxis domain={[20, 80]} tick={{ fill: "#fff" }} />
                <Tooltip 
                  formatter={(value: any) => [`${value}`, "Puntuación T "]}
                  contentStyle={{ backgroundColor: "#063924", borderColor: "#0b4a30", borderRadius: "12px", color: "#fff" }} 
                />
                <Bar dataKey="value">
                  {data.map((e) => <Cell key={e.name} fill={COLORS[e.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs">
            {data.map((d, di) => (
              <span key={d.name} className="text-white/70">
                <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: COLORS[d.name] }} />
                {d.name} ({["Neuroticismo","Extraversión","Apertura","Amabilidad","Responsabilidad"][di]}): <b className="text-white">T {d.value}</b>
              </span>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-5 gap-4 mt-6">
          {DOMAINS.map((d, di) => (
            <Card key={d} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
              <h3 className="font-black text-white text-xs uppercase tracking-wider">{d} — {["Neuroticismo","Extraversión","Apertura","Amabilidad","Responsabilidad"][di]}</h3>
              <p className="text-[10px] text-[#d0b04d] font-bold mt-0.5">Puntuación T: {domainT[d]}</p>
              <ul className="mt-2 text-xs text-white/60 space-y-1">
                {FACET_NAMES[d].map((f, fi) => (
                  <li key={f} className="flex justify-between items-center border-t border-[#0b4a30]/40 pt-1">
                    <span className="truncate pr-2 text-[11px]">{f}</span>
                    <b className="text-white text-[11px]">{facetsT[di][fi]}</b>
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
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6"
            >
              Volver
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}