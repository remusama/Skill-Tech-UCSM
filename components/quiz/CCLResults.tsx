"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { CCL_DIMENSION_LABEL, CCLDimension } from "@/components/exams/personales/psicometria/ccl/cclItems";
import { CCL_LEVEL_LABEL, CCLLevel } from "@/components/exams/personales/psicometria/ccl/cclScoring";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  result: {
    scores: Record<string, number>;
    levels: Record<string, string>;
    nivel_general: number;
    offline?: boolean;
  };
  onExit?: () => void;
};

const LEVEL_COLOR: Record<CCLLevel, string> = {
  bajo: "#ef4444",
  medio: "#d0b04d",
  alto: "#22c55e",
};

const DIMENSION_ORDER: CCLDimension[] = [
  "mando_crisis",
  "vision_inspiracion",
  "empatia_vinculo",
  "decision_participativa",
  "altos_estandares",
  "coaching_desarrollo",
];

export function CCLResults({ result, onExit }: Props) {
  const scores = result.scores as Record<CCLDimension, number>;
  const levels = result.levels as Record<CCLDimension, CCLLevel>;

  const radarData = DIMENSION_ORDER.map((d) => ({
    dimension: CCL_DIMENSION_LABEL[d],
    key: d,
    value: scores[d] ?? 0,
  }));

  return (
    <div className="fixed inset-0 z-[250] bg-[#0B0121] overflow-y-auto custom-scrollbar">
      <div className="relative min-h-screen w-full flex flex-col pt-6 pb-12 bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
        <BackgroundAnimation />
        <div className="max-w-5xl mx-auto w-full px-6 relative z-10 pb-8">
          <h2 className="text-2xl font-black italic text-white uppercase">
            Resultado CCL — Nivel general: {result.nivel_general}%
          </h2>
          {result.offline && <p className="text-xs text-white/40 mt-1">Resultado local (sin conexión al servidor).</p>}
          <p className="text-sm text-white/60 mt-2">
            Evaluación de 6 competencias de liderazgo aplicadas al desempeño (marco de Goleman).
          </p>

          <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#0b4a30" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: "#fff", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 30]} tick={{ fill: "#ffffff80" }} />
                  <Radar dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
                  <Tooltip
                    formatter={(value: any) => [`${value}/30`, "Puntaje"]}
                    contentStyle={{ backgroundColor: "#063924", borderColor: "#0b4a30", borderRadius: "12px", color: "#fff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Detalle por competencia</h3>
            <div className="space-y-3">
              {DIMENSION_ORDER.map((d) => (
                <div key={d} className="flex items-center justify-between gap-4 py-2 border-t border-[#0b4a30]/60 first:border-t-0 first:pt-0">
                  <div>
                    <p className="text-sm font-bold text-white">{CCL_DIMENSION_LABEL[d]}</p>
                    <p className="text-xs text-white/50">{CCL_LEVEL_LABEL[levels[d]]}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-white/70">{scores[d]}/30</span>
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: `${LEVEL_COLOR[levels[d]]}30`, color: LEVEL_COLOR[levels[d]] }}
                    >
                      {levels[d]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
