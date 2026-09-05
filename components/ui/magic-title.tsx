import React from "react"
import { SparklesText } from "@/components/ui/sparkles-text"
import { AuroraText } from "@/components/ui/aurora-text"
import { TextAnimate } from "@/components/ui/text-animate"
import { cn } from "@/lib/utils"

type TitleVariant = "sparkles" | "aurora" | "animate"
type AnimationType = "blurIn" | "blurInUp" | "slideUp" | "slideDown"

interface MagicTitleProps {
    variant?: TitleVariant
    animation?: AnimationType
    by?: "word" | "character"
    colors?: { first: string; second: string } | string[]
    sparklesCount?: number
    className?: string
    children: React.ReactNode
}

export function MagicTitle({
    variant = "sparkles",
    animation = "blurInUp",
    by = "word",
    colors,
    sparklesCount = 15,
    className,
    children,
}: MagicTitleProps) {
    const defaultSparklesColors = { first: "#7aff90", second: "#8bfe98" }
    const defaultAuroraColors = ["#007d15", "#00b20c", "#4edd50", "#7dff7f"]

    const renderContent = () => {
        const baseClasses = cn(
            "inline-block font-black tracking-tighter transition-all duration-700",
            className
        )

        if (variant === "sparkles") {
            // Reutilizamos el nombre sparkles pero lo convertimos en un estilo minimalista con glow sutil
            return (
                <span className={cn(baseClasses, "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]")}>
                    {children}
                </span>
            )
        }

        if (variant === "aurora") {
            return (
                <AuroraText
                    className={baseClasses}
                    colors={colors as string[] || defaultAuroraColors}
                >
                    {children}
                </AuroraText>
            )
        }

        return (
            <TextAnimate
                animation={animation}
                by={by}
                className={baseClasses}
            >
                {children as string}
            </TextAnimate>
        )
    }

    return (
        <div className="relative inline-block py-2">
            {renderContent()}
            <div className="absolute -bottom-1 left-0 w-1/3 h-[2px] bg-gradient-to-r from-[#8B00FF] to-transparent opacity-50" />
        </div>
    )
}
