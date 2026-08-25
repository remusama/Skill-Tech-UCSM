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
  ChevronRight,
  Info,
  History,
  Gamepad2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MagicCard } from "@/components/ui/magic-card"
import { BlurFade } from "@/components/ui/blur-fade"
import { Separator } from "@/components/ui/separator"
import { EleonorHistory } from "./EleonorHistory"
import { usePerformance } from "@/hooks/use-performance"
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

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-8`}
    >
      <div className={`flex gap-4 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className={`w-10 h-10 border-2 ${isUser ? "border-cyan-500/30" : "border-[#B500D1]/30"} shadow-2xl shrink-0`}>
          <AvatarImage src={isUser ? "https://i.pravatar.cc/150?u=user" : "/eleonor_avatar.png"} />
          <AvatarFallback className="bg-white/5 font-black text-[10px] italic">{isUser ? "YO" : "EL"}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <div className={`
            p-5 rounded-[2rem] 
            ${isUser ?
              "bg-cyan-500/10 border border-cyan-500/20 text-white rounded-tr-none" :
              "bg-white/[0.03] border border-white/10 text-white rounded-tl-none backdrop-blur-xl"}
            shadow-2xl relative group
          `}>
            {!isUser && (
              <div className="absolute -top-3 left-6 px-2 py-0.5 bg-[#B500D1] rounded-full text-[8px] font-black uppercase tracking-widest text-white z-10 shadow-[0_0_10px_rgba(181,0,209,0.5)]">
                Enlace Alpha
              </div>
            )}
            <p className="text-sm leading-relaxed font-medium uppercase tracking-wider">
              {message.content}
              {message.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-[#B500D1] animate-pulse align-middle" />}
            </p>
          </div>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest px-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  )
})
MessageBubble.displayName = "MessageBubble"

const MAX_CHARS = 300

