"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Volume2,
  VolumeX,
  X,
  Heart,
  Sparkles,
  Gamepad2,
  MessageCircle,
  HelpCircle,
  Trophy,
  ArrowRight,
  Shield,
  Award,
  Zap,
  CheckCircle2,
  Coins
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface MundoMoyaModalProps {
  isOpen: boolean
  onClose: () => void
  userHouse?: string
  userName?: string
  userBalance?: number
  onRewardClaimed?: () => void
}

type MoyaMenuOption = "talk" | "play" | "missions" | "meme"

export function MundoMoyaModal({
  isOpen,
  onClose,
  userHouse = "APEX",
  userName = "Líder",
  userBalance = 8,
  onRewardClaimed
}: MundoMoyaModalProps) {
  const [selectedOption, setSelectedOption] = useState<MoyaMenuOption>("talk")
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0)
  const [typewriterText, setTypewriterText] = useState("")
  const [showMemeAnimation, setShowMemeAnimation] = useState(false)
  const [missions, setMissions] = useState<any[]>([])
  const [loadingMissions, setLoadingMissions] = useState(false)
  const [toastNotice, setToastNotice] = useState<string | null>(null)

  // ESTADOS DEL MINIJUEGO DE AGILIDAD Y DECISIONES (45 SEGUNDOS)
  const [gameActive, setGameActive] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameTimeLeft, setGameTimeLeft] = useState(45)
  const [heartX, setHeartX] = useState(50) // Porcentaje 10-90%
  const [itemsOnScreen, setItemsOnScreen] = useState<Array<{ id: number; x: number; y: number; type: "good" | "bad"; label: string }>>([])
  const nextItemIdRef = useRef(1)

  // AUDIO SINTETIZADOR 8-BIT NATIVO (WEB AUDIO API)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playBeep = (freq = 440, type: OscillatorType = "square", duration = 0.08) => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // Ignorar fallback silencioso
    }
  }

  // DIÁLOGOS DE HISTORIA Y LIDERAZGO DE MOYA
  const MOYA_DIALOGUES = [
    `* ¡hOI! Soy Moya... el felino estratega de UCSM. Bienvenido a mi cuartel general.`,
    `* Empecé liderando un pequeño puesto en una caja de cartón... ¡pero con disciplina financiera y trabajo en equipo hoy asesoramos a las 4 Casas!`,
    `* Recuerda: En la Casa ${userHouse}, un líder no acapara MYL; coordina con sus 12 integrantes para que nadie se quede atrás.`,
    `* Pista de mercado: Quien ahorre insumos en la Hoja de Pedido desbloquea la hazaña 'Ingeniería Austera'. ¡Cuidado con el derroche!`,
    `* Si intercambias con otra Casa, Solana retiene una pequeña cuota quemada. ¡El trueque justo entre pares es el secreto del éxito!`,
    `* ¿Sabías que si alcanzas 3 puntos de Casa hoy, ya habrás dado el 100% de mérito a tu equipo? ¡Apoya a tus compañeros a sumar los suyos!`
  ]

  // CARGAR MISIONES DESDE EL BACKEND
  useEffect(() => {
    if (!isOpen) return
    const fetchMissions = async () => {
      setLoadingMissions(true)
      const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
      try {
        const res = await fetch(`${API_BASE_URL}/api/myl/moya/missions`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })
        if (res.ok) {
          setMissions(await res.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingMissions(false)
      }
    }
    fetchMissions()
  }, [isOpen])

  // EFECTO MÁQUINA DE ESCRIBIR PARA DIÁLOGO
  useEffect(() => {
    if (!isOpen || selectedOption !== "talk") return
    const fullText = MOYA_DIALOGUES[activeDialogueIndex] || MOYA_DIALOGUES[0]
    let currentIdx = 0
    setTypewriterText("")

    const interval = setInterval(() => {
      if (currentIdx < fullText.length) {
        setTypewriterText(fullText.slice(0, currentIdx + 1))
        if (currentIdx % 3 === 0) playBeep(280 + (currentIdx % 4) * 40, "square", 0.03)
        currentIdx++
      } else {
        clearInterval(interval)
      }
    }, 28)

    return () => clearInterval(interval)
  }, [isOpen, activeDialogueIndex, selectedOption])

  // LÓGICA DEL MINIJUEGO RETRO (45s)
  useEffect(() => {
    if (!gameActive) return

    const timer = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false)
          playBeep(587, "sine", 0.3)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Generar ítems cayendo (conceptos buenos vs malas prácticas)
    const spawnTimer = setInterval(() => {
      const isGood = Math.random() > 0.4
      const labelsGood = ["+Inversión", "+Cohesión", "+Bono", "+Ahorro", "+Sinergia"]
      const labelsBad = ["-Desvío 30%", "-Acaparar", "-Polizón", "-Gasto Inútil"]
      const label = isGood ? labelsGood[Math.floor(Math.random() * labelsGood.length)] : labelsBad[Math.floor(Math.random() * labelsBad.length)]

      setItemsOnScreen(prev => [
        ...prev,
        {
          id: nextItemIdRef.current++,
          x: Math.floor(Math.random() * 80) + 10,
          y: 0,
          type: isGood ? "good" : "bad",
          label
        }
      ])
    }, 900)

    // Loop de animación y colisión
    const animLoop = setInterval(() => {
      setItemsOnScreen(prev => {
        const nextItems: typeof prev = []
        for (const item of prev) {
          const newY = item.y + 3.5
          // Verificar colisión con corazón (y entre 80 y 95, x cerca de heartX)
          if (newY >= 82 && newY <= 94 && Math.abs(item.x - heartX) < 14) {
            if (item.type === "good") {
              setGameScore(s => s + 10)
              playBeep(659, "triangle", 0.08)
            } else {
              setGameScore(s => Math.max(0, s - 10))
              playBeep(180, "sawtooth", 0.12)
            }
          } else if (newY < 100) {
            nextItems.push({ ...item, y: newY })
          }
        }
        return nextItems
      })
    }, 50)

    return () => {
      clearInterval(timer)
      clearInterval(spawnTimer)
      clearInterval(animLoop)
    }
  }, [gameActive, heartX])

  const handleStartGame = () => {
    setGameScore(0)
    setGameTimeLeft(45)
    setItemsOnScreen([])
    setGameActive(true)
    playBeep(523, "square", 0.1)
  }

  const handleClaimMission = async (missionId: string) => {
    const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/api/myl/moya/claim-mission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ mission_id: missionId })
      })
      const data = await res.json()
      if (res.ok) {
        setToastNotice(data.message)
        playBeep(784, "triangle", 0.2)
        if (onRewardClaimed) onRewardClaimed()
        // Refrescar misiones
        const refreshed = await fetch(`${API_BASE_URL}/api/myl/moya/missions`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })
        if (refreshed.ok) setMissions(await refreshed.json())
      } else {
        setToastNotice(data.detail || "No se pudo reclamar la misión.")
      }
    } catch {
      setToastNotice("Error al conectar con la red.")
    } finally {
      setTimeout(() => setToastNotice(null), 3500)
    }
  }

  const triggerMemeEasterEgg = () => {
    setShowMemeAnimation(true)
    playBeep(392, "square", 0.08)
    setTimeout(() => playBeep(523, "square", 0.1), 100)
    setTimeout(() => playBeep(659, "square", 0.15), 200)
    setTimeout(() => setShowMemeAnimation(false), 3000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="relative w-full max-w-4xl bg-[#0d130e] border-4 border-[#34d399] rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col font-mono text-white max-h-[92vh]"
        >
          {/* BARRA SUPERIOR RETRO CON CONTROLES */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#08100a] border-b-2 border-[#10b981]/40 select-none">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-black tracking-widest uppercase text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                MUNDO MOYA RPG · SHOP & MINIJUEGOS
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(v => !v)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                  soundEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/5 text-gray-500 border-white/10"
                }`}
                title="Sonido ON/OFF"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={triggerMemeEasterEgg}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all"
              >
                MEME "PLZ"
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all ml-1"
                title="Cerrar Mundo Moya"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BANNER NOTIFICACIÓN TOAST */}
          {toastNotice && (
            <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs text-center font-bold animate-pulse">
              {toastNotice}
            </div>
          )}

          {/* ESCENARIO RETRO PIXEL-ART PRINCIPAL */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {/* ESCAPARATE DE MOYA (ARTE PIXEL-ART Y TIENDA) */}
            <div className="relative bg-[#050a06] border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
              {/* Arte Pixel-Art de Moya */}
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-black border-2 border-emerald-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] p-2">
                  {/* Avatar Pixel-Art estilizado de Moya */}
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <Sparkles className="w-12 h-12 text-[hsl(74,100%,47%)] animate-bounce" style={{ animationDuration: "2.4s" }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-2">
                      MOYA · LÍDER
                    </span>
                    <span className="text-[9px] text-gray-400">Puesto Nivel 3</span>
                  </div>
                </div>

                {/* Badges de Estado */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    Casa {userHouse}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    {userBalance} MYL
                  </span>
                </div>
              </div>

              {/* CUADRO DE DIÁLOGO NEGRO (ESTILO RETRO RPG / UNDERTALE) */}
              <div className="flex-1 w-full bg-black border-2 border-white rounded-2xl p-4 shadow-inner min-h-[140px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/20 pb-1.5 mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                      * MOYA SHOP & ADVICE
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Capítulo {activeDialogueIndex + 1} de {MOYA_DIALOGUES.length}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-100 leading-relaxed min-h-[50px]">
                    {typewriterText}
                    <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
                  </p>
                </div>

                {/* Controles de avance de diálogo */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      playBeep(400, "square", 0.05)
                      setActiveDialogueIndex(prev => (prev > 0 ? prev - 1 : MOYA_DIALOGUES.length - 1))
                    }}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 font-bold transition-all"
                  >
                    ◄ Anterior
                  </button>
                  <button
                    onClick={() => {
                      playBeep(520, "square", 0.05)
                      setActiveDialogueIndex(prev => (prev + 1) % MOYA_DIALOGUES.length)
                    }}
                    className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black tracking-wider transition-all flex items-center gap-1"
                  >
                    Siguiente ►
                  </button>
                </div>
              </div>
            </div>

            {/* SELECTOR DE OPCIONES DEL MENÚ RPG (CON CORAZÓN ROJO) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: "talk", label: "Hablar (Historia)", icon: MessageCircle },
                { key: "play", label: "Jugar (Minijuego)", icon: Gamepad2 },
                { key: "missions", label: "Misiones Ocultas", icon: HelpCircle },
                { key: "meme", label: "Easter-Egg 'PLZ'", icon: Sparkles }
              ].map(opt => {
                const isActive = selectedOption === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedOption(opt.key as MoyaMenuOption)
                      playBeep(isActive ? 600 : 480, "square", 0.05)
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse flex-shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {/* SECCIÓN DINÁMICA SEGÚN OPCIÓN ELEGIDA */}
            {selectedOption === "play" && (
              <div className="bg-black border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-emerald-400" />
                      Minijuego: El Escape de las Malas Prácticas
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Mueve el corazón con los botones para atrapar Inversiones (+10 pts) y esquivar Multas (-10 pts).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl font-black">
                      Puntos: {gameScore}
                    </span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl font-black">
                      Tiempo: {gameTimeLeft}s
                    </span>
                  </div>
                </div>

                {/* ÁREA DE JUEGO RETRO */}
                <div className="relative w-full h-56 sm:h-64 bg-[#060c07] border-2 border-emerald-500/30 rounded-xl overflow-hidden select-none">
                  {!gameActive ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/70">
                      <p className="text-xs text-gray-300 mb-3 max-w-sm">
                        {gameTimeLeft === 0
                          ? `¡Tiempo cumplido! Tu puntaje final fue de ${gameScore} puntos.`
                          : "Compite durante 45 segundos para ejercitar tu rapidez y toma de decisiones éticas."}
                      </p>
                      <button
                        onClick={handleStartGame}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
                      >
                        {gameTimeLeft === 0 ? "Jugar de Nuevo" : "Iniciar Minijuego (45s)"}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Ítems cayendo */}
                      {itemsOnScreen.map(item => (
                        <div
                          key={item.id}
                          className={`absolute px-2 py-0.5 rounded text-[10px] font-black border pointer-events-none transform -translate-x-1/2 ${
                            item.type === "good"
                              ? "bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                              : "bg-red-500/30 text-red-300 border-red-400"
                          }`}
                          style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        >
                          {item.label}
                        </div>
                      ))}

                      {/* Corazón del jugador en la parte inferior */}
                      <div
                        className="absolute bottom-3 transform -translate-x-1/2 transition-all duration-75 flex flex-col items-center"
                        style={{ left: `${heartX}%` }}
                      >
                        <Heart className="w-7 h-7 text-red-500 fill-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-[9px] font-bold text-gray-400 mt-0.5">TÚ</span>
                      </div>
                    </>
                  )}
                </div>

                {/* CONTROLES TÁCTILES / TECLADO */}
                {gameActive && (
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      onClick={() => setHeartX(prev => Math.max(15, prev - 12))}
                      className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-black text-sm border border-white/20"
                    >
                      ◄ MOVER IZQUIERDA
                    </button>
                    <button
                      onClick={() => setHeartX(prev => Math.min(85, prev + 12))}
                      className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-black text-sm border border-white/20"
                    >
                      MOVER DERECHA ►
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedOption === "missions" && (
              <div className="bg-black border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                      Tablón de Misiones Ocultas (Easter-Eggs)
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Descubre y resuelve los acertijos de la sesión para ganar insignias y +1 o +2 MYL (dentro del cupo oficial de mérito).
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Bolsa de Mérito
                  </span>
                </div>

                {loadingMissions ? (
                  <div className="py-10 text-center text-xs text-gray-400">Cargando misiones...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {missions.map(m => (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                          m.completed
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                            : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                              {m.category || "Misión"}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              +{m.reward_myl} MYL
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white">{m.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{m.hint}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                            <Award className="w-3 h-3 text-amber-400" />
                            {m.badge}
                          </span>

                          {m.completed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Reclamado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleClaimMission(m.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                            >
                              Descubrir
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedOption === "meme" && (
              <div className="bg-black border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-4">
                <Sparkles className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-base font-black uppercase text-amber-300 tracking-wider">
                  ¡EASTER-EGG NO INFLACIONARIO!
                </h3>
                <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                  "plz give muns for colash!" — Moya agradece tu curiosidad pero recuerda: los MYL no se crean de la nada para evitar la inflación en Solana.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                  <Sparkles className="w-4 h-4" /> Logro Desbloqueado: Amigo Curioso de Moya
                </div>
              </div>
            )}

            {/* BOTÓN SALIR INFERIOR */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-black text-xs uppercase tracking-wider transition-all border border-white/10"
              >
                ◄ Salir al Dashboard Transaccional
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
