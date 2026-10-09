"use client";

import { motion } from "framer-motion";
import { Check, X, Minus, HelpCircle, CheckCircle2, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type LikertColorType = "red" | "orange" | "neutral" | "teal" | "green";

export interface LikertOptionDefinition {
  value: any;
  color: LikertColorType;
  badge: string;
  label: string;
  sublabel?: string;
  shortcut?: string;
}

interface LikertChoiceCardProps {
  option: LikertOptionDefinition;
  selected?: boolean;
  onClick: () => void;
  layout?: "horizontal" | "compact";
}

const COLOR_STYLES: Record<
  LikertColorType,
  {
    gradient: string;
    border: string;
    glow: string;
    badgeBg: string;
    textAccent: string;
  }
> = {
  red: {
    gradient: "from-[#661822] via-[#4a0f17] to-[#2c080d]",
    border: "border-[#f87171]",
    glow: "shadow-[0_0_24px_rgba(248,113,113,0.35)]",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    textAccent: "text-red-300",
  },
  orange: {
    gradient: "from-[#6a2b0d] via-[#4d1d07] to-[#2b0e03]",
    border: "border-[#fb923c]",
    glow: "shadow-[0_0_24px_rgba(251,146,60,0.35)]",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    textAccent: "text-orange-300",
  },
  neutral: {
    gradient: "from-[#1e293b] via-[#141d2c] to-[#0c121d]",
    border: "border-[#94a3b8]",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.25)]",
    badgeBg: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    textAccent: "text-slate-300",
  },
  teal: {
    gradient: "from-[#085340] via-[#053d2f] to-[#03261d]",
    border: "border-[#34d399]",
    glow: "shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    textAccent: "text-emerald-300",
  },
  green: {
    gradient: "from-[#146c37] via-[#0e4d27] to-[#073018]",
    border: "border-[#4ade80]",
    glow: "shadow-[0_0_28px_rgba(74,222,128,0.45)]",
    badgeBg: "bg-green-500/25 text-green-300 border-green-500/50",
    textAccent: "text-green-300",
  },
};

export function LikertChoiceCard({
  option,
  selected,
  onClick,
}: LikertChoiceCardProps) {
  const s = COLOR_STYLES[option.color] || COLOR_STYLES.neutral;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group relative flex-1 min-w-[120px] rounded-2xl border-2 transition-all duration-200 text-left overflow-hidden flex flex-col justify-between p-3.5 md:p-4 cursor-pointer",
        `bg-gradient-to-b ${s.gradient}`,
        selected
          ? `${s.border} ${s.glow} ring-2 ring-white/20`
          : "border-white/10 hover:border-white/30 hover:bg-white/[0.04]"
      )}
    >
      {/* Selection indicator pill */}
      <div className="flex items-center justify-between w-full mb-2">
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
            selected
              ? s.badgeBg
              : "bg-white/10 text-white/70 border-white/10 group-hover:bg-white/20"
          )}
        >
          {option.badge}
        </span>

        {option.shortcut && (
          <span className="hidden md:inline-block text-[9px] font-mono font-bold text-white/30 group-hover:text-white/60 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
            [{option.shortcut}]
          </span>
        )}

        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
            selected
              ? "bg-white text-black scale-110 shadow-md"
              : "border border-white/20 text-transparent group-hover:border-white/40"
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      {/* Label and Sublabel */}
      <div className="mt-1">
        <p
          className={cn(
            "text-xs md:text-sm font-black leading-tight tracking-tight transition-colors",
            selected ? "text-white" : "text-white/90 group-hover:text-white"
          )}
        >
          {option.label}
        </p>
        {option.sublabel && (
          <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 leading-snug line-clamp-1">
            {option.sublabel}
          </p>
        )}
      </div>

      {/* Glow dot in the corner */}
      {selected && (
        <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
    </motion.button>
  );
}
