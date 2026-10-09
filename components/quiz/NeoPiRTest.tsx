"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { LikertCardDynamic, LikertDynamicItem, LIKERT_TD_TA_0_4_OPTIONS } from "./likert/LikertCardDynamic";
import { SaveProgressExitModal } from "./shared/SaveProgressExitModal";
import { saveExamDraft, loadExamDraft, clearExamDraft } from "@/lib/utils/examDraftStorage";
import { API_URL } from "@/lib/config";
import { RotateCcw, BookmarkCheck, LayoutList, Sparkles, AlertCircle } from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

export function NeoPiRTest({ onExit, onComplete }: { onExit?: () => void; onComplete?: (res: any) => void }) {
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [answers, setAnswers] = useState<Record<number, LikertValue>>({});
  const [section, setSection] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0); // Index within current section (0 to 39)
  const [viewMode, setViewMode] = useState<"interactive" | "list">("interactive");
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const sectionRef = useRef(section);
  sectionRef.current = section;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const genderRef = useRef(gender);
  genderRef.current = gender;

  // Restore draft on mount
  useEffect(() => {
    const draft = loadExamDraft<Record<number, LikertValue>, { gender?: "M" | "F" | ""; section?: number }>("neo-240");
    if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      if (draft.extra?.gender) setGender(draft.extra.gender);
      if (typeof draft.extra?.section === "number") setSection(draft.extra.section);
      if (typeof draft.currentIndex === "number") setCurrentIndex(Math.min(draft.currentIndex, 39));
      setHasRestoredDraft(true);
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveExamDraft("neo-240", {
        answers,
        currentIndex,
        extra: {
          gender,
          section,
        },
      });
    }
  }, [answers, currentIndex, gender, section]);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / 240) * 100);
  const sectionItems = useMemo(() => neoItems.slice(section * 40, (section + 1) * 40), [section]);
  const sectionAnswered = sectionItems.filter((it) => answers[it.id] !== undefined).length;
  const canNext = sectionAnswered === 40;

  const dynamicSectionItems: LikertDynamicItem[] = useMemo(() => {
    return sectionItems.map((it) => ({
      id: it.id,
      text: it.text,
      dimensionLabel: `Sección ${section + 1} de 6`,
    }));
  }, [sectionItems, section]);

  function handleSetAnswer(id: number, val: LikertValue) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  function handleResetProgress() {
    clearExamDraft("neo-240");
    setAnswers({});
    setCurrentIndex(0);
    setSection(0);
    setHasRestoredDraft(false);
  }

  function handleRequestExit() {
    if (answered > 0) {
      setShowExitModal(true);
    } else {
      onExit?.();
    }
  }

  function handleSaveAndExit() {
    saveExamDraft("neo-240", {
      answers: answersRef.current,
      currentIndex: currentIndexRef.current,
      extra: {
        gender: genderRef.current,
        section: sectionRef.current,
      },
    });
    setShowExitModal(false);
    onExit?.();
  }

  function handleDiscardAndExit() {
    clearExamDraft("neo-240");
    setShowExitModal(false);
    onExit?.();
  }

  async function handleSubmit() {
    if (!gender) { alert("Seleccione sexo (Varón / Mujer) para el baremo normativo."); return; }
    if (answered < 240) { alert(`Faltan ${240 - answered} ítems por responder.`); return; }
    const { facetRaw, domainRaw } = computeRawScores(answers);
    const toT = gender === "M" ? rawToT_Male : rawToT_Female;
    const facetsT = facetRaw.map((arr) => arr.map((v) => toT(v, false)));
    const domainsT: Record<string, number> = {};
    DOMAINS.forEach((d, i) => (domainsT[d] = toT(domainRaw[i], true)));
    const payload = { answers, gender, raw: { facetRaw, domainRaw }, domains: domainsT, facets: facetsT };
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/diagnosis/neo-pi-r/submit`, { 
        method: "POST", 
        headers: getAuthHeaders(), 
        body: JSON.stringify({ answers: Object.entries(answers).map(([k, v]) => ({ itemId: Number(k), value: v })), gender }) 
      });
      clearExamDraft("neo-240");
      if (res.ok) { 
        const data = await res.json(); 
        const full = { ...payload, ...data, gender };
        setResult(full); 
        onComplete?.(full);
      } else { 
        const full = { ...payload, gender };
        setResult(full); 
        onComplete?.(full);
      }
    } catch { 
      clearExamDraft("neo-240");
      const full = { ...payload, gender, offline: true };
      setResult(full); 
      onComplete?.(full);
    } finally { 
      setSubmitting(false); 
    }
  }

  if (result) return <NeoPiRResults result={result} onExit={onExit} />;

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black italic text-white uppercase">NEO PI-R — 240 ítems</h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mt-1">6 secciones × 40 · Escala dinámica TD→TA · Baremo por sexo</p>
            </div>

            <div className="flex items-center gap-2">
              {hasRestoredDraft && (
                <div className="flex items-center gap-2 bg-[#22c55e]/15 border border-[#22c55e]/30 px-3 py-1.5 rounded-xl">
                  <BookmarkCheck className="w-4 h-4 text-[#4ade80]" />
                  <span className="text-[11px] font-bold text-white/90">Avance restaurado</span>
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="ml-2 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-bold uppercase underline"
                    title="Reiniciar respuestas"
                  >
                    <RotateCcw className="w-3 h-3" /> Reiniciar
                  </button>
                </div>
              )}

              {/* View mode toggle */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "interactive" ? "list" : "interactive")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                title="Cambiar vista"
              >
                {viewMode === "interactive" ? (
                  <>
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>Ver lista</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#d0b04d]" />
                    <span>Modo dinámico</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3 items-center flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70 mr-1">Sexo baremo:</span>
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

          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              <span>Progreso general</span><span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
          </div>

          {/* Section selector buttons */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
            {[0,1,2,3,4,5].map((s) => {
              const c = neoItems.slice(s*40,(s+1)*40).filter((it)=>answers[it.id]!==undefined).length;
              return (
                <button 
                  key={s} 
                  onClick={() => {
                    setSection(s);
                    setCurrentIndex(0);
                  }} 
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
                  S{s+1} ({c}/40)
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive Mode (Kurt Lewin style) */}
        {viewMode === "interactive" ? (
          <div className="flex-1 flex flex-col justify-center">
            <LikertCardDynamic
              items={dynamicSectionItems}
              answers={answers}
              onAnswer={(id, val) => handleSetAnswer(id, val as LikertValue)}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              options={LIKERT_TD_TA_0_4_OPTIONS}
            />

            {/* Quick jump to next section banner if section is completed */}
            {canNext && section < 5 && (
              <div className="mt-2 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-emerald-300">
                  ¡Sección {section + 1} completada (40/40)!
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setSection((s) => s + 1);
                    setCurrentIndex(0);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Pasar a Sección {section + 2} →
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* List Mode fallback */
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
                  {LIKERT_TD_TA_0_4_OPTIONS.map((opt) => (
                    <button 
                      key={opt.value} 
                      onClick={() => handleSetAnswer(item.id, opt.value as LikertValue)} 
                      title={opt.label}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black border transition-all ${
                        answers[item.id] === opt.value 
                          ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]" 
                          : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"
                      }`}
                    >
                      {opt.badge}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="pb-6 flex justify-between gap-4 items-center mt-2">
          {onExit && (
            <Button 
              variant="outline" 
              onClick={handleRequestExit} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6"
            >
              Salir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              disabled={section===0} 
              onClick={() => {
                setSection((s)=>Math.max(0,s-1));
                setCurrentIndex(0);
              }} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-4"
            >
              Sección anterior
            </Button>
            {section < 5 ? (
              <Button 
                disabled={!canNext} 
                onClick={() => {
                  setSection((s)=>s+1);
                  setCurrentIndex(0);
                }} 
                className="bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-6 rounded-xl border border-[#063924]"
              >
                {canNext ? "Siguiente sección" : "Completa 40/40"}
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

      <SaveProgressExitModal
        isOpen={showExitModal}
        totalQuestions={240}
        answeredCount={answered}
        examTitle="NEO PI-R — Personalidad (240 ítems)"
        onSaveAndExit={handleSaveAndExit}
        onDiscardAndExit={handleDiscardAndExit}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  );
}