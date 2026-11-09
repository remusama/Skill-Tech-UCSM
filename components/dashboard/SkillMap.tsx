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
  Target, Compass,
  TrendingUp, Clock, Info
} from "lucide-react"

import { GestoresOverworldMap } from "@/components/dashboard/GestoresOverworldMap"
import { useTheme } from "@/contexts/theme-context"
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
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
        theme === 'dark' ? 'bg-black/80 border-white/10 text-white' : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50'
      }`}>
        <p className="text-xs font-black uppercase tracking-widest text-[#d0b04d] mb-2">{label}</p>
        
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
              {entry.name}: <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const ChartHeader = ({ title, description, icon: Icon, theme }: any) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`p-3 rounded-2xl border shadow-md ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#d0b04d]/20 to-cyan-500/20 border-white/10' 
        : 'bg-gradient-to-br from-[#0d971f]/15 to-[#0d971f]/5 border-slate-300'
    }`}>
      <Icon className={`w-6 h-6 ${theme === 'dark' ? 'text-[#baef00]' : 'text-[#0d971f]'}`} />
    </div>
    <div className="flex flex-col">
      <h3 className={`text-xl font-black tracking-tight uppercase italic ${theme === 'dark' ? 'text-white' : 'text-[#01130d]'}`}>{title}</h3>
      <p className={`text-xs font-medium uppercase tracking-wider mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-600'}`}>{description}</p>
    </div>
  </div>
)

// --- COMPONENTE PRINCIPAL ---

export function SkillMap() {
  const [activeTab, setActiveTab] = useState("overworld")
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

  const colors = useMemo(() => ({
    primary: "#d0b04d",
    secondary: "#00FFFF", 
    accent: "#0d971f", 
    grid: theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)",
    text: theme === 'dark' ? "rgba(255, 255, 255, 0.6)" : "rgba(1, 19, 13, 0.8)",
  }), [theme])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (!mounted) return null

  return (
    <div className={`min-h-screen p-4 md:p-12 relative overflow-hidden w-full transition-colors duration-500 ${
      theme === 'dark' ? 'bg-[#02150e] text-white' : 'bg-[#f4f7f5] text-[#01130d]'
    }`}>
      {/* Luces de fondo ambientales */}
      <div className={`absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] pointer-events-none transition-colors duration-500 ${
        theme === 'dark' ? 'bg-[#d0b04d]/10' : 'bg-[#d0b04d]/20'
      }`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] pointer-events-none transition-colors duration-500 ${
        theme === 'dark' ? 'bg-[#0d971f]/10' : 'bg-[#0d971f]/15'
      }`} />

      <div className="relative z-10 mb-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <BlurFade delay={0.1} inView>
              <h1 className={`text-4xl md:text-7xl tracking-[0.2em] font-black ${
                theme === 'dark' ? 'text-white' : 'text-[#01130d]'
              }`}>
                SKILLMAP
              </h1>
            </BlurFade>
            
            <div className="h-[2px] w-48 bg-gradient-to-r from-[#baef00] to-[#032318] mb-4" />
          </div>

          {gamification && (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <StreakFire count={gamification.streak_count} />
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className={`mb-8 p-1.5 rounded-[2rem] flex flex-wrap h-auto gap-2 backdrop-blur-3xl inline-flex w-auto max-w-full shadow-md border ${
          theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-[#e8e8e6] border-slate-300 shadow-slate-300/60'
        }`}>
          {[
            { id: 'overworld', icon: Compass, label: 'Ruta de Gestores (10 Sesiones)' },
            { id: 'comparison', icon: BarChart2, label: 'Benchmarking' }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={`rounded-[1.5rem] px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-500 gap-3 border border-transparent data-[state=active]:bg-[#0d971f] data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(13,151,31,0.4)] ${
                theme === 'dark' ? 'text-white/70' : 'text-[#01130d]'
              }`}
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
            {activeTab === "overworld" && (
              <div className="w-full">
                <GestoresOverworldMap />
              </div>
            )}

            {activeTab === "comparison" && (
              <MagicCard 
                style={theme !== 'dark' ? { backgroundColor: '#e8e8e6' } : undefined}
                className={`backdrop-blur-3xl p-10 rounded-[2.5rem] w-full shadow-xl border ${
                  theme === 'dark' ? 'bg-white/5 border-white/5' : 'border-slate-300 shadow-slate-300/50'
                }`}
              >
                <ChartHeader
                  title="Análisis Comparativo"
                  description="Posicionamiento relativo frente a la media del sistema"
                  icon={Target}
                  theme={theme}
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
                        fill={theme === 'dark' ? "rgba(255,255,255,0.08)" : "rgba(1, 19, 13, 0.15)"}
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
    </div>
  )
}