"use client"

import type React from "react"
import { useTheme } from "@/contexts/theme-context"
import { cn } from "@/lib/utils"

// Tipos para las propiedades de los componentes
type GradientDirection = "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-tl" | "to-br" | "to-bl"
type GradientIntensity = "soft" | "normal" | "vibrant"
type GradientVariant = "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "danger"

interface GradientProps {
    children: React.ReactNode
    className?: string
    direction?: GradientDirection
    intensity?: GradientIntensity
    variant?: GradientVariant
    hover?: boolean
    animated?: boolean
}

// Colores para el tema claro basados en tu paleta proporcionada:
// #d0b04d, #c0c0ba, #cae13c, #baef00
const lightThemeColors = {
    primary: {
        soft: { from: "#c0c0ba", to: "#d0b04d" },
        normal: { from: "#d0b04d", to: "#cae13c" },
        vibrant: { from: "#cae13c", to: "#baef00" },
    },
    secondary: {
        soft: { from: "#c0c0ba", to: "#e5e5e0" },
        normal: { from: "#b0b0aa", to: "#c0c0ba" },
        vibrant: { from: "#a0a09a", to: "#b0b0aa" },
    },
    accent: {
        soft: { from: "#cae13c", to: "#d0b04d" },
        normal: { from: "#baef00", to: "#cae13c" },
        vibrant: { from: "#a6d600", to: "#baef00" },
    },
    info: {
        soft: { from: "#c0c0ba", to: "#cae13c" },
        normal: { from: "#b0c090", to: "#cae13c" },
        vibrant: { from: "#9ab82e", to: "#cae13c" },
    },
    success: {
        soft: { from: "#cae13c", to: "#baef00" },
        normal: { from: "#b8ea00", to: "#baef00" },
        vibrant: { from: "#a5d400", to: "#b8ea00" },
    },
    warning: {
        soft: { from: "#e0d080", to: "#d0b04d" },
        normal: { from: "#d0b04d", to: "#c0a030" },
        vibrant: { from: "#b89830", to: "#d0b04d" },
    },
    danger: {
        soft: { from: "#d0c080", to: "#c09040" },
        normal: { from: "#c09040", to: "#b06020" },
        vibrant: { from: "#b06020", to: "#904010" },
    },
}

// Colores para el tema oscuro basados en tu paleta proporcionada:
// fondo: #032318, #063924, #214f3c, #0a6b17, #d0b04d
const darkThemeColors = {
    primary: {
        soft: { from: "#063924", to: "#214f3c" },
        normal: { from: "#032318", to: "#063924" },
        vibrant: { from: "#063924", to: "#0a6b17" },
    },
    secondary: {
        soft: { from: "#214f3c", to: "#2d6951" },
        normal: { from: "#063924", to: "#214f3c" },
        vibrant: { from: "#032318", to: "#214f3c" },
    },
    accent: {
        soft: { from: "#0a6b17", to: "#d0b04d" },
        normal: { from: "#214f3c", to: "#d0b04d" },
        vibrant: { from: "#063924", to: "#d0b04d" },
    },
    info: {
        soft: { from: "#032318", to: "#214f3c" },
        normal: { from: "#063924", to: "#0a6b17" },
        vibrant: { from: "#214f3c", to: "#0a6b17" },
    },
    success: {
        soft: { from: "#214f3c", to: "#0a6b17" },
        normal: { from: "#063924", to: "#0a6b17" },
        vibrant: { from: "#0a6b17", to: "#228b22" },
    },
    warning: {
        soft: { from: "#063924", to: "#d0b04d" },
        normal: { from: "#214f3c", to: "#d0b04d" },
        vibrant: { from: "#0a6b17", to: "#d0b04d" },
    },
    danger: {
        soft: { from: "#331818", to: "#6b1717" },
        normal: { from: "#230303", to: "#390606" },
        vibrant: { from: "#4d0d0d", to: "#8b1717" },
    },
}

