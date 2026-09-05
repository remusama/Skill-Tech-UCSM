"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { cepvLikertItems, cepvOpenQuestions, CEPV_DIMENSION_LABELS } from "@/components/exams/personales/expectativas/cepv20Items";
import { API_URL } from "@/lib/config";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function CepvSurvey({ onExit }: { onExit?: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [openAns, setOpenAns] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const answered = Object.keys(answers).length;
  const progress = Math.round(((answered + Object.keys(openAns).filter(k => openAns[Number(k)]?.trim()).length) / 23) * 100);

  async function submit() {
    const byDim: Record<string, number[]> = {};
    cepvLikertItems.forEach(it => { (byDim[it.dimension] ||= []).push(answers[it.id] || 0); });
    const avg = Object.fromEntries(Object.entries(byDim).map(([k, v]) => [k, v.filter(Boolean).length ? (v.reduce((a, b) => a + b, 0) / v.filter(Boolean).length).toFixed(2) : "0"]));
    
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/diagnosis/cepv/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers, openAns, avg })
      });
    } catch (e) {
      console.warn("Offline fallback for CEPV survey:", e);
    } finally {
      setSubmitting(false);
      setResult({ avg, openAns });
      window.dispatchEvent(new CustomEvent('refresh-skills'));
    }
  }

  if (result) {
    return (
      <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
        <BackgroundAnimation />
        <div className="max-w-4xl mx-auto w-full px-6 relative z-10 pb-8">
          <h2 className="text-2xl font-black italic text-white uppercase">CEPV-20 — Resultados promedio por dimensión</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {Object.entries(result.avg).map(([k, v]) => (
              <Card key={k} className="p-4 bg-white/[0.04] border-white/10 rounded-2xl">
                <p className="text-xs text-violet-300 uppercase font-bold">{CEPV_DIMENSION_LABELS[k as keyof typeof CEPV_DIMENSION_LABELS]}</p>
                <p className="text-2xl font-black text-white mt-1">{String(v)}/5</p>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
            <h3 className="text-sm font-black uppercase text-white mb-3">Respuestas abiertas</h3>
            {cepvOpenQuestions.map(q => (
              <div key={q.id} className="mb-4">
                <p className="text-xs text-violet-300">{q.text}</p>
                <p className="text-sm text-white/80 mt-1 p-3 rounded-xl bg-black/20">{result.openAns[q.id] || "—"}</p>
              </div>
            ))}
          </Card>
          {onExit && (
            <div className="mt-6 flex justify-end">
              <Button onClick={onExit} className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl shadow-lg hover:brightness-110">
                Ir a Diagnóstico / SKILL NEXUS →
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
        <Progress value={progress} className="h-2 mt-3" />
        <p className="text-xs text-white/40 mt-1">{answered}/20 Likert · {Object.keys(openAns).filter(k => openAns[Number(k)]?.trim()).length}/3 abiertas</p>
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-6 mt-4">
          {Object.entries(CEPV_DIMENSION_LABELS).map(([dim, label]) => (
            <Card key={dim} className="p-4 bg-white/[0.04] border-white/10 rounded-2xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-violet-300">{label}</h3>
              {cepvLikertItems.filter(it => it.dimension === dim).map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/20">
                  <p className="text-sm text-white/80 flex-1">{item.id}. {item.text}</p>
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setAnswers(p => ({ ...p, [item.id]: v }))} className={`w-8 h-8 rounded-lg text-[10px] font-black border ${answers[item.id] === v ? "bg-[#bf00ff] border-[#bf00ff] text-white" : "bg-white/5 border-white/10 text-white/60"}`}>{["TD", "D", "N", "A", "TA"][v - 1]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}
          {cepvOpenQuestions.map(q => (
            <Card key={q.id} className="p-4 bg-white/[0.04] border-white/10 rounded-2xl">
              <p className="text-sm text-white/80 mb-2">{q.text}</p>
              <textarea value={openAns[q.id] || ""} onChange={e => setOpenAns(p => ({ ...p, [q.id]: e.target.value }))} className="w-full min-h-[80px] p-3 rounded-xl bg-black/30 border border-white/10 text-white" placeholder="Escribe tu respuesta..." />
            </Card>
          ))}
        </div>
        <div className="pb-6 flex justify-between gap-4">
          {onExit && <Button variant="ghost" onClick={onExit} className="text-white/50">Salir</Button>}
          <Button onClick={submit} disabled={submitting} className="ml-auto bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl">
            {submitting ? "Enviando..." : "Ver promedios"}
          </Button>
        </div>
      </div>
    </div>
  );
}