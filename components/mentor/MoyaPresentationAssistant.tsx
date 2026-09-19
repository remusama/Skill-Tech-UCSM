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

// ── CANVAS DE PORTAL MÁGICO CON POLVO DE ESTRELLAS Y PARTÍCULAS ─────────────
const MagicPortalCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        let width = (canvas.width = window.innerWidth)
        let height = (canvas.height = window.innerHeight)

        const handleResize = () => {
            if (!canvas) return
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        window.addEventListener("resize", handleResize)

        const particles: Array<{
            x: number
            y: number
            size: number
            color: string
            alpha: number
            vx: number
            vy: number
            life: number
            maxLife: number
        }> = []

        const colors = [
            "rgba(16, 185, 129, ", // Emerald APEX
            "rgba(249, 115, 22, ", // Ignis Orange
            "rgba(168, 85, 247, ", // Nexus Purple
            "rgba(6, 182, 212, ",  // Visio Cyan
            "rgba(234, 179, 8, "   // Magic Gold
        ]

        for (let i = 0; i < 75; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2.8 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.8 + 0.2,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                life: Math.random() * 100,
                maxLife: 150 + Math.random() * 100
            })
        }

        let angle = 0

        const render = () => {
            ctx.clearRect(0, 0, width, height)

            const centerX = width / 2
            const centerY = height / 2 + 50
            const gradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, width * 0.5)
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.12)")
            gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.06)")
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)

            angle += 0.005

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]
                p.life++
                p.x += p.vx + Math.sin(angle + p.y * 0.01) * 0.3
                p.y += p.vy + Math.cos(angle + p.x * 0.01) * 0.3

                if (p.x < 0) p.x = width
                if (p.x > width) p.x = 0
                if (p.y < 0) p.y = height
                if (p.y > height) p.y = 0

                const currentAlpha = p.alpha * Math.sin((p.life / p.maxLife) * Math.PI)

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = `${p.color}${Math.max(0, currentAlpha)})`
                ctx.shadowBlur = 12
                ctx.shadowColor = p.color + "0.8)"
                ctx.fill()
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            window.removeEventListener("resize", handleResize)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[501] pointer-events-none opacity-80"
        />
    )
}