export function ThemeGradientBackground({
    children,
    className = "",
    direction = "to-r",
    intensity = "normal",
    variant = "primary",
    hover = false,
    animated = false,
}: GradientProps) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    return (
        <div
            className={cn(
                `bg-gradient-${direction} from-[${from}] to-[${to}]`,
                hover && `hover:from-[${to}] hover:to-[${from}]`,
                animated && "transition-all duration-500",
                className,
            )}
        >
            {children}
        </div>
    )
}

export function ThemeGradientText({
    children,
    className = "",
    direction = "to-r",
    intensity = "normal",
    variant = "primary",
    hover = false,
    animated = false,
}: GradientProps) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    return (
        <span
            className={cn(
                `bg-gradient-${direction} from-[${from}] to-[${to}] text-transparent bg-clip-text`,
                hover && `hover:from-[${to}] hover:to-[${from}]`,
                animated && "transition-all duration-500",
                className,
            )}
        >
            {children}
        </span>
    )
}

export function ThemeGradientBorder({
    children,
    className = "",
    direction = "to-r",
    intensity = "normal",
    variant = "primary",
    hover = false,
    animated = false,
}: GradientProps) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    return (
        <div className="p-[1px] rounded-lg bg-gradient-to-r from-transparent to-transparent relative">
            <div
                className={cn(
                    "absolute inset-0 rounded-lg",
                    `bg-gradient-${direction} from-[${from}] to-[${to}]`,
                    hover && `hover:from-[${to}] hover:to-[${from}]`,
                    animated && "transition-all duration-500",
                )}
            />
            <div className={cn("relative bg-background rounded-lg", className)}>{children}</div>
        </div>
    )
}

export function ThemeGradientButton({
    children,
    className = "",
    direction = "to-r",
    intensity = "normal",
    variant = "primary",
    animated = false,
    ...props
}: GradientProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    return (
        <button
            className={cn(
                `bg-gradient-${direction} from-[${from}] to-[${to}]`,
                "text-white font-medium py-2 px-4 rounded-md",
                "hover:opacity-90 active:opacity-80",
                animated && "transition-all duration-300",
                className,
            )}
            {...props}
        >
            {children}
        </button>
    )
}

// Componente para crear un gradiente animado
export function AnimatedGradient({
    children,
    className = "",
    variant = "primary",
    intensity = "normal",
    speed = "normal",
}: GradientProps & { speed?: "slow" | "normal" | "fast" }) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    const speedClass = {
        slow: "animate-gradient-slow",
        normal: "animate-gradient",
        fast: "animate-gradient-fast",
    }

    return (
        <div
            className={cn(
                "bg-gradient-to-r bg-[length:400%_400%]",
                `from-[${from}] via-[${to}] to-[${from}]`,
                speedClass[speed],
                className,
            )}
        >
            {children}
        </div>
    )
}

// Componente para crear un borde con gradiente animado
export function AnimatedGradientBorder({
    children,
    className = "",
    variant = "primary",
    intensity = "normal",
    speed = "normal",
    borderWidth = "2px",
}: GradientProps & { speed?: "slow" | "normal" | "fast"; borderWidth?: string }) {
    const { theme } = useTheme()
    const colors = theme === "light" ? lightThemeColors : darkThemeColors
    const { from, to } = colors[variant][intensity]

    const speedClass = {
        slow: "animate-gradient-slow",
        normal: "animate-gradient",
        fast: "animate-gradient-fast",
    }

    return (
        <div className="relative">
            <div
                className={cn(
                    "absolute inset-0 rounded-lg bg-gradient-to-r bg-[length:400%_400%]",
                    `from-[${from}] via-[${to}] to-[${from}]`,
                    speedClass[speed],
                )}
            />
            <div className={cn("relative bg-background rounded-lg", className)} style={{ padding: borderWidth }}>
                <div className="bg-background h-full w-full rounded-lg">{children}</div>
            </div>
        </div>
    )
}