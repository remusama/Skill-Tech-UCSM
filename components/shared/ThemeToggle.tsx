"use client"

import { Sun, Moon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/contexts/theme-context"

// El "cerebro" del tema (ThemeProvider, variables CSS para .light-theme,
// y la paleta clara derivada de la paleta principal) ya existía en el
// proyecto — este componente es únicamente el control visual que faltaba
// para poder disparar setTheme(). Se deja como pieza reutilizable para
// poder montarlo en cualquier lugar (sidebar, settings, header móvil...).
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border transition-colors ${
        compact ? "px-3 py-2" : "px-4 py-3"
      } ${
        isDark
          ? "bg-white/5 border-white/5 text-white/70"
          : "bg-white shadow-xs border-slate-300 text-slate-700"
      }`}
    >
      <div className={`p-1.5 rounded-lg ${isDark ? "bg-white/5" : "bg-[#f4f7f5]"}`}>
        {isDark ? <Moon size={14} /> : <Sun size={14} className="text-[#b8860b]" />}
      </div>
      {!compact && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] flex-1">
          {isDark ? "Tema oscuro" : "Tema claro"}
        </span>
      )}
      <Switch
        checked={!isDark}
        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
        aria-label="Alternar tema claro / oscuro"
        className="data-[state=checked]:bg-[#b8860b] data-[state=unchecked]:bg-[#0d971f]"
      />
    </div>
  )
}