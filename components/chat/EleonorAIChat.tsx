"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEleonor } from "@/contexts/eleonor-context"
import { API_BASE_URL } from "@/lib/config"
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Activity,
  History,
  Gamepad2,
  Sparkles,
  Copy,
  Check,
  Bot,
  User,
  Brain,
  Lightbulb,
  Target,
  HelpCircle,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  MessageSquare,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EleonorHistory } from "./EleonorHistory"
import { MiniGameOverlay } from "../games/MiniGameOverlay"

// --- TIPOS ---
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

// --- SUB-COMPONENTES ---

const MessageBubble = React.memo(({ message }: { message: Message }) => {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!message.content) return
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 15 : -15, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 pointer-events-auto w-full`}
    >
      <div className={`flex gap-2.5 max-w-[90%] sm:max-w-[82%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[hsl(74,100%,47%)] to-emerald-400 flex items-center justify-center text-slate-950 shadow-md text-[11px] font-black">
              <User size={14} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)] border border-[hsl(74,100%,47%)]/30 flex items-center justify-center text-[hsl(74,100%,47%)] shadow-md text-[11px] font-bold">
              <Bot size={14} />
            </div>
          )}
        </div>

        {/* Burbuja de mensaje */}
        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={`
              p-3.5 sm:p-4 rounded-2xl relative group transition-all text-xs sm:text-sm leading-relaxed shadow-lg
              ${
                isUser
                  ? "bg-gradient-to-r from-[hsl(74,100%,47%)] to-[hsl(84,90%,42%)] text-slate-950 font-medium rounded-tr-sm border border-[hsl(74,100%,47%)]/50 shadow-[0_4px_20px_rgba(186,239,0,0.2)]"
                  : "bg-[hsl(161,40%,15%)]/90 text-slate-100 rounded-tl-sm border border-[hsl(153,30%,75%)]/25 backdrop-blur-2xl shadow-xl shadow-black/40"
              }
            `}
          >
            {/* Tag distintivo para la IA */}
            {!isUser && (
              <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[hsl(74,100%,47%)]">
                  <Sparkles size={11} className="text-[hsl(74,100%,47%)]" />
                  Tororo IA
                </span>
                <button
                  onClick={handleCopy}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-[hsl(74,100%,47%)] rounded cursor-pointer"
                  title="Copiar respuesta"
                >
                  {copied ? <Check size={12} className="text-[hsl(74,100%,47%)]" /> : <Copy size={12} />}
                </button>
              </div>
            )}

            <p className="whitespace-pre-wrap font-normal leading-relaxed break-words">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-[hsl(74,100%,47%)] animate-pulse align-middle rounded-sm" />
              )}
            </p>
          </div>

          <span
            className={`text-[9px] font-medium text-white/40 px-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </motion.div>
  )
})
MessageBubble.displayName = "MessageBubble"

const MAX_CHARS = 500

const ChatInput = React.memo(({
  onSend,
  isListening,
  onToggleListening,
  isProcessing,
  placeholder = "Escribe tu consulta...",
  compact = false,
}: {
  onSend: (val: string) => void
  isListening: boolean
  onToggleListening: (val: boolean) => void
  isProcessing: boolean
  placeholder?: string
  compact?: boolean
}) => {
  const [input, setInput] = useState("")

  const handleLocalSend = () => {
    if (!input.trim() || isProcessing || input.length > MAX_CHARS) return
    onSend(input)
    setInput("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= MAX_CHARS) {
      setInput(val)
    } else {
      setInput(val.slice(0, MAX_CHARS))
    }
  }

  const charCount = input.length
  const isNearLimit = charCount >= MAX_CHARS * 0.85

  return (
    <div className="w-full relative group pointer-events-auto">
      <div className="relative flex flex-col p-2 pl-3.5 pr-2 rounded-2xl sm:rounded-3xl bg-[hsl(161,67%,9%)]/95 border border-[hsl(153,30%,75%)]/25 backdrop-blur-2xl hover:border-[hsl(74,100%,47%)]/40 focus-within:border-[hsl(74,100%,47%)] focus-within:shadow-[0_0_25px_rgba(186,239,0,0.22)] transition-all shadow-2xl">
        <div className="flex items-end gap-1.5 sm:gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
              isProcessing
                ? "Tororo está pensando..."
                : isListening
                ? "Escuchando tu voz..."
                : placeholder
            }
            disabled={isProcessing}
            rows={1}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[38px] max-h-24 resize-none py-1.5 text-xs sm:text-sm text-white placeholder:text-white/35 font-normal tracking-wide scrollbar-hide"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleLocalSend()
              }
            }}
          />

          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 flex-shrink-0">
            {/* Botón de voz con microondas estilo Skill Tech */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleListening(!isListening)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl transition-all cursor-pointer ${
                isListening
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white animate-pulse border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                  : "bg-[hsl(161,40%,15%)]/80 hover:bg-[hsl(74,100%,47%)]/15 text-[hsl(74,100%,47%)] border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/50 hover:shadow-[0_0_15px_rgba(186,239,0,0.25)]"
              }`}
              title={isListening ? "Detener grabación de voz" : "Hablar con el micrófono"}
            >
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <Mic size={15} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
              ) : (
                <Mic size={15} />
              )}
            </Button>

            {/* Botón de envío con diseño Skill Tech (Lime Primary Button) */}
            <Button
              type="button"
              onClick={handleLocalSend}
              disabled={!input.trim() || isProcessing || charCount > MAX_CHARS}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] text-slate-950 font-black shadow-lg shadow-[hsl(74,100%,47%)]/25 hover:shadow-[0_0_20px_rgba(186,239,0,0.5)] disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center p-0 cursor-pointer"
              title="Enviar mensaje (Enter)"
            >
              {isProcessing ? (
                <Activity size={15} className="animate-spin text-slate-950" />
              ) : (
                <Send size={14} className="stroke-[2.5]" />
              )}
            </Button>
          </div>
        </div>

        {/* Barra inferior del dock: conteo y tip con diseño Skill Tech */}
        <div className="flex items-center justify-between px-1.5 pt-1.5 mt-0.5 border-t border-[hsl(153,30%,75%)]/15 text-[9px]">
          {!compact && (
            <span className="text-white/40 hidden sm:inline flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md bg-[hsl(161,40%,15%)]/80 text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/25 text-[9px] font-mono font-bold">Enter</kbd>
              <span className="mx-0.5">enviar</span>
              <span className="mx-0.5 text-white/20">·</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-[hsl(161,40%,15%)]/80 text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/25 text-[9px] font-mono font-bold">Shift+Enter</kbd>
              <span className="mx-0.5">salto</span>
            </span>
          )}
          <span
            className={`font-mono ml-auto font-semibold ${
              isNearLimit ? "text-amber-400 font-bold" : "text-[hsl(74,100%,47%)]/70"
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  )
})
ChatInput.displayName = "ChatInput"

// --- CONFIGURACIÓN DE URL ---
const API_URL = API_BASE_URL

// --- COMPONENTE PRINCIPAL ---

export interface EleonorAIChatProps {
  variant?: string
  initialMessage?: { type: string; node: string } | any
  onClose?: () => void
}

export function EleonorAIChat({ variant = "default", initialMessage, onClose }: EleonorAIChatProps = {}) {
  const { enterPresence, updateCognitiveState } = useEleonor()
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeGame, setActiveGame] = useState<any | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [viewportHeight, setViewportHeight] = useState<string>("100%")

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
      window.visualViewport.addEventListener("scroll", handleResize)
      handleResize()
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
        window.visualViewport.removeEventListener("scroll", handleResize)
      }
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem("eleonor_token")
    if (savedToken) setToken(savedToken)
  }, [])

  useEffect(() => {
    const handleExternalMessage = (e: CustomEvent) => {
      const { type, payload } = e.detail
      if (type === "analyze_node" && wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: "analyze_node", node: payload.node }))
        setIsProcessing(true)
      }
    }
    window.addEventListener("eleonor-send-message", handleExternalMessage as EventListener)
    return () => window.removeEventListener("eleonor-send-message", handleExternalMessage as EventListener)
  }, [])

  useEffect(() => {
    if (!token) return

    const wsUrl = API_URL.replace("http", "ws") + "/ws/chat"
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleIncomingWSMessage(data)
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
    }
  }, [token])

  const handleIncomingWSMessage = (data: any) => {
    switch (data.type) {
      case "text":
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + data.content },
            ]
          }
          return prev
        })
        break
      case "expression":
        window.dispatchEvent(new CustomEvent("avatar-expression", { detail: { expression: data.content } }))
        break
      case "audio":
        if (isSpeaking) {
          playAudioWithAnalysis(data.content)
        }
        break
      case "state":
        updateCognitiveState({
          valence: data.content.valence,
          tension: data.content.tension,
          engagement: data.content.engagement,
        })
        break
      case "mode":
        break
      case "game":
        setActiveGame(data.content)
        break
      case "done":
        setMessages(prev => prev.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m)))
        setIsProcessing(false)
        break
      case "error":
        setIsProcessing(false)
        break
    }
  }

  useEffect(() => {
    enterPresence("INTERVENTION")
  }, [enterPresence])

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]")
      if (viewport) {
        const behavior = messages.length > 10 ? "auto" : "smooth"
        viewport.scrollTo({ top: viewport.scrollHeight, behavior })
      }
    }
  }, [messages])

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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        sendAudioToSTT(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsListening(true)
    } catch (err) {
      setIsListening(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
    }
  }

  const sendAudioToSTT = async (blob: Blob) => {
    setIsProcessing(true)
    const formData = new FormData()
    formData.append("file", blob, "audio.webm")

    const currentHandleSend = handleSendRef.current || handleSend

    try {
      const token = localStorage.getItem("eleonor_token")
      const resp = await fetch(`${API_BASE_URL}/api/stt`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await resp.json()
      if (data.status === "ok" && data.text) {
        currentHandleSend(data.text)
      }
    } catch (err) {
      console.error("Error en STT:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudioWithAnalysis = useCallback((base64: string) => {
    const audioContent = `data:audio/mp3;base64,${base64}`
    const audio = new Audio(audioContent)

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioCtx.createMediaElementSource(audio)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyser.connect(audioCtx.destination)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const analyze = () => {
      if (audio.paused || audio.ended) {
        window.dispatchEvent(new CustomEvent("avatar-speaking", { detail: { volume: 0 } }))
        audioCtx.close()
        return
      }

      analyser.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      const volume = average / 255

      window.dispatchEvent(
        new CustomEvent("avatar-speaking", {
          detail: {
            volume: volume * 5.0,
            bass: dataArray[1] / 255,
            mid: dataArray[10] / 255,
            high: dataArray[20] / 255,
          },
        })
      )

      requestAnimationFrame(analyze)
    }

    audio.play().then(() => {
      analyze()
    })
  }, [])

  const handleSend = React.useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing || !wsRef.current) return

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      }

      setMessages(prev => [...prev, userMsg, assistantMsg])
      setIsProcessing(true)

      wsRef.current.send(JSON.stringify({ text }))
    },
    [isProcessing]
  )

  const handleSendRef = useRef(handleSend)
  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  const handleExplainErrors = React.useCallback(() => {
    if (isProcessing || !wsRef.current) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Explícame los errores de mi último examen de manera constructiva y empática.",
      timestamp: new Date(),
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsProcessing(true)

    wsRef.current.send(
      JSON.stringify({
        type: "explain_errors",
      })
    )
  }, [isProcessing])

  const triggerDebugGame = async () => {
    setIsProcessing(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/diagnosis/debug-game`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const game = await resp.json()
      if (game && !game.error) {
        setActiveGame(game)
      }
    } catch (err) {
      console.error("Error triggering debug game:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const [isDesktopMinimized, setIsDesktopMinimized] = useState(false)
  const [mobileViewMode, setMobileViewMode] = useState<"compact" | "expanded" | "dock">("compact")

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.dispatchEvent(new CustomEvent("stop-eleonor-audio"))
      window.dispatchEvent(new CustomEvent("avatar-speaking", { detail: { volume: 0 } }))
    }
    setIsSpeaking(!isSpeaking)
  }

  return (
    <div
      className="h-full w-full relative overflow-hidden pointer-events-none select-none"
      style={{ height: viewportHeight }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          💻 1. MODO ESCRITORIO / PC (PANEL LATERAL FLOTANTE A LA DERECHA)
          El modelo Tororo queda 100% visible y libre en el escenario principal.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isDesktopMinimized ? (
        /* Botón flotante para reabrir el chat cuando está minimizado en PC */
        <div className="hidden md:flex fixed bottom-6 right-6 z-[80] pointer-events-auto">
          <button
            onClick={() => setIsDesktopMinimized(false)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[hsl(161,67%,9%)]/95 hover:bg-[hsl(161,40%,15%)] border border-[hsl(74,100%,47%)]/40 text-[hsl(74,100%,47%)] backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="relative">
              <Bot size={18} className="text-[hsl(74,100%,47%)] group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(74,100%,47%)] animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-wide">Abrir Chat</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[hsl(74,100%,47%)]/20 text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/40 text-[10px] font-mono font-bold">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      ) : (
        /* Panel completo de chat lateral en PC */
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="hidden md:flex fixed top-4 bottom-4 right-4 lg:top-6 lg:bottom-6 lg:right-6 w-[400px] lg:w-[440px] z-[80] pointer-events-auto flex-col rounded-3xl bg-[hsl(161,67%,9%)]/90 backdrop-blur-3xl border border-[hsl(153,30%,75%)]/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden"
        >
          {/* Header del Panel Lateral */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(153,30%,75%)]/15 bg-[hsl(161,40%,15%)]/40">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(74,100%,47%)] animate-pulse shadow-[0_0_12px_rgba(186,239,0,0.9)]" />
                <div className="absolute -inset-1 rounded-full bg-[hsl(74,100%,47%)]/25 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white tracking-wide uppercase">Tororo IA</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[hsl(74,100%,47%)]/15 text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/30 font-bold">
                    En Línea
                  </span>
                </div>
                <p className="text-[10px] text-[hsl(150,15%,85%)]/50 font-medium">Tutor Virtual UCSM</p>
              </div>
            </div>

            {/* Acciones de Cabecera */}
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-[hsl(74,100%,47%)]/15 border-[hsl(74,100%,47%)]/40 text-[hsl(74,100%,47%)] shadow-[0_0_10px_rgba(186,239,0,0.2)]"
                    : "bg-[hsl(161,40%,15%)]/60 border-[hsl(153,30%,75%)]/20 text-white/50 hover:text-white"
                }`}
                onClick={toggleSpeaking}
                title={isSpeaking ? "Silenciar voz de Tororo" : "Activar voz de Tororo"}
              >
                {isSpeaking ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/60 hover:bg-[hsl(74,100%,47%)]/15 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/40 text-white/70 hover:text-[hsl(74,100%,47%)] transition-all cursor-pointer"
                onClick={triggerDebugGame}
                title="Minijuego cognitivo"
              >
                <Gamepad2 size={13} />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/60 hover:bg-[hsl(74,100%,47%)]/15 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/40 text-white/70 hover:text-[hsl(74,100%,47%)] transition-all cursor-pointer"
                onClick={() => setMessages([])}
                title="Limpiar pantalla"
              >
                <RotateCcw size={12} />
              </Button>

              <EleonorHistory messages={messages} />

              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/60 hover:bg-[hsl(74,100%,47%)]/15 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/40 text-white/70 hover:text-[hsl(74,100%,47%)] transition-all cursor-pointer"
                onClick={() => setIsDesktopMinimized(true)}
                title="Minimizar panel a la derecha"
              >
                <ChevronRight size={14} />
              </Button>

              {onClose && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 transition-all ml-0.5 cursor-pointer"
                  onClick={onClose}
                  title="Cerrar chat"
                >
                  <X size={13} />
                </Button>
              )}
            </div>
          </div>

          {/* Feed de Mensajes en PC */}
          <div className="flex-1 min-h-0 relative p-3">
            <ScrollArea className="h-full w-full pr-2 custom-scrollbar" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-white/40">
                  <div className="w-11 h-11 rounded-2xl bg-[hsl(161,40%,15%)]/70 border border-[hsl(74,100%,47%)]/30 flex items-center justify-center mb-3 text-[hsl(74,100%,47%)] shadow-[0_0_20px_rgba(186,239,0,0.18)]">
                    <Sparkles size={18} />
                  </div>
                  <p className="text-xs font-bold text-white mb-1 tracking-wide">Conversación Lista</p>
                  <p className="text-[11px] text-[hsl(150,15%,85%)]/60 max-w-[210px] leading-relaxed">
                    Escribe tu consulta o usa el micrófono para conversar con Tororo sin interrupciones.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col justify-end min-h-full py-1 space-y-1">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input Dock al Pie del Panel en PC con diseño Skill Tech */}
          <div className="p-3 bg-[hsl(161,67%,9%)]/90 border-t border-[hsl(153,30%,75%)]/15">
            <ChatInput
              onSend={handleSend}
              isListening={isListening}
              isProcessing={isProcessing}
              onToggleListening={(val) => {
                if (val) startRecording()
                else stopRecording()
              }}
              placeholder="Escribe a Tororo..."
              compact={false}
            />
          </div>
        </motion.div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          📱 2. MODO MÓVIL (DRAWER INFERIOR INTELIGENTE QUE NO TAPA AL MODELO)
          El rostro, ojos y bufanda de Tororo quedan en el 58% superior de la pantalla.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex md:hidden fixed inset-0 pointer-events-none z-[70] flex-col justify-between p-3">
        {/* HUD Superior Móvil */}
        <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[hsl(161,67%,9%)]/90 border border-[hsl(153,30%,75%)]/20 backdrop-blur-2xl shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 min-w-0">
            {/* Botón Integrado de Menú Lateral para Móvil */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
              className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/90 hover:bg-[hsl(74,100%,47%)]/20 border border-[hsl(153,30%,75%)]/25 hover:border-[hsl(74,100%,47%)]/50 text-[hsl(74,100%,47%)] flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95"
              title="Abrir menú de navegación"
            >
              <Menu size={14} />
            </button>
            <div className="w-2 h-2 rounded-full bg-[hsl(74,100%,47%)] animate-pulse shadow-[0_0_8px_rgba(186,239,0,0.8)] flex-shrink-0" />
            <span className="text-xs font-black text-white uppercase tracking-wider truncate">Tororo IA</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[hsl(74,100%,47%)]/15 text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/30 font-bold flex-shrink-0">
              En Línea
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={`w-7 h-7 rounded-xl border transition-all cursor-pointer ${
                isSpeaking
                  ? "bg-[hsl(74,100%,47%)]/15 border-[hsl(74,100%,47%)]/40 text-[hsl(74,100%,47%)] shadow-[0_0_10px_rgba(186,239,0,0.2)]"
                  : "bg-[hsl(161,40%,15%)]/60 border-[hsl(153,30%,75%)]/20 text-white/50"
              }`}
              onClick={toggleSpeaking}
            >
              {isSpeaking ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/60 hover:bg-[hsl(74,100%,47%)]/15 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/40 text-white/60 hover:text-[hsl(74,100%,47%)] cursor-pointer"
              onClick={triggerDebugGame}
            >
              <Gamepad2 size={13} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 rounded-xl bg-[hsl(161,40%,15%)]/60 hover:bg-[hsl(74,100%,47%)]/15 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/40 text-white/60 hover:text-[hsl(74,100%,47%)] cursor-pointer"
              onClick={() => setMessages([])}
            >
              <RotateCcw size={12} />
            </Button>

            <EleonorHistory messages={messages} />

            {onClose && (
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 cursor-pointer"
                onClick={onClose}
              >
                <X size={13} />
              </Button>
            )}
          </div>
        </div>

        {/* Zona Inferior Móvil: */}
        {messages.length === 0 ? (
          /* Estado sin mensajes: Únicamente la barra de input flotante abajo, Tororo 100% visible */
          <div className="w-full pointer-events-auto mb-1">
            <ChatInput
              onSend={handleSend}
              isListening={isListening}
              isProcessing={isProcessing}
              onToggleListening={(val) => {
                if (val) startRecording()
                else stopRecording()
              }}
              placeholder="Pregúntale a Tororo..."
              compact={true}
            />
          </div>
        ) : (
          /* Con mensajes: Drawer Inteligente que mantiene a Tororo visible arriba */
          <div
            className={`w-full pointer-events-auto transition-all duration-300 flex flex-col rounded-t-3xl bg-[hsl(161,67%,9%)]/95 backdrop-blur-3xl border-t border-[hsl(153,30%,75%)]/20 shadow-[0_-15px_40px_rgba(0,0,0,0.85)] ${
              mobileViewMode === "expanded"
                ? "h-[80vh]"
                : mobileViewMode === "compact"
                ? "h-[42vh]"
                : "h-auto"
            }`}
          >
            {/* Cabecera del Drawer con Controles de Vista */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(153,30%,75%)]/15 bg-[hsl(161,40%,15%)]/60 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(74,100%,47%)]" />
                <span className="text-[11px] font-bold text-white/90">Conversación ({messages.length})</span>
              </div>

              <div className="flex items-center gap-1.5">
                {mobileViewMode !== "dock" && (
                  <button
                    onClick={() => setMobileViewMode(mobileViewMode === "expanded" ? "compact" : "expanded")}
                    className="px-2 py-1 rounded-lg bg-[hsl(161,40%,15%)]/80 border border-[hsl(153,30%,75%)]/20 text-white/70 hover:text-[hsl(74,100%,47%)] hover:border-[hsl(74,100%,47%)]/40 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {mobileViewMode === "expanded" ? (
                      <>
                        <Minimize2 size={11} />
                        <span>Compacto</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={11} />
                        <span>Expandir</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setMobileViewMode(mobileViewMode === "dock" ? "compact" : "dock")}
                  className="p-1 rounded-lg bg-[hsl(161,40%,15%)]/80 border border-[hsl(153,30%,75%)]/20 text-white/70 hover:text-[hsl(74,100%,47%)] hover:border-[hsl(74,100%,47%)]/40 cursor-pointer transition-colors"
                  title={mobileViewMode === "dock" ? "Ver mensajes" : "Ocultar a barra"}
                >
                  {mobileViewMode === "dock" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>

            {/* Feed de Mensajes en Móvil (visible en compacto o expandido) */}
            {mobileViewMode !== "dock" && (
              <div className="flex-1 min-h-0 p-3 overflow-hidden">
                <ScrollArea className="h-full w-full pr-1.5 custom-scrollbar" ref={scrollRef}>
                  <div className="flex flex-col justify-end min-h-full py-1 space-y-1">
                    <AnimatePresence initial={false}>
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Input Dock al Pie del Drawer en Móvil con estilo Skill Tech */}
            <div className="p-2.5 bg-[hsl(161,67%,9%)]/95 border-t border-[hsl(153,30%,75%)]/15">
              <ChatInput
                onSend={(txt) => {
                  handleSend(txt)
                  if (mobileViewMode === "dock") setMobileViewMode("compact")
                }}
                isListening={isListening}
                isProcessing={isProcessing}
                onToggleListening={(val) => {
                  if (val) startRecording()
                  else stopRecording()
                }}
                placeholder="Pregúntale a Tororo..."
                compact={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mini-Game Overlay */}
      {activeGame && (
        <MiniGameOverlay
          gameData={activeGame}
          onComplete={async (results) => {
            console.log("📊 Reporting game results:", results)
            try {
              await fetch(`${API_BASE_URL}/api/diagnosis/game-result`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(results),
              })
            } catch (err) {
              console.error("Error reporting game results:", err)
            }
          }}
          onClose={() => setActiveGame(null)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(186,239,0,0.25); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(186,239,0,0.6); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}