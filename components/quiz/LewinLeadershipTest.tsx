"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { kurtLewinItems } from "@/components/exams/personales/psicometria/kurtLewinItems";
import { scoreLewinTest, LewinAnswer } from "@/components/exams/personales/psicometria/kurtLewinScoring";
import { LewinResults } from "./LewinResults";
import { API_URL } from "@/lib/config";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function LewinLeadershipTest({ onExit, onComplete }: { onExit?: () => void; onComplete?: (score: any) => void }) {
  const [answers, setAnswers] = useState<Record<number, "A" | "D">>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / 33) * 100);

  function setAns(id: number, v: "A" | "D") {
    setAnswers((p) => ({ ...p, [id]: v }));
  }

  async function handleSubmit() {
    if (answered < 33) {
      setError("Responde los 33 ítems antes de enviar.");
      return;
    }
    setError("");
    const list: LewinAnswer[] = Object.entries(answers).map(([k, v]) => ({ itemId: Number(k), value: v }));
    const local = scoreLewinTest(list);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/diagnosis/leadership/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers: list }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const merged = { ...data, local };
      setResult(merged);
      onComplete?.(merged);
    } catch (e: any) {
      setResult({ counts: { autoritario: local.autoritario, democratico: local.democratico, "laissez-faire": local["laissez-faire"] }, dominant: local.dominant, isTied: local.isTied, offline: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <LewinResults result={result} onExit={onExit} />;

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black italic text-white uppercase">Test de Liderazgo — Kurt Lewin</h2>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">33 afirmaciones — Responde A (Acuerdo) / D (Desacuerdo) — Determinístico</p>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              <span>{answered}/33 respondidas</span><span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-3">
          {kurtLewinItems.map((item) => (
            <Card 
              key={item.id} 
              className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl flex items-center justify-between gap-4 transition-colors"
            >
              <div className="flex gap-3 flex-1">
                <span className="text-xs font-black text-[#d0b04d] shrink-0">{item.id}.</span>
                <p className="text-sm text-white/90 leading-snug">{item.text}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {(["A", "D"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAns(item.id, v)}
                    className={`w-10 h-10 rounded-xl text-xs font-black border transition-all ${answers[item.id] === v ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
        
        {error && <p className="text-xs text-red-400 text-center mb-2">{error}</p>}
        
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
            onClick={handleSubmit} 
            disabled={submitting} 
            className="ml-auto bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl border border-[#063924]"
          >
            {submitting ? "Enviando..." : "Ver resultado"}
          </Button>
        </div>
      </div>
    </div>
  );
}