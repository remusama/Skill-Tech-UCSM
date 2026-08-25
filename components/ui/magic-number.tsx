import React from "react"
import { NumberTicker } from "@/components/ui/number-ticker"
import { cn } from "@/lib/utils"

interface MagicNumberProps {
    value: number
    size?: "sm" | "md" | "lg" | "xl"
    color?: string
    enableGlow?: boolean
    glowColor?: string
    className?: string
}

const sizeMap = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
}

export function MagicNumber({
    value,
    size = "lg",
    color = "#7f00b2",
    enableGlow = true,
    glowColor,
    className,
}: MagicNumberProps) {
    const glow = glowColor || `${color}80` // 50% opacity

    return (
        <NumberTicker
            value={value}
            className={cn(
                "font-bold",
                sizeMap[size],
                enableGlow && `drop-shadow-[0_0_10px_${glow}]`,
                className
            )}
            style={{ color }}
        />
    )
}
