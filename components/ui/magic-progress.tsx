import React from "react"
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar"
import { cn } from "@/lib/utils"

interface MagicProgressProps {
    value: number
    max?: number
    size?: "sm" | "md" | "lg" | "xl"
    color?: string
    glowColor?: string
    className?: string
}

const sizeMap = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
}

export function MagicProgress({
    value,
    max = 100,
    size = "lg",
    color = "#7f00b2",
    glowColor,
    className,
}: MagicProgressProps) {
    const glow = glowColor || `${color}80` // 50% opacity by default

    return (
        <AnimatedCircularProgressBar
            value={value}
            max={max}
            gaugePrimaryColor={color}
            gaugeSecondaryColor={`${color}1A`} // 10% opacity
            className={cn(
                sizeMap[size],
                `drop-shadow-[0_0_15px_${glow}]`,
                className
            )}
        />
    )
}
