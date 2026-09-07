import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Brain, Network, ArrowLeft, Sparkles } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { cn } from "@/lib/utils"
import { NaturalWorkflow } from "./NaturalWorkflow"
import { useEleonor } from "@/contexts/eleonor-context"

interface DiagnosisResultsProps {
    analysis: {
        nivel: number
        razonamiento: string
        observaciones: string
        potencial: string
        errores: string[]
        confianza?: string
    }
    skills: any[]
    onExit: () => void
    onExploreMap: () => void
    area?: string
}

export function DiagnosisResults({ analysis, skills, onExit, onExploreMap, area }: DiagnosisResultsProps) {
    const { enterPresence } = useEleonor()

    const handleAnalysis = () => {
        enterPresence('INTERVENTION')
        window.dispatchEvent(new CustomEvent('eleonor-send-message', {
            detail: {
                type: 'analyze_node',
                payload: {
                    node: area || "General"
                }
            }
        }))
    }

    return (
        <div className="w-full h-full flex flex-col items-center gap-6 md:gap-10 pb-20 pt-10 px-4 md:px-0 max-w-4xl mx-auto relative z-10 overflow-y-auto custom-scrollbar">
            {/* Icono Central (Cerebro) */}
            <BlurFade delay={0.1}>
                <div className="relative group">
                    <div className="absolute inset-0 bg-[hsl(74,100%,47%)]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full border border-[hsl(74,100%,47%)]/30 flex items-center justify-center bg-[#050110] shadow-[0_0_20px_-5px_rgba(186,239,0,0.4)]">
                        <Brain className="text-[hsl(74,100%,47%)] w-8 h-8" />
                    </div>
                </div>
            </BlurFade>

            {/* Títulos del Encabezado */}
            <BlurFade delay={0.2} className="text-center space-y-2">
                <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                    PROCESAMIENTO <span className="text-[hsl(74,100%,47%)]">COMPLETADO</span>
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-[0.4em]">
                    SKILLNEXUS • NEURAL INTERFACE v3.0
                </p>
            </BlurFade>

            {/* Grid Superior */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 w-full mt-4">
                <BlurFade delay={0.3}>
                    <div className="bg-[#050110]/60 backdrop-blur-sm border border-white/5 p-5 md:p-8 rounded-[2rem] h-full flex flex-col justify-start">
                        <span className="text-[9px] md:text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-4 md:mb-8 text-left">
                            ÍNDICE DE DOMINIO
                        </span>
                        <div className="flex items-baseline gap-1 mt-auto md:mt-0">
                            <span className="text-5xl md:text-7xl font-black text-white italic">{analysis?.nivel ?? 0}</span>
                            <span className="text-xl md:text-2xl font-black text-[hsl(74,100%,47%)] italic">%</span>
                        </div>
                    </div>
                </BlurFade>

                <BlurFade delay={0.4}>
                    <div className="bg-[#050110]/60 backdrop-blur-sm border border-white/5 p-5 md:p-8 rounded-[2rem] h-full flex flex-col justify-start">
                        <span className="text-[9px] md:text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-4 md:mb-8 text-left">
                            PERFIL DETECTADO
                        </span>
                        <p className="text-sm md:text-2xl font-black text-white italic leading-tight mt-auto md:mt-0 text-left">
                            {analysis?.razonamiento || "Analizando..."}.
                        </p>
                    </div>
                </BlurFade>
            </div>

            {/* Tarjeta Full Width */}
            <BlurFade delay={0.5} className="w-full mt-2">
                <div className="bg-[#050110]/60 backdrop-blur-sm border border-white/5 p-6 md:p-10 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-[hsl(74,100%,47%)] shadow-[0_0_20px_hsl(74,100%,47%)] rounded-full" />
                    <div className="flex items-center gap-3 mb-5 md:mb-8">
                        <Brain className="text-[hsl(74,100%,47%)] w-4 h-4" />
                        <span className="text-[9px] md:text-[10px] font-black text-[hsl(74,100%,47%)] uppercase tracking-[0.3em]">
                            INSIGHT DEL NÚCLEO
                        </span>
                    </div>
                    <p className="text-sm md:text-xl text-white/90 leading-relaxed italic font-medium">
                        "{analysis.observaciones}"
                    </p>
                </div>
            </BlurFade>

            {/* Botones de Acción */}
            <BlurFade delay={0.6} className="w-full flex flex-col gap-4 mt-4">
                <Button
                    onClick={onExploreMap}
                    className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.5rem] h-14 md:h-18 text-[11px] md:text-sm font-black uppercase tracking-[0.3em] transition-all hover:scale-[1.01]"
                >
                    <Network className="w-5 h-5 mr-3 text-cyan-400 animate-pulse" />
                    EXPLORAR MAPA NEURAL
                </Button>

                <Button
                    onClick={onExit}
                    className="w-full bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] text-black rounded-[1.5rem] h-14 md:h-18 text-[11px] md:text-sm font-black uppercase tracking-[0.3em] shadow-[0_15px_45px_-10px_rgba(186,239,0,0.4)] transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                    FINALIZAR EVALUACIÓN
                </Button>
            </BlurFade>
        </div>
    )
}