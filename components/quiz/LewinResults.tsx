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
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
        <h2 className="text-2xl font-black italic text-white uppercase">Resultado — Estilo Dominante: {LEWIN_STYLE_LABEL[dominant] ?? dominant}</h2>
        {result.isTied && <p className="text-xs text-amber-300 mt-1">Empate detectado entre estilos — interpretación combinada.</p>}
        {result.offline && <p className="text-xs text-white/40 mt-1">Resultado local (sin conexión al servidor).</p>}
        <p className="text-sm text-white/60 mt-2">{LEWIN_STYLE_DESCRIPTION[dominant]}</p>

        <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 12 }} />
                <YAxis domain={[0, 11]} tick={{ fill: "#fff" }} />
                <Tooltip 
                  formatter={(value: any) => [`${value}`, "valor "]}
                  contentStyle={{ backgroundColor: "#063924", borderColor: "#0b4a30", borderRadius: "12px", color: "#fff" }} 
                />
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

        <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl overflow-x-auto">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-3">Tabla interpretativa</h3>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-white/50 text-xs uppercase"><th className="text-left p-2">Rasgo</th><th className="text-left p-2">Autoritario</th><th className="text-left p-2">Democrático</th><th className="text-left p-2">Laissez-faire</th></tr></thead>
            <tbody>
              {(Object.keys(LEWIN_TRAITS) as (keyof typeof LEWIN_TRAITS)[]).map((trait) => (
                <tr key={trait} className="border-t border-[#0b4a30]/60">
                  <td className="p-2 font-bold text-white/80 capitalize">{trait}</td>
                  {(["autoritario", "democratico", "laissez-faire"] as LeadershipStyle[]).map((s) => (
                    <td key={s} className={`p-2 text-white/60 ${s === dominant ? "bg-[#164e32]/80 text-white font-semibold" : ""}`}>{LEWIN_TRAITS[trait][s]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

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