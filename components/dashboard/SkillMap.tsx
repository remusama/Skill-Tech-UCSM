"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart
} from "recharts"
import {
  BarChart2, PieChartIcon, Activity, LineChartIcon,
  Sparkles, GraduationCap, UserCircle, Target,
  TrendingUp, Clock, Info
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"
import { fetchUserSkills, UserSkill, fetchProgressHistory, fetchBenchmarking } from "@/lib/api/skills"
import { StreakFire } from "./StreakFire"
import { API_URL } from "@/lib/config"


// --- SUB-COMPONENTES ESTILIZADOS ---

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl ${
        theme === 'dark' ? 'bg-black/80' : 'bg-white/80'
      }`}>
        
        <p className="text-xs font-black uppercase tracking-widest text-[#d0b04d] mb-2">{label}</p>
        
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-xs font-bold text-white/80">
              {entry.name}: <span className="text-white">{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const ChartHeader = ({ title, description, icon: Icon }: any) => (
  <div className="flex items-start gap-4 mb-6">
   
    <div className="p-3 rounded-2xl bg-gradient-to-br from-[#d0b04d]/20 to-cyan-500/20 border border-white/10 shadow-lg">
      
      <Icon className="w-6 h-6 text-[#d0b04d]" />
    </div>
    <div className="flex flex-col">
      <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{title}</h3>
      <p className="text-xs text-white/40 font-medium uppercase tracking-wider mt-1">{description}</p>
    </div>
  </div>
)

// --- COMPONENTE PRINCIPAL ---

export function SkillMap() {
  const [activeTab, setActiveTab] = useState("matrix")

  const [mounted, setMounted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [benchmarking, setBenchmarking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gamification, setGamification] = useState<any>(null)
  const { theme } = useTheme()

  const loadSkills = useCallback(async () => {
    setLoading(true)
    try {
      const [skillsData, historyData, benchmarkingData] = await Promise.all([
        fetchUserSkills(),
        fetchProgressHistory(),
        fetchBenchmarking()
      ]);

      if (skillsData.length > 0) setSkills(skillsData);
      if (historyData.length > 0) setHistory(historyData);
      if (benchmarkingData.length > 0) setBenchmarking(benchmarkingData);

      // Fetch Gamification
      const gResp = await fetch(`${API_URL}/gamification/status`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("eleonor_token")}` }
      });
      if (gResp.ok) setGamification(await gResp.json());

    } catch (e) {
      console.error("Error loading SkillMap data:", e);
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setMounted(true)
    loadSkills()

    const handleUpdate = () => {
      console.log("🔄 SkillMap: Refrescando por evento externo...");
      loadSkills();
    };
    window.addEventListener('skills-updated', handleUpdate);
    return () => window.removeEventListener('skills-updated', handleUpdate);
  }, [loadSkills, refreshKey])


  // Utility to normalize strings for comparison (remove accents and casing)
  const normalize = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  const isSoftSkill = (area: string) => {
    const softKeywords = ["razonamiento", "aprendizaje", "criterio", "adaptabilidad", "autonomia", "cognitivo", "pensamiento", "metacognicion", "flexibilidad", "autogestion", "liderazgo", "equipo", "creatividad", "actuacion"];
    const norm = normalize(area);
    return softKeywords.some(kw => norm.includes(kw));
  }

  // Mapping DB skills to the Chart format dynamically
  const academicData = useMemo(() => {
    const academicSkills = skills.filter(s => !isSoftSkill(s.area));
    if (academicSkills.length === 0) return [{ subject: "Sin Evaluaciones", A: 0, fullMark: 10 }];
    
    return academicSkills.map(s => ({
      subject: s.area,
      A: s.level / 10,
      fullMark: 10
    }));
  }, [skills])

  const softSkillsData = useMemo(() => {
    const softSkills = skills.filter(s => isSoftSkill(s.area));
    if (softSkills.length === 0) return [{ subject: "Sin Evaluaciones", A: 0, fullMark: 10 }];
    
    return softSkills.map(s => ({
      subject: s.area,
      A: s.level / 10,
      fullMark: 10
    }));
  }, [skills])


  const colors = useMemo(() => ({
  primary: "#d0b04d", // 
  secondary: "#00FFFF", 
  accent: "#0d971f", 
  grid: "rgba(255, 255, 255, 0.05)",
  text: "rgba(255, 255, 255, 0.6)",
  }), [])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (!mounted) return null