// ── COINCIDENCIA DINÁMICA DE NOMBRES CON N-GRAM SLIDING WINDOW (SIN HARDCODING) ──
function findBestStudentMatchDynamic(
    transcript: string, 
    students: Student[]
): { student: Student | null; score: number; extractedSegment: string } {
    if (!transcript || !transcript.trim()) {
        return { student: null, score: 0, extractedSegment: "" }
    }

    const normTranscript = phoneticNormalize(transcript)
    const transcriptTokens = normTranscript.split(" ").filter(Boolean)
    const rawTokens = transcript.trim().split(/\s+/).filter(Boolean)

    const pool = (students && students.length > 0) 
        ? students 
        : ALL_48_STUDENTS.map(s => ({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            top_skill: s.top_skill,
            average_level: 100
        }))

    let bestStudent: Student | null = null
    let highestScore = 0
    let bestSegment = ""

    for (const student of pool) {
        const normFullName = phoneticNormalize(student.full_name)
        const studentNameTokens = normFullName.split(" ").filter(Boolean)

        // 1. Direct Substring Check
        if (normTranscript.includes(normFullName)) {
            return {
                student,
                score: 1.0,
                extractedSegment: student.full_name
            }
        }

        // 2. Sliding Window N-gram Matching (Dynamic Token Windowing)
        for (let windowLen = 1; windowLen <= Math.min(transcriptTokens.length, studentNameTokens.length + 2); windowLen++) {
            for (let startIdx = 0; startIdx <= transcriptTokens.length - windowLen; startIdx++) {
                const subWindowTokens = transcriptTokens.slice(startIdx, startIdx + windowLen)
                const rawSubWindow = rawTokens.slice(startIdx, startIdx + windowLen).join(" ")

                let matchedTokensCount = 0
                for (const wToken of subWindowTokens) {
                    for (const sToken of studentNameTokens) {
                        if (wToken === sToken) {
                            matchedTokensCount += 1.0
                            break
                        }
                        const maxLen = Math.max(wToken.length, sToken.length)
                        if (maxLen > 2) {
                            const dist = levenshteinDistance(wToken, sToken)
                            const sim = 1 - dist / maxLen
                            if (sim >= 0.70) {
                                matchedTokensCount += sim
                                break
                            }
                        }
                    }
                }

                const windowPrecision = matchedTokensCount / subWindowTokens.length
                const studentRecall = matchedTokensCount / Math.min(subWindowTokens.length + 1, studentNameTokens.length)
                
                const currentScore = (windowPrecision * 0.4) + (studentRecall * 0.6)

                if (currentScore > highestScore && matchedTokensCount >= 1.0) {
                    highestScore = currentScore
                    bestStudent = student
                    bestSegment = rawSubWindow
                }
            }
        }
    }

    return {
        student: bestStudent,
        score: highestScore,
        extractedSegment: bestSegment
    }
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

    // REFS PARA SINCRONIZACIÓN DE AUDIO Y MOVIMIENTO DE MOYA (LIP-SYNC)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animFrameRef = useRef<number | null>(null)

    // Detener la sincronización labial y movimiento de Moya
    const stopMoyaLipSync = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current)
            animFrameRef.current = null
        }
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0, bass: 0, mid: 0, high: 0 } }))
        }
    }

    // Simulación de movimiento rítmico para Moya en caso de contingencia
    const simulateLipSyncMovement = (audio: HTMLAudioElement) => {
        stopMoyaLipSync()
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent('avatar-expression', { detail: { expression: 'Explicando' } }))
        }
        const loop = () => {
            if (audio.paused || audio.ended) {
                stopMoyaLipSync()
                return
            }
            const now = Date.now()
            // Variación rítmica y enérgica que simula cadencia natural de habla
            const speechPulse = Math.sin(now / 110) * 0.4 + Math.cos(now / 75) * 0.3 + 0.5
            const vol = Math.min(1.0, Math.max(0.12, speechPulse * 0.95))
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('avatar-speaking', {
                    detail: {
                        volume: vol,
                        bass: vol * 0.85,
                        mid: vol * 0.9,
                        high: vol * 0.65
                    }
                }))
            }
            animFrameRef.current = requestAnimationFrame(loop)
        }
        animFrameRef.current = requestAnimationFrame(loop)
    }

    // Conectar el audio HTML5 al AnalyserNode de Web Audio API para mover a Moya en tiempo real
    const startMoyaLipSyncFromAudioElement = (audio: HTMLAudioElement) => {
        try {
            stopMoyaLipSync()

            let ctx = audioCtxRef.current
            if (!ctx || ctx.state === "closed") {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                ctx = new AudioContextClass()
                audioCtxRef.current = ctx
            }
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => {})
            }

            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            analyserRef.current = analyser

            let source: MediaElementAudioSourceNode
            if ((audio as any).__mediaSourceNode) {
                source = (audio as any).__mediaSourceNode
            } else {
                source = ctx.createMediaElementSource(audio)
                ;(audio as any).__mediaSourceNode = source
            }

            source.connect(analyser)
            analyser.connect(ctx.destination)

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('avatar-expression', { detail: { expression: 'Explicando' } }))
            }

            const dataArray = new Uint8Array(analyser.frequencyBinCount)

            const loop = () => {
                if (audio.paused || audio.ended) {
                    stopMoyaLipSync()
                    return
                }

                analyser.getByteFrequencyData(dataArray)
                const binCount = dataArray.length

                let sum = 0
                for (let i = 0; i < binCount; i++) sum += dataArray[i]
                const rawAvg = sum / binCount / 255

                // Bandas de frecuencia para forma de boca fonética
                const bass = (dataArray[2] || 0) / 255
                const mid = (dataArray[12] || 0) / 255
                const high = (dataArray[32] || 0) / 255

                // Impulso de volumen dinámico para que los labios de Moya se abran con claridad (0 - 1.0)
                let volume = Math.min(1.0, rawAvg * 4.8)

                // Fallback de modulación viva en caso de que CORS silencie el FFT del analyser en el navegador
                if (volume < 0.04 && !audio.paused && audio.currentTime > 0) {
                    const now = Date.now()
                    const speechPulse = Math.sin(now / 110) * 0.4 + Math.cos(now / 75) * 0.3 + 0.5
                    volume = Math.min(1.0, Math.max(0.12, speechPulse * 0.95))
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent('avatar-speaking', {
                        detail: { volume, bass, mid, high }
                    }))
                }

                animFrameRef.current = requestAnimationFrame(loop)
            }

            animFrameRef.current = requestAnimationFrame(loop)
        } catch (e) {
            console.warn("Web Audio API analyser fallback a simulación:", e)
            simulateLipSyncMovement(audio)
        }
    }

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
            stopMoyaLipSync()
            if (currentAudioRef.current) {
                currentAudioRef.current.pause()
                currentAudioRef.current = null
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => {})
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

    // Reproducción del audio de introducción oficial (/CASAS/Presentacion.mpeg) conectando a Moya
    const playIntroductionAudio = () => {
        setStatus("speaking")
        triggerTypewriter("¡Bienvenidos a la presentación oficial de las Casas de Liderazgo UCSM! Menciona el nombre de un integrante para comenzar.")

        const audio = new Audio("/CASAS/Presentacion.mpeg")
        currentAudioRef.current = audio

        audio.onended = () => {
            setStatus("idle")
            stopMoyaLipSync()
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent('avatar-expression', { detail: { expression: 'Atenta' } }))
            }
        }

        audio.onerror = (err) => {
            console.warn("Error cargando audio /CASAS/Presentacion.mpeg:", err)
            setStatus("idle")
            stopMoyaLipSync()
        }

        const handleSuccess = () => {
            startMoyaLipSyncFromAudioElement(audio)
        }

        audio.play()
            .then(handleSuccess)
            .catch(err => {
                console.warn("Autoplay bloqueado por navegador, esperando interacción:", err)
                const unlock = () => {
                    audio.play().then(handleSuccess).catch(() => {})
                }
                window.addEventListener("click", unlock, { once: true })
                window.addEventListener("touchstart", unlock, { once: true })
            })
    }

    // Reproducir audio de presentación oficial al abrir (/CASAS/Presentacion.mpeg)
    useEffect(() => {
        if (!initialGreetingDone.current) {
            initialGreetingDone.current = true
            const timer = setTimeout(() => {
                playIntroductionAudio()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [])

    // Fallback con SpeechSynthesis para voz de Microsoft Edge Dalia
    const fallbackWebSpeech = (text: string, onEndCallback?: () => void) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            setStatus("idle")
            stopMoyaLipSync()
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
            stopMoyaLipSync()
            if (onEndCallback) onEndCallback()
        }

        utterance.onerror = () => {
            setStatus("idle")
            stopMoyaLipSync()
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
                        stopMoyaLipSync()
                        if (onEndCallback) onEndCallback()
                    }
                    audio.onerror = () => {
                        stopMoyaLipSync()
                        fallbackWebSpeech(text, onEndCallback)
                    }
                    await audio.play()
                    startMoyaLipSyncFromAudioElement(audio)
                    return
                }
            }
        } catch (err) {
            console.warn("Backend Edge-TTS fallback:", err)
        }

        fallbackWebSpeech(text, onEndCallback)
    }

    // DISPARAR ANIMACIÓN Y PRESENTACIÓN DE UN ESTUDIANTE DIRECTAMENTE CON SU AUDIO OFICIAL
    const executeStudentPresentationAnimation = async (studentName: string) => {
        const houseProfile = getStudentHouseProfile(studentName)
        if (!houseProfile) return

        setActivePresentation(houseProfile)
        setIsPlayingHouseAudio(true)
        setStatus("speaking")
        if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current)
            typingTimerRef.current = null
        }
        setIsTyping(false)
        setDisplayedSubtitleText("") // Quitar cualquier subtítulo previo

        // Detener cualquier audio previo
        if (currentAudioRef.current) {
            currentAudioRef.current.pause()
            currentAudioRef.current = null
        }
        stopMoyaLipSync()

        // Reproducir DIRECTAMENTE el archivo de audio MP3 oficial del estudiante
        const audioObj = await playStudentHouseAudio(
            houseProfile,
            () => {
                setIsPlayingHouseAudio(false)
                setStatus("idle")
                stopMoyaLipSync()
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent('avatar-expression', { detail: { expression: 'Atenta' } }))
                }
            },
            () => {
                setIsPlayingHouseAudio(false)
                setStatus("idle")
                stopMoyaLipSync()
            }
        )

        if (audioObj) {
            currentAudioRef.current = audioObj
            startMoyaLipSyncFromAudioElement(audioObj)
        } else {
            setIsPlayingHouseAudio(false)
            setStatus("idle")
            stopMoyaLipSync()
        }
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

        const { student, score, extractedSegment } = findBestStudentMatchDynamic(trimmed, localStudents)

        if (student && score >= 0.35) {
            setIdentifiedStudent(student)
            setMatchConfidence(Math.round(score * 100))
            if (onStudentIdentified) onStudentIdentified(student)

            // DISPARAR ANIMACIÓN ESPECTACULAR DE LOGO DE CASA Y AUDIO
            executeStudentPresentationAnimation(student.full_name)
        } else {
            setIdentifiedStudent(null)
            setMatchConfidence(0)
            const queryName = extractedSegment || trimmed
            const fallbackMessage = `No encontré al integrante "${queryName}". Menciona tu nombre de nuevo o selecciona de las mini ventanas.`
            speakTextWithMicrosoftEdge(fallbackMessage)
        }
    }

