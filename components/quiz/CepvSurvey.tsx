"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { cepvLikertItems, cepvOpenQuestions, CEPV_DIMENSION_LABELS } from "@/components/exams/personales/expectativas/cepv20Items";

export function CepvSurvey({ onExit }: { onExit?: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [openAns, setOpenAns] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  
  const answered = Object.keys(answers).length;
  const progress = Math.round(((answered + Object.keys(openAns).filter(k => openAns[Number(k)]?.trim()).length) / 23) * 100);

  function submit() {
    const byDim: Record<string, number[]> = {};
    cepvLikertItems.forEach(it => { (byDim[it.dimension] ||= []).push(answers[it.id] || 0); });
    const avg = Object.fromEntries(Object.entries(byDim).map(([k, v]) => [k, v.filter(Boolean).length ? (v.reduce((a, b) => a + b, 0) / v.filter(Boolean).length).toFixed(2) : "0"]));
    setResult({ avg, openAns });
  }

  if (result) {
    return (
      <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
        <BackgroundAnimation />
        <div className="max-w-4xl mx-auto w-full px-6 relative z-10 pb-8">
          <h2 className="text-2xl font-black italic text-white uppercase">CEPV-20 — Resultados promedio por dimensión</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {Object.entries(result.avg).map(([k, v]) => (
              <Card key={k} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl flex flex-col justify-between">
                <p className="text-xs text-[#d0b04d] uppercase font-bold tracking-widest">{CEPV_DIMENSION_LABELS[k as keyof typeof CEPV_DIMENSION_LABELS]}</p>
                <p className="text-2xl font-black text-white mt-4">{String(v)}/5</p>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
            <h3 className="text-sm font-black uppercase text-white mb-3">Respuestas abiertas</h3>
            {cepvOpenQuestions.map(q => (
              <div key={q.id} className="mb-4">
                <p className="text-xs text-[#d0b04d] font-bold">{q.text}</p>
                <p className="text-sm text-white/80 mt-1 p-3 rounded-xl bg-[#0b3320]/80 border border-[#14532d]">{result.openAns[q.id] || "—"}</p>
              </div>
            ))}
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

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <h2 className="text-2xl font-black italic text-white uppercase">CEPV-20 — Expectativas de Programas Vivenciales</h2>
        <p className="text-xs text-white/50 uppercase tracking-widest mt-1">20 Likert 1-5 (por dimensión) + 3 abiertas</p>
        <div className="mt-3">
          <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
        </div>
        <p className="text-xs text-white/40 mt-1">{answered}/20 Likert · {Object.keys(openAns).filter(k => openAns[Number(k)]?.trim()).length}/3 abiertas</p>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-6 mt-4">
          {Object.entries(CEPV_DIMENSION_LABELS).map(([dim, label]) => (
            <Card key={dim} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#d0b04d]">{label}</h3>
              {cepvLikertItems.filter(it => it.dimension === dim).map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0b3320]/80 border border-[#14532d]">
                  <p className="text-sm text-white/90 flex-1">{item.id}. {item.text}</p>
                  <div className="flex gap-1.5 shrink-0">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v} 
                        onClick={() => setAnswers(p => ({ ...p, [item.id]: v }))} 
                        className={`w-9 h-9 rounded-xl text-[10px] font-black border transition-all ${answers[item.id] === v ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"}`}
                      >
                        {["TD", "D", "N", "A", "TA"][v - 1]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}

          {cepvOpenQuestions.map(q => (
            <Card key={q.id} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
              <p className="text-sm text-white/90 mb-2 font-medium">{q.text}</p>
              <textarea 
                value={openAns[q.id] || ""} 
                onChange={e => setOpenAns(p => ({ ...p, [q.id]: e.target.value }))} 
                className="w-full min-h-[80px] p-3 rounded-xl bg-[#0b3320]/80 border border-[#14532d] text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e]" 
                placeholder="Escribe tu respuesta..." 
              />
            </Card>
          ))}
        </div>

        <div className="pb-6 flex justify-between items-center gap-4">
          {onExit && (
            <Button 
              variant="outline" 
              onClick={onExit} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6"
            >
              Salir
            </Button>
          )}
          <Button 
            onClick={submit} 
            className="ml-auto bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl border border-[#063924]"
          >
            Ver promedios
          </Button>
        </div>
      </div>
    </div>
  );
}