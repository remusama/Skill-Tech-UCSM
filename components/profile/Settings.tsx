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
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#B500D1]/5 to-transparent pointer-events-none" />
    <div className="w-16 h-16 rounded-2xl bg-[#B500D1]/10 border border-[#B500D1]/20 flex items-center justify-center text-[#B500D1] group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(181,0,209,0.1)]">
      <Icon size={32} />
    </div>
    <div>
      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
      <p className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">{description}</p>
    </div>
    <div className="ml-auto hidden md:block">
      <Radio className="text-[#B500D1] animate-pulse" size={20} />
    </div>
  </div>
)

const ControlWrapper = ({ label, description, children, icon: Icon }: { label: string, description: string, children: React.ReactNode, icon?: any }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
    <div className="flex gap-4 items-start">
      {Icon && <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-[#B500D1] transition-colors"><Icon size={18} /></div>}
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
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#B500D1]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header Principal */}
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col gap-2 mb-16 pl-20 md:pl-0">
            <MagicTitle variant="sparkles" className="text-4xl md:text-7xl tracking-[0.2em] font-black uppercase">
              AJUSTES
            </MagicTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl">
              <Cpu size={14} className="text-[#B500D1]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Configuración Central del Sistema Alpha</span>
            </div>
          </div>
        </BlurFade>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-12">

          {/* Menú Lateral Futurista */}
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
                    className="justify-start gap-4 h-14 rounded-2xl px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border border-transparent data-[state=active]:bg-[#B500D1] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(181,0,209,0.3)] hover:bg-white/5 group"
                  >
                    <tab.icon size={18} className="group-hover:scale-110 transition-transform" />
                    <span>{tab.label}</span>
                    <ChevronRight size={14} className="ml-auto opacity-20 group-data-[state=active]:opacity-100" />
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Status Box en el menú */}
              <div className="mt-8 p-6 rounded-3xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">System Load</span>
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Optimal</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "35%" }}
                    className="h-full bg-cyan-400"
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
                {/* --- SECCIÓN: CUENTA --- */}
                {activeTab === "account" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full overflow-hidden">
                    <SettingHeader
                      title="Matriz de Identidad"
                      description="Gestión de bio-datos y representación digital del agente"
                      icon={User}
                    />

                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="relative group/avatar">
                          <div className="absolute -inset-1 bg-gradient-to-br from-[#B500D1] to-cyan-400 rounded-full blur-sm opacity-50 group-hover/avatar:opacity-100 transition-opacity" />
                          <Avatar className="w-28 h-28 border-4 border-[#0B0121] relative z-10 shadow-2xl">
                            <AvatarImage src="/placeholder.svg?height=112&width=112" />
                            <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 font-black text-xl italic">AD</AvatarFallback>
                          </Avatar>
                          <Button size="sm" className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full h-8 px-4 bg-white text-black font-black text-[9px] uppercase tracking-widest z-20 hover:bg-[#B500D1] hover:text-white transition-all">
                            Cambiar
                          </Button>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Nombre Agente</Label>
                            <Input defaultValue="Usuario" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 text-white font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Alias Digital</Label>
                            <Input defaultValue="Demo" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 text-white font-bold" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Dirección de Sincronización (Email)</Label>
                        <Input defaultValue="usuario@demo.com" className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 text-white font-bold" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Memorándum del Perfil</Label>
                        <textarea
                          placeholder="Cuéntanos sobre tus objetivos en SkillTech..."
                          rows={4}
                          className="w-full h-32 rounded-3xl bg-white/5 border border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 p-6 text-sm text-white/80 placeholder:text-white/10 font-medium uppercase tracking-wider"
                        />
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest shadow-[0_0_25px_rgba(181,0,209,0.3)] transition-all active:scale-95">
                          <Save size={18} className="mr-3" />
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
                              className="data-[state=checked]:bg-[#B500D1]"
                            />
                          </ControlWrapper>
                          <ControlWrapper label="Registros de Logros" description="Notificación inmediata al desbloquear nuevos hitos." icon={Award}>
                            <Switch
                              checked={preferences.push_notifications ?? true}
                              onCheckedChange={(c) => handleUpdate('push_notifications', c)}
                              className="data-[state=checked]:bg-[#B500D1]"
                            />
                          </ControlWrapper>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Interfaz de Usuario</h4>
                        <div className="space-y-3">
                          <ControlWrapper label="Mensajes del Enlace" description="Nuevas comunicaciones de otros agentes o tutores." icon={Radio}>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#B500D1]" />
                          </ControlWrapper>
                          <ControlWrapper label="Protocolos Pendientes" description="Recordatorios automáticos de evaluaciones detectadas." icon={Clock}>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#B500D1]" />
                          </ControlWrapper>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-end">
                        <Button className="h-14 px-12 rounded-2xl bg-white/5 border-white/10 hover:bg-[#B500D1] hover:text-white text-white font-black uppercase tracking-widest transition-all">
                          Actualizar Protocolos
                        </Button>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: APARIENCIA --- */}
                {activeTab === "appearance" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Interfaz Visual"
                      description="Personalización del espectro lumínico de la plataforma"
                      icon={Palette}
                    />

                    <div className="space-y-10">
                      <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white/[0.06] transition-all">
                        <div className="flex gap-6 items-center text-center md:text-left">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-cyan-400 transition-colors shadow-2xl">
                            {theme === 'dark' ? <Moon size={32} /> : <Sun size={32} />}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Espectro de Tema</h4>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Actualmente en modo {theme === 'dark' ? 'Absorción' : 'Emisión'}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUpdate('theme', theme === "dark" ? "light" : "dark")}
                        className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-[#B500D1] hover:text-white transition-all shadow-xl"
                      >
                        Alternar Espectro
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Densidad de Datos</Label>
                        <Select
                          value={preferences.data_density || "comfortable"}
                          onValueChange={(v) => handleUpdate('data_density', v)}
                        >
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold uppercase tracking-wider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Modo Compacto</SelectItem>
                            <SelectItem value="comfortable">Modo Balanceado</SelectItem>
                            <SelectItem value="spacious">Modo Inmersivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Escala Tipográfica</Label>
                        <Select
                          value={preferences.font_scale || "medium"}
                          onValueChange={(v) => handleUpdate('font_scale', v)}
                        >
                          <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold uppercase tracking-wider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Nano</SelectItem>
                            <SelectItem value="medium">Standard</SelectItem>
                            <SelectItem value="large">Macro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ControlWrapper label="Dinámicas de Animación" description="Habilita el despliegue fluido de elementos estructurales." icon={Zap}>
                      <Switch
                        checked={preferences.animations ?? true}
                        onCheckedChange={(c) => handleUpdate('animations', c)}
                        className="data-[state=checked]:bg-[#B500D1]"
                      />
                    </ControlWrapper>

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <Button className="h-14 px-12 rounded-2xl bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest shadow-[0_0_25px_rgba(181,0,209,0.3)] transition-all">
                        Guardar Estética
                      </Button>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIÓN: SEGURIDAD --- */}
                {activeTab === "security" && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                    <SettingHeader
                      title="Protocolos de Defensa"
                      description="Seguridad de nivel militar para tu red neuronal"
                      icon={Shield}
                    />

                    <div className="space-y-10">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Cadena de Acceso (Password)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Código de Entrada Actual</Label>
                            <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Nuevo Código de Entrada</Label>
                            <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" />
                          </div>
                        </div>
                        <Button className="h-14 px-10 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                          Actualizar Cifrado
                        </Button>
                      </div>

                      <Separator className="bg-white/5" />

                      <ControlWrapper label="Acceso Biométrico" description="Utiliza el escáner dactilar o reconocimiento facial del host." icon={Fingerprint}>
                        <Button variant="outline" className="h-10 rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest">Configurar</Button>
                      </ControlWrapper>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[.4em] mb-6">Nodos de Acceso Activos</h4>
                        <div className="space-y-3">
                          {[
                            { device: "Chrome / Windows Alpha", loc: "Sector Lima, PE", time: "Now", current: true },
                            { device: "Safari / Neural Mobile", loc: "Sector Madrid, ES", time: "2 solar cycles ago", current: false },
                          ].map((session, idx) => (
                            <div key={idx} className="flex justify-between items-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-all">
                              <div className="flex gap-4 items-center">
                                <div className={`p-2 rounded-lg ${session.current ? 'bg-cyan-400/10 text-cyan-400' : 'bg-white/5 text-white/20'}`}>
                                  <Activity size={18} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-white uppercase tracking-wider">{session.device}</p>
                                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{session.loc} • {session.time}</p>
                                </div>
                              </div>
                              {!session.current && (
                                <Button variant="ghost" className="text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 h-10 px-4 rounded-xl">Cerrar</Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </MagicCard>
                )}

                {/* --- SECCIONES RESTANTES (HELP, GLOBAL, PRIVACY) USARÁN ESTRUCTURA SIMILAR --- */}
                {(activeTab === "help" || activeTab === "language" || activeTab === "privacy") && (
                  <MagicCard className="p-10 rounded-[3.5rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-[600px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#B500D1]/5 to-transparent animate-pulse" />
                    <div className="text-center relative z-10 space-y-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-[#B500D1]/10 border border-[#B500D1]/30 flex items-center justify-center text-[#B500D1] mx-auto mb-6 shadow-[0_0_50px_rgba(181,0,209,0.2)]">
                        <Zap size={40} className="animate-pulse" />
                      </div>
                      <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Módulo en Desarrollo</h3>
                      <p className="text-xs font-bold text-white/30 uppercase tracking-[0.4em]">Sincronizando protocolos finales...</p>
                      <Button variant="outline" className="mt-8 h-14 px-10 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest" onClick={() => setActiveTab('account')}>
                        Volver al Centro
                      </Button>
                    </div>
                  </MagicCard>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div >
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(181,0,209,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(181,0,209,0.4); }
      `}</style>
    </div >
  )
}
