"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackgroundAnimation } from "../shared/BackgroundAnimation";
import { cclItems, CCL_DIMENSION_LABEL } from "@/components/exams/personales/psicometria/ccl/cclItems";
import { scoreCCLTest, CCLAnswer } from "@/components/exams/personales/psicometria/ccl/cclScoring";
import { CCLResults } from "./CCLResults";
import { LikertCardDynamic, LikertDynamicItem, LIKERT_5_NUMERIC_OPTIONS } from "./likert/LikertCardDynamic";
import { SaveProgressExitModal } from "./shared/SaveProgressExitModal";
import { saveExamDraft, loadExamDraft, clearExamDraft } from "@/lib/utils/examDraftStorage";
import { API_URL } from "@/lib/config";
import { RotateCcw, BookmarkCheck, LayoutList, Sparkles } from "lucide-react";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null;
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function CCLTest({ onExit, onComplete }: { onExit?: () => void; onComplete?: (score: any) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"interactive" | "list">("interactive");
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Restore draft on mount
  useEffect(() => {
    const draft = loadExamDraft<Record<number, number>>("ccl-36");
    if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      if (typeof draft.currentIndex === "number") {
        setCurrentIndex(Math.min(draft.currentIndex, cclItems.length - 1));
      }
      setHasRestoredDraft(true);
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveExamDraft("ccl-36", {
        answers,
        currentIndex,
      });
    }
  }, [answers, currentIndex]);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / 36) * 100);

  function setAns(id: number, v: number) {
    setAnswers((p) => ({ ...p, [id]: v }));
  }

  function handleResetProgress() {
    clearExamDraft("ccl-36");
    setAnswers({});
    setCurrentIndex(0);
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
    saveExamDraft("ccl-36", {
      answers: answersRef.current,
      currentIndex: currentIndexRef.current,
    });
    setShowExitModal(false);
    onExit?.();
  }

  function handleDiscardAndExit() {
    clearExamDraft("ccl-36");
    setShowExitModal(false);
    onExit?.();
  }

  async function handleSubmit() {
    if (answered < 36) {
      setError("Responde los 36 ítems antes de enviar.");
      return;
    }
    setError("");
    const list: CCLAnswer[] = Object.entries(answers).map(([k, v]) => ({ itemId: Number(k), value: v }));
    const local = scoreCCLTest(list);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/diagnosis/ccl/submit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers: list }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const merged = { ...data, local };
      clearExamDraft("ccl-36");
      setResult(merged);
      onComplete?.(merged);
    } catch (e: any) {
      clearExamDraft("ccl-36");
      setResult({
        scores: local.scores,
        levels: local.levels,
        nivel_general: local.nivelGeneral,
        offline: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const dynamicItems: LikertDynamicItem[] = useMemo(() => {
    return cclItems.map((it) => ({
      id: it.id,
      text: it.text,
      dimensionLabel: CCL_DIMENSION_LABEL[it.dimension],
    }));
  }, []);

  if (result) return <CCLResults result={result} onExit={onExit} />;

  return (
    <div className="relative min-h-screen w-full flex flex-col pt-6 overflow-hidden bg-gradient-to-b from-[#012216] via-[#023320] via-40% to-[#3c5a21]">
      <BackgroundAnimation />
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col relative z-10">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black italic text-white uppercase">Cuestionario de Competencias de Liderazgo (CCL)</h2>
              <p className="text-xs text-white/50 uppercase tracking-widest mt-1">36 afirmaciones — Escala interactiva 1 a 5 — 6 competencias clave</p>
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

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              <span>{answered}/36 respondidas</span><span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-[#022a1c] [&>div]:bg-[#22c55e]" />
          </div>
        </div>

        {/* Dynamic Card Mode (Kurt Lewin style) */}
        {viewMode === "interactive" ? (
          <LikertCardDynamic
            items={dynamicItems}
            answers={answers}
            onAnswer={setAns}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            options={LIKERT_5_NUMERIC_OPTIONS}
          />
        ) : (
          /* List Mode fallback */
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-3">
            {cclItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-[#063924]/60 border-[#0b4a30] backdrop-blur-xl rounded-2xl transition-colors"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex gap-3 flex-1">
                    <span className="text-xs font-black text-[#d0b04d] shrink-0">{item.id}.</span>
                    <p className="text-sm text-white/90 leading-snug">{item.text}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#d0b04d] bg-[#d0b04d]/10 px-2 py-0.5 rounded-md shrink-0">
                    {CCL_DIMENSION_LABEL[item.dimension]}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {LIKERT_5_NUMERIC_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAns(item.id, opt.value)}
                      className={`p-2.5 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-1 ${
                        answers[item.id] === opt.value
                          ? "bg-[#164e32] border-[#22c55e] text-white shadow-[0_0_12px_rgba(34,197,94,0.4)] scale-102"
                          : "bg-[#0b3320]/80 border-[#14532d] text-white/70 hover:bg-[#114d2e]"
                      }`}
                    >
                      <span className="text-xs">{opt.badge}</span>
                      <span className="text-[9px] uppercase opacity-70 hidden sm:inline text-center leading-none">
                        {opt.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-400 text-center mb-2">{error}</p>}

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
            onClick={handleSubmit}
            disabled={submitting || answered < 36}
            className="ml-auto bg-gradient-to-r from-[#032318] to-[#214f3c] text-white font-black uppercase text-xs tracking-widest px-8 py-5 rounded-xl border border-[#063924]"
          >
            {submitting ? "Enviando..." : "Ver resultado"}
          </Button>
        </div>
      </div>

      <SaveProgressExitModal
        isOpen={showExitModal}
        totalQuestions={36}
        answeredCount={answered}
        examTitle="Cuestionario de Competencias de Liderazgo (CCL)"
        onSaveAndExit={handleSaveAndExit}
        onDiscardAndExit={handleDiscardAndExit}
        onCancel={() => setShowExitModal(false)}
      />
    </div>
  );
}
