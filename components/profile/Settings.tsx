"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Bell,
  Lock,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  Save,
  Moon,
  Sun,
  ChevronRight,
  BookOpen,
  FileText,
  Zap,
  Activity,
  Cpu,
  Fingerprint,
  Radio,
  Award,
  Clock
} from "lucide-react"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/contexts/theme-context"
import { fetchUserProfile, updateUserSettings, UserPreferences } from "@/lib/api/user"

// --- SUB-COMPONENTES ---

const SettingHeader = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="mb-10 flex flex-col md:flex-row md:items-center gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0d971f]/5 to-transparent pointer-events-none" />
    <div className="w-16 h-16 rounded-2xl bg-[#0d971f]/10 border border-[#0d971f]/20 flex items-center justify-center text-[#0d971f] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(13,151,31,0.1)]">
      <Icon size={32} />
    </div>
    <div>
      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
      <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">{description}</p>
    </div>
    <div className="ml-auto hidden md:block">
      <Radio className="text-[#0d971f] animate-pulse" size={20} />
    </div>
  </div>
)

const ControlWrapper = ({ label, description, children, icon: Icon }: { label: string, description: string, children: React.ReactNode, icon?: any }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex gap-4 items-start">
      {Icon && <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-[#d0b04d] transition-colors"><Icon size={18} /></div>}
      <div className="flex flex-col">
        <Label className="text-sm font-black uppercase tracking-widest text-white/80">{label}</Label>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter mt-1">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
)

// --- COMPONENTE PRINCIPAL ---

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("account")
  const [preferences, setPreferences] = useState<UserPreferences>({})

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const profile = await fetchUserProfile();
    if (profile && profile.preferences) {
      setPreferences(profile.preferences);
      // Sync theme if different
      if (profile.preferences.theme && profile.preferences.theme !== theme) {
        setTheme(profile.preferences.theme);
      }
    }
  };

  const handleUpdate = async (key: string, value: any) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    await updateUserSettings(newPrefs);

    if (key === 'theme') {
      setTheme(value);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 bg-transparent relative overflow-hidden">
      {/* Fondos Decorativos */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#d0b04d]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#0d971f]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header Principal */}
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col gap-2 mb-16 pl-20 md:pl-0">
            <MagicTitle variant="sparkles" className="text-4xl md:text-7xl tracking-[0.2em] font-black uppercase">
              AJUSTES
            </MagicTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl">
              <Cpu size={14} className="text-[#0d971f]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Configuración Central del Sistema Alpha</span>
            </div>
          </div>
        </BlurFade>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-12">

          {/* Menú Lateral Uniforme */}
          <div className="lg:w-80 flex-shrink-0">
            <MagicCard className="p-4 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl sticky top-8">
              <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                {[
                  { value: "account", label: "Cuenta", icon: User },
                  { value: "notifications", label: "Notificaciones", icon: Bell },
                  { value: "privacy", label: "Privacidad", icon: Lock },
                  { value: "security", label: "Seguridad", icon: Shield },
                  { value: "appearance", label: "Apariencia", icon: Palette },
                  { value: "language", label: "Global", icon: Globe },
                  { value: "help", label: "Soporte", icon: HelpCircle },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    /* CLASES CSS MODIFICADAS PARA IGUALAR EL TAMAÑO Y ESTILO */
                    className="justify-start gap-4 h-14 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent data-[state=active]:bg-[#0d971f] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.3)] hover:bg-white/5 group w-full"
                  >
                    <tab.icon size={18} className="text-[#c7c7c7] group-hover:scale-110 transition-transform" />
                    <span>{tab.label}</span>
                    <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100" />
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Status Box en el menú */}
              <div className="mt-8 p-6 rounded-3xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">System Load</span>
                  <span className="text-[9px] font-black text-[#d0b04d] uppercase tracking-widest">Optimal</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "35%" }}
                    className="h-full bg-[#0d971f]"
                  />
                </div>
              </div>
            </MagicCard>
          </div>

          {/* Área de Contenido Principal */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Las secciones de contenido permanecen igual */}
                {activeTab === "account" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full overflow-hidden">
                    <SettingHeader
                      title="Matriz de Identidad"
                      description="Gestión de bio-datos y representación digital del agente"
                      icon={User}
                    />

                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="relative group/avatar flex flex-col items-center">
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#063924] to-[#84cc16] rounded-full blur-sm opacity-50 group-hover/avatar:opacity-100 transition-opacity" />
                        
                        <Avatar className="w-28 h-28 border-4 border-[#0B0121] relative z-10 shadow-2xl">
                          <AvatarImage src="/placeholder.svg?height=112&width=112" />
                          <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 font-black text-xl italic text-white">AD</AvatarFallback>
                        </Avatar>

                        <Button 
                          size="sm" 
                          className="absolute -bottom-2 rounded-full h-8 px-4 bg-[#84cc16] text-black font-black text-[9px] uppercase tracking-widest z-20 hover:bg-[#063924] hover:text-white transition-colors"
                        >
                          Cambiar
                        </Button>
                      </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Nombre Agente</Label>
                            <Input defaultValue="Usuario" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-white/40 text-white font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Alias Digital</Label>
                            <Input defaultValue="Demo" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-white/40 text-white font-bold" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Dirección de Sincronización (Email)</Label>
                        <Input defaultValue="usuario@demo.com" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#d0b04d]/50 text-white font-bold" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Memorándum del Perfil</Label>
                        <textarea
                          placeholder="Cuéntanos sobre tus objetivos en SkillTech..."
                          rows={4}
                          className="w-full h-32 rounded-3xl bg-white/5 border border-white/10 focus:border-[#d0b04d]/50 focus:ring-1 focus:ring-[#d0b04d]/50 p-6 text-sm text-white/80 placeholder:text-white/10 font-medium uppercase tracking-wider"
                        />
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Sincronizar Datos
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: NOTIFICACIONES --- */}
                {activeTab === "notifications" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Centro de Alertas"
                      description="Protocolos de comunicación y avisos del reactor central"
                      icon={Bell}
                    />

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Canales Externos (Email)</h4>
                        <div className="space-y-3">
                          <ControlWrapper label="Ciclos de Aprendizaje" description="Alertas sobre actualizaciones en tus trayectorias activas." icon={Activity}>
                            <Switch
                              checked={preferences.email_notifications ?? true}
                              onCheckedChange={(c) => handleUpdate('email_notifications', c)}
                              className="data-[state=checked]:bg-[#0d971f]"
                            />
                          </ControlWrapper>
                          <ControlWrapper label="Registros de Logros" description="Notificación inmediata al desbloquear nuevos hitos." icon={Award}>
                            <Switch
                              checked={preferences.push_notifications ?? true}
                              onCheckedChange={(c) => handleUpdate('push_notifications', c)}
                              className="data-[state=checked]:bg-[#0d971f]"
                            />
                          </ControlWrapper>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Interfaz de Usuario</h4>
                        <div className="space-y-3">
                          <ControlWrapper label="Mensajes del Enlace" description="Nuevas comunicaciones de otros agentes o tutores." icon={Radio}>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                          </ControlWrapper>
                          <ControlWrapper label="Protocolos Pendientes" description="Recordatorios automáticos de evaluaciones detectadas." icon={Clock}>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                          </ControlWrapper>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Guardar Configuración
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: PRIVACIDAD --- */}
                {activeTab === "privacy" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Niveles de Privacidad"
                      description="Control de visibilidad y metadatos expuestos al ecosistema"
                      icon={Lock}
                    />

                    <div className="space-y-6">
                      <ControlWrapper label="Modo Espectro (Perfil Público)" description="Permite que otros agentes visualicen tu progreso e insignias." icon={User}>
                        <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                      </ControlWrapper>
                      <ControlWrapper label="Sintonizador de Actividad" description="Muestra tu estado en tiempo real dentro de las salas de aprendizaje." icon={Activity}>
                        <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                      </ControlWrapper>
                      <ControlWrapper label="Cifrado de Historial" description="Oculta las métricas detalladas de tus evaluaciones recientes." icon={Shield}>
                        <Switch className="data-[state=checked]:bg-[#0d971f]" />
                      </ControlWrapper>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Guardar Configuración
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: SEGURIDAD --- */}
                {activeTab === "security" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Protocolos de Seguridad"
                      description="Gestión de claves de acceso y autenticación biométrica de dos factores"
                      icon={Shield}
                    />

                    <div className="space-y-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em]">Credenciales de Acceso</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Contraseña Actual</Label>
                            <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#d0b04d]/50 text-white font-bold" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Nueva Clave</Label>
                              <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#d0b04d]/50 text-white font-bold" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Confirmar Clave</Label>
                              <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#d0b04d]/50 text-white font-bold" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Autenticación Avanzada</h4>
                        <ControlWrapper label="Doble Factor de Autenticación (2FA)" description="Protege tu cuenta mediante un token numérico temporal." icon={Fingerprint}>
                          <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                        </ControlWrapper>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Actualizar Credenciales
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: APARIENCIA --- */}
                {activeTab === "appearance" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Matriz de Apariencia"
                      description="Personalización visual, efectos de brillo y paleta cromática del sistema"
                      icon={Palette}
                    />

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                          onClick={() => handleUpdate('theme', 'dark')}
                          className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between gap-6 ${theme === 'dark' ? 'bg-[#063924]/20 border-[#d0b04d]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                          <div className="flex items-center justify-between">
                            <Moon size={24} className={theme === 'dark' ? 'text-[#d0b04d]' : 'text-white/40'} />
                            <div className={`w-4 h-4 rounded-full border-2 ${theme === 'dark' ? 'border-[#d0b04d] bg-[#d0b04d]' : 'border-white/20'}`} />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white uppercase italic tracking-wider">Modo Oscuro Absoluto</h4>
                            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Esquema predeterminado Verde & Dorado</p>
                          </div>
                        </div>

                        <div 
                          onClick={() => handleUpdate('theme', 'light')}
                          className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between gap-6 ${theme === 'light' ? 'bg-[#063924]/20 border-[#d0b04d]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                        >
                          <div className="flex items-center justify-between">
                            <Sun size={24} className={theme === 'light' ? 'text-[#d0b04d]' : 'text-white/40'} />
                            <div className={`w-4 h-4 rounded-full border-2 ${theme === 'light' ? 'border-[#d0b04d] bg-[#d0b04d]' : 'border-white/20'}`} />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white uppercase italic tracking-wider">Modo Luminoso</h4>
                            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Entorno claro de alta reflectividad</p>
                          </div>
                        </div>
                      </div>

                      <ControlWrapper label="Efectos Ambientales (Blur & Glow)" description="Renderiza efectos de iluminación dinámica en los fondos." icon={Zap}>
                        <Switch defaultChecked className="data-[state=checked]:bg-[#0d971f]" />
                      </ControlWrapper>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Guardar Apariencia
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: IDIOMA / GLOBAL --- */}
                {activeTab === "language" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Configuración Global"
                      description="Selección de lenguaje regional y parámetros de zona horaria del sistema"
                      icon={Globe}
                    />

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Idioma del Sistema</Label>
                        <Select defaultValue="es">
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold">
                            <SelectValue placeholder="Seleccionar idioma" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0121] border-white/10 text-white">
                            <SelectItem value="es">Español (Latinoamérica)</SelectItem>
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="pt">Português (Brasil)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Zona Horaria del Agente</Label>
                        <Select defaultValue="lima">
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold">
                            <SelectValue placeholder="Seleccionar zona horaria" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0121] border-white/10 text-white">
                            <SelectItem value="lima">(GMT-5) Lima / Bogotá / Quito</SelectItem>
                            <SelectItem value="cdmx">(GMT-6) Ciudad de México</SelectItem>
                            <SelectItem value="ba">(GMT-3) Buenos Aires</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#063924] hover:bg-[#063924]/80 text-[#d0b04d] border border-[#d0b04d]/30 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,57,36,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3 text-[#d0b04d]" />
                          Guardar Parámetros
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: SOPORTE / AYUDA --- */}
                {activeTab === "help" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Soporte y Enlace Central"
                      description="Documentación de protocolos, manuales técnicos y asistencia directa"
                      icon={HelpCircle}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-[#d0b04d]/30 transition-all flex flex-col justify-between gap-6 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-[#063924]/30 border border-[#d0b04d]/20 flex items-center justify-center text-[#d0b04d] group-hover:scale-110 transition-transform">
                          <BookOpen size={22} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white uppercase italic tracking-wider">Manual de Operación</h4>
                          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Guías paso a paso sobre el uso del ecosistema</p>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-[#d0b04d]/30 transition-all flex flex-col justify-between gap-6 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-[#063924]/30 border border-[#d0b04d]/20 flex items-center justify-center text-[#d0b04d] group-hover:scale-110 transition-transform">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white uppercase italic tracking-wider">Reportar Incidencia</h4>
                          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Abre un ticket directo con el equipo técnico central</p>
                        </div>
                      </div>
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