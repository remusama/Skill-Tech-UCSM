"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Mic, MicOff, CheckCircle2, X, Loader2, Search, Sparkles, 
    Volume2, Shield, Zap, UserCheck, ChevronDown, Award
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { getStudentHouseProfile, CASAS_INFO, ALL_48_STUDENTS, playStudentHouseAudio, StudentHouseProfile } from "@/lib/casasData"

interface Student {
    id: number
    username: string
    full_name: string
    top_skill: string
    average_level: number
}

interface MoyaPresentationAssistantProps {
    students: Student[]
    onStudentIdentified?: (student: Student) => void
    onClose?: () => void
    presentationTitle?: string
}

// ── NORMALIZACIÓN FONÉTICA EN ESPAÑOL ──────────────────────────────────────────
function phoneticNormalize(str: string): string {
    if (!str) return ""
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
        .replace(/y/g, "i")
        .replace(/w/g, "u")
        .replace(/hu/g, "u")
        .replace(/v/g, "b")
        .replace(/z/g, "s")
        .replace(/c([ei])/g, "s$1")
        .replace(/k/g, "c")
        .replace(/qu([ei])/g, "c$1")
        .replace(/ll/g, "i")
        .replace(/ch/g, "x")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

// Distancia de Levenshtein para coincidencia difusa (Fuzzy Matching)
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) matrix[i] = [i]
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }
    return matrix[b.length][a.length]
}

// Coincidencia Inteligente de Nombres (STT -> Database 48 Estudiantes)
function findBestStudentMatch(transcript: string, students: Student[]): { student: Student | null; score: number } {
    if (!transcript.trim()) {
        return { student: null, score: 0 }
    }

    const normTranscript = phoneticNormalize(transcript)
    const transcriptTokens = normTranscript.split(" ").filter(Boolean)

    // Usar tanto la lista entregada como los 48 de casasData
    const pool = (students && students.length > 0) 
        ? students 
        : ALL_48_STUDENTS.map(s => ({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            top_skill: s.top_skill,
            average_level: 100
        }))

    let bestMatch: Student | null = null
    let highestScore = 0

    for (const student of pool) {
        const normFullName = phoneticNormalize(student.full_name)
        const normUsername = phoneticNormalize(student.username)
        const nameTokens = normFullName.split(" ").concat(normUsername.split(" ")).filter(Boolean)

        if (normFullName.includes(normTranscript) || normTranscript.includes(normFullName)) {
            return { student, score: 0.98 }
        }

        let tokenMatches = 0
        for (const tToken of transcriptTokens) {
            for (const nToken of nameTokens) {
                if (tToken === nToken) {
                    tokenMatches += 1.0
                    break
                }
                const maxLen = Math.max(tToken.length, nToken.length)
                if (maxLen > 2) {
                    const dist = levenshteinDistance(tToken, nToken)
                    const sim = 1 - dist / maxLen
                    if (sim >= 0.65) {
                        tokenMatches += sim
                        break
                    }
                }
            }
        }

        const calculatedScore = tokenMatches / Math.max(1, transcriptTokens.length)
        if (calculatedScore > highestScore && calculatedScore >= 0.40) {
            highestScore = calculatedScore
            bestMatch = student
        }
    }

    return { student: bestMatch, score: highestScore }
}