return (
    <div className="min-h-screen p-4 md:p-12 bg-transparent relative overflow-hidden w-full">
      {/* Fondo Ambientales con tonos dorado y verde */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d0b04d]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0d971f]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Principal sin padding lateral forzado que rompa el ancho */}
      <div className="relative z-10 mb-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <BlurFade delay={0.1} inView>
              <h1 className="text-4xl md:text-7xl tracking-[0.2em] font-black text-white">
                SKILLMAP
              </h1>
            </BlurFade>
            
            {/* Tu única línea con el degradado correcto */}
            <div className="h-[2px] w-48 bg-gradient-to-r from-[#baef00] to-[#032318] mb-4" />
            
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-[#0d971f] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Análisis en tiempo real habilitado</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {gamification && <StreakFire count={gamification.streak_count} />}

          <Button
            variant="default"
            onClick={() => window.dispatchEvent(new CustomEvent('restart-onboarding'))}
            className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-[#d0b04d]/50 text-white rounded-2xl h-14 px-8 transition-all duration-500 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#d0b04d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-4 h-4 mr-3 transition-transform duration-300 group-hover:scale-110 text-[#d0b04d]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Repetir Onboarding</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className="mb-12 bg-white/5 border border-white/5 p-1.5 rounded-[2rem] flex flex-wrap h-auto gap-2 backdrop-blur-3xl inline-flex w-auto max-w-full">
          {[
            { id: 'matrix', icon: Activity, label: 'Matriz de Habilidades' },
            { id: 'comparison', icon: BarChart2, label: 'Benchmarking' }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-[#0d971f] data-[state=active]:text-white text-white/70 rounded-[1.5rem] px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 gap-3 border border-transparent data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.4)]"
            >
              <tab.icon size={16} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + refreshKey}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {/* TABS CONTENT: MATRIX */}
            {activeTab === "matrix" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                <MagicCard className="bg-white/5 backdrop-blur-3xl border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <ChartHeader
                    title="Académico"
                    description="Distribución de competencias en áreas troncales"
                    icon={GraduationCap}
                  />
                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={academicData}>
                        <defs>
                          <linearGradient id="colorRadar" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#0d971f" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#d0b04d" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke={colors.grid} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: colors.text, fontSize: 10, fontWeight: 'bold' }}
                        />
                        <Radar
                          name="Nivel"
                          dataKey="A"
                          stroke="#0d971f"
                          strokeWidth={2}
                          fill="url(#colorRadar)"
                          fillOpacity={0.6 + (academicData.reduce((acc, curr: any) => acc + (curr.xp || 0), 0) / 1000 * 0.4)}
                        />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </MagicCard>

                <MagicCard className="bg-white/5 backdrop-blur-3xl border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <ChartHeader
                    title="Soft Skills"
                    description="Atributos personales y sociales analizados"
                    icon={UserCircle}
                  />
                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={softSkillsData}>
                        <defs>
                          <linearGradient id="colorRadarSoft" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#d0b04d" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#0d971f" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <PolarGrid stroke={colors.grid} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: colors.text, fontSize: 10, fontWeight: 'bold' }}
                        />
                        <Radar
                          name="Nivel"
                          dataKey="A"
                          stroke="#d0b04d"
                          strokeWidth={2}
                          fill="url(#colorRadarSoft)"
                          fillOpacity={0.6}
                        />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </MagicCard>
              </div>
            )}

            {/* TABS CONTENT: COMPARISON */}
            {activeTab === "comparison" && (
              <MagicCard className="bg-white/5 backdrop-blur-3xl border-white/5 p-10 rounded-[2.5rem] w-full">
                <ChartHeader
                  title="Análisis Comparativo"
                  description="Posicionamiento relativo frente a la media del sistema"
                  icon={Target}
                />
                <div className="h-[450px] w-full mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={benchmarking} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barGap={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.text, fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis
                        domain={[0, 10]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.text, fontSize: 11, fontWeight: '900' }}
                      />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Legend wrapperStyle={{ paddingTop: 40, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} />
                      <Bar
                        dataKey="Nivel"
                        name="Tu Rendimiento"
                        fill="#0d971f"
                        radius={[20, 20, 0, 0]}
                        barSize={35}
                      />
                      <Bar
                        dataKey="Promedio"
                        name="Media Global"
                        fill="rgba(255,255,255,0.08)"
                        radius={[20, 20, 0, 0]}
                        barSize={35}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </MagicCard>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Guía de Interpretación Inferior */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-20 p-12 bg-white/5 backdrop-blur-[100px] border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden w-full"
      >
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
          <Info size={120} strokeWidth={1} />
        </div>

        <div className="flex flex-col md:flex-row gap-12 relative z-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d971f]/20 rounded-full border border-[#0d971f]/20 mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0d971f]">Intelligence Insight</span>
            </div>
            <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Interpretación del SkillMap</h3>
            <p className="text-sm text-white/60 leading-relaxed font-medium">
              Tu SkillMap es un ecosistema dinámico que evoluciona con cada interacción. Está diseñado para proporcionarte una ventaja estratégica identificando no solo lo que sabes, sino cómo tu potencial se está expandiendo en múltiples dimensiones.
            </p>
          </div>

          <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Matriz Radar",
                txt: "Permite ver el equilibrio entre tus fortalezas técnicas y tu inteligencia emocional.",
                color: "text-[#0d971f]"
              },
              {
                title: "Benchmark",
                txt: "Comprende tu posición respecto a los niveles globales para optimizar tu especialización.",
                color: "text-[#d0b04d]"
              }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-colors duration-500 group">
                <h4 className={`font-black uppercase tracking-widest text-[11px] mb-2 ${item.color} group-hover:scale-105 transition-transform origin-left`}>
                  {item.title}
                </h4>
                <p className="text-[11px] text-white/40 leading-relaxed font-bold tracking-tight">
                  {item.txt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
