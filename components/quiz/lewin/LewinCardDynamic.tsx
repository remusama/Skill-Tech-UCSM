"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChoiceCard } from "./ChoiceCard";
import type { LewinItem } from "@/components/exams/personales/psicometria/kurtLewinItems";

type Props = {
  items: LewinItem[];
  answers: Record<number, "A" | "D">;
  onAnswer: (id: number, value: "A" | "D") => void;
};

export function LewinCardDynamic({ items, answers, onAnswer }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const item = items[currentIndex];
  const isLast = currentIndex === items.length - 1;
  const currentAnswer = item ? answers[item.id] : undefined;

  function choose(value: "A" | "D") {
    if (!item) return;
    onAnswer(item.id, value);
    if (!isLast) {
      setDirection(1);
      setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, items.length - 1)), 260);
    }
  }

  function goPrev() {
    setDirection(-1);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function goNext() {
    if (!currentAnswer) return;
    setDirection(1);
    setCurrentIndex((i) => Math.min(i + 1, items.length - 1));
  }

  if (!item) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-6 px-2">
      <div className="w-full max-w-xl relative h-44">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={item.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 60, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center bg-[#063924]/60 border border-[#0b4a30] backdrop-blur-xl rounded-2xl p-6"
          >
            <span className="text-xs font-black text-[#d0b04d] mb-2">
              Afirmación {item.id} / {items.length}
            </span>
            <p className="text-base text-white/90 leading-snug">{item.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xl flex gap-4">
        <ChoiceCard
          color="red"
          label="Espera"
          sublabel="En desacuerdo"
          selected={currentAnswer === "D"}
          onClick={() => choose("D")}
        />
        <ChoiceCard
          color="green"
          label="Adelante"
          sublabel="De acuerdo"
          selected={currentAnswer === "A"}
          onClick={() => choose("A")}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="text-xs font-bold text-white/50 uppercase tracking-widest disabled:opacity-30 hover:text-white transition-colors"
        >
          ← Anterior
        </button>
        <div className="flex flex-wrap justify-center gap-1 max-w-[180px]">
          {items.map((it, idx) => (
            <span
              key={it.id}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex
                  ? "bg-[#d0b04d]"
                  : answers[it.id]
                  ? "bg-[#22c55e]"
                  : "bg-white/15"
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={!currentAnswer || isLast}
          className="text-xs font-bold text-white/50 uppercase tracking-widest disabled:opacity-30 hover:text-white transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
