"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export type ChoiceCardColor = "red" | "green";

type ChoiceCardProps = {
  color: ChoiceCardColor;
  label: string;
  sublabel?: string;
  selected?: boolean;
  onClick: () => void;
};

const COLOR_STYLES: Record<ChoiceCardColor, { bg: string; border: string; glow: string }> = {
  red: {
    bg: "bg-gradient-to-br from-[#7a1f2b] to-[#4a0f18]",
    border: "border-[#e05464]",
    glow: "shadow-[0_0_24px_rgba(224,84,100,0.45)]",
  },
  green: {
    bg: "bg-gradient-to-br from-[#1f6b3a] to-[#0f3d20]",
    border: "border-[#4ade80]",
    glow: "shadow-[0_0_24px_rgba(74,222,128,0.45)]",
  },
};

export function ChoiceCard({ color, label, sublabel, selected, onClick }: ChoiceCardProps) {
  const s = COLOR_STYLES[color];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -4 }}
      className={`relative flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 ${s.bg} ${
        selected ? `${s.border} ${s.glow}` : "border-white/10"
      } px-4 py-6 min-h-[120px] transition-colors`}
    >
      <span className="absolute top-3 left-3 w-3 h-3 rounded-full bg-white/25" />
      <div className="text-white">
        {color === "red" ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
      </div>
      <span className="text-white font-black text-sm uppercase tracking-wide text-center">{label}</span>
      {sublabel && (
        <span className="text-white/60 text-[10px] uppercase tracking-widest">{sublabel}</span>
      )}
    </motion.button>
  );
}
