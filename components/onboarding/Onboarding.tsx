"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEleonor } from '@/contexts/eleonor-context'
import { API_BASE_URL } from '@/lib/config'
import { Input } from '@/components/ui/input'
import { createPortal } from 'react-dom'

// Componente de ondas de audio auto-contenido, reactivo al evento avatar-speaking
const AudioWaveform: React.FC = () => {
    const [bars, setBars] = React.useState([0.3, 0.5, 0.8, 1.0, 0.8, 0.5, 0.3])

    React.useEffect(() => {
        let animFrame: number
        let currentVol = 0
        let idlePhase = 0

        const handleSpeaking = (e: Event) => {
            const vol = (e as CustomEvent).detail?.volume || 0
            currentVol = vol
        }
        window.addEventListener('avatar-speaking', handleSpeaking)

        const animate = () => {
            idlePhase += 0.05
            const baseAmp = currentVol > 0.02 ? currentVol : 0.15 + Math.sin(idlePhase) * 0.1
            setBars([
                baseAmp * (0.4 + Math.sin(idlePhase * 1.3) * 0.3),
                baseAmp * (0.6 + Math.sin(idlePhase * 0.9) * 0.4),
                baseAmp * (0.9 + Math.sin(idlePhase * 1.7) * 0.1),
                baseAmp * (1.0 + Math.sin(idlePhase * 2.1) * 0.05),
                baseAmp * (0.9 + Math.sin(idlePhase * 1.4) * 0.1),
                baseAmp * (0.6 + Math.sin(idlePhase * 1.1) * 0.4),
                baseAmp * (0.4 + Math.sin(idlePhase * 0.7) * 0.3),
            ])
            animFrame = requestAnimationFrame(animate)
        }
        animFrame = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(animFrame)
            window.removeEventListener('avatar-speaking', handleSpeaking)
        }
    }, [])

    return (
        <div className="relative z-10 flex items-end justify-center gap-[3px]">
            {bars.map((amp, i) => (
                <div
                    key={i}
                    className="w-[3px] bg-cyan-400 rounded-full"
                    style={{ height: `${Math.max(4, amp * 24)}px`, opacity: 0.7 + amp * 0.3 }}
                />
            ))}
        </div>
    )
}

const SCRIPT = [
    {
        id: 'presentacion',
        eleonor: "¡Hola, futuro líder! Soy Moya... tu asistente felino. Y voy a acompañarte durante este programa. Aquí aprenderás, explorarás nuevas habilidades... y, quién sabe, quizá descubras algo nuevo sobre ti. ¿Listo? ¡Empecemos!",
        isQuestion: false
    }
]

const GUIDE_SCRIPT = [
    {
        id: 'guia_inicio',
        eleonor: "Estamos en Skill-Tech... un ecosistema de herramientas educativas. Aquí, mentores y estudiantes pueden aprender, compartir y crecer juntos.",
        highlight: 'sidebar',
        expression: 'Explicando',
        navigate: null,
        action: null,
        scrollBack: false
    },
    {
        id: 'guia_credencial',
        eleonor: "Primero, toca tu nombre, aquí arriba. Ahí podrás abrir tu credencial... y luego, tu código QR para registrar tu llegada.",
        highlight: 'profile',
        expression: 'Atenta',
        navigate: 'profile',
        action: null,
        scrollBack: false
    },
    {
        id: 'guia_skillmap',
        eleonor: "En tu SkillMap encontrarás una radiografía de las distintas clases que tendremos durante el programa. Échale un vistazo cuando puedas.",
        highlight: 'skillmap',
        expression: 'Explicando',
        navigate: 'skillmap',
        action: null,
        scrollBack: false
    },
    {
        id: 'guia_examenes_intro',
        eleonor: "¡Tu primera gran exploración de habilidades! Aquí descubrirás qué estilo de liderazgo tienes y cómo puedes marcar la diferencia.",
        highlight: 'practice',
        expression: 'Atenta',
        navigate: 'practice',
        action: 'onboarding-scroll-modules',
        scrollBack: false
    },
    {
        id: 'guia_diagnostico',
        eleonor: "Este es tu Liderómetro. Vuelve aquí cuando quieras para revisar tus métricas, ver cómo evolucionan tus fortalezas... y celebrar tu progreso, sábado a sábado.",
        highlight: 'diagnosis',
        expression: 'Atenta',
        navigate: 'diagnosis',
        action: null,
        scrollBack: false
    },
    {
        id: 'guia_configuracion',
        eleonor: "Y por ultimo pero no menos importante... En esta sección puedes consultar tu información de cuenta.. Y hazme caso y dale una renovada a tu contraseña",
        highlight: 'settings',
        expression: 'Explicando',
        navigate: 'settings',
        action: null,
        scrollBack: false
    },
    {
        id: 'guia_asistente',
        eleonor: "¡Llegó la hora de medir tu potencial! Ve resolviendo con calma... que el camino es largo. Yo, mientras tanto, voy a ponerme cómoda. ¡Te deseo mucha suerte!",
        highlight: 'assistant',
        expression: 'Saludando',
        navigate: 'assistant',
        action: null,
        scrollBack: false
    }
]

