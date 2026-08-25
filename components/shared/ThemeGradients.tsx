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

// Colores para el tema claro
const lightThemeColors = {
  primary: {
    soft: { from: "#9B85B9", to: "#D5C6E3" },
    normal: { from: "#7D5AA4", to: "#C1A9D2" },
    vibrant: { from: "#6A4A8C", to: "#A98BC0" },
  },
  secondary: {
    soft: { from: "#D5D9E3", to: "#E5E5E5" },
    normal: { from: "#C1C8D9", to: "#D5D9E3" },
    vibrant: { from: "#AAB4CC", to: "#C1C8D9" },
  },
  accent: {
    soft: { from: "#C1A9D2", to: "#D5C6E3" },
    normal: { from: "#A98BC0", to: "#C1A9D2" },
    vibrant: { from: "#9B7DB3", to: "#A98BC0" },
  },
  info: {
    soft: { from: "#A0B8D0", to: "#C5D5E5" },
    normal: { from: "#7A9CC0", to: "#A0B8D0" },
    vibrant: { from: "#5A85B0", to: "#7A9CC0" },
  },
  success: {
    soft: { from: "#A0C8B0", to: "#C5E0D0" },
    normal: { from: "#7AAA90", to: "#A0C8B0" },
    vibrant: { from: "#5A9070", to: "#7AAA90" },
  },
  warning: {
    soft: { from: "#D0C0A0", to: "#E5D5C0" },
    normal: { from: "#C0AA80", to: "#D0C0A0" },
    vibrant: { from: "#B09560", to: "#C0AA80" },
  },
  danger: {
    soft: { from: "#D0A0A0", to: "#E5C0C0" },
    normal: { from: "#C08080", to: "#D0A0A0" },
    vibrant: { from: "#B06060", to: "#C08080" },
  },
}

// Colores para el tema oscuro
const darkThemeColors = {
  primary: {
    soft: { from: "#5C1A8C", to: "#8C40B0" },
    normal: { from: "#4C007D", to: "#7F00B2" },
    vibrant: { from: "#3C006E", to: "#6F00A3" },
  },
  secondary: {
    soft: { from: "#3A3A4A", to: "#4A4A5A" },
    normal: { from: "#2A2A3A", to: "#3A3A4A" },
    vibrant: { from: "#1A1A2A", to: "#2A2A3A" },
  },
  accent: {
    soft: { from: "#6C2A9C", to: "#9C50C0" },
    normal: { from: "#5C1A8C", to: "#8C40B0" },
    vibrant: { from: "#4C0A7C", to: "#7C30A0" },
  },
  info: {
    soft: { from: "#2A4A7C", to: "#4A6A9C" },
    normal: { from: "#1A3A6C", to: "#3A5A8C" },
    vibrant: { from: "#0A2A5C", to: "#2A4A7C" },
  },
  success: {
    soft: { from: "#2A7C4A", to: "#4A9C6A" },
    normal: { from: "#1A6C3A", to: "#3A8C5A" },
    vibrant: { from: "#0A5C2A", to: "#2A7C4A" },
  },
  warning: {
    soft: { from: "#7C6A2A", to: "#9C8A4A" },
    normal: { from: "#6C5A1A", to: "#8C7A3A" },
    vibrant: { from: "#5C4A0A", to: "#7C6A2A" },
  },
  danger: {
    soft: { from: "#7C2A2A", to: "#9C4A4A" },
    normal: { from: "#6C1A1A", to: "#8C3A3A" },
    vibrant: { from: "#5C0A0A", to: "#7C2A2A" },
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