const ChatInput = React.memo(({ onSend, isListening, onToggleListening, isProcessing }: {
  onSend: (val: string) => void,
  isListening: boolean,
  onToggleListening: (val: boolean) => void,
  isProcessing: boolean
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
  const isNearLimit = charCount >= MAX_CHARS * 0.8
  const isVeryNearLimit = charCount >= MAX_CHARS * 0.95

  const counterColor = isVeryNearLimit
    ? "text-red-500 font-black animate-pulse"
    : isNearLimit
      ? "text-yellow-500 font-bold"
      : "text-white/20"

  return (
    <div className="max-w-xl mx-auto relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#B500D1]/10 via-cyan-400/10 to-[#B500D1]/10 rounded-[2rem] blur-sm opacity-20" />
      <div className="relative flex flex-col p-1.5 pl-4 pr-2 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-xl focus-within:border-[#B500D1]/40 transition-all shadow-xl">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={isProcessing ? "Eleonor analizando..." : "Inyectar comando..."}
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[44px] max-h-24 resize-none py-3 text-xs text-white placeholder:text-white/20 font-medium uppercase tracking-wider scrollbar-hide"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleLocalSend()
              }
            }}
          />
          <div className="flex items-center gap-1.5 mb-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleListening(!isListening)}
              className={`w-9 h-9 rounded-full transition-all ${isListening ? "bg-red-500/80 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
            >
              {isListening ? (
                <div className="relative">
                  <Mic size={16} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
              ) : <MicOff size={16} />}
            </Button>

            <Button
              type="button"
              onClick={handleLocalSend}
              disabled={!input.trim() || isProcessing || charCount > MAX_CHARS}
              className="w-9 h-9 rounded-full bg-[#B500D1] hover:bg-[#B500D1]/80 text-white shadow-xl disabled:opacity-30 transition-all"
            >
              {isProcessing ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </div>
        
        {/* Contador de caracteres */}
        <div className="flex justify-end px-4 pb-1">
          <span className={`text-[8px] font-mono tracking-widest transition-colors ${counterColor}`}>
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
  variant?: string;
  initialMessage?: { type: string; node: string } | any;
  onClose?: () => void;
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

  // Manejar el redimensionamiento del teclado en móviles usando VisualViewport
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

  // Recuperar token del localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("eleonor_token")
    if (savedToken) setToken(savedToken)
  }, [])

  // Listen for external commands (e.g. from Graph)
  useEffect(() => {
    const handleExternalMessage = (e: CustomEvent) => {
      const { type, payload } = e.detail;
      if (type === 'analyze_node' && wsRef.current) {
        // Send special command frame
        console.log("📡 Relaying external command to WS:", payload);
        wsRef.current.send(JSON.stringify({ type: 'analyze_node', node: payload.node }));
        setIsProcessing(true);
      }
    }
    window.addEventListener('eleonor-send-message', handleExternalMessage as EventListener);
    return () => window.removeEventListener('eleonor-send-message', handleExternalMessage as EventListener);
  }, [wsRef.current])

  // Inicializar WebSocket
  useEffect(() => {
    if (!token) return

    const wsUrl = API_URL.replace("http", "ws") + "/ws/chat"
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WS Connected")
      // Enviar autenticación inmediatamente
      ws.send(JSON.stringify({ token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleIncomingWSMessage(data)
    }

    ws.onclose = () => {
      console.log("WS Disconnected")
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
              { ...lastMsg, content: lastMsg.content + data.content }
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
          engagement: data.content.engagement
        })
        break
      case "mode":
        // Opcional: Podrías actualizar el badge o HUD con el modo actual
        break
      case "game":
        console.log("🎮 Game event received:", data.content);
        setActiveGame(data.content);
        break
      case "done":
        setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))
        setIsProcessing(false)
        break
      case "error":
        console.error("WS Error:", data.content)
        setIsProcessing(false)
        break
    }
  }

  useEffect(() => {
    enterPresence('INTERVENTION')
  }, [enterPresence])

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        const behavior = messages.length > 10 ? "auto" : "smooth"
        viewport.scrollTo({ top: viewport.scrollHeight, behavior })
      }
    }
  }, [messages])

  // --- LOGICA DE AUDIO (STT / MediaRecorder) ---
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
        sendAudioToSTT(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsListening(true)
    } catch (err) {
      console.error("No se pudo acceder al micrófono:", err)
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
    formData.append('file', blob, 'audio.webm')
    
    // Usar useRef para no depender del closure
    const currentHandleSend = handleSendRef.current || handleSend
    
    try {
      const token = localStorage.getItem("eleonor_token")
      const resp = await fetch(`${API_URL}/api/stt`, {
        method: 'POST',
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData
      })
      const data = await resp.json()
      if (data.status === 'ok' && data.text) {
        currentHandleSend(data.text)
      }
    } catch (err) {
      console.error("Error en STT:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  // --- ANALIZADOR DE AUDIO PARA LIP SYNC ---
  const playAudioWithAnalysis = useCallback((base64: string) => {
    const audioContent = `data:audio/mp3;base64,${base64}`
    const audio = new Audio(audioContent)

    // Configurar Web Audio API
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
        window.dispatchEvent(new CustomEvent('avatar-speaking', { detail: { volume: 0 } }))
        audioCtx.close()
        return
      }

      analyser.getByteFrequencyData(dataArray)

      // Calcular volumen promedio
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      const volume = average / 255

      // Dispatch para AvatarDisplay
      window.dispatchEvent(new CustomEvent('avatar-speaking', {
        detail: {
          volume: volume * 5.0, // Multiplicador agresivo para forzar apertura
          bass: dataArray[1] / 255,
          mid: dataArray[10] / 255,
          high: dataArray[20] / 255
        }
      }))

      requestAnimationFrame(analyze)
    }

    audio.play().then(() => {
      analyze()
    })
  }, [])

  // --- LÓGICA DE ENVÍO ---
  const handleSend = React.useCallback(async (text: string) => {
    if (!text.trim() || isProcessing || !wsRef.current) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsProcessing(true)

    // Enviar por WebSocket
    wsRef.current.send(JSON.stringify({ text }))
  }, [isProcessing])

  // Mantener ref actualizado para evitar stale closures en speech recognition
  const handleSendRef = useRef(handleSend)
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend])

  const handleExplainErrors = React.useCallback(() => {
    if (isProcessing || !wsRef.current) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Explícame los errores de mi último examen de manera constructiva y empática.",
      timestamp: new Date()
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsProcessing(true)

    // Enviar por WebSocket
    wsRef.current.send(JSON.stringify({
      type: "explain_errors"
    }))
  }, [isProcessing])

  const triggerDebugGame = async () => {
    setIsProcessing(true);
    try {
      const resp = await fetch(`${API_URL}/api/diagnosis/debug-game`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const game = await resp.json();
      if (game && !game.error) {
        setActiveGame(game);
      }
    } catch (err) {
      console.error("Error triggering debug game:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="h-full flex flex-col bg-transparent relative overflow-hidden"
      style={{ height: viewportHeight }}
    >

      {/* HUD Superior - Ultra-Top (Alineado con Menú Lateral - Desplazado para no taparse) */}
      <div className="z-[100] fixed top-2 left-0 right-0 pl-20 pr-4 lg:pl-24"> {/* PL-20 para esquivar el botón de menú */}
        <BlurFade delay={0.1}>
          <div className="flex flex-col gap-2 max-w-full mx-auto">
            <div className="flex items-center justify-between gap-4 p-2 pl-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.25em]">Eleonor v4.2</span>
                </div>
                <Separator orientation="vertical" className="h-4 bg-white/20" />
                <EleonorHistory messages={messages} />
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="w-8 h-8 rounded-lg bg-white/5 border-white/10 text-white/40 hover:text-white" onClick={() => setIsSpeaking(!isSpeaking)}>
                  {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-8 h-8 rounded-lg bg-[#B500D1]/20 border-[#B500D1]/40 text-[#B500D1] hover:bg-[#B500D1]/30 transition-all"
                  onClick={triggerDebugGame}
                  title="Debug Game"
                >
                  <Gamepad2 size={16} />
                </Button>
                <Button size="icon" variant="outline" className="w-8 h-8 rounded-lg bg-white/5 border-white/10 text-white/40 hover:text-white">
                  <RotateCcw size={16} />
                </Button>
              </div>
            </div>

          </div>
        </BlurFade>
      </div>

      {/* Area Central: Mensajes (Solo en la zona del input para no tapar cara) */}
      <div className="flex-1 flex flex-col justify-end relative z-[10] px-4 md:px-8 pb-40 md:pb-36 min-h-0">
        <div className="w-full max-w-xl mx-auto pointer-events-none flex flex-col justify-end h-full">
          <ScrollArea className="flex-1 max-h-[30vh] md:max-h-[25vh] pr-4 pointer-events-auto" ref={scrollRef}>
            <div className="flex flex-col justify-end min-h-full py-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Barra Inferior: ChatInput (Componente memoizado para evitar re-renders del chat al escribir) */}
      {/* Barra Inferior: ChatInput */}
      <div className="z-[100] absolute bottom-12 left-0 right-0 p-4 md:p-8 flex flex-col gap-4 items-center">
        {!isProcessing && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(181,0,209,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExplainErrors}
            className="px-4 py-2 rounded-full bg-black/60 border border-[#B500D1]/40 text-[#B500D1] hover:text-white hover:bg-[#B500D1]/20 backdrop-blur-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Activity size={12} className="animate-pulse text-cyan-400" />
            ¿Cuáles fueron mis errores del último examen?
          </motion.button>
        )}
        <div className="w-full">
          <ChatInput
            onSend={handleSend}
            isListening={isListening}
            isProcessing={isProcessing}
            onToggleListening={(val) => {
              if (val) startRecording()
              else stopRecording()
            }}
          />
        </div>
      </div>


      {/* Mini-Game Overlay */}
      {activeGame && (
        <MiniGameOverlay
          gameData={activeGame}
          onComplete={async (results) => {
            console.log("📊 Reporting game results:", results);
            try {
              await fetch(`${API_URL}/api/diagnosis/game-result`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(results)
              });
            } catch (err) {
              console.error("Error reporting game results:", err);
            }
          }}
          onClose={() => setActiveGame(null)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(181,0,209,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(181,0,209,0.3); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
