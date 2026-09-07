import React from "react"
import { BlurFade } from "@/components/ui/blur-fade"
import { Card } from "@/components/ui/card"
import { Meteors } from "@/components/ui/meteors"
import { cn } from "@/lib/utils"

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
    delay?: number
    showMeteors?: boolean
    meteorCount?: number
    meteorOpacity?: string
    enableHover?: boolean
    gradientColor?: string
    gradientOpacity?: number
    children: React.ReactNode
}

export function MagicCard({
    delay = 0,
    showMeteors = false,
    meteorCount = 3,
    meteorOpacity = "opacity-20",
    enableHover = true,
    gradientColor,
    gradientOpacity = 0.1,
    className,
    style,
    children,
    ...props
}: MagicCardProps) {
    const gradientStyle = gradientColor
        ? {
            background: `linear-gradient(135deg, ${gradientColor}${Math.round(gradientOpacity * 255).toString(16).padStart(2, '0')}, transparent)`,
            ...style,
        }
        : style

    return (
        <BlurFade delay={delay} inView>
            <Card
                className={cn(
                    "relative overflow-hidden bg-transparent border-white/5 shadow-lg",
                    enableHover && "hover:scale-[1.02] transition-transform duration-300",
                    className
                )}
                style={gradientStyle}
                {...props}
            >
                {showMeteors && <Meteors number={meteorCount} className={meteorOpacity} />}
                <div className="relative z-10 w-full">{children}</div>
            </Card>
        </BlurFade>
    )
}
