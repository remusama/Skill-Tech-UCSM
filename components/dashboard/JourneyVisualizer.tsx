"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { API_BASE_URL } from "@/lib/config"
import {
    Brain,
    Sparkles,
    Lock,
    CheckCircle2,
    PlayCircle,
    ArrowRight,
    AlertTriangle,
    Loader2,
    ChevronRight,
    Zap,
    Target,
    RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SessionPlayer } from "./SessionPlayer"

interface JourneySession {
    id: number
    session_number: number
    title: string
    objective: string
    type: string
    content: any
    is_completed: number
}

interface LearningJourney {
    id: number
    area: string
    objective: string
    current_session: number
    total_sessions: number
    status: string
}

interface VisualizerProps {
    areaId: string
    areaName: string
    theme: {
        color: string
        textColor: string
        badge: string
        tab: string
        via: string
    }
}

export function JourneyVisualizer({ areaId, areaName, theme }: VisualizerProps) {
    const [loading, setLoading] = useState(true)
    const [journey, setJourney] = useState<LearningJourney | null>(null)
    const [sessions, setSessions] = useState<JourneySession[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showPlayer, setShowPlayer] = useState(false)
    const [activeSession, setActiveSession] = useState<JourneySession | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("eleonor_token")
        if (!token) return

        try {
            const baseUrl = API_BASE_URL
            const resp = await fetch(`${baseUrl}/api/journey/current?area=${encodeURIComponent(areaName)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            const data = await resp.json()

            if (data.status === "success" && data.journey) {
                setJourney(data.journey)
                setSessions(data.sessions)
            } else {
                setJourney(null)
                setSessions([])
            }
        } catch (err) {
            console.error("Error fetching journey:", err)
            setError("No se pudo conectar con el servidor.")
        } finally {
            setLoading(false)
        }
    }, [areaName])

    useEffect(() => {
        fetchData()
    }, [fetchData, areaId])

    const handleGenerate = async (force = false) => {
        setIsGenerating(true)
        setError(null)
        const token = localStorage.getItem("eleonor_token")

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const resp = await fetch(`${baseUrl}/api/journey/generate?area=${encodeURIComponent(areaName)}&force=${force}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            })

            const data = await resp.json()

            if (resp.status === 400) {
                setError(data.detail)
                setIsGenerating(false)
                return
            }

            if (data.status === "success" || data.status === "exists") {
                await fetchData()
            }
        } catch (err) {
            setError("Error al generar la ruta. Inténtalo de nuevo.")
        } finally {
            setIsGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className={cn("w-10 h-10 animate-spin", theme.textColor)} />
                <p className="text-gray-400 font-mono text-[10px] tracking-[0.3em] uppercase">Sincronizando ruta {areaName}...</p>
            </div>
        )
    }

    if (!journey) {
        return (
            <Card className="bg-[#120824]/40 border-white/5 p-12 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center text-center overflow-hidden relative">
                <div className={cn("absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50", theme.via)} />

                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6 relative", theme.badge.split(' ')[1])}>
                    <div className={cn("absolute inset-0 border-2 rounded-full animate-ping opacity-20", theme.badge.split(' ')[2])} />
                    <Brain className={cn("w-10 h-10", theme.textColor)} />
                </div>

                <h2 className="text-2xl font-black italic text-white uppercase tracking-tight mb-4">
                    Sin Ruta: {areaName}
                </h2>

                <p className="text-gray-400 max-w-md text-sm leading-relaxed mb-8">
                    {error || `Detectamos que no tienes una ruta activa para ${areaName}. El sistema necesita datos de tus diagnósticos previos para construir esta experiencia.`}
                </p>

                {error && error.includes("diagnóstico") ? (
                    <div className="flex flex-col items-center gap-4">
                        <Badge variant="outline" className="text-orange-400 border-orange-400/20 bg-orange-400/5 py-1 px-4 mb-4">
                            <AlertTriangle className="w-3 h-3 mr-2" /> REQUISITO FALTANTE
                        </Badge>
                        <Button
                            onClick={() => { }}
                            className="bg-white text-black hover:bg-gray-200 font-black tracking-widest uppercase px-8 py-6 rounded-xl"
                        >
                            Realizar Diagnóstico
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => handleGenerate(false)}
                        disabled={isGenerating}
                        className={cn("text-white font-black tracking-widest uppercase px-10 py-6 rounded-xl shadow-lg transition-all hover:scale-105 bg-gradient-to-r", theme.color)}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Arquitecto Trabajando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generar Ruta de {areaName}
                            </>
                        )}
                    </Button>
                )}
            </Card>
        )
    }

    return (
        <div className="flex flex-col gap-12 py-8 relative">
            {/* Header de la Ruta */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-1.5 h-8 rounded-full shadow-lg", theme.tab)} />
                            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
                                {journey.area}
                            </h2>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerate(true)}
                            disabled={isGenerating}
                            className="bg-white/5 border-white/10 hover:border-white/20 text-white/40 hover:text-white rounded-full h-8 px-4 transition-all"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isGenerating && "animate-spin")} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {isGenerating ? "Regenerando..." : "Regenerar Ruta"}
                            </span>
                        </Button>
                    </div>
                    <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                        <span className={cn("font-bold uppercase tracking-widest text-[10px] block mb-1", theme.textColor)}>Objetivo General</span>
                        {journey.objective}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Progreso Actual</span>
                    <div className="text-5xl font-black italic text-white leading-none">
                        {Math.round(((journey.current_session - 1) / 5) * 100)}<span className={cn("text-2xl", theme.textColor)}>%</span>
                    </div>
                </div>
            </div>

            {/* Skill Tree Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative py-10 overflow-x-auto min-h-[400px]">
                {/* SVG de conexiones */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M 120 150 Q 250 150, 400 150 T 680 150"
                            stroke={`url(#grad-${areaId})`}
                            strokeWidth="2"
                            fill="none"
                            className="opacity-20 hidden md:block"
                            strokeDasharray="10 5"
                        />
                        <defs>
                            <linearGradient id={`grad-${areaId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={theme.textColor.replace('text-', '#').replace('emerald-400', '10b981').replace('blue-400', '60a5fa').replace('amber-400', 'fbbf24').replace('purple-400', 'c084fc').replace('rose-400', 'fb7185').replace('yellow-400', 'facc15').replace('cyan-400', '22d3ee').replace('indigo-400', '818cf8').replace('green-400', '4ade80')} />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {sessions.map((session, index) => {
                    const isLocked = session.session_number > journey.current_session
                    const isActive = session.session_number === journey.current_session
                    const isCompleted = session.is_completed === 1

                    return (
                        <div
                            key={session.id}
                            className="flex flex-col items-center relative z-10 group"
                        >
                            {/* Nodo Rhombus */}
                            <motion.div
                                onClick={() => {
                                    if (isActive) {
                                        setActiveSession(session)
                                        setShowPlayer(true)
                                    }
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "w-32 h-32 relative mb-6 transition-all duration-500",
                                    isActive && "scale-110 cursor-pointer hover:scale-[1.15]"
                                )}
                            >
                                {/* Rhombus Shape */}
                                <div className={cn(
                                    "absolute inset-0 rotate-45 border-2 rounded-xl transition-all duration-500 flex items-center justify-center overflow-hidden",
                                    isCompleted ? cn("bg-white/10 border-white/20", theme.textColor) :
                                        isActive ? cn("bg-black/40 shadow-2xl animate-pulse border-2", theme.textColor.replace('text-', 'border-')) :
                                            "bg-white/5 border-white/10 opacity-40"
                                )}>
                                    {/* Glow effect for active node */}
                                    {isActive && (
                                        <div className={cn("absolute inset-0 opacity-20 blur-xl", theme.tab)} />
                                    )}

                                    {/* Contenido del Nodo */}
                                    <div className="-rotate-45 flex flex-col items-center gap-1 z-10">
                                        {isCompleted ? (
                                            <CheckCircle2 className={cn("w-8 h-8", theme.textColor)} />
                                        ) : isLocked ? (
                                            <Lock className="w-8 h-8 text-gray-500" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <PlayCircle className={cn("w-10 h-10 mb-1", theme.textColor)} />
                                                <span className={cn("text-[10px] font-black", theme.textColor)}>START</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Número de Sesión con Badge flotante */}
                                <div className={cn(
                                    "absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 bg-[#0B0121] flex items-center justify-center z-20 transition-colors shadow-lg",
                                    isActive ? theme.textColor.replace('text-', 'border-') : "border-white/10 text-white/40"
                                )}>
                                    <span className={cn("text-xs font-black", isActive ? "text-white" : "")}>{session.session_number}</span>
                                </div>
                            </motion.div>

                            {/* Información de la Sesión */}
                            <div className={cn(
                                "flex flex-col items-center text-center px-4 transition-opacity",
                                isLocked ? "opacity-30" : "opacity-100"
                            )}>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2 line-clamp-2 min-h-[2em]">
                                    {session.title}
                                </h3>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] font-bold border-0 px-2 py-0.5 rounded-sm mb-4 bg-white/5",
                                    isActive ? theme.textColor : "text-gray-500"
                                )}>
                                    {session.type}
                                </Badge>

                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                        <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Dinamismo</span>
                        <p className="text-xs font-medium text-gray-200">Dificultad ajustable en tiempo real.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl">
                        <Target className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Enfoque</span>
                        <p className="text-xs font-medium text-gray-200">Exclusivo en tus debilidades técnicas.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl">
                        <ArrowRight className="w-6 h-6 text-white/40" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Continuidad</span>
                        <p className="text-xs font-medium text-gray-200">Progreso guardado automáticamente.</p>
                    </div>
                </div>
            </div>

            {/* Session Player Overlay */}
            <AnimatePresence>
                {showPlayer && activeSession && (
                    <SessionPlayer
                        session={activeSession}
                        theme={theme}
                        onClose={() => {
                            setShowPlayer(false)
                            setActiveSession(null)
                        }}
                        onComplete={async () => {
                            setShowPlayer(false)
                            setActiveSession(null)
                            await fetchData()
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
