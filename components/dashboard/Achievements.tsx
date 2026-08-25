"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Calculator,
  FlaskRoundIcon as Flask,
  Cpu,
  Music,
  Activity,
  Theater,
  CheckCircle,
  Lock,
  Award,
  BookOpen,
  Sparkles,
  Zap,
  Star
} from "lucide-react"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { MagicCard } from "@/components/ui/magic-card"

// --- TIPOS ---
type Achievement = {
  id: string
  title: string
  description: string
  level: number
  maxLevel: number
  unlocked: boolean
  icon: React.ElementType
}

type SkillCategory = {
  id: string
  name: string
  icon: React.ElementType
  color: string
  achievements: Achievement[]
}

// --- DATOS ---
const ACADEMIC_SKILLS: SkillCategory[] = [
  {
    id: "communication",
    name: "Comunicación",
    icon: MessageSquare,
    color: "#FF8042",
    achievements: [
      { id: "clear-voice", title: "Voz Clara", description: "Comunicas ideas con claridad y precisión", level: 8, maxLevel: 10, unlocked: true, icon: MessageSquare },
      { id: "internal-narrator", title: "Narrador Interno", description: "Desarrollas un estilo narrativo propio", level: 6, maxLevel: 10, unlocked: true, icon: MessageSquare },
      { id: "ideas-bridge", title: "Puente de Ideas", description: "Conectas conceptos complejos de forma accesible", level: 4, maxLevel: 10, unlocked: true, icon: MessageSquare },
      { id: "active-listening", title: "Escucha Activa", description: "Comprendes y respondes efectivamente a otros", level: 7, maxLevel: 10, unlocked: true, icon: MessageSquare },
      { id: "speaker-training", title: "Orador en Formación", description: "Presentas ante grupos con confianza creciente", level: 3, maxLevel: 10, unlocked: false, icon: MessageSquare },
    ],
  },
  {
    id: "math",
    name: "Matemática",
    icon: Calculator,
    color: "#0088FE",
    achievements: [
      { id: "logical-mind", title: "Mente Lógica", description: "Resuelves problemas con pensamiento estructurado", level: 9, maxLevel: 10, unlocked: true, icon: Calculator },
      { id: "number-architect", title: "Arquitecto de Números", description: "Construyes soluciones matemáticas elegantes", level: 7, maxLevel: 10, unlocked: true, icon: Calculator },
      { id: "analytical-vision", title: "Visión Analítica", description: "Analizas datos y patrones con precisión", level: 6, maxLevel: 10, unlocked: true, icon: Calculator },
      { id: "challenge-solved", title: "Desafío Resuelto", description: "Superas problemas matemáticos complejos", level: 5, maxLevel: 10, unlocked: true, icon: Calculator },
      { id: "method-master", title: "Maestro del Método", description: "Dominas técnicas matemáticas avanzadas", level: 2, maxLevel: 10, unlocked: false, icon: Calculator },
    ],
  },
  {
    id: "science",
    name: "Ciencia",
    icon: Flask,
    color: "#00C49F",
    achievements: [
      { id: "natural-curious", title: "Curioso Natural", description: "Exploras el mundo con preguntas constantes", level: 8, maxLevel: 10, unlocked: true, icon: Flask },
      { id: "empirical-explorer", title: "Explorador Empírico", description: "Realizas experimentos para probar teorías", level: 6, maxLevel: 10, unlocked: true, icon: Flask },
      { id: "deduction-light", title: "Luz de la Deducción", description: "Extraes conclusiones lógicas de observaciones", level: 5, maxLevel: 10, unlocked: true, icon: Flask },
      { id: "scientific-mentor", title: "Mentor Científico", description: "Compartes conocimiento científico con otros", level: 3, maxLevel: 10, unlocked: false, icon: Flask },
      { id: "hypothesis-builder", title: "Constructor de Hipótesis", description: "Formulas teorías basadas en evidencia", level: 4, maxLevel: 10, unlocked: true, icon: Flask },
    ],
  },
  {
    id: "technology",
    name: "Tecnología",
    icon: Cpu,
    color: "#FFBB28",
    achievements: [
      { id: "digital-apprentice", title: "Aprendiz Digital", description: "Adoptas nuevas tecnologías con facilidad", level: 9, maxLevel: 10, unlocked: true, icon: Cpu },
      { id: "computational-thinker", title: "Pensador Computacional", description: "Descompones problemas en pasos lógicos", level: 8, maxLevel: 10, unlocked: true, icon: Cpu },
      { id: "code-creator", title: "Creador de Código", description: "Programas soluciones funcionales", level: 7, maxLevel: 10, unlocked: true, icon: Cpu },
      { id: "practical-innovator", title: "Innovador Práctico", description: "Aplicas tecnología para resolver problemas reales", level: 6, maxLevel: 10, unlocked: true, icon: Cpu },
      { id: "engineer-process", title: "Ingeniero en Proceso", description: "Diseñas sistemas tecnológicos complejos", level: 4, maxLevel: 10, unlocked: false, icon: Cpu },
    ],
  },
]

