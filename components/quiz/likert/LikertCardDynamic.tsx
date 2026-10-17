"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LikertChoiceCard,
  LikertOptionDefinition,
} from "./LikertChoiceCard";
import { ChevronLeft, ChevronRight, Grid, CheckCircle2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LikertDynamicItem {
  id: number;
  text: string;
  dimensionLabel?: string;
  subtext?: string;
}

export const LIKERT_5_NUMERIC_OPTIONS: LikertOptionDefinition[] = [
  {
    value: 1,
    color: "red",
    badge: "1",
    label: "Totalmente en desacuerdo",
    sublabel: "Desacuerdo total",
    shortcut: "1",
  },
  {
    value: 2,
    color: "orange",
    badge: "2",
    label: "En desacuerdo",
    sublabel: "Poco de acuerdo",
    shortcut: "2",
  },
  {
    value: 3,
    color: "neutral",
    badge: "3",
    label: "Neutral",
    sublabel: "Ni acuerdo ni desacuerdo",
    shortcut: "3",
  },
  {
    value: 4,
    color: "teal",
    badge: "4",
    label: "De acuerdo",
    sublabel: "Bastante de acuerdo",
    shortcut: "4",
  },
  {
    value: 5,
    color: "green",
    badge: "5",
    label: "Totalmente de acuerdo",
    sublabel: "Acuerdo total",
    shortcut: "5",
  },
];

export const LIKERT_TD_TA_0_4_OPTIONS: LikertOptionDefinition[] = [
  {
    value: 0,
    color: "red",
    badge: "TD",
    label: "Totalmente en desacuerdo",
    sublabel: "TD",
    shortcut: "1",
  },
  {
    value: 1,
    color: "orange",
    badge: "D",
    label: "En desacuerdo",
    sublabel: "D",
    shortcut: "2",
  },
  {
    value: 2,
    color: "neutral",
    badge: "N",
    label: "Neutral / Ni de acuerdo",
    sublabel: "N",
    shortcut: "3",
  },
  {
    value: 3,
    color: "teal",
    badge: "A",
    label: "De acuerdo",
    sublabel: "A",
    shortcut: "4",
  },
  {
    value: 4,
    color: "green",
    badge: "TA",
    label: "Totalmente de acuerdo",
    sublabel: "TA",
    shortcut: "5",
  },
];

export const LIKERT_TD_TA_1_5_OPTIONS: LikertOptionDefinition[] = [
  {
    value: 1,
    color: "red",
    badge: "TD",
    label: "Totalmente en desacuerdo",
    sublabel: "TD",
    shortcut: "1",
  },
  {
    value: 2,
    color: "orange",
    badge: "D",
    label: "En desacuerdo",
    sublabel: "D",
    shortcut: "2",
  },
  {
    value: 3,
    color: "neutral",
    badge: "N",
    label: "Neutral / Indeciso",
    sublabel: "N",
    shortcut: "3",
  },
  {
    value: 4,
    color: "teal",
    badge: "A",
    label: "De acuerdo",
    sublabel: "A",
    shortcut: "4",
  },
  {
    value: 5,
    color: "green",
    badge: "TA",
    label: "Totalmente de acuerdo",
    sublabel: "TA",
    shortcut: "5",
  },
];

interface LikertCardDynamicProps {
  items: LikertDynamicItem[];
  answers: Record<number, any>;
  onAnswer: (id: number, value: any) => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  options?: LikertOptionDefinition[];
  scaleType?: "1-5" | "td-ta-0-4" | "td-ta-1-5";
  autoAdvanceDelay?: number;
  showGridDrawer?: boolean;
}

export function LikertCardDynamic({
  items,
  answers,
  onAnswer,
  currentIndex: externalIndex,
  onIndexChange,
  options: customOptions,
  scaleType = "1-5",
  autoAdvanceDelay = 260,
}: LikertCardDynamicProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showOverview, setShowOverview] = useState(false);

  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;

  const setIndex = useCallback(
    (newIdx: number, dir?: 1 | -1) => {
      const clamped = Math.max(0, Math.min(newIdx, items.length - 1));
      if (dir) setDirection(dir);
      if (onIndexChange) {
        onIndexChange(clamped);
      } else {
        setInternalIndex(clamped);
      }
    },
    [items.length, onIndexChange]
  );

  const options = useMemo(() => {
    if (customOptions) return customOptions;
    if (scaleType === "td-ta-0-4") return LIKERT_TD_TA_0_4_OPTIONS;
    if (scaleType === "td-ta-1-5") return LIKERT_TD_TA_1_5_OPTIONS;
    return LIKERT_5_NUMERIC_OPTIONS;
  }, [customOptions, scaleType]);

  const currentItem = items[currentIndex];
  const isLast = currentIndex === items.length - 1;
  const currentAnswer = currentItem ? answers[currentItem.id] : undefined;

  const handleSelect = useCallback(
    (val: any) => {
      if (!currentItem) return;
      onAnswer(currentItem.id, val);

      if (!isLast) {
        setDirection(1);
        setTimeout(() => {
          setIndex(currentIndex + 1, 1);
        }, autoAdvanceDelay);
      }
    },
    [currentItem, onAnswer, isLast, autoAdvanceDelay, setIndex, currentIndex]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIndex(currentIndex - 1, -1);
    }
  }, [currentIndex, setIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setIndex(currentIndex + 1, 1);
    }
  }, [currentIndex, items.length, setIndex]);

  // Keyboard navigation: 1-5 to select, Left/Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (options[idx]) {
          handleSelect(options[idx].value);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, handleSelect, options]);

  if (!currentItem) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4 px-2 w-full max-w-4xl mx-auto">
      {/* Top indicator: Dimensions / Tags */}
      <div className="flex items-center justify-between w-full max-w-2xl px-1">
        <div className="flex items-center gap-2">
          {currentItem.dimensionLabel && (
            <span className="text-[11px] font-black uppercase tracking-wider text-[#d0b04d] bg-[#d0b04d]/10 px-2.5 py-1 rounded-lg border border-[#d0b04d]/20">
              {currentItem.dimensionLabel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowOverview(!showOverview)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors px-2 py-1 rounded-lg bg-white/5 border border-white/10"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Índice ({currentIndex + 1}/{items.length})</span>
        </button>
      </div>

      {/* Overview drawer if toggled */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl bg-[#03170e]/95 border border-[#14532d] rounded-2xl p-4 overflow-hidden shadow-xl"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                Mapa de ítems ({Object.keys(answers).length} respondidos)
              </span>
              <button
                onClick={() => setShowOverview(false)}
                className="text-xs text-white/50 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar p-1">
              {items.map((it, idx) => {
                const hasAns = answers[it.id] !== undefined;
                const isCur = idx === currentIndex;
                return (
                  <button
                    key={it.id}
                    onClick={() => {
                      setIndex(idx);
                      setShowOverview(false);
                    }}
                    className={cn(
                      "h-7 rounded-lg text-[10px] font-black border transition-all flex items-center justify-center",
                      isCur
                        ? "bg-[#d0b04d] text-black border-[#d0b04d] scale-105 shadow-md"
                        : hasAns
                        ? "bg-[#14532d]/80 text-[#4ade80] border-[#22c55e]/40 hover:bg-[#166534]"
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {it.id}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Animated Question Card */}
      <div className="w-full max-w-2xl relative min-h-[140px] md:min-h-[160px] flex items-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentItem.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 50, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full flex flex-col items-center justify-center text-center bg-[#063924]/70 border border-[#0b4a30] shadow-[0_15px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-black text-[#d0b04d] uppercase tracking-widest">
                Ítem {currentItem.id} de {items.length}
              </span>
              {currentAnswer !== undefined && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#4ade80] bg-[#22c55e]/15 px-2 py-0.5 rounded-full border border-[#22c55e]/30">
                  <CheckCircle2 className="w-3 h-3" /> Respondido
                </span>
              )}
            </div>

            <p className="text-base md:text-xl font-medium text-white/95 leading-relaxed tracking-tight max-w-xl">
              {currentItem.text}
            </p>

            {currentItem.subtext && (
              <p className="text-xs text-white/50 mt-2 italic">
                {currentItem.subtext}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Likert Scale Choice Cards Deck */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-5 gap-2.5 md:gap-3">
        {options.map((opt) => (
          <LikertChoiceCard
            key={String(opt.value)}
            option={opt}
            selected={currentAnswer === opt.value}
            onClick={() => handleSelect(opt.value)}
          />
        ))}
      </div>

      {/* Navigation Footer */}
      <div className="w-full max-w-2xl flex items-center justify-between pt-2 px-1">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="bg-[#0b3320]/60 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider px-4 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        {/* Minimal Dot Indicators (for up to 40 items window) */}
        <div className="hidden sm:flex items-center gap-1 max-w-[280px] overflow-x-auto py-1 custom-scrollbar px-2">
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setIndex(idx)}
              className={cn(
                "rounded-full transition-all shrink-0",
                idx === currentIndex
                  ? "w-4 h-2 bg-[#d0b04d] rounded-md shadow-[0_0_8px_#d0b04d]"
                  : answers[it.id] !== undefined
                  ? "w-2 h-2 bg-[#22c55e]"
                  : "w-2 h-2 bg-white/20 hover:bg-white/40"
              )}
              title={`Ir al ítem ${it.id}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={goNext}
          disabled={isLast}
          className="bg-[#0b3320]/60 border-[#14532d] text-white/70 hover:bg-[#114d2e] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider px-4 disabled:opacity-30"
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
