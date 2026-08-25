import { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Camera, MapPin, Briefcase, GraduationCap, Clock, Users, ImageIcon, FileText, Zap, Star, Shield, Trophy, User, Cpu, BookOpen, TrendingUp } from "lucide-react"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { fetchUserProfile, updateUserProfile, UserProfile } from "@/lib/api/user"
import { fetchUserSkills, UserSkill as APIUserSkill } from "@/lib/api/skills"

// --- ANIMACIONES ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    },
  },
}

// --- SUB-COMPONENTES ---

const ProfileStat = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <motion.div
    variants={itemVariants}
    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group"
  >
    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-xl" style={{ color }}>
      <Icon size={20} />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</span>
      <span className="text-sm font-bold text-white uppercase italic">{value}</span>
    </div>
  </motion.div>
)

const SkillProgress = ({ label, value, color, delay }: { label: string, value: number, color: string, delay: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-white/40">{label}</span>
      <span style={{ color }}>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        className="h-full relative"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
      </motion.div>
    </div>
  </div>
)

// --- COMPONENTE PRINCIPAL ---

export function Profile() {
  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userSkills, setUserSkills] = useState<APIUserSkill[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    location: "",
    occupation: "",
    specialty: "",
    phone: "",
    website: ""
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const [userData, skillsData] = await Promise.all([
        fetchUserProfile(),
        fetchUserSkills()
      ])

      if (userData) {
        setProfile(userData)
        setFormData({
          full_name: userData.full_name || userData.username || "",
          email: userData.email || "",
          bio: userData.bio || "",
          location: userData.location || "No especificado",
          occupation: userData.occupation || "Estudiante",
          specialty: userData.specialty || "General",
          phone: userData.phone || "",
          website: userData.website || ""
        })
      }
      if (skillsData) {
        setUserSkills(skillsData)
      }
    } catch (error) {
      console.error("Error loading profile data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return;

    // Optimistic update
    const updatedProfile = { ...profile, ...formData, username: profile.username }; // username is readonly in UI usually
    setProfile(updatedProfile);
    setIsEditing(false);

    await updateUserProfile(formData);
    loadProfile(); // Reload to confirm
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen p-4 md:p-12 bg-transparent relative overflow-hidden">
      {/* Fondos Ambientales */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B500D1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header con Título */}
        <BlurFade delay={0.1} inView>
          <div className="flex flex-col gap-2 mb-12 pl-20 md:pl-0">
            <MagicTitle variant="sparkles" className="text-4xl md:text-7xl tracking-[0.2em] font-black uppercase">
              PERFIL
            </MagicTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl">
              <User size={14} className="text-[#B500D1]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Identidad Digital del Estudiante</span>
            </div>
          </div>
        </BlurFade>

        {/* Hero Section: Portada y Foto */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-20 group"
        >
          {/* Portada Premium */}
          <div className="h-64 md:h-80 rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0B0121] to-[#1a1a1a]" />
            <img
              src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Portada"
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0121] via-transparent to-transparent" />

            <Button
              variant="outline"
              className="absolute bottom-6 right-6 bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl gap-2 backdrop-blur-xl"
            >
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Cover</span>
            </Button>
          </div>

          {/* Avatar y Datos Básicos Flotantes */}
          <div className="absolute -bottom-10 left-8 md:left-12 flex flex-col md:flex-row items-end justify-between w-[calc(100%-4rem)] md:w-[calc(100%-6rem)] gap-6">
            <div className="flex flex-col md:flex-row items-end gap-6 self-start">
              <div className="relative group/avatar">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#B500D1] to-cyan-400 rounded-full blur-sm opacity-50 group-hover/avatar:opacity-100 transition-opacity duration-500" />
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-[#0B0121] relative z-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-white/10 to-white/5 font-black italic">{profile?.username?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                </Avatar>
                <Button size="sm" variant="secondary" className="absolute bottom-2 right-2 rounded-2xl w-10 h-10 p-0 z-20 bg-white text-black hover:bg-[#B500D1] hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </Button>
              </div>
              <div className="mb-4 text-center md:text-left">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter"
                >
                  {isLoading ? "Cargando..." : (profile?.full_name || profile?.username)}
                </motion.h1>
                <div className="flex items-center gap-3 justify-center md:justify-start mt-1">
                  <span className="text-[11px] font-black text-[#B500D1] uppercase tracking-[0.3em] bg-[#B500D1]/10 px-3 py-1 rounded-full border border-[#B500D1]/20">Estudiante Nivel 42</span>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,229,74,0.5)]" />
                </div>
              </div>
            </div>

            <div className="md:mb-4 w-full md:w-auto px-4 md:px-0 pointer-events-auto">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#B500D1] hover:bg-[#B500D1]/80 text-white rounded-2xl w-full md:w-auto md:px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(181,0,209,0.3)] transition-all active:scale-95"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Navegación por Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-12 bg-white/5 border border-white/5 p-1.5 rounded-[2.5rem] flex flex-wrap h-auto gap-2 backdrop-blur-3xl inline-flex w-auto max-w-full">
            <TabsTrigger value="info" className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-2">
              <FileText size={18} />
              Identidad
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-2">
              <GraduationCap size={18} />
              Trayectoria
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-2">
              <Users size={18} />
              Red
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-2">
              <ImageIcon size={18} />
              Archivo
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar con Datos Personales */}
            <div className="lg:col-span-1 space-y-8">
              <MagicCard className="p-8 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#B500D1]/10 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-700" />
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Módulos de Información</h3>
                <div className="grid grid-cols-1 gap-4">
                  <ProfileStat icon={MapPin} label="Ubicación" value={profile?.location || "N/A"} color="#00FFFF" />
                  <ProfileStat icon={Briefcase} label="Ocupación" value={profile?.occupation || "N/A"} color="#B500D1" />
                  <ProfileStat icon={GraduationCap} label="Especialidad" value={profile?.specialty || "N/A"} color="#00C49F" />
                  <ProfileStat icon={Clock} label="Registro" value={new Date(profile?.created_at || Date.now()).toLocaleDateString()} color="#FFBB28" />
                </div>
              </MagicCard>

              <MagicCard className="p-8 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-700" />
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Sincronización de Habilidades</h3>
                <div className="space-y-6 relative z-10">
                  {userSkills.length > 0 ? (
                    userSkills.slice(0, 5).sort((a, b) => b.level - a.level).map((skill, i) => (
                      <SkillProgress
                        key={skill.id}
                        label={skill.area}
                        value={skill.level}
                        color={i % 2 === 0 ? "#B500D1" : "#00FFFF"}
                        delay={0.2 + i * 0.1}
                      />
                    ))
                  ) : (
                    <div className="py-10 text-center opacity-30 italic text-xs">
                      No hay datos de diagnóstico sincronizados.
                    </div>
                  )}

                  <div className="pt-4 mt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Promedio de Empoderamiento</span>
                      <span className="text-xl font-black italic text-white">
                        {userSkills.length > 0
                          ? Math.round(userSkills.reduce((acc, s) => acc + s.level, 0) / userSkills.length)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </MagicCard>
            </div>

            {/* Contenido Principal de Tabs */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Pestaña: Información / Identidad */}
                  {activeTab === "info" && (
                    <MagicCard className="p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                      {isEditing ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Modificar Registro</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Nombre Completo</label>
                              <Input
                                value={formData.full_name}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                                className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 text-white font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Enlace de Comunicación (Email)</label>
                              <Input
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 text-white font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Ubicación</label>
                              <Input
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 text-white font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Ocupación</label>
                              <Input
                                value={formData.occupation}
                                onChange={(e) => handleChange('occupation', e.target.value)}
                                className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 text-white font-bold"
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Biografía del Sistema</label>
                              <textarea
                                value={formData.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 focus:border-[#B500D1]/50 text-white font-bold p-4"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-4 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest"
                            >
                              Abortar
                            </Button>
                            <Button
                              onClick={handleSave}
                              className="h-14 px-10 rounded-2xl bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest"
                            >
                              Sincronizar Datos
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {/* AI Cognitive Profile Card */}
                          {userSkills.length > 0 && userSkills.some(s => s.current_diagnosis) && (
                            <div className="mb-10 p-6 rounded-[2.5rem] bg-gradient-to-br from-[#B500D1]/20 to-cyan-500/5 border border-white/10 shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Cpu size={80} />
                              </div>

                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">DIAGNÓSTICO COGNITIVO RECIENTE</span>
                              </div>

                              {(() => {
                                const latestSkill = [...userSkills]
                                  .filter(s => s.current_diagnosis)
                                  .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())[0];

                                if (!latestSkill) return null;
                                const diagnosis = latestSkill.current_diagnosis;

                                return (
                                  <div className="space-y-4 relative z-10">
                                    <h4 className="text-xl md:text-2xl font-black text-white italic uppercase leading-tight">
                                      {diagnosis.razonamiento}
                                    </h4>
                                    <p className="text-sm text-white/60 leading-relaxed italic">
                                      "{diagnosis.observaciones}"
                                    </p>
                                    <div className="flex items-center gap-3 pt-2">
                                      <span className="text-[9px] font-black px-2 py-1 bg-white/10 rounded-md border border-white/5 text-white/50">
                                        ÁREA: {latestSkill.area.toUpperCase()}
                                      </span>
                                      <span className="text-[9px] font-black px-2 py-1 bg-cyan-400/10 rounded-md border border-cyan-400/20 text-cyan-400">
                                        CONFIANZA: {diagnosis.confianza || "94%"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <FileText className="text-[#B500D1]" size={20} />
                              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Memorándum Biográfico</h3>
                            </div>
                            <p className="text-white/50 text-sm leading-relaxed font-medium uppercase tracking-wider">
                              {profile?.bio || "Unidad biológica con alta afinidad por la ingeniería de software y la optimización de procesos digitales..."}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Protocolo de Contacto</span>
                              <p className="text-white font-bold italic truncate uppercase">{profile?.email || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Frecuencia Móvil</span>
                              <p className="text-white font-bold italic uppercase">{profile?.phone || "No Registrado"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Dominio Personal</span>
                              <p className="text-cyan-400 font-black italic uppercase underline decoration-cyan-400/30">{profile?.website || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Alias Digital</span>
                              <p className="text-white font-bold italic uppercase">@{profile?.username || "Usuario"}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </MagicCard>
                  )}

                  {/* Pestaña: Cursos / Trayectoria */}
                  {activeTab === "courses" && (
                    <MagicCard className="p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <GraduationCap className="text-[#B500D1]" size={24} />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Registro de Trayectoria</h3>
                      </div>
                      <div className="space-y-6">
                        {[
                          { title: "Matemáticas de Alta Densidad", instructor: "Dr. Pablo Sánchez", progress: 85, color: "#B500D1", icon: Zap },
                          { title: "Protocolos de Lógica Binaria", instructor: "Dra. Laura Gómez", progress: 60, color: "#00FFFF", icon: Cpu },
                          { title: "Historia de la Civilización Alpha", instructor: "Dr. Eduardo Torres", progress: 40, color: "#3B82F6", icon: BookOpen },
                        ].map((course, idx) => (
                          <motion.div
                            key={course.title}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={idx}
                            className="group p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300"
                          >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <course.icon size={20} style={{ color: course.color }} />
                                </div>
                                <div>
                                  <h4 className="font-black text-white uppercase tracking-wider italic text-sm">{course.title}</h4>
                                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{course.instructor}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10" style={{ color: course.color }}>
                                Status: {course.progress}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${course.progress}%` }}
                                className="h-full"
                                style={{ backgroundColor: course.color }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </MagicCard>
                  )}

                  {/* Pestaña: Amigos / Red */}
                  {activeTab === "friends" && (
                    <MagicCard className="p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <Users className="text-[#B500D1]" size={24} />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Nodos de Conexión (24)</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                          >
                            <Avatar className="w-20 h-20 mb-3 border-2 border-white/10">
                              <AvatarImage src={`https://i.pravatar.cc/150?u=user${i}`} />
                              <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                            <p className="font-black text-white uppercase tracking-widest text-[10px] italic">Agente {i + 101}</p>
                            <p className="text-[9px] text-white/30 uppercase font-bold tracking-tighter mt-1">Conectado</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-10 text-center">
                        <Button variant="outline" className="h-14 px-10 rounded-2xl bg-white/5 border-white/10 hover:bg-[#B500D1] hover:text-white text-white font-black uppercase tracking-widest transition-all">
                          Explorar Red Global
                        </Button>
                      </div>
                    </MagicCard>
                  )}

                  {/* Pestaña: Fotos / Archivo */}
                  {activeTab === "photos" && (
                    <MagicCard className="p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl h-full">
                      <div className="flex items-center gap-3 mb-8">
                        <ImageIcon className="text-[#B500D1]" size={24} />
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Archivo Visual (12)</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ scale: 1.05, rotate: 1 }}
                            className="aspect-square rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                          >
                            <img
                              src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?auto=format&fit=crop&w=300&q=80`}
                              alt={`Foto ${i}`}
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                            />
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-10 text-center">
                        <Button variant="outline" className="h-14 px-10 rounded-2xl bg-white/5 border-white/10 hover:bg-[#B500D1] hover:text-white text-white font-black uppercase tracking-widest transition-all">
                          Cargar Nuevas Unidades
                        </Button>
                      </div>
                    </MagicCard>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Tabs>

        {/* Banner de Logros Destacados */}
        <BlurFade delay={0.6} inView>
          <div className="mt-20 p-10 bg-gradient-to-br from-[#B500D1]/10 to-transparent border border-white/5 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Trophy size={160} strokeWidth={1} />
            </div>
            <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
              <div className="p-6 rounded-full bg-white/5 border border-white/10 shadow-2xl">
                <Shield size={40} className="text-[#00FFFF]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Estado de Protección de Datos</h4>
                <p className="text-sm text-white/40 font-bold uppercase tracking-wide leading-relaxed">
                  Tu perfil está actualmente encriptado bajo el protocolo SkillTech-X. Todas tus habilidades y trayectorias están seguras.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Star className="text-yellow-400 mb-2" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Reputación</span>
                  <span className="text-lg font-black italic text-white">A+</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                  <Zap className="text-cyan-400 mb-2" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Actividad</span>
                  <span className="text-lg font-black italic text-white">99</span>
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

      </div >

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}</style>
    </div >
  )
}
