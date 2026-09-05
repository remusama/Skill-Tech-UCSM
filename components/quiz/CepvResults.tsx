"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { CEPV_DIMENSION_LABELS, cepvOpenQuestions } from "@/components/exams/personales/expectativas/cepv20Items";

type Props = {
  result: {
    avg: Record<string, string | number>;
    openAns?: Record<string | number, string>;
    overall_avg?: number;
  };
  onExit?: () => void;
};

export function CepvResults({ result, onExit }: Props) {
  const avg = result.avg || {};
  const openAns = result.openAns || {};

  return (
    <div className="fixed inset-0 z-[250] bg-[#0B0121] overflow-y-auto custom-scrollbar">
      <div className="relative min-h-screen w-full flex flex-col pt-6 pb-12">
        <BackgroundAnimation />
        <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />
        <div className="max-w-4xl mx-auto w-full px-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black italic text-white uppercase">
                CEPV-20 — Resultados de Expectativas Vivenciales
              </h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mt-1">
                Puntajes promedio por dimensión (Escala 1 a 5)
              </p>
            </div>
            {onExit && (
              <Button onClick={onExit} variant="ghost" className="text-white/50 hover:text-white">
                ✕ Cerrar
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {Object.entries(avg).map(([k, v]) => (
              <Card key={k} className="p-5 bg-white/[0.04] border-white/10 rounded-2xl shadow-xl">
                <p className="text-xs text-violet-300 uppercase font-bold tracking-wider mb-2">
                  {CEPV_DIMENSION_LABELS[k as keyof typeof CEPV_DIMENSION_LABELS] || k}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{String(v)}</span>
                  <span className="text-xs text-white/40 font-bold">/ 5.0</span>
                </div>
              </Card>
            ))}
          </div>

          {openAns && Object.keys(openAns).length > 0 && (
            <Card className="mt-6 p-6 bg-white/[0.04] border-white/10 rounded-2xl shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
                Respuestas Abiertas
              </h3>
              <div className="space-y-4">
                {cepvOpenQuestions.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <p className="text-xs text-violet-300 font-bold mb-1">{q.text}</p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {openAns[q.id] || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {onExit && (
            <div className="mt-8 flex justify-end">
              <Button
                onClick={onExit}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl shadow-xl hover:brightness-110"
              >
                Volver a SKILL NEXUS →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
