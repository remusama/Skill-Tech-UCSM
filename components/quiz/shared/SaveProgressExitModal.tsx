"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookmarkCheck, AlertCircle, Play, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SaveProgressExitModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  onSaveAndExit: () => void;
  onDiscardAndExit: () => void;
  onCancel: () => void;
  examTitle?: string;
}

export function SaveProgressExitModal({
  isOpen,
  totalQuestions,
  answeredCount,
  onSaveAndExit,
  onDiscardAndExit,
  onCancel,
  examTitle,
}: SaveProgressExitModalProps) {
  if (!isOpen) return null;

  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#072418]/95 dark:bg-[#061e14]/95 border border-[#14532d] shadow-[0_0_50px_rgba(34,197,94,0.15)] rounded-3xl p-6 md:p-8 text-white overflow-hidden"
        >
          {/* Ambient decorative glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#22c55e]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#eab308]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon Header */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#166534] to-[#0f3d20] border border-[#22c55e]/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <BookmarkCheck className="w-8 h-8 text-[#4ade80]" />
            </div>

            <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white mb-2">
              ¿Deseas guardar tu avance?
            </h3>

            {examTitle && (
              <p className="text-xs font-bold text-[#d0b04d] uppercase tracking-wider mb-2">
                {examTitle}
              </p>
            )}

            <p className="text-xs md:text-sm text-white/70 max-w-sm mb-6 leading-relaxed">
              Has respondido <span className="font-bold text-white">{answeredCount}</span> de{" "}
              <span className="font-bold text-white">{totalQuestions}</span> ítems.
              Puedes guardar tu progreso actual para retomarlo más tarde desde donde te quedaste.
            </p>

            {/* Progress preview card */}
            <div className="w-full bg-[#03170e]/80 border border-[#0d4525] rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-white/60">Avance completado</span>
                <span className="text-[#4ade80]">{pct}% ({answeredCount}/{totalQuestions})</span>
              </div>
              <Progress value={pct} className="h-2.5 bg-[#022215] [&>div]:bg-gradient-to-r [&>div]:from-[#15803d] [&>div]:to-[#22c55e]" />
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <Button
                onClick={onSaveAndExit}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-[#166534] to-[#22c55e] hover:brightness-110 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-green-950/40 border border-[#4ade80]/40 flex items-center justify-center gap-2"
              >
                <BookmarkCheck className="w-4 h-4" />
                Guardar avance y salir
              </Button>

              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full py-5 rounded-xl bg-[#0b3320]/80 border-[#14532d] text-white hover:bg-[#114d2e] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current text-[#4ade80]" />
                Continuar evaluación
              </Button>

              <button
                type="button"
                onClick={onDiscardAndExit}
                className="mt-2 text-[11px] font-bold text-red-400/80 hover:text-red-300 uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Salir sin guardar (descartar respuestas)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
