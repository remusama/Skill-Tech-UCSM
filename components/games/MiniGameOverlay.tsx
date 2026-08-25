"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Trophy, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SwappedColorGame } from "./logic-games/SwappedColorGame"

interface MiniGameOverlayProps {
    gameData: any
    onComplete: (results: any) => void
    onClose: () => void
}

export function MiniGameOverlay({ gameData, onComplete, onClose }: MiniGameOverlayProps) {
    const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro")
    const [startTime, setStartTime] = useState<number>(0)
    const [results, setResults] = useState<any>(null)

    useEffect(() => {
        if (gameState === "playing") {
            setStartTime(Date.now())
        }
    }, [gameState])

    const handleFinish = (gameResults: any) => {
        const duration = Date.now() - startTime
        const finalData = {
            game_id: gameData?.game_id || "fallback_game",
            game_type: gameData?.type || "unknown",
            reaction_time_ms: duration / (gameResults.actions || 1),
            rule_adaptation_delay: gameResults.adaptation_delay || 0,
            accuracy: gameResults.accuracy || 0,
            frustration_level: gameResults.frustration || 0,
            abandoned: false
        }
        setResults(finalData)
        setGameState("result")
        onComplete(finalData)
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-lg overflow-hidden border bg-black/40 border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#B500D1]/20 border border-[#B500D1]/30">
                                <Trophy size={18} className="text-[#B500D1]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-widest text-white uppercase">{gameData?.title || "Sincronización Cognitiva"}</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">Desafío de Eleonor</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/20 hover:text-white">
                            <X size={20} />
                        </Button>
                    </div>

                    <div className="p-8">
                        {gameState === "intro" && (
                            <div className="space-y-6 text-center">
                                <p className="text-sm leading-relaxed text-white/70 uppercase tracking-widest font-medium">
                                    {gameData?.rules?.initial || "Prepárate para el desafío mental de Eleonor."}
                                </p>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-[#B500D1] font-bold uppercase tracking-[0.2em] mb-2">Advertencia</p>
                                    <p className="text-[10px] text-white/30 uppercase leading-normal">
                                        Eleonor observará tu tiempo de reacción y precisión. Mantén el foco.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setGameState("playing")}
                                    className="w-full h-12 rounded-xl bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest shadow-lg shadow-[#B500D1]/20"
                                >
                                    Iniciar Sincronización
                                </Button>
                            </div>
                        )}

                        {gameState === "playing" && (
                            <div className="min-h-[350px] flex items-center justify-center">
                                {(gameData?.type === "swapped_logic" || gameData?.type === "pattern_break") ? (
                                    <SwappedColorGame
                                        items={gameData?.items || []}
                                        rules={gameData?.rules || {}}
                                        onFinish={handleFinish}
                                    />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <AlertTriangle size={40} className="mx-auto text-yellow-500" />
                                        <p className="text-sm text-white/60">Este tipo de desafío ({gameData?.type || "desconocido"}) está encriptado todavía.</p>
                                        <Button onClick={() => handleFinish({ accuracy: 1, actions: 1, adaptation_delay: 0 })}>
                                            Omitir Desafío
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {gameState === "result" && (
                            <div className="space-y-6 text-center">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 rounded-full blur-2xl animate-pulse bg-cyan-500/20" />
                                    <div className="relative flex flex-col items-center justify-center w-32 h-32 border-4 rounded-full border-cyan-500/30">
                                        <span className="text-2xl font-black text-white">{Math.round(results.accuracy * 100)}%</span>
                                        <span className="text-[8px] text-white/40 font-bold uppercase">Precisión</span>
                                    </div>
                                </div>
                                <p className="text-xs text-white/60 uppercase tracking-widest">
                                    Datos enviados a Eleonor. Ella analizará tu rendimiento cognitivo.
                                </p>
                                <Button
                                    onClick={onClose}
                                    className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest border border-white/10"
                                >
                                    Volver al Enlace
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
