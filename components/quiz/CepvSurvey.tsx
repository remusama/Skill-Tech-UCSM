"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { cepvLikertItems, cepvOpenQuestions, CEPV_DIMENSION_LABELS } from "@/components/exams/personales/expectativas/cepv20Items";
import { LikertCardDynamic, LikertDynamicItem, LIKERT_TD_TA_1_5_OPTIONS } from "./likert/LikertCardDynamic";
import { SaveProgressExitModal } from "./shared/SaveProgressExitModal";
import { saveExamDraft, loadExamDraft, clearExamDraft } from "@/lib/utils/examDraftStorage";
import { API_URL } from "@/lib/config";
import { RotateCcw, BookmarkCheck, LayoutList, Sparkles, ChevronLeft, ChevronRight, PenTool } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function CepvSurvey({ onExit, onComplete }: { onExit?: () => void; onComplete?: (res: any) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [openAns, setOpenAns] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0); // 0-19 for Likert, 20-22 for Open
  const [viewMode, setViewMode] = useState<"interactive" | "list">("interactive");
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const openAnsRef = useRef(openAns);
  openAnsRef.current = openAns;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Restore draft on mount
  useEffect(() => {
    const draft = loadExamDraft<Record<number, number>, { openAns?: Record<number, string> }>("cepv-20");
    if (draft && ((draft.answers && Object.keys(draft.answers).length > 0) || (draft.extra?.openAns && Object.keys(draft.extra.openAns).length > 0))) {
      if (draft.answers) setAnswers(draft.answers);
      if (draft.extra?.openAns) setOpenAns(draft.extra.openAns);
      if (typeof draft.currentIndex === "number") setCurrentIndex(Math.min(draft.currentIndex, 22));
      setHasRestoredDraft(true);
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (Object.keys(answers).length > 0 || Object.keys(openAns).length > 0) {
      saveExamDraft("cepv-20", {
        answers,
        currentIndex,
        extra: {
          openAns,
        },
      });
    }
  }, [answers, openAns, currentIndex]);

  const answeredLikert = Object.keys(answers).length;
  const answeredOpen = Object.keys(openAns).filter((k) => openAns[Number(k)]?.trim()).length;
  const totalAnswered = answeredLikert + answeredOpen;
  const progress = Math.round((totalAnswered / 23) * 100);

  const dynamicLikertItems: LikertDynamicItem[] = useMemo(() => {
    return cepvLikertItems.map((it) => ({
      id: it.id,
      text: it.text,
      dimensionLabel: CEPV_DIMENSION_LABELS[it.dimension],
    }));
  }, []);

  function handleSetLikert(id: number, val: number) {
    setAnswers((p) => ({ ...p, [id]: val }));
  }

  function handleResetProgress() {
    clearExamDraft("cepv-20");
    setAnswers({});
    setOpenAns({});
    setCurrentIndex(0);
    setHasRestoredDraft(false);
  }

  function handleRequestExit() {
    if (totalAnswered > 0) {
      setShowExitModal(true);
    } else {
      onExit?.();
    }
  }

  function handleSaveAndExit() {
    saveExamDraft("cepv-20", {
      answers: answersRef.current,
      currentIndex: currentIndexRef.current,
      extra: {
        openAns: openAnsRef.current,
      },
    });
    setShowExitModal(false);
    onExit?.();
  }

  function handleDiscardAndExit() {
    clearExamDraft("cepv-20");
    setShowExitModal(false);
    onExit?.();
  }

  async function submit() {
    const byDim: Record<string, number[]> = {};
    cepvLikertItems.forEach((it) => {
      (byDim[it.dimension] ||= []).push(answers[it.id] || 0);
    });
    const avg = Object.fromEntries(
      Object.entries(byDim).map(([k, v]) => [
        k,
        v.filter(Boolean).length
          ? (v.reduce((a, b) => a + b, 0) / v.filter(Boolean).length).toFixed(2)
          : "0",
      ])
    );

    setSubmitting(true);
    try {
      await fetch(`${API_URL}/diagnosis/cepv/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers, openAns, avg }),
      });
    } catch (e) {
      console.warn("Offline fallback for CEPV survey:", e);
    } finally {
      clearExamDraft("cepv-20");
      setSubmitting(false);
      setResult({ avg, openAns });
      onComplete?.({ avg, openAns });
      window.dispatchEvent(new CustomEvent("refresh-skills"));
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
              <Card key={k} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl flex flex-col justify-between">
                <p className="text-xs text-[#d0b04d] uppercase font-bold tracking-widest">{CEPV_DIMENSION_LABELS[k as keyof typeof CEPV_DIMENSION_LABELS]}</p>
                <p className="text-2xl font-black text-white mt-4">{String(v)}/5</p>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 p-6 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
            <h3 className="text-sm font-black uppercase text-white mb-3">Respuestas abiertas</h3>
            {cepvOpenQuestions.map((q) => (
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

  // Active open question if in interactive mode and index >= 20
  const activeOpenQuestion = currentIndex >= 20 ? cepvOpenQuestions[currentIndex - 20] : null;

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black italic text-white uppercase">CEPV-20 — Expectativas de Programas Vivenciales</h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mt-1">20 ítems escala Likert TD→TA + 3 preguntas abiertas</p>
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
                title="Cambiar modo de visualización"
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

          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              <span>{answeredLikert}/20 Likert · {answeredOpen}/3 abiertas</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
          </div>

          {/* Quick tab between Likert (1-20) and Abiertas (21-23) in interactive mode */}
          {viewMode === "interactive" && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.min(currentIndex, 19))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  currentIndex < 20
                    ? "bg-[#164e32] border-[#22c55e] text-white"
                    : "bg-[#0b3320]/60 border-[#14532d] text-white/60 hover:text-white"
                }`}
              >
                Escala Likert ({answeredLikert}/20)
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.max(20, currentIndex))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  currentIndex >= 20
                    ? "bg-[#164e32] border-[#22c55e] text-white"
                    : "bg-[#0b3320]/60 border-[#14532d] text-white/60 hover:text-white"
                }`}
              >
                Preguntas Abiertas ({answeredOpen}/3)
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Card Mode */}
        {viewMode === "interactive" ? (
          <div className="flex-1 flex flex-col justify-center">
            {currentIndex < 20 ? (
              <LikertCardDynamic
                items={dynamicLikertItems}
                answers={answers}
                onAnswer={handleSetLikert}
                currentIndex={currentIndex}
                onIndexChange={(idx) => {
                  if (idx === 19 && answers[20] !== undefined) {
                    // allows going into open questions
                  }
                  setCurrentIndex(idx);
                }}
                options={LIKERT_TD_TA_1_5_OPTIONS}
              />
            ) : (
              /* Open Questions Dynamic Card */
              activeOpenQuestion && (
                <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-6 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#d0b04d] bg-[#d0b04d]/10 px-3 py-1 rounded-xl border border-[#d0b04d]/20 flex items-center gap-2">
                      <PenTool className="w-3.5 h-3.5" />
                      Pregunta Abierta {activeOpenQuestion.id - 20} de 3
                    </span>
                    <span className="text-xs text-white/50">
                      Ítem {activeOpenQuestion.id} / 23
                    </span>
                  </div>

                  <Card className="p-6 md:p-8 bg-[#063924]/70 border-[#0b4a30] shadow-[0_15px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-3xl">
                    <p className="text-base md:text-lg font-bold text-white mb-4 leading-relaxed">
                      {activeOpenQuestion.text}
                    </p>
                    <textarea
                      value={openAns[activeOpenQuestion.id] || ""}
                      onChange={(e) =>
                        setOpenAns((p) => ({ ...p, [activeOpenQuestion.id]: e.target.value }))
                      }
                      rows={4}
                      className="w-full p-4 rounded-2xl bg-[#03170e]/90 border border-[#14532d] text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] text-sm leading-relaxed"
                      placeholder="Escribe tu reflexión detallada aquí..."
                    />
                    <div className="flex justify-between items-center mt-2 text-[10px] text-white/40">
                      <span>Tu respuesta nos ayuda a calibrar la experiencia.</span>
                      <span>{(openAns[activeOpenQuestion.id] || "").length} caracteres</span>
                    </div>
                  </Card>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      className="bg-[#0b3320]/60 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider px-4"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    {currentIndex < 22 ? (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIndex((i) => Math.min(22, i + 1))}
                        className="bg-[#0b3320]/60 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider px-4"
                      >
                        Siguiente pregunta
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <span className="text-xs text-[#4ade80] font-bold">
                        ¡Todas las preguntas completadas!
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* List Mode fallback */
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-6 mt-2">
            {Object.entries(CEPV_DIMENSION_LABELS).map(([dim, label]) => (
              <Card key={dim} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#d0b04d]">{label}</h3>
                {cepvLikertItems.filter((it) => it.dimension === dim).map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0b3320]/80 border border-[#14532d]">
                    <p className="text-sm text-white/90 flex-1">{item.id}. {item.text}</p>
                    <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                      {LIKERT_TD_TA_1_5_OPTIONS.map((opt) => (
                        <button 
                          key={opt.value} 
                          onClick={() => handleSetLikert(item.id, opt.value)} 
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
                  </div>
                ))}
              </Card>
            ))}

            {cepvOpenQuestions.map((q) => (
              <Card key={q.id} className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl">
                <p className="text-sm text-white/90 mb-2 font-medium">{q.text}</p>
                <textarea 
                  value={openAns[q.id] || ""} 
                  onChange={(e) => setOpenAns((p) => ({ ...p, [q.id]: e.target.value }))} 
                  className="w-full min-h-[80px] p-3 rounded-xl bg-[#0b3320]/80 border border-[#14532d] text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e]" 
                  placeholder="Escribe tu respuesta..." 
                />
              </Card>
            ))}
          </div>
        )}

        <div className="pb-6 flex justify-between items-center gap-4 mt-2">
          {onExit && (
            <Button 
              variant="outline" 
              onClick={handleRequestExit} 
              className="bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest px-6"
            >
              Salir
            </Button>
          )}
          <Button 
            onClick={submit} 
            disabled={submitting || answeredLikert < 20}
            className="ml-auto bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl border border-[#063924]"
          >
            {submitting ? "Enviando..." : "Ver promedios"}
          </Button>
        </div>
      </div>

      <SaveProgressExitModal
        isOpen={showExitModal}
        totalQuestions={23}
        answeredCount={totalAnswered}
        examTitle="CEPV-20 — Expectativas de Programas Vivenciales"
        onSaveAndExit={handleSaveAndExit}
        onDiscardAndExit={handleDiscardAndExit}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  );
}