"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Brain, Send, TrendingUp, Mic, MicOff, Loader2, Sparkles, HelpCircle, Keyboard } from "lucide-react"

import { Question } from "../exams/types"
import { cn } from "@/lib/utils"
import { BackgroundAnimation } from "../shared/BackgroundAnimation"
import { submitExam, fetchUserSkills, explainQuestion } from "@/lib/api/skills"
import { useEleonor } from "@/contexts/eleonor-context"
import { API_BASE_URL } from "@/lib/config"
// Importamos el nuevo componente de diagnóstico y el grafo natural
import { NaturalWorkflow } from "./NaturalWorkflow"
import { DiagnosisEleonorOverlay } from "./DiagnosisEleonorOverlay"

interface QuizInterfaceProps {
  questions: Question[]
  title: string
  area: string
  onComplete: (score: number, answers: Record<number, string>) => void
  onExit: () => void
  onExploreMap?: () => void
  duration?: number // en segundos
}

export function QuizInterface({
  questions,
  title,
  area,
  onComplete,
  onExit,
  onExploreMap,
  duration: _duration // Ignoramos el prop para forzar el estándar
}: QuizInterfaceProps) {
  const duration = 600; // 10 minutos exactos sin excepciones


  // Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for forward, -1 for backward

  // Data State
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [inputText, setInputText] = useState("")

  // Status State
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [userSkills, setUserSkills] = useState<any[]>([])
  const [showEleonorDiagnosis, setShowEleonorDiagnosis] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSTTProcessing, setIsSTTProcessing] = useState(false)
  const [explanationText, setExplanationText] = useState("")
  const [showExplanationText, setShowExplanationText] = useState(false)
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice')
  const { enterPresence, setPage } = useEleonor()

  // --- CSAT & RAGE CLICKS (Phase 3) ---
  const [showCSATModal, setShowCSATModal] = useState(false)
  const [csatPayload, setCsatPayload] = useState<any>(null)
  const clickTimesRef = useRef<number[]>([])
  const rageClicksCountRef = useRef<number>(0)

  useEffect(() => {
    const handleGlobalClick = () => {
      const now = Date.now()
      clickTimesRef.current.push(now)
      clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 800)
      if (clickTimesRef.current.length >= 3) {
        rageClicksCountRef.current += 1
        clickTimesRef.current = [] // reset
        console.log("⚡ Rage click detected! Total clicks in 800ms >= 3. Total events:", rageClicksCountRef.current)
      }
    }
    window.addEventListener("click", handleGlobalClick)
    return () => window.removeEventListener("click", handleGlobalClick)
  }, [])

  // --- TELEMETRY STATE ---
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const telemetryRef = useRef<Record<number, {
    time_spent_ms: number;
    keystrokes: number;
    deletions: number;
    focus_lost_count: number;
    _lastFocusTime: number;
    _isActive: boolean;
  }>>({})

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Listen for call close
  useEffect(() => {
    const handleCloseCall = () => {
      setIsExplaining(false)
      enterPresence('IDLE_HIDDEN')
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop()
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
    }
    window.addEventListener('close-eleonor-call', handleCloseCall)
    return () => window.removeEventListener('close-eleonor-call', handleCloseCall)
  }, [enterPresence])

  // Global Focus Tracker
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true)
    const handleBlur = () => setIsWindowFocused(false)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Timer (Paused on blur)
  useEffect(() => {
    if (isFinished || isExplaining || !isWindowFocused) return
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinishQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isFinished, isExplaining, isWindowFocused])

  // Current Question
  const question = questions && questions.length > 0 ? questions[currentQuestionIndex] : null
  const isLastQuestion = questions ? currentQuestionIndex === questions.length - 1 : true

  // Question Telemetry Tracker
  useEffect(() => {
    if (!question || isFinished) return;
    const qId = question.id;
    
    if (!telemetryRef.current[qId]) {
      telemetryRef.current[qId] = { time_spent_ms: 0, keystrokes: 0, deletions: 0, focus_lost_count: 0, _lastFocusTime: Date.now(), _isActive: true }
    } else {
      telemetryRef.current[qId]._lastFocusTime = Date.now()
      telemetryRef.current[qId]._isActive = true
    }

    const handleFocus = () => {
      const t = telemetryRef.current[qId]
      t._lastFocusTime = Date.now()
      t._isActive = true
    }

    const handleBlur = () => {
      const t = telemetryRef.current[qId]
      if (t._isActive) {
        t.time_spent_ms += Date.now() - t._lastFocusTime
        t._isActive = false
        t.focus_lost_count += 1
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      
      const t = telemetryRef.current[qId]
      if (t && t._isActive) {
        t.time_spent_ms += Date.now() - t._lastFocusTime
        t._isActive = false
      }
    }
  }, [question, isFinished])

  // Reset explanation and input mode when changing questions
  useEffect(() => {
    setExplanationText("")
    setShowExplanationText(false)
    setInputMode('voice')
    if (isExplaining) {
      window.dispatchEvent(new CustomEvent('close-eleonor-call'))
    }
  }, [currentQuestionIndex])

  // (Moved Question variables up)

  if (!isFinished && (!questions || questions.length === 0 || !question)) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center pt-8 overflow-hidden bg-[#0B0121]">
        <BackgroundAnimation />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Error de Carga</h2>
          <p className="text-gray-400 text-sm italic">No se encontraron reactivos para {title}.</p>
          <Button onClick={onExit} variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">
            Volver al panel
          </Button>
        </div>
      </div>
    )
  }

  // Navigation Handlers
  const handleNext = () => {
    const q = question
    const qs = questions || []

    // Save current input if text type
    if (q && (q.type === "input-text" || q.type === "open-ended")) {
      setAnswers(prev => ({ ...prev, [q.id]: inputText }))
    }

    if (currentQuestionIndex < qs.length - 1) {
      setDirection(1)
      setCurrentQuestionIndex(prev => prev + 1)
      setInputText(answers[qs[currentQuestionIndex + 1]?.id || 0] || "")
    }
  }

  const handlePrev = () => {
    const qs = questions || []
    if (currentQuestionIndex > 0) {
      setDirection(-1)
      setCurrentQuestionIndex(prev => prev - 1)
      setInputText(answers[qs[currentQuestionIndex - 1]?.id || 0] || "")
    }
  }

  const handleSelectOption = (optionId: string) => {
    if (question) {
      setAnswers(prev => ({ ...prev, [question.id]: optionId }))
    }
  }

  const handleExplain = async () => {
    if (!question || (isExplaining && !explanationText)) return

    if (isExplaining && explanationText) {
      window.dispatchEvent(new CustomEvent('close-eleonor-call'))
      return
    }

    if (explanationText) {
      setShowExplanationText(prev => !prev)
      return
    }

    setIsExplaining(true)
    enterPresence('DIAGNOSIS')

    try {
      const data = await explainQuestion(question.text, question.options)
      if (data?.explanation) {
        setExplanationText(data.explanation)
        setShowExplanationText(true)
        // Reproducir audio via endpoint de TTS ya existente
        const ttsResp = await fetch(`${API_BASE_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.explanation })
        })
        const ttsData = await ttsResp.json()

        if (ttsData.audio) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          const ctx = new AudioContextClass()
          const binaryString = atob(ttsData.audio)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBuffer = await ctx.decodeAudioData(bytes.buffer)
          const source = ctx.createBufferSource()
          audioSourceRef.current = source
          const analyser = ctx.createAnalyser()
          source.buffer = audioBuffer
          source.connect(analyser)
          analyser.connect(ctx.destination)

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const updateAnalysis = () => {
            analyser.getByteFrequencyData(dataArray)
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
            window.dispatchEvent(new CustomEvent('avatar-speaking', {
              detail: { volume: Math.min(1.0, volume * 1.5) }
            }))
            if (!(source as any).onended_called) requestAnimationFrame(updateAnalysis)
          }

          source.onended = () => {
            (source as any).onended_called = true
            window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
            setIsExplaining(false)
            // Automáticamente salir de DIAGNOSIS si se termina de hablar la pista
            enterPresence('IDLE_HIDDEN')
          }

          source.start()
          updateAnalysis()
        }
      }
    } catch (error) {
      console.error("Error fetching explanation:", error)
      setIsExplaining(false)
    }
  }

  // --- LOGICA DE DICTADO DE VOZ ---
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
        await sendAudioToSTT(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("No se pudo acceder al micrófono:", err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToSTT = async (blob: Blob) => {
    setIsSTTProcessing(true)
    const formData = new FormData()
    formData.append('file', blob, 'audio.webm')

    const API_URL = API_BASE_URL

    try {
      // Usamos el token de localStorage si existe
      const token = localStorage.getItem("eleonor_token")
      const resp = await fetch(`${API_URL}/api/stt`, {
        method: 'POST',
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData
      })
      const data = await resp.json()
      if (data.status === 'ok' && data.text) {
        // Concatenar el texto a lo que ya hay en inputText
        const newText = inputText.trim()
          ? `${inputText.trim()} ${data.text}`
          : data.text
        setInputText(newText)
      }
    } catch (err) {
      console.error("Error en STT:", err)
    } finally {
      setIsSTTProcessing(false)
    }
  }

  // --- KEYSTROKE TRACKER ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!question) return;
    const t = telemetryRef.current[question.id]
    if (t) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        t.deletions += 1
      } else if (e.key.length === 1) {
        t.keystrokes += 1
      }
    }
  }

  // Finish Handler
  const handleFinishQuiz = () => {
    const q = question
    // Save last input
    const finalAnswers = { ...answers }
    if (q && (q.type === "input-text" || q.type === "open-ended")) {
      finalAnswers[q.id] = inputText
    }

    // Construct Payload for AI
    const items = questions.map(q => {
      const t = telemetryRef.current[q.id];
      if (t && t._isActive) {
        t.time_spent_ms += Date.now() - t._lastFocusTime;
        t._isActive = false;
      }
      return {
        questionId: q.id,
        question: q.text,
        answer: finalAnswers[q.id] || "Sin respuesta",
        type: q.type || "multiple-choice",
        telemetry: t ? {
          time_spent_ms: t.time_spent_ms,
          keystrokes: t.keystrokes,
          deletions: t.deletions,
          focus_lost_count: t.focus_lost_count
        } : { time_spent_ms: 0, keystrokes: 0, deletions: 0, focus_lost_count: 0 }
      }
    })

    const payload = {
      examTitle: title,
      area: area,
      items: items,
      totalTime: duration - timeRemaining
    }

    setCsatPayload(payload)
    setShowCSATModal(true)
  }

  const submitWithCSAT = async (csatScore: number | null) => {
    if (!csatPayload) return
    setShowCSATModal(false)
    setIsSubmitting(true)
    setIsFinished(true)

    const finalPayload = {
      ...csatPayload,
      csat_score: csatScore,
      rage_clicks: rageClicksCountRef.current
    }

    try {
      console.log("🧠 Enviando a IA con CSAT...", finalPayload)

      let data;
      // Mock logic para "Personajes" o si no hay API
      if (area === "Personajes") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        data = {
          analysis: {
            nivel: 85,
            razonamiento: "Arquitecto de Realidades",
            observaciones: "Tu perfil muestra una tendencia excepcional hacia la resolución de problemas abstractos y la adaptabilidad en entornos de alta incertidumbre. Eres capaz de ver patrones donde otros ven caos.",
            potencial: "Alta capacidad para liderar proyectos tecnológicos disruptivos y diseñar sistemas complejos de gobernanza ética.",
            errores: ["Optimización de recursos", "Delegación crítica", "Gestión de disonancia"],
            csat_score: csatScore,
            rage_clicks: rageClicksCountRef.current,
            confianza: "92%",
            technicalSummary: "Sujeto presenta alta coherencia en dilemas éticos asimétricos. Capacidad de abstracción Nivel 7. Arquitectura cognitiva compatible con modelos de alta autonomía."
          }
        };
      } else {
        // Generate a basic technical summary based on area and level (simulation)
        const techSummary = `Evaluación técnica en el área de ${area}. Se detectaron patrones de respuesta consistentes con un nivel del ${Math.round(Math.random() * 20 + 70)}%. Arquitectura de pensamiento enfocada en la resolución de problemas.`;
        data = await submitExam({ ...finalPayload, technicalSummary: techSummary })
      }

      if (data) {
        // Cache data first
        localStorage.setItem("latest_analysis", JSON.stringify(data.analysis))

        // Update states: setShowEleonorDiagnosis directly
        setAiAnalysis(data.analysis)
        setShowEleonorDiagnosis(true)
        setShowOptions(false)

        // Fetch updated skills in background
        const updatedSkills = await fetchUserSkills();
        setUserSkills(updatedSkills);
      } else {
        throw new Error("No data received from AI")
      }

    } catch (error) {
      console.error("Error submitting exam:", error)
      const errorAnalysis = {
        nivel: 0,
        razonamiento: "Error de conexión",
        observaciones: "No se pudo conectar con el sistema de diagnóstico. Por favor verifica tu conexión o el estado del servidor.",
        errores: ["Verifica servidor", "Reintenta envío"],
        potencial: "N/A"
      }
      setAiAnalysis(errorAnalysis)
      setShowEleonorDiagnosis(true)
    } finally {
      setIsSubmitting(false)
    }
  }


  // Render Result Screen (Isolated in Component)
  if (isFinished) {
    if (!aiAnalysis) {
      return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center pt-8 overflow-hidden">
          <BackgroundAnimation />
          <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 relative z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf00ff]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Procesando respuestas en núcleo IA...</p>
          </div>
        </div>
      )
    }


    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center pt-8 overflow-hidden">
        <BackgroundAnimation />
        <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />

        <div className="flex-1 w-full max-w-5xl mx-auto px-6 relative z-10 flex items-center justify-center">
          <AnimatePresence>
            {showEleonorDiagnosis && (
              <DiagnosisEleonorOverlay
                analysis={aiAnalysis}
                onClose={() => {
                  setShowEleonorDiagnosis(false);
                  enterPresence('IDLE_HIDDEN');
                  if (onExploreMap) onExploreMap();
                }}
                onExit={onExit}
                onExploreMap={onExploreMap || (() => { })}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Render Question Screen
  return (
    <div className="relative h-[100dvh] w-full flex flex-col pt-4 md:pt-8 overflow-hidden">
      <BackgroundAnimation />
      <div className="fixed inset-0 bg-[#0B0121]/90 z-[-1]" />

      <AnimatePresence>
        {showCSATModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080216]/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-8 rounded-3xl border border-white/10 bg-[#12072B]/85 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              {/* Decorative radial glows */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#bf00ff]/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00ffff]/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#bf00ff] shadow-lg shadow-[#bf00ff]/10">
                  <Brain className="w-8 h-8 animate-pulse" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">
                    ¡Examen Terminado!
                  </h3>
                  <p className="text-gray-400 text-sm max-w-sm">
                    ¿Cómo calificarías tu experiencia resolviendo estos ejercicios? Tu feedback afina la inteligencia de Eleonor.
                  </p>
                </div>
                
                {/* 5 glowing emoji rating buttons */}
                <div className="flex gap-3 justify-center my-4">
                  {[
                    { val: 1, char: "😠", label: "Muy insatisfecho" },
                    { val: 2, char: "🙁", label: "Insatisfecho" },
                    { val: 3, char: "😐", label: "Neutral" },
                    { val: 4, char: "🙂", label: "Satisfecho" },
                    { val: 5, char: "😄", label: "Muy satisfecho" }
                  ].map((emoji) => (
                    <motion.button
                      key={emoji.val}
                      whileHover={{ scale: 1.25, rotate: [0, -5, 5, 0] }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => submitWithCSAT(emoji.val)}
                      type="button"
                      className="w-14 h-14 text-3xl flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:border-[#bf00ff]/50 hover:bg-[#bf00ff]/10 shadow-md transition-all group relative"
                    >
                      <span>{emoji.char}</span>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/5 text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap text-gray-300">
                        {emoji.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
                
                <button
                  onClick={() => submitWithCSAT(null)}
                  type="button"
                  className="text-xs font-semibold text-gray-500 hover:text-white uppercase tracking-wider transition-colors pt-2"
                >
                  Omitir encuesta y enviar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto w-full px-6 md:px-10 flex-1 flex flex-col relative z-10 min-h-0">
        {/* Header - Compacted and moved up with offset for mobile menu button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-4 border-b border-white/5 pb-3 md:pb-6 pl-16 md:pl-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#bf00ff] rounded-full shadow-[0_0_15px_#bf00ff]" />
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black italic tracking-tight text-white uppercase leading-none">
                {title}
              </h2>
              <p className="text-[10px] font-bold text-purple-200/40 tracking-[0.2em] mt-1 uppercase">
                {area} • SkillTech Diagnostics v1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tiempo Restante</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-[#bf00ff]" />
                <span className="font-mono text-sm font-bold text-white">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Container - More compact */}
        <div className="mb-4 md:mb-8">
          <div className="flex justify-between items-end text-[10px] font-black tracking-widest text-gray-500 mb-2 uppercase">
            <span>Situación {currentQuestionIndex + 1} de {questions.length}</span>
            <span className="text-[#bf00ff]">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#7a00cc] to-[#bf00ff]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question Card Area - Scrollable on mobile */}
        <div className="flex-1 flex flex-col justify-start pb-4 overflow-y-auto custom-scrollbar min-h-0">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentQuestionIndex}
              custom={direction}
              initial={{ x: direction * 40, opacity: 0, scale: 0.98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: direction * -40, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }} // Animación más rápida para evitar cuelgues
              className="w-full"
            >
              <Card className="p-4 md:p-12 bg-[#120824]/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex flex-col shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
                <div className="pr-1">
                  <div className="mb-3 md:mb-6 flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-[#bf00ff] tracking-[0.3em] uppercase block mb-2">Contexto de la situación</span>
                      <h3 className="text-lg md:text-2xl font-bold mb-4 leading-tight text-white tracking-tight">
                        {question?.text}
                      </h3>
                    </div>
                    <div className="relative">
                      <Button
                        onClick={handleExplain}
                        disabled={isExplaining && !explanationText}
                        variant="outline"
                        className={cn(
                          "shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl border transition-all p-0 relative z-20",
                          explanationText
                            ? showExplanationText
                              ? "border-[#bf00ff] bg-[#bf00ff]/20 text-white shadow-[0_0_15px_rgba(191,0,255,0.4)]"
                              : "border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                            : "border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                        )}
                        title={explanationText ? "Ver pista" : "Preguntar a Eleonor"}
                      >
                        {isExplaining && !explanationText ? (
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        ) : isExplaining && explanationText ? (
                          <Mic className="w-5 h-5 md:w-6 md:h-6 text-red-400 animate-pulse" />
                        ) : (
                          <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                      </Button>

                      <AnimatePresence>
                        {showExplanationText && explanationText && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
                            className="absolute top-14 right-0 md:right-14 md:top-0 w-[280px] md:w-[320px] bg-[#1a0b38] border border-[#bf00ff]/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(191,0,255,0.2)] z-30 pointer-events-auto"
                          >
                            {/* Flecha del globo */}
                            <div className="absolute -top-2 right-4 md:-right-2 md:top-4 w-4 h-4 bg-[#1a0b38] border-t border-l border-[#bf00ff]/40 transform rotate-45 md:rotate-135" />
                            
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#bf00ff]" />
                                <span className="text-[10px] font-black text-[#bf00ff] uppercase tracking-widest">Pista de Eleonor</span>
                              </div>
                              <p className="text-sm text-purple-100/90 leading-relaxed font-medium">
                                {explanationText}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="pb-4">
                    {/* Opciones Múltiples */}
                    {question && (question.type === "multiple-choice" || !question.type) && (
                      <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {question.options.map((option: any) => (
                          <button
                            key={option.id}
                            onClick={() => handleSelectOption(option.id)}
                            className={cn(
                              "p-3 md:p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                              answers[question.id] === option.id
                                ? "border-[#bf00ff] bg-[#bf00ff]/10 shadow-[0_0_30px_-5px_rgba(191,0,255,0.3)]"
                                : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                            )}
                          >
                            <div className="flex items-center gap-4 relative z-10 w-full pr-8">
                              <div className={cn(
                                "shrink-0 w-2 h-2 rounded-full transition-all duration-300",
                                answers[question.id] === option.id ? "bg-[#bf00ff] scale-125 shadow-[0_0_10px_#bf00ff]" : "bg-gray-700"
                              )} />
                              <span className={cn(
                                "text-sm md:text-base font-medium transition-colors text-left",
                                answers[question.id] === option.id ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                              )}>
                                {option.text}
                              </span>
                            </div>
                            <AnimatePresence>
                              {answers[question.id] === option.id && (
                                <motion.div 
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  className="absolute right-6 z-10"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-[#bf00ff]" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input de Texto / Open Ended */}
                    {question && (question.type === "input-text" || question.type === "open-ended") && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full flex flex-col gap-4"
                      >
                        {/* Selector de Modo (Teclado / Micrófono) */}
                        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 w-fit self-end z-20">
                          <button
                            type="button"
                            onClick={() => setInputMode('voice')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2",
                              inputMode === 'voice' ? "bg-[#bf00ff] text-white shadow-lg shadow-[#bf00ff]/20" : "text-white/40 hover:text-white"
                            )}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            Voz / Dictado
                          </button>
                          <button
                            type="button"
                            onClick={() => setInputMode('keyboard')}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2",
                              inputMode === 'keyboard' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                            )}
                          >
                            <Keyboard className="w-3.5 h-3.5" />
                            Teclado / Escrito
                          </button>
                        </div>

                        {inputMode === 'voice' ? (
                          /* VISTA DE MICROFONO / DICTADO */
                          <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden min-h-[160px]">
                            {isRecording && (
                              <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                            )}
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={isRecording ? stopRecording : startRecording}
                              disabled={isSTTProcessing}
                              type="button"
                              className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center border transition-all relative z-10",
                                isRecording
                                  ? "bg-red-500 border-red-400 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                                  : "bg-[#bf00ff]/15 border-[#bf00ff]/30 text-[#bf00ff] hover:bg-[#bf00ff]/25 hover:border-[#bf00ff]/50 shadow-[0_0_20px_rgba(191,0,255,0.15)]"
                              )}
                            >
                              {isSTTProcessing ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                              ) : isRecording ? (
                                <MicOff className="w-8 h-8" />
                              ) : (
                                <Mic className="w-8 h-8" />
                              )}
                            </motion.button>

                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest mt-4 relative z-10",
                              isRecording ? "text-red-400 animate-pulse" : "text-gray-400"
                            )}>
                              {isSTTProcessing ? "Transcribiendo..." : isRecording ? "Grabando... Toca para detener" : "Toca para dictar respuesta"}
                            </span>

                            {inputText && (
                              <div className="mt-6 w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-left max-h-[120px] overflow-y-auto custom-scrollbar">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Resumen dictado:</span>
                                <p className="text-sm text-gray-300 italic">{inputText}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* VISTA DE TECLADO / ESCRITO */
                          <div className={cn(
                            "relative w-full transition-all duration-300 rounded-2xl p-[1px] bg-white/10"
                          )}>
                            <textarea
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Desarrolla tu respuesta detallando tu lógica de decisión..."
                              className="w-full h-32 md:h-56 bg-[#0B0121]/80 backdrop-blur-xl border-none rounded-[calc(1rem-1px)] p-4 md:p-6 text-sm md:text-base font-medium text-white focus:ring-1 focus:ring-[#bf00ff]/30 outline-none resize-none transition-all placeholder:text-gray-600 custom-scrollbar"
                            />
                            
                            <div className="absolute bottom-4 right-4 flex items-center gap-3">
                              <div className="text-[9px] font-bold text-gray-600 tracking-widest uppercase bg-black/40 px-2 py-1 rounded">
                                {inputText.length} caracteres
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Nav - Always visible, never hidden behind content */}
        <div className="shrink-0 bg-[#0B0121]/80 backdrop-blur-lg border-t border-white/5 px-4 md:px-0 py-3 md:py-6 flex justify-between items-center z-30 -mx-6 md:mx-0">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="text-gray-500 hover:text-white hover:bg-white/5 px-4 md:px-6 font-bold tracking-widest uppercase text-[9px] md:text-[10px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Atrás
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleFinishQuiz}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#7a00cc] to-[#bf00ff] hover:from-[#9d00ff] hover:to-[#df80ff] text-white px-6 md:px-10 py-3 md:py-5 rounded-xl font-black tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all uppercase text-[9px] md:text-[10px]"
            >
              {isSubmitting ? "Sincronizando..." : "Enviar a Núcleo IA"}
              {!isSubmitting && <Brain className="w-4 h-4 ml-2" />}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 md:px-8 py-3 md:py-5 rounded-xl font-black tracking-widest uppercase text-[9px] md:text-[10px] transition-all"
            >
              Siguiente <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
