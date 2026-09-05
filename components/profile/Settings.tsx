"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Lock, Save, KeyRound, ShieldCheck, ChevronRight, UserCheck, School, BookOpen } from "lucide-react"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { API_BASE_URL } from "@/lib/config"

export function Settings() {
  const [activeTab, setActiveTab] = useState("account")

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

  return (
    <div className="min-h-screen p-4 md:p-12 bg-transparent relative overflow-hidden">
      {/* Fondos Decorativos */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#B500D1]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Encabezado */}
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col gap-2 mb-10 pl-16 md:pl-0">
            <MagicTitle variant="sparkles" className="text-3xl md:text-6xl tracking-[0.2em] font-black uppercase">
              CONFIGURACIÓN
            </MagicTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl">
              <ShieldCheck size={14} className="text-[#B500D1]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Información de la Cuenta y Seguridad</span>
            </div>
          </div>
        </BlurFade>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-8">

          {/* Menú Lateral de Opciones (Solo 2 Opciones) */}
          <div className="lg:w-72 flex-shrink-0">
            <MagicCard className="p-3 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl sticky top-8">
              <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                <TabsTrigger
                  value="account"
                  className="justify-start gap-4 h-14 rounded-2xl px-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent data-[state=active]:bg-[#B500D1] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(181,0,209,0.3)] hover:bg-white/5 group"
                >
                  <User size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Información</span>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100" />
                </TabsTrigger>

                <TabsTrigger
                  value="password"
                  className="justify-start gap-4 h-14 rounded-2xl px-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent data-[state=active]:bg-[#B500D1] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(181,0,209,0.3)] hover:bg-white/5 group"
                >
                  <Lock size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Cambiar Contraseña</span>
                  <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100" />
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
                  <MagicCard className="p-8 md:p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                      <Avatar className="w-16 h-16 border-2 border-[#B500D1]/50 shadow-xl">
                        <AvatarFallback className="bg-gradient-to-br from-[#B500D1] to-cyan-500 text-white font-black text-xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">{displayName}</h3>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">
                          {userData.role === "teacher" ? "Docente" : userData.role === "admin" ? "Administrador" : "Estudiante"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Nombre de Usuario</Label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                          <UserCheck size={16} className="text-[#B500D1]" />
                          <span>{userData.username || "No asignado"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Correo Electrónico</Label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold truncate">
                          <User size={16} className="text-cyan-400" />
                          <span className="truncate">{userData.email || "No registrado"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Universidad</Label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                          <School size={16} className="text-purple-400" />
                          <span>{userData.school || "UCSM"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Grupo</Label>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                          <BookOpen size={16} className="text-emerald-400" />
                          <span>{userData.classroom || "No asignada"}</span>
                        </div>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- TAB 2: CAMBIAR CONTRASEÑA --- */}
                {activeTab === "password" && (
                  <MagicCard className="p-8 md:p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-[#B500D1]/10 border border-[#B500D1]/20 flex items-center justify-center text-[#B500D1]">
                        <KeyRound size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">Actualizar Credencial</h3>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-0.5">Ingresa tu contraseña actual y define tu nueva clave de acceso.</p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                      {passMessage && (
                        <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider ${passMessage.type === "success" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" : "bg-red-500/20 border border-red-500/40 text-red-400"
                          }`}>
                          {passMessage.text}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Contraseña Actual</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold focus:border-[#B500D1]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Nueva Contraseña (mínimo 8 caracteres)</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold focus:border-[#B500D1]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Confirmar Nueva Contraseña</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold focus:border-[#B500D1]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={passLoading}
                        className="w-full h-14 rounded-2xl bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest shadow-[0_0_25px_rgba(181,0,209,0.3)] transition-all active:scale-95"
                      >
                        {passLoading ? "Guardando..." : "Actualizar Contraseña"}
                      </Button>
                    </form>
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
