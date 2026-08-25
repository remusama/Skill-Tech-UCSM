"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface SwappedColorGameProps {
    items: any[]
    rules: any
    onFinish: (results: any) => void
}

const COLORS = [
    { name: "ROJO", hex: "#ef4444" },
    { name: "AZUL", hex: "#3b82f6" },
    { name: "VERDE", hex: "#22c55e" },
    { name: "AMARILLO", hex: "#eab308" },
    { name: "ROSA", hex: "#ec4899" }
]

export function SwappedColorGame({ items, rules, onFinish }: SwappedColorGameProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [currentRule, setCurrentRule] = useState<"color" | "text">("color")
    const [lastRuleChangeIndex, setLastRuleChangeIndex] = useState(-1)
    const [adaptationDelays, setAdaptationDelays] = useState<number[]>([])

    const lastActionTime = useRef(Date.now())

    // Mezclar colores para el primer item o usar los de gameData si vienen
    const [currentItem, setCurrentItem] = useState(() => {
        const textObj = COLORS[Math.floor(Math.random() * COLORS.length)]
        const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)]
        return { text: textObj.name, color: colorObj.hex, correct: currentRule === "color" ? colorObj.name : textObj.name }
    })

    useEffect(() => {
        // Si llegamos a la mitad, cambiamos la regla (Stroop Effect Switch)
        if (currentIndex === 5) {
            setCurrentRule("text")
            setLastRuleChangeIndex(5)
        }

        if (currentIndex >= 10) {
            onFinish({
                accuracy: score / 10,
                actions: 10,
                adaptation_delay: adaptationDelays.length > 0 ? adaptationDelays.reduce((a, b) => a + b, 0) / adaptationDelays.length : 0
            })
        }
    }, [currentIndex])

    const handleAction = (colorName: string) => {
        const now = Date.now()
        const reactionTime = now - lastActionTime.current

        if (colorName === currentItem.correct) {
            setScore(s => s + 1)
        }

        // Si hubo un cambio de regla reciente, medir el delay
        if (currentIndex === lastRuleChangeIndex) {
            setAdaptationDelays(prev => [...prev, reactionTime])
        }

        // Siguiente item
        const textObj = COLORS[Math.floor(Math.random() * COLORS.length)]
        const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)]
        const nextRule = (currentIndex + 1) >= 5 ? "text" : "color"

        setCurrentItem({
            text: textObj.name,
            color: colorObj.hex,
            correct: nextRule === "color" ? colorObj.name : textObj.name
        })
        setCurrentIndex(i => i + 1)
        lastActionTime.current = now
    }

    return (
        <div className="flex flex-col items-center gap-12 w-full">
            <div className="text-center space-y-2">
                <Badge variant="outline" className="text-[#B500D1] border-[#B500D1]/20 px-4 py-1">
                    {currentRule === "color" ? "REGLA: CLICA EL COLOR DE LA TINTA" : "REGLA: CLICA EL SIGNIFICADO DE LA PALABRA"}
                </Badge>
                <div className="flex gap-1 justify-center">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-8 h-1 rounded-full ${i < currentIndex ? "bg-[#B500D1]" : "bg-white/10"}`} />
                    ))}
                </div>
            </div>

            <motion.div
                key={currentIndex}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black tracking-tighter"
                style={{ color: currentItem.color }}
            >
                {currentItem.text}
            </motion.div>

            <div className="grid grid-cols-2 gap-4 w-full px-4">
                {COLORS.map((c) => (
                    <Button
                        key={c.name}
                        onClick={() => handleAction(c.name)}
                        className="h-14 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px]"
                    >
                        {c.name}
                    </Button>
                ))}
            </div>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</div>
}
