"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    ChevronLeft,
    CheckCircle2,
    Brain,
    Target,
    Zap,
    ArrowRight,
    Info,
    Lightbulb,
    Loader2,
    Mic,
    MicOff,
    Pause,
    Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BackgroundAnimation } from "../shared/BackgroundAnimation"
import { useEleonor } from "@/contexts/eleonor-context"
import { explainQuestion } from "@/lib/api/skills"
import { API_BASE_URL, API_URL } from "@/lib/config"

interface Exercise {
    id: string
    tipo: "practica_guiada" | "ejercicio_basico" | "micro_reto"
    enunciado: string
    explicacion_breve: string
    pasos?: string[]
    opciones?: string[]
    respuesta_correcta: string
}

interface Session {
    id: number
    title: string
    objective: string
    content: {
        ejercicios: Exercise[]
    }
}

interface SessionPlayerProps {
    session: Session
    onClose: () => void
    onComplete: () => void
    theme: any
}

export function SessionPlayer({ session, onClose, onComplete, theme }: SessionPlayerProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(1)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    const [completing, setCompleting] = useState(false)
    const [isExplaining, setIsExplaining] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [isVoiceEvaluating, setIsVoiceEvaluating] = useState(false)
    const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null)
    const [cachedExplanations, setCachedExplanations] = useState<Record<string, string>>({})
    const [isPaused, setIsPaused] = useState(false)
    const [showTextExplanation, setShowTextExplanation] = useState(false)
    const { enterPresence } = useEleonor()

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
    const startTimeRef = useRef<number>(0)
    const resumeTimeRef = useRef<number>(0)
    const audioBufferRef = useRef<AudioBuffer | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    const exercises = session.content.ejercicios
    const currentExercise = exercises[currentStep]
    const progress = ((currentStep) / exercises.length) * 100

    const handleCheck = () => {
        if (!selectedOption) return
        const correct = selectedOption === currentExercise.respuesta_correcta
        setIsCorrect(correct)
        setShowExplanation(true)
    }

    const handleNext = async () => {
        if (currentStep < exercises.length - 1) {
            setDirection(1)
            setCurrentStep(prev => prev + 1)
            setSelectedOption(null)
            setIsCorrect(null)
            setShowExplanation(false)
        } else {
            await finishSession()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1)
            setCurrentStep(prev => prev - 1)
            setSelectedOption(null)
            setIsCorrect(null)
            setShowExplanation(false)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await evaluateVoice(audioBlob)
                stream.getTracks().forEach(track => track.stop())
            }
            recorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error("Error al grabar:", err)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const evaluateVoice = async (blob: Blob) => {
        setIsVoiceEvaluating(true)
        setVoiceFeedback(null)
        const formData = new FormData()
        formData.append('file', blob, 'voice.webm')
        formData.append('target_objective', currentExercise.enunciado)
        formData.append('expected_answer', currentExercise.respuesta_correcta)

        try {
            const token = localStorage.getItem("eleonor_token")
            const resp = await fetch(`${API_URL}/voice/evaluate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })
            const data = await resp.json()
            if (data.feedback) {
                setVoiceFeedback(data.feedback)
                setIsCorrect(data.success)
                setShowExplanation(true)
            }
        } catch (err) {
            console.error("Error evaluando voz:", err)
        } finally {
            setIsVoiceEvaluating(false)
        }
    }

    const handleExplain = async () => {
        if (!currentExercise || isExplaining) return

        // 1. Verificar si ya tenemos una explicación en caché para este ejercicio
        const exerciseKey = `${session.id}-${currentStep}`
        if (cachedExplanations[exerciseKey]) {
            setShowTextExplanation(true)
            return
        }

        setIsExplaining(true)
        setShowTextExplanation(false)
        enterPresence('DIAGNOSIS')

        try {
            const data = await explainQuestion(currentExercise.enunciado, currentExercise.opciones || [])
            if (data?.explanation) {
                // Guardar en caché
                setCachedExplanations(prev => ({ ...prev, [exerciseKey]: data.explanation }))
                setShowTextExplanation(true)

                const baseUrl = API_BASE_URL
                const ttsResp = await fetch(`${baseUrl}/api/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: data.explanation })
                })
                const ttsData = await ttsResp.json()

                if (ttsData.audio) {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                    const ctx = new AudioContextClass()
                    audioContextRef.current = ctx

                    const binaryString = atob(ttsData.audio)
                    const bytes = new Uint8Array(binaryString.length)
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i)
                    }
                    const audioBuffer = await ctx.decodeAudioData(bytes.buffer)
                    audioBufferRef.current = audioBuffer

                    playAudio(0)
                }
            }
        } catch (error) {
            console.error("Error fetching explanation:", error)
            setIsExplaining(false)
        }
    }

    const playAudio = (offset: number) => {
        if (!audioContextRef.current || !audioBufferRef.current) return

        const ctx = audioContextRef.current
        const source = ctx.createBufferSource()
        const analyser = ctx.createAnalyser()

        source.buffer = audioBufferRef.current
        source.connect(analyser)
        analyser.connect(ctx.destination)

        audioSourceRef.current = source
        analyserRef.current = analyser
        startTimeRef.current = ctx.currentTime - offset

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateAnalysis = () => {
            if (!analyserRef.current || isPaused) return

            analyser.getByteFrequencyData(dataArray)
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
            window.dispatchEvent(new CustomEvent('avatar-speaking', {
                detail: { volume: Math.min(1.0, volume * 1.5) }
            }))
            animationFrameRef.current = requestAnimationFrame(updateAnalysis)
        }

        source.onended = () => {
            if (!isPaused) {
                window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
                setIsExplaining(false)
                setIsPaused(false)
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            }
        }

        source.start(0, offset)
        setIsPaused(false)
        updateAnalysis()
    }

    const togglePause = () => {
        if (!isExplaining) return

        if (isPaused) {
            // Reanudar
            playAudio(resumeTimeRef.current)
        } else {
            // Pausar
            if (audioSourceRef.current) {
                audioSourceRef.current.stop()
                if (audioContextRef.current) {
                    resumeTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current
                }
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
            setIsPaused(true)
        }
    }

    // Cleanup audio on unmount or slide change
    useEffect(() => {
        return () => {
            if (audioSourceRef.current) audioSourceRef.current.stop()
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        }
    }, [currentStep])

    const finishSession = async () => {
        setCompleting(true)
        const token = localStorage.getItem("eleonor_token")
        try {
            const baseUrl = API_BASE_URL
            const resp = await fetch(`${baseUrl}/api/journey/progress?session_id=${session.id}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (resp.ok) {
                onComplete()
            }
        } catch (err) {
            console.error("Error saving progress:", err)
        } finally {
            setCompleting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0B0121] flex flex-col items-center overflow-hidden"
        >
            <BackgroundAnimation />

            {/* Overlay Gradient for depth */}
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#0B0121]/50 to-[#0B0121] pointer-events-none" />

            {/* Header */}
            <div className="w-full max-w-5xl px-6 py-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6">
                    <div className={cn("w-1.5 h-10 rounded-full shadow-lg", theme.tab)} />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className={cn("bg-black/40 border-white/10 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest", theme.textColor)}>
                                Sesión {currentStep + 1} de {exercises.length}
                            </Badge>
                            {currentExercise.tipo === 'micro_reto' && (
                                <Badge className="bg-orange-500 text-white border-0 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                    Desafío Crítico
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">{session.title}</h2>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="rounded-2xl w-12 h-12 p-0 bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full max-w-5xl px-6 mb-12 relative z-10">
                <div className="flex justify-between items-end text-[10px] font-black tracking-widest text-white/30 mb-2 uppercase">
                    <span>Avance de la Sesión</span>
                    <span className={theme.textColor}>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={cn("h-full transition-all duration-500", theme.tab)}
                    />
                </div>
            </div>

            {/* Exercise Content Area */}
            <div className="w-full max-w-4xl px-6 flex-1 flex flex-col justify-start relative z-10 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        initial={{ x: direction * 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction * -50, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col gap-8 h-full"
                    >
                        <Card className="bg-[#120824]/40 border-white/10 p-8 md:p-12 rounded-[3rem] backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col">
                            {/* Accent line */}
                            <div className={cn("absolute left-0 top-12 bottom-12 w-1 rounded-full shadow-[0_0_20px]", theme.tab, theme.tab.includes('bg-[#bf00ff]') ? "shadow-[#bf00ff]" : "")} />

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="flex justify-between items-start mb-8 gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={cn("p-2 rounded-xl bg-white/5", theme.textColor)}>
                                                {currentExercise.tipo === 'practica_guiada' && <Info className="w-5 h-5" />}
                                                {currentExercise.tipo === 'ejercicio_basico' && <Target className="w-5 h-5" />}
                                                {currentExercise.tipo === 'micro_reto' && <Zap className="w-5 h-5" />}
                                            </div>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{currentExercise.tipo.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight">{currentExercise.enunciado}</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            onClick={isExplaining ? togglePause : handleExplain}
                                            variant="outline"
                                            className={cn(
                                                "shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl border-white/10 bg-white/5 transition-all p-0 flex flex-col items-center justify-center gap-1",
                                                isExplaining ? "text-emerald-400 border-emerald-400/20" : "text-white/60 hover:text-white"
                                            )}
                                        >
                                            {isExplaining ? (
                                                isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />
                                            ) : (
                                                <Brain className={cn("w-6 h-6", theme.textColor)} />
                                            )}
                                        </Button>
                                        {isExplaining && (
                                            <span className="text-[7px] font-black uppercase text-center opacity-40">
                                                {isPaused ? 'Pausado' : 'Hablando'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Textual Explanation Cache Display */}
                                <AnimatePresence>
                                    {showTextExplanation && cachedExplanations[`${session.id}-${currentStep}`] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-6 p-6 rounded-2xl bg-white/[0.02] border border-white/10 border-l-purple-500 border-l-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <Brain className={cn("w-5 h-5 mt-1 shrink-0", theme.textColor)} />
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Resumen de Eleonor</span>
                                                    <p className="text-sm text-gray-300 italic leading-relaxed">
                                                        {cachedExplanations[`${session.id}-${currentStep}`]}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Options or Steps Rendering Logic */}
                                <div className="grid grid-cols-1 gap-4 mb-8 relative">
                                    {currentExercise.tipo === "practica_guiada" ? (
                                        <div className="space-y-6 relative">
                                            {/* Decorative vertical timeline line */}
                                            <div className="absolute left-[2.45rem] top-6 bottom-6 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent z-0" />

                                            {currentExercise.pasos?.map((paso, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.15 }}
                                                    key={i}
                                                    className="flex gap-6 p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 group hover:border-white/20 transition-all hover:bg-white/[0.06] shadow-xl hover:-translate-y-1 relative overflow-hidden z-10"
                                                >
                                                    <div className={cn(
                                                        "flex-shrink-0 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center font-black text-sm border-2 border-purple-500/30 group-hover:border-purple-500 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)]",
                                                        theme.textColor
                                                    )}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 pt-1">
                                                        <p className="text-gray-200 leading-relaxed font-semibold text-base md:text-lg">{paso}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {currentExercise.opciones?.map((opt, i) => (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    key={i}
                                                    onClick={() => !showExplanation && setSelectedOption(opt)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-6 rounded-[1.5rem] border transition-all text-left relative overflow-hidden",
                                                        selectedOption === opt
                                                            ? cn("border-transparent text-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] scale-[1.01]", theme.tab)
                                                            : "border-white/5 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06] hover:scale-[1.005]"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-5 relative z-10">
                                                        <div className={cn(
                                                            "w-3 h-3 rounded-full transition-all duration-300",
                                                            selectedOption === opt ? "bg-white scale-125 shadow-[0_0_15px_white]" : "bg-white/10"
                                                        )} />
                                                        <span className="font-bold text-base md:text-lg leading-snug">{opt}</span>
                                                    </div>
                                                    {selectedOption === opt && (
                                                        <motion.div layoutId="checkInSession" className="relative z-10">
                                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            ))}

                                            {currentExercise.tipo === 'micro_reto' && !showExplanation && (
                                                <div className="flex flex-col items-center gap-4 mt-6 p-8 rounded-[2rem] bg-orange-500/5 border border-dashed border-orange-500/30">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">¿Deseas responder mediante dictado de voz?</p>
                                                    <Button
                                                        onClick={isRecording ? stopRecording : startRecording}
                                                        disabled={isVoiceEvaluating}
                                                        className={cn(
                                                            "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                                                            isRecording ? "bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:scale-110"
                                                        )}
                                                    >
                                                        {isVoiceEvaluating ? (
                                                            <Loader2 className="w-8 h-8 animate-spin" />
                                                        ) : isRecording ? (
                                                            <MicOff className="w-8 h-8" />
                                                        ) : (
                                                            <Mic className="w-8 h-8" />
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Feedback & Explanation */}
                                <AnimatePresence>
                                    {showExplanation && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "p-8 rounded-[2rem] border relative overflow-hidden mt-4",
                                                isCorrect === false ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                                            )}
                                        >
                                            <div className="flex items-start gap-4 relative z-10">
                                                <div className={cn("p-2 rounded-xl bg-black/20", isCorrect === false ? "text-red-400" : "text-emerald-400")}>
                                                    <Lightbulb className="w-6 h-6 shrink-0" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isCorrect === false ? "text-red-400" : "text-emerald-400")}>
                                                        {isCorrect === false ? "Análisis de Reacción" : "Validación Completada"}
                                                    </span>
                                                    <p className="text-sm md:text-lg text-white/90 leading-relaxed italic font-medium">
                                                        "{voiceFeedback || currentExercise.explicacion_breve || (isCorrect ? "Tu respuesta ha sido validada correctamente por nuestra red neuronal." : "Has tomado una decisión que requiere análisis. Revisa los fundamentos técnicos para optimizar tu criterio.")}"
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="w-full max-w-4xl px-6 py-10 flex justify-between items-center relative z-20">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0 || showExplanation}
                    className="text-white/30 hover:text-white hover:bg-white/5 font-bold tracking-widest uppercase text-[10px] px-6"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>

                {!showExplanation ? (
                    <Button
                        disabled={currentExercise.opciones && currentExercise.opciones.length > 0 && !selectedOption}
                        onClick={currentExercise.opciones && currentExercise.opciones.length > 0 ? handleCheck : () => setShowExplanation(true)}
                        className={cn("px-12 py-7 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-[0.98] text-[11px]", theme.tab)}
                    >
                        {currentExercise.opciones && currentExercise.opciones.length > 0 ? "Verificar Acción" : "Marcar como Comprendido"}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        disabled={completing}
                        className={cn("px-12 py-7 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-[0.98] text-[11px] flex items-center gap-3", theme.tab)}
                    >
                        {completing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>{currentStep === exercises.length - 1 ? 'Finalizar Sesión' : 'Siguiente Fase'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                )}
            </div>
        </motion.div>
    )
}