const AUDIO_FILE_MAP: Record<string, string> = {
    'presentacion': 'Presentacion.mp3',
    'guia_inicio': 'Inicio.mp3',
    'guia_credencial': 'Credencial.mp3',
    'guia_skillmap': 'Skillmap.mp3',
    'guia_examenes_intro': 'Examenes.mp3',
    'guia_diagnostico': 'Diagnostico.mp3',
    'guia_configuracion': 'Configuraciones.mp3',
    'guia_asistente': 'Asistente.mp3',
}

interface OnboardingProps {
    onComplete: () => void
    onNavigate?: (page: string) => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onNavigate }) => {
    // FASE 3: Usar nueva API de presencia
    const { enterPresence, saveResponse, completeOnboarding, setGuideHighlight, preload } = useEleonor()
    const [step, setStep] = useState(0)
    const [guideStep, setGuideStep] = useState(-1)
    const [isGuiding, setIsGuiding] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [hasInteracted, setHasInteracted] = useState(false)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const animationFrameRef = React.useRef<number | null>(null)
    const bufferSourceRef = React.useRef<AudioBufferSourceNode | null>(null)
    const lastTextRef = React.useRef<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isLastStep = step === SCRIPT.length - 1
    const currentStep = isGuiding ? GUIDE_SCRIPT[guideStep] : SCRIPT[step]

    // TTS & Static MP3 Logic (Predeterminado: MP3 locales -> Fallback: TTS es-MX-DaliaNeural -> Fallback: Browser es-MX)
    const playTTS = async (text: string, audioId?: string, onFinish?: () => void) => {
        if (!text || text === lastTextRef.current) return
        lastTextRef.current = text

        try {
            let arrayBuffer: ArrayBuffer | null = null

            // 1. PREDETERMINADO: Cargar archivo MP3 estático (Inicio.mp3, Skillmap.mp3, etc.)
            const fileName = audioId ? (AUDIO_FILE_MAP[audioId] || `${audioId}.mp3`) : null
            if (fileName) {
                try {
                    const staticRes = await fetch(`/audio/onboarding/${fileName}`)
                    if (staticRes.ok) {
                        arrayBuffer = await staticRes.arrayBuffer()
                    }
                } catch (e) {
                    console.warn(`Audio MP3 estático ${fileName} no encontrado:`, e)
                }
            }

            // 2. FALLBACK 1: API Backend /api/tts (Usa Edge-TTS con la voz antigua de México: es-MX-DaliaNeural)
            if (!arrayBuffer) {
                try {
                    const ttsToken = localStorage.getItem("eleonor_token")
                    const response = await fetch(`${API_BASE_URL}/api/tts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(ttsToken ? { "Authorization": `Bearer ${ttsToken}` } : {})
                        },
                        body: JSON.stringify({ text })
                    })
                    if (response.ok) {
                        const data = await response.json()
                        if (data.audio) {
                            const binaryString = atob(data.audio)
                            const bytes = new Uint8Array(binaryString.length)
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i)
                            }
                            arrayBuffer = bytes.buffer
                        }
                    }
                } catch (e) {
                    console.warn("Error consultando backend TTS es-MX:", e)
                }
            }

            if (arrayBuffer) {
                // 1. Limpiar reproducción anterior
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                    animationFrameRef.current = null
                }
                if (bufferSourceRef.current) {
                    try {
                        bufferSourceRef.current.onended = null
                        bufferSourceRef.current.stop();
                    } catch (e) { }
                }

                // 2. Inicializar AudioContext
                if (!audioContextRef.current || (audioContextRef.current.state as any) === 'closed') {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                    audioContextRef.current = new AudioContextClass()
                }
                const ctx = audioContextRef.current
                if (ctx.state === 'suspended') await ctx.resume()

                if ((ctx.state as any) === 'closed') return;

                // 3. Decodificar audio
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
                if ((ctx.state as any) === 'closed') return;

                // 4. NORMALIZACIÓN DE VOLUMEN RMS + DYNAMICS COMPRESSOR (Equilibra Inicio.mp3, Configuraciones.mp3 y los demás)
                let sumSq = 0
                let sampleCount = 0
                let maxPeak = 0
                for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
                    const channelData = audioBuffer.getChannelData(c)
                    for (let i = 0; i < channelData.length; i++) {
                        const abs = Math.abs(channelData[i])
                        if (abs > maxPeak) maxPeak = abs
                        if (abs > 0.015) {
                            sumSq += abs * abs
                            sampleCount++
                        }
                    }
                }

                const rms = sampleCount > 0 ? Math.sqrt(sumSq / sampleCount) : 0.1
                const targetRMS = 0.20
                let gainValue = targetRMS / (rms || 0.1)

                // Evitar distorsión/clipping
                if (maxPeak * gainValue > 0.95) {
                    gainValue = 0.95 / (maxPeak || 1)
                }
                gainValue = Math.min(Math.max(gainValue, 0.5), 4.5)

                const compressor = ctx.createDynamicsCompressor()
                compressor.threshold.value = -24
                compressor.knee.value = 12
                compressor.ratio.value = 4
                compressor.attack.value = 0.003
                compressor.release.value = 0.25

                const gainNode = ctx.createGain()
                gainNode.gain.value = gainValue

                const analyser = ctx.createAnalyser()
                analyser.fftSize = 512
                const source = ctx.createBufferSource()
                source.buffer = audioBuffer

                // Conectar nodos: Source -> Compressor -> Gain -> Analyser -> Destination
                source.connect(compressor)
                compressor.connect(gainNode)
                gainNode.connect(analyser)
                analyser.connect(ctx.destination)
                bufferSourceRef.current = source

                // 5. Loop de Análisis (Lip-Sync de Moya)
                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                let currentAnimFrame: number;

                const updateAnalysis = () => {
                    analyser.getByteFrequencyData(dataArray)

                    const binCount = dataArray.length
                    const sampleRate = ctx.sampleRate

                    const bassEnd = Math.floor(200 / (sampleRate / 2) * binCount)
                    const midEnd = Math.floor(1000 / (sampleRate / 2) * binCount)
                    const highEnd = Math.floor(4000 / (sampleRate / 2) * binCount)

                    let bassSum = 0, midSum = 0, highSum = 0
                    for (let i = 0; i < bassEnd; i++) bassSum += dataArray[i]
                    for (let i = bassEnd; i < midEnd; i++) midSum += dataArray[i]
                    for (let i = midEnd; i < highEnd; i++) highSum += dataArray[i]

                    const bass = bassSum / (bassEnd || 1) / 255
                    const mid = midSum / (midEnd - bassEnd || 1) / 255
                    const high = highSum / (highEnd - midEnd || 1) / 255

                    const volume = Math.min(0.5, (bass * 0.4 + mid * 0.4 + high * 0.2) * 0.8)

                    window.dispatchEvent(new CustomEvent('avatar-speaking', {
                        detail: { volume, bass, mid, high }
                    }))

                    currentAnimFrame = requestAnimationFrame(updateAnalysis)
                    animationFrameRef.current = currentAnimFrame
                }

                source.onended = () => {
                    if (animationFrameRef.current === currentAnimFrame) {
                        cancelAnimationFrame(currentAnimFrame)
                        animationFrameRef.current = null
                    }
                    window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))

                    if (onFinish) {
                        setTimeout(onFinish, 300)
                    }
                }

                source.start(0)
                updateAnalysis()
            } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                // FALLBACK 2: Síntesis nativa del navegador con la voz de México (es-MX)
                window.speechSynthesis.cancel()
                const utterance = new SpeechSynthesisUtterance(text)
                utterance.lang = "es-MX"
                const voices = window.speechSynthesis.getVoices()
                const mxVoice = voices.find(v => v.lang === "es-MX" || v.lang === "es_MX")
                    || voices.find(v => v.lang.startsWith("es") && (v.name.includes("Mexico") || v.name.includes("México") || v.name.includes("Dalia") || v.name.includes("Sabina") || v.name.includes("Jorge")))
                    || voices.find(v => v.lang.startsWith("es"))
                if (mxVoice) utterance.voice = mxVoice

                let interval: any
                utterance.onstart = () => {
                    interval = setInterval(() => {
                        const volume = 0.3 + Math.random() * 0.5
                        window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume } }))
                    }, 100)
                }
                utterance.onend = () => {
                    clearInterval(interval)
                    window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
                    if (onFinish) setTimeout(onFinish, 300)
                }
                utterance.onerror = () => {
                    clearInterval(interval)
                    window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
                    if (onFinish) onFinish()
                }
                window.speechSynthesis.speak(utterance)
            }
        } catch (e) {
            console.error("TTS Error:", e)
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                try {
                    window.speechSynthesis.cancel()
                    const utterance = new SpeechSynthesisUtterance(text)
                    utterance.lang = "es-MX"
                    utterance.onend = () => { if (onFinish) onFinish() }
                    utterance.onerror = () => { if (onFinish) onFinish() }
                    window.speechSynthesis.speak(utterance)
                } catch {
                    if (onFinish) onFinish()
                }
            } else {
                if (onFinish) onFinish()
            }
        }
    }

    // Cleanup en desmonte
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (bufferSourceRef.current) {
                try { bufferSourceRef.current.stop(); } catch (e) { }
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    // FASE 4: Onboarding controla presencia y cámara al montar
    useEffect(() => {
        preload() // CRITICAL: Activar preload para que isAuthorized sea true
        enterPresence('INTRO_ACTIVE')

        // Bloquear scroll durante el onboarding
        document.body.style.overflow = 'hidden'

        return () => {
            // Restaurar scroll al salir
            document.body.style.overflow = 'unset'
        }
    }, [enterPresence, preload])

    useEffect(() => {
        if (!currentStep) return

        const handleNextStep = () => {
            if (isGuiding) {
                if (guideStep < GUIDE_SCRIPT.length - 1) {
                    setGuideStep(prev => prev + 1)
                } else {
                    // ÚLTIMO PASO DE LA GUÍA (7/7) -> Finalizar onboarding y poner a Moya en posición ASSISTANT
                    if (bufferSourceRef.current) {
                        try { bufferSourceRef.current.stop(); } catch (e) { }
                    }
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                    window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }));
                    completeOnboarding()
                    enterPresence('INTRO_DONE')
                    enterPresence('INTERVENTION')
                    if (onNavigate) onNavigate('assistant')
                    onComplete()
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('toggle-eleonor-history', { detail: true }))
                    }, 300)
                }
            } else {
                const scriptStep = currentStep as any
                if (!scriptStep.isQuestion) {
                    if (step < SCRIPT.length - 1) {
                        setStep(prev => prev + 1)
                    } else {
                        completeOnboarding()
                        setIsGuiding(true)
                        setGuideStep(0)
                        enterPresence('GUIDE_ACTIVE')
                    }
                }
            }
        }

        const scriptStep = currentStep as any
        if (scriptStep.isQuestion && !hasInteracted) return; // Esperar interacción para preguntas

        playTTS(currentStep.eleonor, currentStep.id, handleNextStep)

        if (isGuiding) {
            const guideStepData = currentStep as any
            setGuideHighlight(guideStepData.highlight || null)

            // Navegar a página si el paso lo requiere
            if (guideStepData.navigate && onNavigate) {
                onNavigate(guideStepData.navigate)
            }

            // Si el paso requiere scroll de regreso al inicio
            if (guideStepData.scrollBack) {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('onboarding-scroll-top'))
                }, 400)
            }

            // Disparar acción custom para controlar UI interna
            if (guideStepData.action) {
                // Pequeño delay para que la navegación renderice primero
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent(guideStepData.action))
                }, 600)
            }

            // Resaltar cursos específicos del guión
            if (guideStepData.highlightCourses) {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('onboarding-highlight-courses', {
                        detail: { courses: guideStepData.highlightCourses }
                    }))
                }, 800)
            } else {
                window.dispatchEvent(new CustomEvent('onboarding-highlight-courses', { detail: { courses: [] } }))
            }

            if (guideStepData.expression) {
                window.dispatchEvent(new CustomEvent('avatar-expression', {
                    detail: { expression: guideStepData.expression }
                }))
            }
        }
    }, [step, guideStep, isGuiding, setGuideHighlight, playTTS])

    // Completar el onboarding de forma manual desde el click de la barra lateral
    useEffect(() => {
        const handleManualComplete = () => {
            if (bufferSourceRef.current) {
                try { bufferSourceRef.current.stop(); } catch (e) { }
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }));
            completeOnboarding()
            enterPresence('INTRO_DONE')
            enterPresence('INTERVENTION')
            if (onNavigate) onNavigate('assistant')
            onComplete()
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('toggle-eleonor-history', { detail: true }))
            }, 300)
        }
        window.addEventListener('onboarding-completed-manually', handleManualComplete)
        return () => window.removeEventListener('onboarding-completed-manually', handleManualComplete)
    }, [onComplete, completeOnboarding, enterPresence, onNavigate])

    const handleSend = () => {
        const scriptStep = currentStep as any
        if (inputValue.trim() !== '' && scriptStep.isQuestion) {
            saveResponse(scriptStep.index!, inputValue.trim())
            setInputValue('')
            if (step < SCRIPT.length - 1) {
                setStep(step + 1)
            } else {
                completeOnboarding()
                setIsGuiding(true)
                setGuideStep(0)
                enterPresence('GUIDE_ACTIVE')
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    const unlockAudio = () => {
        setHasInteracted(true)
        // Intentar desbloquear AudioContext inmediatamente
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            audioContextRef.current = new AudioContextClass()
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }
    }

    if (!mounted) return null

    return createPortal(
        <>
            {/* CAPA 1: Atmósfera de Moya (FOCUS MODE) */}
            <AnimatePresence>
                {!isGuiding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[210] overflow-hidden pointer-events-none"
                    >
                        {/* Spotlight Dramático: Oscurece todo menos el centro (Avatar) */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_10%,#000000_90%)] opacity-80" />

                        {/* Neuro-Link Grid: Suelo digital perceptivo */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-50 perspective-[1000px] rotate-x-12 scale-150" />

                        {/* Orbes de Energía (Originales mantenidos pero sutiles) */}
                        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CAPA 2: Desenfoque de Fondo */}
            <AnimatePresence>
                {!isGuiding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ willChange: "opacity" }}
                        className="fixed inset-0 z-[220] backdrop-blur-md bg-black/40"
                    />
                )}
            </AnimatePresence>

            {/* CAPA 2.5: Glitch Overlay (Transiciones) */}
            <AnimatePresence>
                {!isGuiding && (
                    <motion.div
                        key={currentStep.id} // Re-render glitch on step change
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[225] pointer-events-none bg-cyan-500/10 mix-blend-overlay"
                        style={{
                            backgroundImage: 'url("/noise.svg")',
                            backgroundSize: '200px'
                        }}
                    />
                )}
            </AnimatePresence>

            {/* CAPA 2.8: Highlights Contextuales del Tour */}
            <AnimatePresence>
                {isGuiding && (currentStep as any)?.highlight === 'quiz-help-button' && (
                    <motion.div
                        key="highlight-help"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 z-[260] pointer-events-none flex items-center justify-center"
                    >
                        <div className="relative flex items-center justify-center">
                            {/* Anillo pulsante */}
                            <div className="absolute w-24 h-24 rounded-full border-2 border-purple-400/60 animate-ping" />
                            <div className="absolute w-20 h-20 rounded-full border border-purple-400/30 animate-pulse" />
                            {/* Mock botón ? */}
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-400/80 shadow-[0_0_30px_rgba(191,0,255,0.5)] flex items-center justify-center backdrop-blur-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(167,139,250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                            </div>
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/80 border border-purple-500/30 rounded-xl px-4 py-2 text-xs font-bold text-purple-300 tracking-wider whitespace-nowrap backdrop-blur-md">
                                Pide una pista a Moya
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGuiding && (currentStep as any)?.highlight === 'results-right' && (
                    <motion.div
                        key="highlight-right"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="fixed top-0 right-0 w-1/2 h-full z-[260] pointer-events-none hidden md:block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 to-transparent border-l-2 border-cyan-400/30" />
                        <div className="absolute top-1/2 -translate-y-1/2 right-8 flex flex-col items-end gap-3">
                            <div className="bg-black/80 border border-cyan-400/40 rounded-2xl px-5 py-3 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Resultado General</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    <span className="text-sm font-bold text-white">Tu rendimiento global</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGuiding && (currentStep as any)?.highlight === 'results-left' && (
                    <motion.div
                        key="highlight-left"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="fixed top-0 left-0 w-1/2 h-full z-[260] pointer-events-none hidden md:block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent border-r-2 border-purple-400/30" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-8 flex flex-col items-start gap-3">
                            <div className="bg-black/80 border border-purple-400/40 rounded-2xl px-5 py-3 backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Plan de Mejora</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                    <span className="text-sm font-bold text-white">Cómo puedes mejorar</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mock de Interfaz de Examen Abierto durante la Guía */}
            <AnimatePresence>
                {isGuiding && (currentStep.id === 'guia_examen_boton_ayuda' || currentStep.id === 'guia_examen_recomendacion') && (
                    <motion.div
                        key="mock-exam-interface"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[255] bg-[#0B0121] flex flex-col justify-start pt-6 pb-24 px-6 pointer-events-auto overflow-y-auto"
                    >
                        {/* Header de Examen */}
                        <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_15px_#bf00ff]" />
                                <div className="flex flex-col">
                                    <h2 className="text-xl md:text-2xl font-black italic tracking-tight text-white uppercase leading-none">
                                        FÍSICA I: MECÁNICA CLÁSICA
                                    </h2>
                                    <p className="text-[10px] font-bold text-purple-200/40 tracking-[0.2em] mt-1 uppercase">
                                        CIENCIAS • SkillTech Diagnostics v1.0
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tiempo Restante</span>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bf00ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        <span className="font-mono text-sm font-bold text-white">9:57</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="max-w-5xl mx-auto w-full mb-8">
                            <div className="flex justify-between items-end text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">
                                <span>Situación 1 de 8</span>
                                <span className="text-[#bf00ff]">13%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-[#7a00cc] to-[#bf00ff]" style={{ width: '13%' }} />
                            </div>
                        </div>

                        {/* Pregunta Abierta Mock */}
                        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start">
                            <div className="p-6 md:p-12 bg-[#120824]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col shadow-2xl relative">
                                <div className="mb-6 flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black text-[#bf00ff] tracking-[0.3em] uppercase block mb-2">Contexto de la situación</span>
                                        <h3 className="text-lg md:text-2xl font-bold mb-4 leading-tight text-white tracking-tight">
                                            Diseñe un experimento simple para calcular el coeficiente de fricción entre un libro y una mesa usando solo una regla.
                                        </h3>
                                    </div>

                                    {/* Botón de Ayuda ? */}
                                    <div className="relative shrink-0">
                                        <div
                                            onClick={() => {
                                                if (currentStep.id === 'guia_examen_boton_ayuda') {
                                                    completeOnboarding();
                                                    onComplete();
                                                    setTimeout(() => {
                                                        window.dispatchEvent(new CustomEvent('toggle-eleonor-history', { detail: true }))
                                                    }, 300);
                                                }
                                            }}
                                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${currentStep.id === 'guia_examen_boton_ayuda' ? 'border-[#bf00ff] bg-[#bf00ff]/20 text-white shadow-[0_0_15px_rgba(191,0,255,0.4)] cursor-pointer hover:bg-[#bf00ff]/30 hover:scale-105' : 'border-purple-500/20 bg-purple-500/5 text-purple-400'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                                        </div>
                                        {currentStep.id === 'guia_examen_boton_ayuda' && (
                                            <div className="absolute w-16 h-16 rounded-full border-2 border-purple-400/60 animate-ping -top-2 -left-2" />
                                        )}
                                    </div>
                                </div>

                                {/* Area de Dictado */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 w-fit self-center md:self-end">
                                        <div className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase bg-[#bf00ff] text-white flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                                            Voz / Dictado
                                        </div>
                                        <div className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase text-white/40 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" /><path d="M6 12h.01" /><path d="M18 12h.01" /><path d="M7 16h10" /></svg>
                                            Teclado / Escrito
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl min-h-[160px]">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#bf00ff]/15 border border-[#bf00ff]/30 text-[#bf00ff] shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest mt-4 text-gray-400">
                                            Toca para dictar respuesta
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mock de Resultados del Examen (DiagnosisEleonorOverlay) durante la Guía */}
            <AnimatePresence>
                {isGuiding && (currentStep.id === 'guia_resultados_derecha' || currentStep.id === 'guia_resultados_izquierda') && (
                    <motion.div
                        key="mock-results-interface"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[255] bg-[#0B0121] flex flex-col justify-start pt-[10vh] pb-24 px-6 pointer-events-auto overflow-y-auto"
                    >
                        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
                            {/* Title Chip */}
                            <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                <svg className="w-4 h-4 text-purple-400 animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Perfil Orientativo de Tendencias</span>
                            </div>

                            {/* Main Diagnostic Title */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
                                    <svg className="w-4 h-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <span className="text-xs font-black uppercase tracking-widest text-white">
                                        Perfil Orientativo · <span className="text-cyan-400">Usuario Demo</span>
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
                                    DETECTADO
                                </h2>
                                <p className="text-purple-200/60 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed px-4">
                                    Las evidencias apuntan a que existe una falta de compromiso con el examen, lo que sugiere que el conocimiento de mecánica clásica podría no estar bien asimilado.
                                </p>
                            </div>

                            {/* Cards Grid - Desktop: separado y separado; Móvil: resalta activo sin separar */}
                            {/* DESKTOP: 3 columnas con espaciado; MÓVIL: columna vertical con highlight */}
                            <div className="w-full max-w-5xl mt-4 hidden md:grid md:grid-cols-3 md:gap-6">
                                {/* Columna 1 desktop: Eleonor Sugiere - Izquierda */}
                                <motion.div
                                    animate={{
                                        scale: currentStep.id === 'guia_resultados_izquierda' ? 1.04 : 0.97,
                                        opacity: currentStep.id === 'guia_resultados_izquierda' ? 1 : 0.45,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    className="rounded-[2rem] overflow-hidden"
                                >
                                    <div className={`bg-white/5 border p-6 rounded-[2rem] relative overflow-hidden h-full flex flex-col ${currentStep.id === 'guia_resultados_izquierda' ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.35)]' : 'border-white/10'}`}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" /></svg>
                                            Moya Sugiere
                                        </h3>
                                        <p className="text-white/90 text-sm font-medium italic leading-relaxed">
                                            "Tu perfil tiende hacia una falta de interacción con el material de estudio, lo que puede ser un área clave a mejorar para avanzar en tu comprensión de la física."
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Columna 2 desktop: Orbe Central */}
                                <div className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/30 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20" />
                                        <div className="relative w-28 h-28 rounded-full border-4 border-cyan-500/30 flex flex-col items-center justify-center gap-0.5">
                                            <span className="text-2xl font-black text-white tracking-tighter leading-none">
                                                Inicial
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-[10px] font-black text-cyan-200 uppercase tracking-widest mb-1">Tendencia Orientativa</h3>
                                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                                        Rango estimado: 0–39
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-cyan-500/20 w-full">
                                        <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-black italic tracking-wider">
                                            Estimación orientativa basada en LLMs.
                                        </p>
                                    </div>
                                </div>

                                {/* Columna 3 desktop: Rutas - Derecha */}
                                <motion.div
                                    animate={{
                                        scale: currentStep.id === 'guia_resultados_derecha' ? 1.04 : 0.97,
                                        opacity: currentStep.id === 'guia_resultados_derecha' ? 1 : 0.45,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    className="rounded-[2rem] overflow-hidden"
                                >
                                    <div className={`bg-white/5 border p-6 rounded-[2rem] flex flex-col h-full ${currentStep.id === 'guia_resultados_derecha' ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.35)]' : 'border-white/10'}`}>
                                        <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.886L4.2 9.272l4.912 4.786L7.912 20 13 16.772l5.088 3.228-1.2-5.942 4.912-4.786-5.888-.386Z" /></svg>
                                            Rutas de Exploración Sugeridas
                                        </h3>
                                        <div className="space-y-3 flex-1">
                                            <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5 text-[10px] font-bold text-white uppercase tracking-tight">
                                                Revisar los conceptos básicos de mecánica clásica, especialmente sobre fuerzas y movimiento.
                                            </div>
                                            <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5 text-[10px] font-bold text-white uppercase tracking-tight">
                                                Practicar problemas de física que involucren la aplicación de fórmulas y principios.
                                            </div>
                                        </div>
                                        <div className="mt-6 flex flex-col gap-2">
                                            <div className="py-3 text-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[9px] font-black tracking-widest uppercase">
                                                Finalizar Diagnóstico X
                                            </div>
                                            <div className="py-3 text-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-black tracking-widest uppercase">
                                                Ver Mapa Neuronal
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* MÓVIL: 3 paneles en columna, solo el activo brilla */}
                            <div className="flex md:hidden flex-col gap-4 w-full max-w-5xl mt-4">
                                {/* Eleonor Sugiere */}
                                <div className={`transition-all duration-500 bg-white/5 border p-5 rounded-[1.5rem] relative overflow-hidden ${currentStep.id === 'guia_resultados_izquierda' ? 'border-purple-500/80 shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'border-white/10 opacity-60'}`}>
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                                    <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Moya Sugiere</h3>
                                    <p className="text-white/90 text-xs font-medium italic leading-relaxed">
                                        "Tu perfil tiende hacia una falta de interacción con el material de estudio."
                                    </p>
                                </div>
                                {/* Orbe central */}
                                <div className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/30 p-5 rounded-[1.5rem] flex flex-row items-center gap-5">
                                    <div className="relative w-16 h-16 rounded-full border-4 border-cyan-500/30 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-black text-white">Inicial</span>
                                    </div>
                                    <div>
                                        <h3 className="text-[9px] font-black text-cyan-200 uppercase tracking-widest mb-0.5">Tendencia Orientativa</h3>
                                        <p className="text-[10px] font-bold text-cyan-400 uppercase">Rango estimado: 0–39</p>
                                    </div>
                                </div>
                                {/* Rutas de Exploración */}
                                <div className={`transition-all duration-500 bg-white/5 border p-5 rounded-[1.5rem] ${currentStep.id === 'guia_resultados_derecha' ? 'border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.4)]' : 'border-white/10 opacity-60'}`}>
                                    <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3">Rutas de Exploración</h3>
                                    <div className="space-y-2">
                                        <div className="p-2 bg-white/[0.02] rounded-xl border border-white/5 text-[9px] font-bold text-white uppercase">
                                            Revisar conceptos básicos de mecánica clásica.
                                        </div>
                                        <div className="p-2 bg-white/[0.02] rounded-xl border border-white/5 text-[9px] font-bold text-white uppercase">
                                            Practicar problemas con fórmulas y principios.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CAPA 3: Contenido - UI Holográfica */}
            <div className={`fixed inset-0 z-[300] flex flex-col overflow-hidden pointer-events-none ${isGuiding ? 'justify-end items-end p-4 md:p-8' : 'items-center justify-end pb-8'}`}>
                <div className={`w-full ${isGuiding ? 'max-w-md' : 'max-w-2xl'} flex flex-col items-center gap-6`}>

                    <div className={`w-full flex flex-col items-center gap-4 relative ${!isGuiding ? 'animate-in fade-in duration-1000' : ''}`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep.id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, y: -20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                                style={{ willChange: "transform, opacity" }}
                                className={`pointer-events-auto w-full ${isGuiding
                                    ? 'bg-black/85 backdrop-blur-xl rounded-[1.5rem] border border-cyan-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden'
                                    : 'text-center bg-black/85 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center gap-6'
                                    }`}
                            >
                                {isGuiding ? (
                                    // TARJETA GUÍA: Videollamada self-contained con ondas de audio reactivas
                                    <div className="flex flex-row items-stretch">
                                        {/* Panel de videollamada - Solo en móvil. En PC Eleonor aparece de fondo via AvatarDisplay GUIDE */}
                                        <div id="eleonor-avatar-box" className="w-[100px] shrink-0 relative overflow-hidden bg-[#050110] border-r border-cyan-500/20 flex md:hidden flex-col">
                                            {/* Indicador de Live */}
                                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-600/80 backdrop-blur-sm">
                                                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                                <span className="text-[7px] font-black text-white uppercase tracking-wide">LIVE</span>
                                            </div>
                                            {/* Silhouette visual + audio waveform */}
                                            <div className="flex-1 relative min-h-[140px] flex items-end justify-center pb-3">
                                                {/* Background gradient para dar sensación de profundidad */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-[#050110] to-[#050110]" />
                                                {/* Orbe de presencia */}
                                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
                                                {/* Waveform de audio - reactivo a avatar-speaking */}
                                                <AudioWaveform />
                                            </div>
                                        </div>
                                        {/* Texto del diálogo */}
                                        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400">Moya</span>
                                                <span className="text-[9px] text-white/20 ml-auto">{guideStep + 1} / {GUIDE_SCRIPT.length}</span>
                                            </div>
                                            <p className="text-sm md:text-base font-medium text-white leading-relaxed">
                                                {currentStep.eleonor}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    // TARJETA INTRO: Texto compacto + botón
                                    <>
                                        <h2
                                            className="text-sm md:text-base font-semibold tracking-tight text-white leading-relaxed max-w-lg mx-auto"
                                            style={{
                                                textShadow: '0px 0px 15px rgba(6,182,212,0.3)',
                                                fontFamily: 'var(--font-geist-mono)'
                                            }}
                                        >
                                            {currentStep.eleonor}
                                        </h2>
                                        {!hasInteracted && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                onClick={unlockAudio}
                                                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
                                            >
                                                Conectar con Moya
                                            </motion.button>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {!isGuiding && hasInteracted && (currentStep as any).isQuestion && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="w-full max-w-lg relative group pointer-events-auto flex flex-col items-center gap-6"
                            >
                                <div className="relative w-full">
                                    <Input
                                        autoFocus
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Escribe aquí..."
                                        className="bg-[#063924]/60 backdrop-blur-md border-[#d0b04d]/20 rounded-2xl text-center text-xl h-20 focus-visible:ring-2 focus-visible:ring-[#d0b04d]/50 focus-visible:border-[#d0b04d]/50 transition-all placeholder:text-[#f6f6ed]/40 text-[#f6f6ed] font-medium pr-16 outline-none"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="absolute right-3 top-3 bottom-3 aspect-square bg-[#d0b04d] hover:bg-[#e0c05d] disabled:opacity-30 disabled:hover:bg-[#d0b04d] text-[#063924] rounded-xl flex items-center justify-center transition-all shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </div>
                                <div className="text-center animate-pulse hidden md:block mt-2">
                                    <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#d0b04d]">Presiona Enter para enviar</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Botón de Saltar Intro (Developer Tool) */}
                <div className="absolute top-8 right-8 pointer-events-auto">
                    <button
                        onClick={() => {
                            if (bufferSourceRef.current) {
                                try { bufferSourceRef.current.stop(); } catch (e) { }
                            }
                            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                            window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }));
                            completeOnboarding();
                            if (onNavigate) onNavigate('assistant');
                            onComplete();
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('toggle-eleonor-history', { detail: true }))
                            }, 300)
                        }}
                        className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                    >
                        SALTAR INTRO
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