const PERSONAL_SKILLS: SkillCategory[] = [
  {
    id: "music",
    name: "Música",
    icon: Music,
    color: "#FF00FF",
    achievements: [
      { id: "open-ear", title: "Oído Abierto", description: "Aprecias diversos géneros y estilos musicales", level: 7, maxLevel: 10, unlocked: true, icon: Music },
      { id: "rhythmic-soul", title: "Alma Rítmica", description: "Mantienes el ritmo y tempo con precisión", level: 6, maxLevel: 10, unlocked: true, icon: Music },
      { id: "sound-interpreter", title: "Intérprete del Sonido", description: "Tocas un instrumento con técnica creciente", level: 5, maxLevel: 10, unlocked: true, icon: Music },
      { id: "harmonic-voice", title: "Voz en Armonía", description: "Cantas con afinación y expresividad", level: 3, maxLevel: 10, unlocked: false, icon: Music },
      { id: "sound-creator", title: "Creador Sonoro", description: "Compones piezas musicales originales", level: 2, maxLevel: 10, unlocked: false, icon: Music },
    ],
  },
  {
    id: "sports",
    name: "Deporte",
    icon: Activity,
    color: "#8884D8",
    achievements: [
      { id: "body-movement", title: "Cuerpo en Movimiento", description: "Mantienes actividad física regular", level: 8, maxLevel: 10, unlocked: true, icon: Activity },
      { id: "team-spirit", title: "Espíritu de Equipo", description: "Colaboras efectivamente en deportes grupales", level: 7, maxLevel: 10, unlocked: true, icon: Activity },
      { id: "disciplined-energy", title: "Energía Disciplinada", description: "Entrenas con constancia y método", level: 6, maxLevel: 10, unlocked: true, icon: Activity },
      { id: "limit-surpasser", title: "Superador de Límites", description: "Superas marcas personales con perseverancia", level: 5, maxLevel: 10, unlocked: true, icon: Activity },
      { id: "developing-athlete", title: "Atleta en Desarrollo", description: "Perfeccionas técnicas deportivas específicas", level: 3, maxLevel: 10, unlocked: false, icon: Activity },
    ],
  },
  {
    id: "acting",
    name: "Actuación",
    icon: Theater,
    color: "#82CA9D",
    achievements: [
      { id: "stage-presence", title: "Presencia Escénica", description: "Proyectas confianza ante el público", level: 4, maxLevel: 10, unlocked: true, icon: Theater },
      { id: "living-narrator", title: "Narrador Viviente", description: "Cuentas historias con expresividad", level: 5, maxLevel: 10, unlocked: true, icon: Theater },
      { id: "intentional-voice", title: "Voz con Intención", description: "Modulas tu voz para transmitir emociones", level: 4, maxLevel: 10, unlocked: true, icon: Theater },
      { id: "emotion-movement", title: "Emoción en Movimiento", description: "Expresas sentimientos a través del cuerpo", level: 3, maxLevel: 10, unlocked: false, icon: Theater },
      { id: "character-creator", title: "Creador de Personajes", description: "Desarrollas personajes complejos y creíbles", level: 2, maxLevel: 10, unlocked: false, icon: Theater },
    ],
  },
]

// --- SUB-COMPONENTES ---

