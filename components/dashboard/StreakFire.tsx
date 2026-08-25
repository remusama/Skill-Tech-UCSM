"use client"

import React from "react"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakFireProps {
    count: number
    className?: string
}

export const StreakFire: React.FC<StreakFireProps> = ({ count, className }) => {
    if (count <= 0) return null

    // Intensidad basada en la racha
    const intensity = Math.min(count / 10, 1) // Cap at 1.0 (10 days)

    return (
        <div className={cn("relative flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-orange-500/30 backdrop-blur-xl group overflow-hidden", className)}>
            {/* Aura Animada */}
            <motion.div
                animate={{
                    opacity: [0.1, 0.3 * intensity, 0.1],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-t from-orange-600/20 via-yellow-500/10 to-transparent"
            />

            <div className="relative flex items-center gap-2">
                <motion.div
                    animate={{
                        rotate: [-5, 5, -5],
                        scale: [1, 1.1, 1],
                        filter: [
                            `drop-shadow(0 0 5px rgba(249, 115, 22, ${0.4 + 0.6 * intensity}))`,
                            `drop-shadow(0 0 15px rgba(249, 115, 22, ${0.4 + 0.6 * intensity}))`,
                            `drop-shadow(0 0 5px rgba(249, 115, 22, ${0.4 + 0.6 * intensity}))`
                        ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                </motion.div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/70 leading-none">Racha Actual</span>
                    <span className="text-xl font-black text-white leading-none tabular-nums">
                        {count} <span className="text-[10px] font-medium text-white/40 italic">DÍAS</span>
                    </span>
                </div>
            </div>

            {/* Partículas de Fuego */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0, x: Math.random() * 40 - 20 }}
                    animate={{
                        y: [-10, -30],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.4
                    }}
                    className="absolute bottom-0 w-1 h-1 bg-orange-400 rounded-full blur-[1px]"
                />
            ))}
        </div>
    )
}
