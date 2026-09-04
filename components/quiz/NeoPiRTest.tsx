"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { neoItems } from "@/components/exams/personales/psicometria/neo-pi-r/items";
import { computeRawScores, LikertValue } from "@/components/exams/personales/psicometria/neo-pi-r/scoring";
import { rawToT_Male } from "@/components/exams/personales/psicometria/neo-pi-r/norms/maleNorms";
import { rawToT_Female } from "@/components/exams/personales/psicometria/neo-pi-r/norms/femaleNorms";
import { DOMAINS } from "@/components/exams/personales/psicometria/neo-pi-r/facetKey";
import { NeoPiRResults } from "./NeoPiRResults";
import { API_URL } from "@/lib/config";

function getAuthHeaders(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function NeoPiRTest({ onExit }: { onExit?: () => void }) {
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [answers, setAnswers] = useState<Record<number, LikertValue>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState(0);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / 240) * 100);
  const sectionItems = neoItems.slice(section * 40, (section + 1) * 40);
  const sectionAnswered = sectionItems.filter((it) => answers[it.id] !== undefined).length;
  const canNext = sectionAnswered === 40;

  async function handleSubmit() {
    if (!gender) { alert("Seleccione sexo para baremo"); return; }
    if (answered < 240) { alert(`Faltan ${240 - answered} ítems`); return; }
    const { facetRaw, domainRaw } = computeRawScores(answers);
    const toT = gender === "M" ? rawToT_Male : rawToT_Female;
    const facetsT = facetRaw.map((arr) => arr.map((v) => toT(v, false)));
    const domainsT: Record<string, number> = {};
    DOMAINS.forEach((d, i) => (domainsT[d] = toT(domainRaw[i], true)));
    const payload = { answers, gender, raw: { facetRaw, domainRaw }, domains: domainsT, facets: facetsT };
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/diagnosis/neo-pi-r/submit`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ answers: Object.entries(answers).map(([k, v]) => ({ itemId: Number(k), value: v })), gender }) });
      if (res.ok) { const data = await res.json(); setResult({ ...payload, ...data, gender }); } else setResult({ ...payload, gender });
    } catch { setResult({ ...payload, gender, offline: true }); } finally { setSubmitting(false); }
  }

  if (result) return <NeoPiRResults result={result} onExit={onExit} />;

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black italic text-white uppercase">NEO PI-R — 240 ítems</h2>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">6 secciones × 40 · Escala TD→TA · Baremo por sexo</p>
          
          <div className="flex gap-2 mt-3 items-center flex-wrap">
            {(["M","F"] as const).map((g) => (
              <button 
                key={g} 
                onClick={() => setGender(g)} 
                className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${gender===g ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"}`}
              >
                {g==="M"?"Varón":"Mujer"}
              </button>
            ))}
            <span className="text-xs text-white/40 ml-2">{answered}/240 · {progress}% · Sección {section+1}/6 ({sectionAnswered}/40)</span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              <span>Progreso general</span><span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
            {[0,1,2,3,4,5].map((s) => {
              const c = neoItems.slice(s*40,(s+1)*40).filter((it)=>answers[it.id]!==undefined).length;
              return (
                <button 
                  key={s} 
                  onClick={() => setSection(s)} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border whitespace-nowrap transition-all ${
                    section===s 
                      ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                      : c===40 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : c>0 
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                          : "bg-[#0b3320]/80 border-[#14532d] text-white/40"
                  }`}
                >
                  S{s+1} {c}/40
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-3">
          {sectionItems.map((item) => (
            <Card 
              key={item.id} 
              className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl flex items-center justify-between gap-4 transition-colors"
            >
              <div className="flex gap-3 flex-1">
                <span className="text-xs font-black text-[#d0b04d] shrink-0">{item.id}.</span>
                <p className="text-sm text-white/90 leading-snug">{item.text}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {[0,1,2,3,4].map((v) => (
                  <button 
                    key={v} 
                    onClick={() => setAnswers((p) => ({ ...p, [item.id]: v as LikertValue }))} 
                    className={`w-8 h-8 rounded-xl text-[10px] font-black border transition-all ${
                      answers[item.id]===v 
                        ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]" 
                        : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"
                    }`}
                  >
                    {["TD","D","N","A","TA"][v]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="pb-6 flex justify-between gap-4 items-center">
          {onExit && (
            <Button 
              variant="outline" 
              onClick={onExit} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6"
            >
              Salir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              disabled={section===0} 
              onClick={() => setSection((s)=>Math.max(0,s-1))} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-4"
            >
              Anterior
            </Button>
            {section < 5 ? (
              <Button 
                disabled={!canNext} 
                onClick={() => setSection((s)=>s+1)} 
                className="bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-6 rounded-xl border border-[#063924]"
              >
                {canNext ? "Siguiente" : "Completa 40/40"}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || answered<240 || !gender} 
                className="bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl border border-[#063924]"
              >
                {submitting ? "Enviando..." : "Ver perfil T"}
              </Button>
            )}
          </div>
        </div>
        {!gender && <p className="text-xs text-amber-300 text-center pb-2">Selecciona Varón/Mujer antes de enviar (baremo normativo distinto).</p>}
      </div>
    </div>
  );
}