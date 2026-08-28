"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEleonor } from '@/contexts/eleonor-context'
import { createPortal } from 'react-dom'
import { Brain, Sparkles, TrendingUp, Target, Zap, X, Network, ArrowRight, User } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { API_BASE_URL, VOICE_PLAYBACK_ENABLED } from '@/lib/config'
import { fetchUserProfile } from '@/lib/api/user'

interface DiagnosisEleonorOverlayProps {
    analysis: {
        nivel: number
        // Campos de madurez orientativa (del JudgeAgent + rubrica_base.py)
        nivel_etiqueta?: string
        nivel_rango?: string
        nivel_descripcion_orientativa?: string
        nota_incertidumbre?: string
        razonamiento: string
        observaciones: string
        potencial: string
        errores: string[]
        analisis_profundo?: string
        puntos_fuertes?: string[]
        recomendaciones?: string[]
        confianza?: string
        technicalSummary?: string
        spoken_analysis?: string
    }
    onClose: () => void
    onExit?: () => void
    onExploreMap?: () => void
}

export const DiagnosisEleonorOverlay: React.FC<DiagnosisEleonorOverlayProps> = ({
    analysis,
    onClose,
    onExit,
    onExploreMap
}) => {
    const { enterPresence, preload } = useEleonor()
    const [mounted, setMounted] = useState(false)
    const [showContent, setShowContent] = useState(false)
    const [userName, setUserName] = useState<string>('Estudiante')

    const audioContextRef = useRef<AudioContext | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null)
    const lastTextRef = useRef<string | null>(null)

    useEffect(() => {
        console.log("🛠️ DiagnosisEleonorOverlay MOUNTED with analysis:", analysis)
        setMounted(true)
        preload()
        enterPresence('DIAGNOSIS')

        const fetchUser = async () => {
            try {
                const user = await fetchUserProfile()
                if (user) {
                    setUserName(user.full_name || user.username || 'Estudiante')
                }
            } catch (err) {
                console.error("Error fetching user:", err)
            }
        }
        fetchUser()

        // Timer for the "jump" entrance feel - slightly faster
        const timer = setTimeout(() => {
            console.log("🚀 Showing content now")
            setShowContent(true)
        }, 300)

        return () => {
            console.log("💀 DiagnosisEleonorOverlay UNMOUNTING")
            clearTimeout(timer)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (bufferSourceRef.current) {
                try { bufferSourceRef.current.stop(); } catch (e) { }
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [analysis, enterPresence, preload])

    const playTTS = async (text: string) => {
        if (!VOICE_PLAYBACK_ENABLED) return
        if (!text || text === lastTextRef.current) return
        lastTextRef.current = text

        try {
            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            })
            const data = await response.json()
            if (data.audio) {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
                if (bufferSourceRef.current) {
                    try { bufferSourceRef.current.stop(); } catch (e) { }
                }

                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                    audioContextRef.current = new AudioContextClass()
                }
                const ctx = audioContextRef.current
                if (ctx.state === 'suspended') await ctx.resume()

                const binaryString = atob(data.audio)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                const audioBuffer = await ctx.decodeAudioData(bytes.buffer)

                const analyser = ctx.createAnalyser()
                analyser.fftSize = 512
                const source = ctx.createBufferSource()
                source.buffer = audioBuffer
                source.connect(analyser)
                analyser.connect(ctx.destination)
                bufferSourceRef.current = source

                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                const updateAnalysis = () => {
                    analyser.getByteFrequencyData(dataArray)
                    const volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
                    window.dispatchEvent(new CustomEvent('avatar-speaking', {
                        detail: { volume: Math.min(1.0, volume * 1.5) }
                    }))
                    animationFrameRef.current = requestAnimationFrame(updateAnalysis)
                }

                source.onended = () => {
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
                    window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
                }

                source.start(0)
                updateAnalysis()
            }
        } catch (e) {
            console.error("TTS Error:", e)
        }
    }

    useEffect(() => {
        if (showContent && analysis) {
            const summary = analysis.spoken_analysis ||
                (analysis.analisis_profundo
                    ? `He completado tu evaluación científica, ${userName}. ${analysis.analisis_profundo} ${analysis.observaciones}`
                    : `Saludos ${userName}. Basado en tu desempeño, presento el siguiente diagnóstico: ${analysis.observaciones || ''}. Tu perfil se identifica como ${analysis.razonamiento || 'en proceso'}. Para mejorar, recomiendo enfocarte en: ${(analysis.recomendaciones || analysis.errores || []).slice(0, 3).join(', ') || 'revisión técnica'}.`)

            if (VOICE_PLAYBACK_ENABLED) {
                console.log("🗣️ Triggering TTS:", summary)
                playTTS(summary)
            }

            // Auto-hide avatar after some time if requested or just ensure IDLE_HIDDEN on close
        }
    }, [showContent, analysis])

    const handleFinalClose = () => {
        if (bufferSourceRef.current) {
            try { bufferSourceRef.current.stop(); } catch (e) { }
        }
        enterPresence('IDLE_HIDDEN')
        onClose()
    }

    if (!mounted) return null

    return createPortal(
        <>
            <div className="fixed inset-0 z-[340] flex flex-col overflow-y-auto custom-scrollbar pointer-events-auto">
                {/* Background Blur Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#0B0121] z-0"
                />

                {/* Content Container */}
                <div className="relative w-full max-w-5xl px-6 flex flex-col items-center justify-start min-h-screen pt-[12vh] pb-[20vh] z-10 mx-auto">

                    {/* Header Section (The "Jump" element) */}
                    <AnimatePresence>
                        {showContent && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 100, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.1
                                }}
                                className="w-full flex flex-col items-center gap-8"
                            >
                                {/* Title Chip */}
                                <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Perfil Orientativo de Tendencias</span>
                                </div>

                                {/* Main Diagnostic Title */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-md shadow-lg">
                                        <User className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs font-black uppercase tracking-widest text-white">
                                            Perfil Orientativo · <span className="text-cyan-400">{userName}</span>
                                        </span>
                                    </div>
                                    <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
                                        {analysis.razonamiento} <span className="text-purple-500">{analysis.nivel > 0 ? 'DETECTADO' : ''}</span>
                                    </h2>
                                    {analysis.analisis_profundo && (
                                        <p className="text-purple-200/60 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed px-4">
                                            {analysis.analisis_profundo}
                                        </p>
                                    )}
                                </div>

                                {/* Cards Grid - Responsive columns */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                                    {/* Column 1: Core Insight & Strengths */}
                                    <div className="space-y-6">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden h-full flex flex-col"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[2px_0_15px_rgba(191,0,255,0.5)]" />
                                            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Brain className="w-3 h-3" /> Eleonor Sugiere
                                            </h3>
                                            <p className="text-white/90 text-sm md:text-base font-medium italic leading-relaxed mb-6">
                                                "{analysis.observaciones}"
                                            </p>

                                            {(analysis.puntos_fuertes || []).length > 0 && (
                                                <div className="mt-auto space-y-2">
                                                    <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Puntos Fuertes</h4>
                                                    {analysis.puntos_fuertes?.map((p, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-tight">{p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Column 2: Performance Summary (Replaces Potential) */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group"
                                    >
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative w-28 h-28 rounded-full border-4 border-cyan-500/30 flex flex-col items-center justify-center gap-0.5">
                                                <span className="text-2xl font-black text-white tracking-tighter leading-none">
                                                    {analysis.nivel_etiqueta || (
                                                        analysis.nivel >= 80 ? 'Experto' :
                                                        analysis.nivel >= 60 ? 'Competente' :
                                                        analysis.nivel >= 40 ? 'En Desarrollo' : 'Inicial'
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-[10px] font-black text-cyan-200 uppercase tracking-widest mb-1">Tendencia Orientativa</h3>
                                        <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                                            Rango estimado: {analysis.nivel_rango || `${Math.max(0, analysis.nivel - 9)}–${Math.min(100, analysis.nivel + 10)}`}
                                        </p>

                                        <div className="mt-6 pt-6 border-t border-cyan-500/20 w-full">
                                            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[200px] mx-auto uppercase font-black italic tracking-wider">
                                                {analysis.nota_incertidumbre
                                                    ? 'Estimación orientativa basada en LLMs.'
                                                    : 'Perfil orientativo sincronizado con el Mapa Neural.'}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Column 3: Recommendations */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col h-full"
                                    >
                                        <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Zap className="w-3 h-3" /> Rutas de Exploración Sugeridas
                                        </h3>
                                        <div className="space-y-3 flex-1">
                                            {(analysis.recomendaciones || analysis.errores || []).slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group">
                                                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                                                        <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white uppercase tracking-tight leading-tight">{item}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('refresh-skills'));
                                                handleFinalClose();
                                            }}
                                            variant="ghost"
                                            className="mt-6 w-full group/btn text-purple-400 hover:text-purple-300 hover:bg-purple-500/5 rounded-xl border border-purple-500/20 text-[10px] font-black tracking-widest uppercase py-6"
                                        >
                                            Finalizar Diagnóstico
                                            <X className="ml-2 w-4 h-4" />
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('refresh-skills'));
                                                onExploreMap && onExploreMap();
                                            }}
                                            variant="ghost"
                                            className="mt-3 w-full group/btn text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5 rounded-xl border border-cyan-500/20 text-[10px] font-black tracking-widest uppercase py-6"
                                        >
                                            Ver Mapa Neuronal
                                            <Network className="ml-2 w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* EXIT BUTTON LAYER: IN FRONT OF ELEONOR (Z-400) */}
            <div className="fixed inset-0 z-[400] pointer-events-none">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    onClick={onClose}
                    className="absolute top-6 right-6 md:top-10 md:right-10 px-6 py-3 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center gap-3 justify-center text-red-100 hover:text-white hover:bg-red-500/40 hover:scale-105 hover:border-red-400 transition-all backdrop-blur-xl pointer-events-auto shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                >
                    <span className="text-xs md:text-sm font-black tracking-widest uppercase">
                        CERRAR DIAGNÓSTICO
                    </span>
                    <div className="bg-red-500/40 p-1.5 rounded-full">
                        <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                    </div>
                </motion.button>
            </div>
        </>,
        document.body
    )
}
