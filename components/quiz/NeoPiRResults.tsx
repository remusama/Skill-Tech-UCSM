"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { FACET_NAMES, DOMAINS } from "@/components/exams/personales/psicometria/neo-pi-r/facetKey";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
const COLORS: Record<string, string> = { N: "#ef4444", E: "#22c55e", O: "#eab308", A: "#3b82f6", C: "#a855f7" };
export function NeoPiRResults({ result, onExit }: { result: any; onExit?: () => void }) {
  const domainT = result.domains as Record<string, number>;
  const facetsT = result.facets as number[][];
  const data = DOMAINS.map((d) => ({ name: d, value: domainT[d] ?? 50 }));
  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden">
      <BackgroundAnimation />
      <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />
      <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
        <h2 className="text-2xl font-black italic text-white uppercase">NEO PI-R — Perfil T (media 50 ±10)</h2>
        <p className="text-xs text-white/50">Bajo &lt;45 · Promedio 45-55 · Alto &gt;55 — Baremo por sexo: {result.gender}</p>
        <Card className="mt-6 p-6 bg-white/[0.04] border-white/10 rounded-2xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fill: "#fff" }} />
                <YAxis domain={[20, 80]} tick={{ fill: "#fff" }} />
                <Tooltip />
                <Bar dataKey="value">{data.map((e) => <Cell key={e.name} fill={COLORS[e.name]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="grid md:grid-cols-5 gap-4 mt-6">
          {DOMAINS.map((d, di) => (
            <Card key={d} className="p-4 bg-white/[0.04] border-white/10 rounded-2xl">
              <h3 className="font-black text-white text-sm">{d} — {["Neuroticismo","Extraversión","Apertura","Amabilidad","Responsabilidad"][di]} — T {domainT[d]}</h3>
              <ul className="mt-2 text-xs text-white/60 space-y-1">
                {FACET_NAMES[d].map((f, fi) => (
                  <li key={f} className="flex justify-between"><span>{f}</span><b className="text-white">{facetsT[di][fi]}</b></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        {onExit && <div className="mt-6 flex justify-end"><Button onClick={onExit} className="bg-white text-black font-bold">Volver</Button></div>}
      </div>
    </div>
  );
}
