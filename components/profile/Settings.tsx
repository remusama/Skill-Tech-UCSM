"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Lock, Save, KeyRound, ShieldCheck, ChevronRight, UserCheck, School, BookOpen, Palette, Sun, Moon } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { API_BASE_URL } from "@/lib/config"
import { useTheme } from "@/contexts/theme-context"

export function Settings() {
  const [activeTab, setActiveTab] = useState("account")
  const { theme, setTheme } = useTheme() // Integrado con tu contexto global de temas

  // Datos del Usuario
  const [userData, setUserData] = useState<{
    id?: number
    username?: string
    full_name?: string
    email?: string
    role?: string
    school?: string
    classroom?: string
  }>({})

  // Formulario de contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passLoading, setPassLoading] = useState(false)
  const [passMessage, setPassMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eleonor_user")
      if (stored) {
        setUserData(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Error cargando usuario:", e)
    }
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMessage(null)

    if (!currentPassword) {
      setPassMessage({ type: "error", text: "Ingresa tu contraseña actual." })
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setPassMessage({ type: "error", text: "La nueva contraseña debe tener al menos 8 caracteres." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: "error", text: "Las contraseñas no coinciden." })
      return
    }

    setPassLoading(true)
    try {
      const token = localStorage.getItem("eleonor_token")
      const resp = await fetch(`${API_BASE_URL}/api/auth/change_password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data.detail || "Error al cambiar la contraseña.")
      }

      setPassMessage({ type: "success", text: "¡Contraseña actualizada exitosamente!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPassMessage({ type: "error", text: err.message || "Error al cambiar la contraseña." })
    } finally {
      setPassLoading(false)
    }
  }

  const displayName = userData.full_name || userData.username || "Estudiante"
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ST"
  const isDark = theme === "dark"

  return (
    <div 
      style={!isDark ? { backgroundColor: '#e8e8e6' } : undefined}
      className={`min-h-screen p-4 md:p-12 relative overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#02140c] text-white" : "text-[#063924]"}`}
    >
      {/* Fondos Decorativos dinámicos */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none ${isDark ? "bg-[#d0b04d]/5" : "bg-[#b8860b]/10"}`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none ${isDark ? "bg-[#0d971f]/10" : "bg-[#0d971f]/10"}`} />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Encabezado */}
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col gap-2 mb-10 pl-16 md:pl-0">
            <h1 className={`text-3xl md:text-6xl tracking-[0.2em] font-black uppercase ${isDark ? "text-white" : "text-[#063924]"}`}>
              CONFIGURACIÓN
            </h1>
            <div className="w-48 sm:w-64 md:w-80 h-[2px] bg-gradient-to-r from-[#baef00] to-[#3c5a21] my-2" />
            <div className={`flex items-center gap-3 px-4 py-2 border rounded-full self-start backdrop-blur-xl ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-300 shadow-sm"}`}>
              <ShieldCheck size={14} className="text-[#d0b04d]" />
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white/60" : "text-slate-700"}`}>
                Información de la Cuenta, Seguridad y Apariencia
              </span>
            </div>
          </div>
        </BlurFade>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8">

          {/* Menú Lateral de Opciones */}
          <div className="lg:w-72 flex-shrink-0">
            <MagicCard 
              style={!isDark ? { backgroundColor: '#f4f7f5' } : undefined}
              className={`p-3 rounded-[2rem] backdrop-blur-3xl border shadow-2xl sticky top-8 ${isDark ? "bg-white/[0.02] border-white/5" : "border-slate-300"}`}
            >
              <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                <TabsTrigger
                  value="account"
                  className={`w-full flex items-center justify-start gap-4 h-14 rounded-2xl px-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent group ${
                    isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-200"
                  } data-[state=active]:bg-[#0d971f] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.3)]`}
                >
                  <User size={18} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-left truncate">Información</span>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100 flex-shrink-0" />
                </TabsTrigger>

                <TabsTrigger
                  value="password"
                  className={`w-full flex items-center justify-start gap-4 h-14 rounded-2xl px-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent group ${
                    isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-200"
                  } data-[state=active]:bg-[#0d971f] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.3)]`}
                >
                  <Lock size={18} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-left truncate">Cambiar Contraseña</span>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100 flex-shrink-0" />
                </TabsTrigger>

                <TabsTrigger
                  value="theme"
                  className={`w-full flex items-center justify-start gap-4 h-14 rounded-2xl px-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent group ${
                    isDark ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-200"
                  } data-[state=active]:bg-[#0d971f] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.3)]`}
                >
                  <Palette size={18} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-left truncate">Apariencia / Tema</span>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100 flex-shrink-0" />
                </TabsTrigger>
              </TabsList>
            </MagicCard>
          </div>

          {/* Área de Contenido */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* --- TAB 1: INFORMACIÓN DE LA CUENTA --- */}
                {activeTab === "account" && (
                  <MagicCard 
                    style={!isDark ? { backgroundColor: '#f4f7f5' } : undefined}
                    className={`p-8 md:p-10 rounded-[3rem] backdrop-blur-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-white/[0.02] border-white/5" : "border-slate-300"}`}
                  >
                    <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${isDark ? "border-white/5" : "border-slate-300"}`}>
                      <Avatar className="w-16 h-16 border-2 border-[#0d971f]/50 shadow-xl">
                        <AvatarFallback className="bg-gradient-to-br from-[#0d971f] to-[#d0b04d] text-white font-black text-xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className={`text-xl font-black uppercase tracking-wider ${isDark ? "text-white" : "text-[#063924]"}`}>{displayName}</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isDark ? "text-white/40" : "text-slate-600"}`}>
                          {userData.role === "teacher" ? "Docente" : userData.role === "admin" ? "Administrador" : "Estudiante"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Nombre de Usuario</Label>
                        <div 
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`flex items-center gap-3 p-4 rounded-2xl border font-bold ${isDark ? "bg-white/5 border-white/10 text-white" : "border-slate-300 text-[#063924] shadow-xs"}`}
                        >
                          <UserCheck size={16} className="text-[#0d971f]" />
                          <span>{userData.username || "No asignado"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Correo Electrónico</Label>
                        <div 
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`flex items-center gap-3 p-4 rounded-2xl border font-bold truncate ${isDark ? "bg-white/5 border-white/10 text-white" : "border-slate-300 text-[#063924] shadow-xs"}`}
                        >
                          <User size={16} className="text-[#d0b04d]" />
                          <span className="truncate">{userData.email || "No registrado"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Universidad</Label>
                        <div 
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`flex items-center gap-3 p-4 rounded-2xl border font-bold ${isDark ? "bg-white/5 border-white/10 text-white" : "border-slate-300 text-[#063924] shadow-xs"}`}
                        >
                          <School size={16} className="text-[#0d971f]" />
                          <span>{userData.school || "UCSM"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Grupo</Label>
                        <div 
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`flex items-center gap-3 p-4 rounded-2xl border font-bold ${isDark ? "bg-white/5 border-white/10 text-white" : "border-slate-300 text-[#063924] shadow-xs"}`}
                        >
                          <BookOpen size={16} className="text-[#d0b04d]" />
                          <span>{userData.classroom || "No asignada"}</span>
                        </div>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- TAB 2: CAMBIAR CONTRASEÑA --- */}
                {activeTab === "password" && (
                  <MagicCard 
                    style={!isDark ? { backgroundColor: '#f4f7f5' } : undefined}
                    className={`p-8 md:p-10 rounded-[3rem] backdrop-blur-3xl border shadow-2xl ${isDark ? "bg-white/[0.02] border-white/5" : "border-slate-300"}`}
                  >
                    <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${isDark ? "border-white/5" : "border-slate-300"}`}>
                      <div className="w-12 h-12 rounded-2xl bg-[#0d971f]/10 border border-[#0d971f]/20 flex items-center justify-center text-[#0d971f]">
                        <KeyRound size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-black uppercase tracking-wider ${isDark ? "text-white" : "text-[#063924]"}`}>Actualizar Credencial</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isDark ? "text-white/40" : "text-slate-600"}`}>Ingresa tu contraseña actual y define tu nueva clave de acceso.</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                      {passMessage && (
                        <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                          passMessage.type === "success" 
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" 
                            : "bg-red-500/20 border border-red-500/40 text-red-400"
                        }`}>
                          {passMessage.text}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Contraseña Actual</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`h-14 rounded-2xl font-bold focus:border-[#0d971f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-300 text-[#063924]"}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Nueva Contraseña (mínimo 8 caracteres)</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`h-14 rounded-2xl font-bold focus:border-[#0d971f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-300 text-[#063924]"}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${isDark ? "text-white/40" : "text-slate-600"}`}>Confirmar Nueva Contraseña</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={!isDark ? { backgroundColor: '#ffffff' } : undefined}
                          className={`h-14 rounded-2xl font-bold focus:border-[#0d971f] ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-300 text-[#063924]"}`}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={passLoading}
                        className="w-full h-14 rounded-2xl bg-[#0d971f] hover:bg-[#0d971f]/80 text-white font-black uppercase tracking-widest shadow-[0_0_25px_rgba(13,151,31,0.3)] transition-all active:scale-95"
                      >
                        {passLoading ? "Guardando..." : "Actualizar Contraseña"}
                      </Button>
                    </form>
                  </MagicCard>
                )}

                {/* --- TAB 3: APARIENCIA / TEMA (Conectado al Contexto Global) --- */}
                {activeTab === "theme" && (
                  <MagicCard 
                    style={!isDark ? { backgroundColor: '#f4f7f5' } : undefined}
                    className={`p-8 md:p-10 rounded-[3rem] backdrop-blur-3xl border shadow-2xl ${isDark ? "bg-white/[0.02] border-white/5" : "border-slate-300"}`}
                  >
                    <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${isDark ? "border-white/5" : "border-slate-300"}`}>
                      <div className="w-12 h-12 rounded-2xl bg-[#0d971f]/10 border border-[#0d971f]/20 flex items-center justify-center text-[#0d971f]">
                        <Palette size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-black uppercase tracking-wider ${isDark ? "text-white" : "text-[#063924]"}`}>Apariencia del Sistema</h3>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isDark ? "text-white/40" : "text-slate-600"}`}>Selecciona el modo visual de toda la plataforma.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                      {/* Modo Oscuro */}
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 ${
                          theme === "dark"
                            ? "bg-[#02140c] border-[#0d971f] shadow-[0_0_25px_rgba(13,151,31,0.3)] text-white scale-105"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-[#0d971f] text-white" : "bg-white/10"}`}>
                          <Moon size={28} />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black uppercase tracking-wider block">Modo Oscuro</span>
                          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Inmersivo Neural</span>
                        </div>
                      </button>

                      {/* Modo Claro */}
                      <button
                        onClick={() => setTheme("light")}
                        style={theme === "light" ? { backgroundColor: '#ffffff' } : undefined}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all duration-300 ${
                          theme === "light"
                            ? "border-[#0d971f] shadow-[0_10px_25px_rgba(0,0,0,0.1)] text-[#063924] scale-105 font-bold"
                            : "bg-slate-200 border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme === "light" ? "bg-[#0d971f] text-white" : "bg-slate-300"}`}>
                          <Sun size={28} />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-black uppercase tracking-wider block">Modo Claro</span>
                          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Alta Definición</span>
                        </div>
                      </button>
                    </div>
                  </MagicCard>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </Tabs>
      </div>
    </div>
  )
}