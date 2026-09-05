"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { LEWIN_TRAITS, LEWIN_STYLE_LABEL, LEWIN_STYLE_DESCRIPTION } from "@/components/exams/personales/psicometria/kurtLewinInterpretation";
import { LeadershipStyle } from "@/components/exams/personales/psicometria/kurtLewinItems";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Props = { result: { counts: Record<string, number>; dominant: string; isTied?: boolean; offline?: boolean }; onExit?: () => void };

const COLORS: Record<string, string> = { autoritario: "#baef00", democratico: "#c0c0ba", "laissez-faire": "#d0b04d" };

export function LewinResults({ result, onExit }: Props) {
  const counts = result.counts as Record<LeadershipStyle, number>;
  const dominant = result.dominant as LeadershipStyle;
  const data = (["autoritario", "democratico", "laissez-faire"] as LeadershipStyle[]).map((k) => ({ name: LEWIN_STYLE_LABEL[k], key: k, value: counts[k] ?? 0 }));

  return (
    <div className="fixed inset-0 z-[250] bg-[#0B0121] overflow-y-auto custom-scrollbar">
      <div className="relative min-h-screen w-full flex flex-col pt-6 pb-12">
        <BackgroundAnimation />
        <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />
        <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
          <h2 className="text-2xl font-black italic text-white uppercase">Resultado — Estilo Dominante: {LEWIN_STYLE_LABEL[dominant] ?? dominant}</h2>
          {result.isTied && <p className="text-xs text-amber-300 mt-1">Empate detectado entre estilos — interpretación combinada.</p>}
          {result.offline && <p className="text-xs text-white/40 mt-1">Resultado local (sin conexión al servidor).</p>}
          <p className="text-sm text-white/60 mt-2">{LEWIN_STYLE_DESCRIPTION[dominant]}</p>

          <Card className="mt-6 p-6 bg-white/[0.04] border-white/10 rounded-2xl">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 12 }} />
                  <YAxis domain={[0, 11]} tick={{ fill: "#fff" }} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {data.map((e) => <Cell key={e.key} fill={COLORS[e.key]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center mt-4 text-xs">
              {data.map((d) => <span key={d.key} className="text-white/70"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: COLORS[d.key] }} />{d.name}: <b className="text-white">{d.value}/11</b></span>)}
            </div>
          </Card>

          <Card className="mt-6 p-6 bg-white/[0.04] border-white/10 rounded-2xl overflow-x-auto">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3">Tabla interpretativa</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-white/50 text-xs uppercase"><th className="text-left p-2">Rasgo</th><th className="text-left p-2">Autoritario</th><th className="text-left p-2">Democrático</th><th className="text-left p-2">Laissez-faire</th></tr></thead>
              <tbody>
                {(Object.keys(LEWIN_TRAITS) as (keyof typeof LEWIN_TRAITS)[]).map((trait) => (
                  <tr key={trait} className="border-t border-white/5">
                    <td className="p-2 font-bold text-white/80 capitalize">{trait}</td>
                    {(["autoritario", "democratico", "laissez-faire"] as LeadershipStyle[]).map((s) => (
                      <td key={s} className={`p-2 text-white/60 ${s === dominant ? "bg-[#bf00ff]/10 text-white" : ""}`}>{LEWIN_TRAITS[trait][s]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {onExit && (
            <div className="mt-6 flex justify-end">
              <Button onClick={onExit} className="bg-gradient-to-r from-[#7a00cc] to-[#bf00ff] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl shadow-lg hover:brightness-110">
                Ir a Diagnóstico / SKILL NEXUS →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}