// LOGOS OFICIALES DE LAS 4 CASAS CON '1' EN SU NOMBRE (SOLO LOGOS AL INICIO)
const INITIAL_HOUSE_LOGOS = [
    { id: "APEX", name: "APEX", file: "/CASAS/APEX 1.png", glow: "rgba(16,185,129,0.55)", side: "left" },
    { id: "IGNIS", name: "IGNIS", file: "/CASAS/IGNIS 1.png", glow: "rgba(249,115,22,0.55)", side: "left" },
    { id: "NEXUS", name: "NEXUS", file: "/CASAS/NEXUS 1.png", glow: "rgba(168,85,247,0.55)", side: "right" },
    { id: "VISIO", name: "VISIO", file: "/CASAS/VISIO 1.png", glow: "rgba(6,182,212,0.55)", side: "right" },
]

    // Determinar si la locución ha finalizado para mostrar los flancos laterales
    const isLocutionFinished = activePresentation !== null && !isPlayingHouseAudio && status !== "speaking" && status !== "processing"

    // Integrantes de la misma Casa divididos: 6 a la izquierda y 6 a la derecha de Moya
    const sameHouseTeammates = activePresentation 
        ? ALL_48_STUDENTS.filter(s => s.house === activePresentation.house)
        : []
    const leftTeammates = sameHouseTeammates.slice(0, 6)
    const rightTeammates = sameHouseTeammates.slice(6, 12)

    // Filtrar lista de 48 para el drawer de búsqueda manual
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

            {/* CANVAS DE PORTAL MÁGICO (Z-Index 501) */}
            <MagicPortalCanvas />

            {/* BOTÓN SALIR SUPERIOR */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="fixed top-4 right-6 z-[600] flex items-center gap-2 px-3.5 py-2 bg-slate-950/90 hover:bg-slate-900 text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-xs font-bold transition-all shadow-2xl backdrop-blur-md cursor-pointer"
                >
                    <X className="w-4 h-4" />
                    <span>Finalizar Presentación</span>
                </button>
            )}

            {/* BARRA SUPERIOR IZQUIERDA: BÚSQUEDA RÁPIDA DE INTEGRANTES */}
            <div className="fixed top-4 left-6 z-[600] flex items-center gap-2 pointer-events-auto">
                <button
                    onClick={() => setShowSearchDrawer(!showSearchDrawer)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/90 hover:bg-slate-900 text-slate-200 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-xs font-bold transition-all shadow-2xl backdrop-blur-md"
                >
                    <Search className="w-4 h-4 text-[hsl(74,100%,47%)]" />
                    <span>Buscar Integrante (48)</span>
                </button>
            </div>

            {/* LOGOS INICIALES DE LAS CASAS CON '1' EN SU NOMBRE (SOLO LOS LOGOS HASTA QUE SE DIGA UN NOMBRE A MOYA) */}
            <AnimatePresence>
                {!activePresentation && (
                    <>
                        {/* 2 Casas a la izquierda: APEX 1 e IGNIS 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -70 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -70 }}
                            transition={{ type: "spring", stiffness: 180, damping: 20 }}
                            className="fixed top-1/2 -translate-y-1/2 left-6 sm:left-10 md:left-14 z-[540] pointer-events-auto flex flex-col gap-6 items-center"
                        >
                            {INITIAL_HOUSE_LOGOS.filter(h => h.side === "left").map((house, idx) => (
                                <motion.div
                                    key={house.id}
                                    animate={{ 
                                        y: [0, -8, 0],
                                        rotate: [0, 1.5, -1.5, 0]
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 3.5 + idx * 0.6, 
                                        ease: "easeInOut" 
                                    }}
                                    className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 p-2.5 rounded-3xl bg-slate-950/40 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center group hover:scale-105 transition-all duration-300"
                                    style={{
                                        boxShadow: `0 0 35px ${house.glow}`
                                    }}
                                >
                                    <img 
                                        src={house.file} 
                                        alt={`Logo ${house.name}`} 
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] transition-all"
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* 2 Casas a la derecha: NEXUS 1 y VISIO 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: 70 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 70 }}
                            transition={{ type: "spring", stiffness: 180, damping: 20 }}
                            className="fixed top-1/2 -translate-y-1/2 right-6 sm:right-10 md:right-14 z-[540] pointer-events-auto flex flex-col gap-6 items-center"
                        >
                            {INITIAL_HOUSE_LOGOS.filter(h => h.side === "right").map((house, idx) => (
                                <motion.div
                                    key={house.id}
                                    animate={{ 
                                        y: [0, -8, 0],
                                        rotate: [0, -1.5, 1.5, 0]
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        duration: 3.8 + idx * 0.6, 
                                        ease: "easeInOut" 
                                    }}
                                    className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 p-2.5 rounded-3xl bg-slate-950/40 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center group hover:scale-105 transition-all duration-300"
                                    style={{
                                        boxShadow: `0 0 35px ${house.glow}`
                                    }}
                                >
                                    <img 
                                        src={house.file} 
                                        alt={`Logo ${house.name}`} 
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] transition-all"
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* FLANCO IZQUIERDO: 6 INTEGRANTES DE LA CASA A UN COSTADO DE MOYA */}
            <AnimatePresence>
                {isLocutionFinished && activePresentation && (
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ type: "spring", stiffness: 180, damping: 20 }}
                        className="fixed top-12 left-4 md:left-6 lg:left-8 bottom-28 w-60 sm:w-64 md:w-72 z-[540] pointer-events-auto flex flex-col justify-center gap-2"
                    >
                        <div className="bg-slate-950/85 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[hsl(74,100%,47%)] flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Casa {activePresentation.house} (1 - 6)
                            </span>
                        </div>
                        <div className="space-y-2 overflow-y-auto pr-1 max-h-[60vh]">
                            {leftTeammates.map((student, idx) => {
                                const hInfo = CASAS_INFO[student.house]
                                const isActive = activePresentation?.full_name === student.full_name

                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ 
                                            opacity: 1, 
                                            x: 0,
                                            scale: isActive ? 1.04 : 1,
                                            y: isActive ? [0, -3, 0] : [0, -1.5, 0]
                                        }}
                                        transition={{
                                            duration: 0.25,
                                            delay: idx * 0.03,
                                            y: { repeat: Infinity, duration: 3 + (idx % 2), ease: "easeInOut" }
                                        }}
                                        onClick={() => executeStudentPresentationAnimation(student.full_name)}
                                        className={`relative p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border cursor-pointer transition-all duration-300 flex items-center gap-2.5 shadow-md group hover:scale-[1.03] ${
                                            isActive 
                                                ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.6)] z-20 bg-slate-900/95" 
                                                : `${hInfo.borderColor} hover:border-white/50 hover:shadow-[0_0_12px_${hInfo.glowColor}] z-10`
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-slate-950 p-1 border ${hInfo.borderColor} shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner`}>
                                            <img src={hInfo.logo} alt="" className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[11px] font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                                                {student.full_name}
                                            </h4>
                                            <p className="text-[9px] font-mono text-slate-400 truncate">
                                                {student.classroom} • {student.top_skill}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-0.5 border border-white/40 animate-pulse">
                                                <Sparkles className="w-2 h-2" />
                                                PRESENTE
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLANCO DERECHO: OTROS 6 INTEGRANTES DE LA CASA AL OTRO COSTADO DE MOYA */}
            <AnimatePresence>
                {isLocutionFinished && activePresentation && (
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        transition={{ type: "spring", stiffness: 180, damping: 20 }}
                        className="fixed top-12 right-4 md:right-6 lg:right-8 bottom-28 w-60 sm:w-64 md:w-72 z-[540] pointer-events-auto flex flex-col justify-center gap-2"
                    >
                        <div className="bg-slate-950/85 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[hsl(74,100%,47%)] flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Casa {activePresentation.house} (7 - 12)
                            </span>
                        </div>
                        <div className="space-y-2 overflow-y-auto pr-1 max-h-[60vh]">
                            {rightTeammates.map((student, idx) => {
                                const hInfo = CASAS_INFO[student.house]
                                const isActive = activePresentation?.full_name === student.full_name

                                return (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ 
                                            opacity: 1, 
                                            x: 0,
                                            scale: isActive ? 1.04 : 1,
                                            y: isActive ? [0, -3, 0] : [0, -1.5, 0]
                                        }}
                                        transition={{
                                            duration: 0.25,
                                            delay: idx * 0.03,
                                            y: { repeat: Infinity, duration: 3 + (idx % 2), ease: "easeInOut" }
                                        }}
                                        onClick={() => executeStudentPresentationAnimation(student.full_name)}
                                        className={`relative p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border cursor-pointer transition-all duration-300 flex items-center gap-2.5 shadow-md group hover:scale-[1.03] ${
                                            isActive 
                                                ? "border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.6)] z-20 bg-slate-900/95" 
                                                : `${hInfo.borderColor} hover:border-white/50 hover:shadow-[0_0_12px_${hInfo.glowColor}] z-10`
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-slate-950 p-1 border ${hInfo.borderColor} shrink-0 flex items-center justify-center relative overflow-hidden shadow-inner`}>
                                            <img src={hInfo.logo} alt="" className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[11px] font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                                                {student.full_name}
                                            </h4>
                                            <p className="text-[9px] font-mono text-slate-400 truncate">
                                                {student.classroom} • {student.top_skill}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <div className="absolute -top-2 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-0.5 border border-white/40 animate-pulse">
                                                <Sparkles className="w-2 h-2" />
                                                PRESENTE
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DRAWER / DESPLEGABLE DE BÚSQUEDA RÁPIDA DE LOS 48 INTEGRANTES */}
            <AnimatePresence>
                {showSearchDrawer && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-16 left-6 z-[650] w-80 max-h-[480px] bg-slate-950/95 border border-emerald-500/30 rounded-3xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col gap-3 pointer-events-auto overflow-hidden"
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

            {/* TARJETITA DE PRESENTACIÓN DIRECTAMENTE ENCIMA DE LA CABEZA DE MOYA */}
            <AnimatePresence>
                {activePresentation && (() => {
                    const houseInfo = CASAS_INFO[activePresentation.house]

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: -20 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="fixed top-4 left-1/2 -translate-x-1/2 z-[620] w-full max-w-sm sm:max-w-md px-3 pointer-events-auto"
                        >
                            <div className={`bg-slate-950/95 border-2 ${houseInfo.borderColor} rounded-2xl p-3 shadow-[0_0_35px_${houseInfo.glowColor}] backdrop-blur-2xl relative overflow-hidden flex items-center gap-3.5`}>
                                {/* Fondo de Partículas Resplandecientes */}
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none" />

                                {/* LOGO OFICIAL DE LA CASA FLOTANTE */}
                                <motion.div
                                    animate={{ 
                                        y: [0, -3, 0],
                                        rotate: [0, 2, -2, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                    className="relative w-12 h-12 p-1.5 rounded-xl bg-slate-950 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center shrink-0 z-10"
                                >
                                    <img
                                        src={houseInfo.logo}
                                        alt={`Logo oficial Casa ${houseInfo.name}`}
                                        className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                                    />
                                </motion.div>

                                {/* INFORMACIÓN Y PRESENTACIÓN DEL INTEGRANTE */}
                                <div className="z-10 min-w-0 flex-1 space-y-0.5 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${houseInfo.badgeBg} ${houseInfo.badgeText} border border-current/30`}>
                                            CASA {houseInfo.name} • {houseInfo.element}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {activePresentation.classroom}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-white tracking-tight truncate">
                                        {activePresentation.full_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-mono">
                                        <span className="text-emerald-400 font-bold truncate">{activePresentation.top_skill}</span>
                                        {isPlayingHouseAudio && (
                                            <span className="flex items-center gap-1 text-amber-400 font-bold ml-auto shrink-0">
                                                <Volume2 className="w-3 h-3 animate-bounce" />
                                                <span className="text-[9px]">Locución</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* BOTÓN PARA CERRAR ANIMACIÓN DE PRESENTACIÓN */}
                                <button
                                    onClick={() => setActivePresentation(null)}
                                    className="z-10 text-slate-500 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-white/10 shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
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
