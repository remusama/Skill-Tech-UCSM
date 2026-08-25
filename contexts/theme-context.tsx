"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  // Inicializar el tema desde localStorage si está disponible
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [])

  // Actualizar el DOM y localStorage cuando cambia el tema
  useEffect(() => {
    const root = document.documentElement

    if (theme === "light") {
      root.classList.add("light-theme")
    } else {
      root.classList.remove("light-theme")
    }

    localStorage.setItem("theme", theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