const AchievementItem = ({ achievement, categoryColor, index }: { achievement: Achievement, categoryColor: string, index: number }) => {
  const percentage = (achievement.level / achievement.maxLevel) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 5 }}
      className={`group relative p-5 rounded-[2rem] border transition-all duration-500 overflow-hidden ${achievement.unlocked
        ? 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'
        : 'bg-black/20 border-white/5 opacity-60 grayscale'
        }`}
    >
      {/* Glow Effect on Hover */}
      {achievement.unlocked && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${categoryColor}15 0%, transparent 70%)` }}
        />
      )}

      <div className="flex items-center gap-5 relative z-10">
        {/* Icon Container */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${achievement.unlocked
            ? 'bg-gradient-to-br from-white/10 to-white/5 shadow-xl border border-white/10'
            : 'bg-white/5'
            }`}>
            <achievement.icon
              size={24}
              className={`transition-all duration-500 ${achievement.unlocked ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/20'
                }`}
              style={achievement.unlocked ? { color: categoryColor } : {}}
            />
          </div>
          {achievement.unlocked ? (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4AE54A] rounded-full flex items-center justify-center border-2 border-[#0B0121] shadow-lg">
              <CheckCircle size={10} className="text-white" />
            </div>
          ) : (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center border-2 border-[#0B0121]">
              <Lock size={10} className="text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`text-sm font-black uppercase tracking-widest truncate ${achievement.unlocked ? 'text-white' : 'text-white/20'
              }`}>
              {achievement.title}
            </h4>
            {achievement.unlocked && (
              <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
                LVL <span className="text-white">{achievement.level}</span>
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight leading-tight mb-3 line-clamp-1">
            {achievement.description}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em]">
              <span className="text-white/20">Progreso Operativo</span>
              <span className="text-white/40">{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full relative"
                style={{ backgroundColor: achievement.unlocked ? categoryColor : '#222' }}
              >
                {achievement.unlocked && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const CategorySection = ({ category }: { category: SkillCategory }) => {
  return (
    <MagicCard
      className="bg-white/[0.02] backdrop-blur-3xl border-white/5 p-8 rounded-[3rem] relative overflow-hidden h-full group"
      gradientColor={category.color}
      gradientOpacity={0.05}
    >
      <div className="flex items-center gap-4 mb-8">
        <div
          className="p-4 rounded-[1.5rem] border border-white/10 shadow-2xl transition-transform duration-500 group-hover:rotate-6"
          style={{ backgroundColor: `${category.color}15` }}
        >
          <category.icon size={26} style={{ color: category.color }} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{category.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: category.color }} />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Sector Identificado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {category.achievements.map((achievement, idx) => (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            categoryColor={category.color}
            index={idx}
          />
        ))}
      </div>
    </MagicCard>
  )
}

// --- MAIN COMPONENT ---

export function Achievements() {
  const [activeTab, setActiveTab] = useState("academic")
  const data = useMemo(() => activeTab === "academic" ? ACADEMIC_SKILLS : PERSONAL_SKILLS, [activeTab])

  return (
    <div className="w-full h-full p-4 md:p-12 relative overflow-hidden">
      {/* Ambient Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#B500D1]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <BlurFade delay={0.1} inView>
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 relative z-10 pl-20 md:pl-0">
          <div className="flex flex-col gap-2">
            <MagicTitle variant="sparkles" className="text-4xl md:text-7xl tracking-[0.2em] font-black uppercase">
              LOGROS
            </MagicTitle>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl">
              <Award size={14} className="text-[#B500D1]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Registro de Habilidades y Desafíos</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-3xl">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Global Rank</span>
              <span className="text-xl font-black text-white italic">#1,248</span>
            </div>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total XP</span>
              <span className="text-xl font-black text-[#B500D1] italic">45.2k</span>
            </div>
          </div>
        </div>
      </BlurFade>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className="mb-12 bg-white/5 border border-white/5 p-1.5 rounded-[2.5rem] flex flex-wrap h-auto gap-2 backdrop-blur-3xl inline-flex w-auto max-w-full">
          <TabsTrigger
            value="academic"
            className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-3 border border-transparent data-[state=active]:shadow-[0_0_25px_rgba(181,0,209,0.3)]"
          >
            <BookOpen size={18} />
            Estructuras Académicas
          </TabsTrigger>
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-[#B500D1] data-[state=active]:text-white rounded-[2rem] px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 gap-3 border border-transparent data-[state=active]:shadow-[0_0_25px_rgba(181,0,209,0.3)]"
          >
            <Star size={18} />
            Potencial Personal
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {data.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Footer Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-20 p-10 bg-gradient-to-br from-[#B500D1]/10 to-transparent border border-white/5 rounded-[3rem] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
          <Sparkles size={140} strokeWidth={1} />
        </div>
        <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
          <div className="p-6 rounded-full bg-white/5 border border-white/10 shadow-2xl">
            <Zap size={40} className="text-[#B500D1]" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Desbloquea tu Siguiente Nivel</h4>
            <p className="text-sm text-white/40 font-bold uppercase tracking-wide leading-relaxed">
              Cada interacción con Eleonor y cada examen completado alimenta este sistema de logros. Mantén la consistencia para ver cómo tu aura de habilidades crece.
            </p>
          </div>
          <Button className="bg-white text-black font-black uppercase tracking-widest px-10 h-16 rounded-[1.5rem] hover:bg-[#B500D1] hover:text-white transition-all duration-500 shadow-2xl">
            Ver Próximos Retos
          </Button>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
        }
      `}</style>
    </div>
  )
}