export const MoyaPresentationAssistant = ({ students, onStudentIdentified, onClose, presentationTitle }: MoyaPresentationAssistantProps) => {
    const [mounted, setMounted] = useState(false)
    const [localStudents, setLocalStudents] = useState<Student[]>(students || [])
    const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle")
    const [displayedSubtitleText, setDisplayedSubtitleText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(null)
    const [matchConfidence, setMatchConfidence] = useState(0)

    // ESTADOS PARA ANIMACIONES DE PRESENTACIÓN DE INTEGRANTE Y LOGO DE CASA
    const [activePresentation, setActivePresentation] = useState<StudentHouseProfile | null>(null)
    const [isPlayingHouseAudio, setIsPlayingHouseAudio] = useState(false)
    const [showSearchDrawer, setShowSearchDrawer] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const recognitionRef = useRef<any>(null)
    const liveTranscriptRef = useRef<string>("")
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)
    const typingTimerRef = useRef<any>(null)
    const initialGreetingDone = useRef(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Cargar lista completa de estudiantes si la prop viene vacía
    useEffect(() => {
        if (students && students.length > 0) {
            setLocalStudents(students)
        } else {
            const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null
            fetch(`${API_BASE_URL}/api/mentor/students`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setLocalStudents(data)
                }
            })
            .catch(err => console.error("Error al cargar estudiantes en MoyaPresentationAssistant:", err))
        }
    }, [students])

    // Soporte para tecla Escape para finalizar presentación
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && onClose) {
                onClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    // Limpieza de recursos al desmontar
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause()
                currentAudioRef.current = null
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            if (typingTimerRef.current) {
                clearInterval(typingTimerRef.current)
            }
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    // Animación de escritura en tiempo real (Typewriter) al hablar
    const triggerTypewriter = (text: string) => {
        if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current)
            typingTimerRef.current = null
        }

        setDisplayedSubtitleText("")
        setIsTyping(true)

        if (!text) {
            setIsTyping(false)
            return
        }

        let charIndex = 0
        const charInterval = Math.max(25, Math.min(45, Math.floor(3200 / Math.max(text.length, 1))))

        typingTimerRef.current = setInterval(() => {
            charIndex++
            if (charIndex <= text.length) {
                setDisplayedSubtitleText(text.slice(0, charIndex))
            } else {
                clearInterval(typingTimerRef.current)
                typingTimerRef.current = null
                setIsTyping(false)
            }
        }, charInterval)
    }

    // Reproducir saludo inicial con Voz de Microsoft Edge Dalia (es-MX-DaliaNeural)
    useEffect(() => {
        if (!initialGreetingDone.current) {
            initialGreetingDone.current = true
            const timer = setTimeout(() => {
                speakTextWithMicrosoftEdge("Búsqueda inteligente activada. Menciona un nombre o selecciona a un integrante para ver su presentación.")
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [])

    // Fallback con SpeechSynthesis para voz de Microsoft Edge Dalia
    const fallbackWebSpeech = (text: string, onEndCallback?: () => void) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            setStatus("idle")
            if (onEndCallback) onEndCallback()
            return
        }

        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "es-MX"
        utterance.rate = 0.95
        utterance.pitch = 1.05

        const voices = window.speechSynthesis.getVoices()
        const edgeDaliaVoice = voices.find(v => 
            v.name.includes("Dalia") ||
            v.name.includes("es-MX-DaliaNeural") ||
            (v.name.includes("Microsoft") && (v.lang === "es-MX" || v.lang.startsWith("es-MX") || v.lang.startsWith("es_MX"))) ||
            (v.name.includes("Natural") && v.lang.startsWith("es-MX")) ||
            v.name.includes("Microsoft Edge")
        ) || voices.find(v => (v.lang === "es-MX" || v.lang.startsWith("es-MX")) && v.name.includes("Microsoft"))
          || voices.find(v => v.lang === "es-MX" || v.lang.startsWith("es-MX"))
          || voices.find(v => v.lang.startsWith("es") && v.name.includes("Microsoft"))
          || voices.find(v => v.lang.startsWith("es"))

        if (edgeDaliaVoice) {
            utterance.voice = edgeDaliaVoice
        }

        utterance.onend = () => {
            setStatus("idle")
            if (onEndCallback) onEndCallback()
        }

        utterance.onerror = () => {
            setStatus("idle")
            if (onEndCallback) onEndCallback()
        }

        setStatus("speaking")
        window.speechSynthesis.speak(utterance)
    }

    // Reproducción de Voz usando EXCLUSIVAMENTE Voz de Microsoft Edge (es-MX-DaliaNeural)
    const speakTextWithMicrosoftEdge = async (text: string, onEndCallback?: () => void) => {
        triggerTypewriter(text)
        setStatus("speaking")

        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null
            const res = await fetch(`${API_BASE_URL}/api/tts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ text })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.audio) {
                    if (currentAudioRef.current) {
                        currentAudioRef.current.pause()
                        currentAudioRef.current = null
                    }
                    const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
                    currentAudioRef.current = audio
                    audio.onended = () => {
                        setStatus("idle")
                        if (onEndCallback) onEndCallback()
                    }
                    audio.onerror = () => {
                        fallbackWebSpeech(text, onEndCallback)
                    }
                    await audio.play()
                    return
                }
            }
        } catch (err) {
            console.warn("Backend Edge-TTS fallback:", err)
        }

        fallbackWebSpeech(text, onEndCallback)
    }

    // DISPARAR ANIMACIÓN Y PRESENTACIÓN DE UN ESTUDIANTE E INTEGRAR SU AUDIO DE CASA
    const executeStudentPresentationAnimation = async (studentName: string) => {
        const houseProfile = getStudentHouseProfile(studentName)
        if (!houseProfile) return

        setActivePresentation(houseProfile)
        setIsPlayingHouseAudio(true)

        const houseInfo = CASAS_INFO[houseProfile.house]
        const announcementText = `¡Presentando a ${houseProfile.full_name}! Perteneciente a la Casa ${houseInfo.name}.`

        // 1. Hablar la presentación inicial
        speakTextWithMicrosoftEdge(announcementText, async () => {
            // 2. Reproducir el audio MP3 personalizado del estudiante desde /audio/Sombrero/
            const audioObj = await playStudentHouseAudio(
                houseProfile,
                () => {
                    setIsPlayingHouseAudio(false)
                },
                () => {
                    setIsPlayingHouseAudio(false)
                }
            )

            if (audioObj) {
                currentAudioRef.current = audioObj
            } else {
                setIsPlayingHouseAudio(false)
            }
        })
    }

    // Envío de archivo de audio al backend STT (OpenAI Whisper /api/stt)
    const sendAudioToSTT = async (blob: Blob) => {
        setStatus("processing")
        const formData = new FormData()
        formData.append("file", blob, "audio.webm")

        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null
            const resp = await fetch(`${API_BASE_URL}/api/stt`, {
                method: "POST",
                headers: token ? { "Authorization": `Bearer ${token}` } : {},
                body: formData
            })

            if (resp.ok) {
                const data = await resp.json()
                if (data.status === "ok" && data.text) {
                    processRecognizedText(data.text)
                    return
                }
            }
        } catch (err) {
            console.error("Error en envío de audio a texto /api/stt:", err)
        }

        if (liveTranscriptRef.current && liveTranscriptRef.current.trim().length > 0) {
            processRecognizedText(liveTranscriptRef.current)
        } else {
            processRecognizedText("")
        }
    }

    // Iniciar captura por micrófono con MediaRecorder
    const startRecording = async () => {
        try {
            setIdentifiedStudent(null)
            liveTranscriptRef.current = ""
            setStatus("listening")

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/mp4"

            const recorder = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
                stream.getTracks().forEach(track => track.stop())
                streamRef.current = null

                if (audioBlob.size > 0) {
                    await sendAudioToSTT(audioBlob)
                } else if (liveTranscriptRef.current) {
                    processRecognizedText(liveTranscriptRef.current)
                } else {
                    setStatus("idle")
                }
            }

            recorder.start(150)

            if (typeof window !== "undefined") {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                if (SpeechRecognition) {
                    try {
                        const rec = new SpeechRecognition()
                        rec.continuous = false
                        rec.interimResults = true
                        rec.lang = "es-MX"
                        rec.onresult = (event: any) => {
                            const interim = Array.from(event.results)
                                .map((r: any) => r[0].transcript)
                                .join(" ")
                            liveTranscriptRef.current = interim
                        }
                        rec.onerror = () => {}
                        rec.start()
                        recognitionRef.current = rec
                    } catch (e) {}
                }
            }
        } catch (err) {
            console.error("Error al acceder al micrófono:", err)
            setStatus("idle")
        }
    }

    // Detener captura de micrófono
    const stopRecording = () => {
        if (mediaRecorderRef.current && status === "listening") {
            try {
                mediaRecorderRef.current.stop()
            } catch (e) {
                console.warn("Error deteniendo MediaRecorder:", e)
            }
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (e) {}
        }
    }

    // Alternar escucha al presionar el botón de micrófono
    const toggleListening = () => {
        if (status === "speaking" || status === "processing") return

        if (status === "listening") {
            stopRecording()
        } else {
            startRecording()
        }
    }

    // Procesamiento & Buscador Inteligente de Nombres con Coincidencia Fonética y Animación
    const processRecognizedText = (text: string) => {
        setStatus("processing")

        const trimmed = (text || "").trim()
        if (!trimmed) {
            const noAudioMessage = "No pude escuchar tu nombre con claridad. Por favor presiona el micrófono y dilo de nuevo."
            speakTextWithMicrosoftEdge(noAudioMessage)
            return
        }

        const { student, score } = findBestStudentMatch(trimmed, localStudents)

        if (student && score >= 0.40) {
            setIdentifiedStudent(student)
            setMatchConfidence(Math.round(score * 100))
            if (onStudentIdentified) onStudentIdentified(student)

            // DISPARAR ANIMACIÓN ESPECTACULAR DE LOGO DE CASA Y AUDIO
            executeStudentPresentationAnimation(student.full_name)
        } else {
            setIdentifiedStudent(null)
            setMatchConfidence(0)
            const fallbackMessage = `Participante "${trimmed}" no encontrado. Menciona tu nombre de nuevo o usa el buscador.`
            speakTextWithMicrosoftEdge(fallbackMessage)
        }
    }

    // Filtrar lista de 48 para la búsqueda rápida en Moya
    const filteredQuickStudents = ALL_48_STUDENTS.filter(s => {
        const q = searchQuery.toLowerCase().trim()
        return !q || s.full_name.toLowerCase().includes(q) || s.house.toLowerCase().includes(q) || s.top_skill.toLowerCase().includes(q)
    })

    if (!mounted) return null

    return createPortal(
        <>
            {/* Fondo Difuminado Detrás de Moya (Z-Index 500) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-md pointer-events-auto"
            />

            {/* BOTÓN SALIR SUPERIOR */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="fixed top-6 right-6 z-[600] flex items-center gap-2 px-4 py-2.5 bg-slate-950/90 hover:bg-slate-900 text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-xs font-bold transition-all shadow-2xl backdrop-blur-md cursor-pointer"
                >
                    <X className="w-4 h-4" />
                    <span>Finalizar Presentación</span>
                </button>
            )}

            {/* BOTÓN SUPERIOR IZQUIERDO: BÚSQUEDA RÁPIDA DE LOS 48 INTEGRANTES */}
            <div className="fixed top-6 left-6 z-[600] flex items-center gap-2 pointer-events-auto">
                <button
                    onClick={() => setShowSearchDrawer(!showSearchDrawer)}
                    className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-xs font-bold transition-all shadow-2xl backdrop-blur-md"
                >
                    <Search className="w-4 h-4 text-[hsl(74,100%,47%)]" />
                    <span>Buscar Integrante (48)</span>
                </button>
            </div>

            {/* DRAWER / DESPLEGABLE DE BÚSQUEDA RÁPIDA DE LOS 48 INTEGRANTES */}
            <AnimatePresence>
                {showSearchDrawer && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-20 left-6 z-[650] w-80 max-h-[480px] bg-slate-950/95 border border-emerald-500/30 rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col gap-3 pointer-events-auto overflow-hidden"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[hsl(74,100%,47%)] flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Base de Datos 48 Integrantes
                            </span>
                            <button onClick={() => setShowSearchDrawer(false)} className="text-slate-400 hover:text-white text-xs">
                                ✕
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Escribe un nombre o casa..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[hsl(74,100%,47%)]"
                            />
                        </div>

                        <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[320px]">
                            {filteredQuickStudents.map(student => {
                                const hInfo = CASAS_INFO[student.house]
                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setShowSearchDrawer(false)
                                            executeStudentPresentationAnimation(student.full_name)
                                        }}
                                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/30 text-left transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-slate-950 p-1 border border-white/10 shrink-0">
                                                <img src={hInfo.logo} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                                                    {student.full_name}
                                                </h5>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    Casa {student.house} • {student.classroom}
                                                </p>
                                            </div>
                                        </div>
                                        <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-[hsl(74,100%,47%)] transition-colors shrink-0" />
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ANIMACIÓN PRINCIPAL ESPECTACULAR: LOGO DE CASA Y PRESENTACIÓN EN VIVO */}
            <AnimatePresence>
                {activePresentation && (() => {
                    const houseInfo = CASAS_INFO[activePresentation.house]

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: -20 }}
                            transition={{ type: "spring", stiffness: 180, damping: 18 }}
                            className="fixed top-12 left-1/2 -translate-x-1/2 z-[620] w-full max-w-md px-4 pointer-events-auto"
                        >
                            <div className={`bg-slate-950/95 border-2 ${houseInfo.borderColor} rounded-3xl p-6 shadow-[0_0_60px_${houseInfo.glowColor}] backdrop-blur-2xl text-center relative overflow-hidden flex flex-col items-center gap-4`}>
                                {/* Fondo de Partículas Resplandecientes */}
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none" />

                                {/* LOGO OFICIAL DE LA CASA EN 3D FLOTANTE */}
                                <motion.div
                                    animate={{ 
                                        y: [0, -8, 0],
                                        rotate: [0, 2, -2, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                    className="relative w-28 h-28 p-3 rounded-2xl bg-slate-950 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 z-10"
                                >
                                    <img
                                        src={houseInfo.logo}
                                        alt={`Logo oficial Casa ${houseInfo.name}`}
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                    />
                                </motion.div>

                                {/* INFORMACIÓN Y PRESENTACIÓN DEL INTEGRANTE */}
                                <div className="z-10 space-y-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest ${houseInfo.badgeBg} ${houseInfo.badgeText} border border-current/30`}>
                                        CASA {houseInfo.name} • {houseInfo.element}
                                    </span>
                                    <h3 className="text-2xl font-black text-white tracking-tight pt-1">
                                        {activePresentation.full_name}
                                    </h3>
                                    <p className="text-xs text-slate-300 font-semibold italic">
                                        "{houseInfo.motto}"
                                    </p>
                                    <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10">{activePresentation.classroom}</span>
                                        <span>•</span>
                                        <span className="text-emerald-400 font-bold">{activePresentation.top_skill}</span>
                                    </div>
                                </div>

                                {/* ONDA DE SONIDO / INDICADOR DE AUDIO MP3 EN REPRODUCCIÓN */}
                                {isPlayingHouseAudio && (
                                    <div className="z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
                                        <Volume2 className="w-4 h-4 animate-bounce" />
                                        <span>Locución del Integrante en Vivo</span>
                                        <div className="flex items-end gap-1 h-3 ml-1">
                                            <span className="w-1 h-3 bg-emerald-400 animate-pulse rounded-full" />
                                            <span className="w-1 h-4 bg-emerald-400 animate-pulse delay-75 rounded-full" />
                                            <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150 rounded-full" />
                                        </div>
                                    </div>
                                )}

                                {/* BOTÓN PARA CERRAR ANIMACIÓN DE PRESENTACIÓN */}
                                <button
                                    onClick={() => setActivePresentation(null)}
                                    className="absolute top-3 right-3 text-slate-500 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )
                })()}
            </AnimatePresence>

            {/* CONTROLES E INTERFAZ DE AUDIO SOBRE MOYA (Z-Index 600) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center gap-3 w-full max-w-lg px-4 pointer-events-auto">
                {/* SUBTÍTULOS DE MOYA CON ANIMACIÓN DE ESCRITURA EN TIEMPO REAL */}
                <AnimatePresence>
                    {displayedSubtitleText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="w-full bg-slate-950/90 border border-emerald-500/30 rounded-2xl px-5 py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? "bg-[hsl(74,100%,47%)] animate-ping" : "bg-emerald-400"}`} />
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                    Subtítulos Moya
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white italic leading-relaxed min-h-[1.5rem]">
                                "{displayedSubtitleText}"
                                {isTyping && (
                                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-[hsl(74,100%,47%)] animate-pulse align-middle rounded-full shadow-[0_0_8px_hsl(74,100%,47%)]" />
                                )}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* BOTÓN DE MICRÓFONO REDONDO Y ROJO SOBRE MOYA */}
                <div className="flex flex-col items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={toggleListening}
                        disabled={status === "speaking" || status === "processing"}
                        title={status === "listening" ? "Detener y procesar audio" : "Presiona para hablar"}
                        className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white transition-all shadow-2xl ${
                            status === "listening"
                                ? "bg-red-600 shadow-[0_0_50px_rgba(239,68,68,1)] border-4 border-red-300 animate-pulse ring-4 ring-red-500/40"
                                : status === "processing"
                                    ? "bg-amber-600 border-4 border-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.6)] cursor-wait"
                                    : "bg-red-600 hover:bg-red-500 border-4 border-red-400/30 shadow-[0_0_35px_rgba(239,68,68,0.7)]"
                        }`}
                    >
                        {status === "processing" ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : status === "listening" ? (
                            <MicOff className="w-8 h-8 text-white" />
                        ) : (
                            <Mic className="w-8 h-8 text-white" />
                        )}
                    </motion.button>
                    <span className="text-[11px] font-mono font-bold text-slate-200 bg-slate-950/90 px-4 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-lg">
                        {status === "idle" && "Presiona para hablar y buscar integrante"}
                        {status === "listening" && "Escuchando... Di un nombre (Presiona para enviar)"}
                        {status === "processing" && "Buscando integrante en la base de datos..."}
                        {status === "speaking" && "Moya presentando integrante..."}
                    </span>
                </div>
            </div>
        </>,
        document.body
    )
}
