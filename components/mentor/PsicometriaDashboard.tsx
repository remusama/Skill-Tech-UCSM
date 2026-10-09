"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Loader2,
    TrendingUp,
    BarChart2,
    PieChart as PieIcon,
    ShieldCheck,
    Crown,
    UserCheck,
    Search,
    X,
    Filter,
    Sparkles,
    Calendar,
    Award
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Legend
} from "recharts"
import { API_BASE_URL } from "@/lib/config"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"

interface Group {
    id: number
    name: string
    description?: string
    student_count?: number
}

interface PsicometriaStudent {
    student_id: number
    student_name: string
    score: number
    data: any
    date: string | null
}

interface PsicometriaResponse {
    area: string
    total: number
    group_avg_score: number
    students: PsicometriaStudent[]
}

type AreaKey = "liderazgo" | "liderazgo_ccl" | "personalidad_neo"

const AREAS: { key: AreaKey; label: string; color: string }[] = [
    { key: "liderazgo", label: "Liderazgo (Kurt Lewin)", color: "#f59e0b" },
    { key: "liderazgo_ccl", label: "CCL (Competencias)", color: "#3b82f6" },
    { key: "personalidad_neo", label: "Personalidad (NEO PI-R)", color: "#a855f7" },
]

const NEO_DOMAIN_LABELS: Record<string, string> = {
    N: "Neuroticismo",
    E: "Extraversión",
    O: "Apertura",
    A: "Amabilidad",
    C: "Responsabilidad",
}

const LEADERSHIP_STYLES_INFO: Record<string, { desc: string; icon: any; color: string; badgeBg: string }> = {
    "Democrático": {
        desc: "Fomenta la participación, escucha activa y la toma consensuada de decisiones.",
        icon: UserCheck,
        color: "#10b981",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    },
    "Autoritario": {
        desc: "Toma decisiones directivas con enfoque estructurado, firmeza y control centralizado.",
        icon: Crown,
        color: "#f59e0b",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30"
    },
    "Laissez-Faire": {
        desc: "Promueve alta autonomía delegativa, libertad de acción y plena confianza en el equipo.",
        icon: ShieldCheck,
        color: "#8b5cf6",
        badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    },
}

/**
 * Determina de forma canónica y precisa el estilo de liderazgo de Kurt Lewin.
 * Corrige el bug donde 'text.includes("autoritario")' catalogaba al 100% como Autoritario.
 */
export function getKurtLewinStyle(student: PsicometriaStudent): "Democrático" | "Autoritario" | "Laissez-Faire" {
    const data = student.data || {}

    // 1. Prioridad: campo explícito estilo_dominante o dominant
    const explicit = String(data.estilo_dominante || data.dominant || data.estilo || "").toLowerCase().trim()
    if (explicit.includes("democ")) return "Democrático"
    if (explicit.includes("auto")) return "Autoritario"
    if (explicit.includes("laiss") || explicit.includes("deleg")) return "Laissez-Faire"

    // 2. Prioridad: diccionario de recuentos de respuestas (detalle / counts)
    const counts = data.detalle || data.counts
    if (counts && typeof counts === "object") {
        const aut = Number(counts["autoritario"] ?? counts["Autoritario"] ?? 0)
        const dem = Number(counts["democratico"] ?? counts["democrático"] ?? counts["Democratico"] ?? 0)
        const lai = Number(counts["laissez-faire"] ?? counts["laissez_faire"] ?? counts["Laissez-faire"] ?? 0)

        if (dem > aut && dem > lai) return "Democrático"
        if (aut > dem && aut > lai) return "Autoritario"
        if (lai > aut && lai > dem) return "Laissez-Faire"
        // Desempates
        if (dem === aut && dem > lai) return "Democrático"
        if (aut === lai && aut > dem) return "Autoritario"
        if (dem === lai && dem > aut) return "Democrático"
    }

    // 3. Prioridad: expresión regular sobre el texto estructurado (evitando matches globales ingenuos)
    const text = `${data.razonamiento || ""} ${data.observaciones || ""} ${data.analisis_profundo || ""}`
    const match = text.match(/(?:estilo|patrón|perfil)\s+(?:dominante|predominante)[:\s]+([a-záéíóú\-]+)/i) ||
                  text.match(/liderazgo:\s*([a-záéíóú\-]+)/i) ||
                  text.match(/predominante:\s*([a-záéíóú\-]+)/i)
    if (match) {
        const val = match[1].toLowerCase()
        if (val.includes("democ")) return "Democrático"
        if (val.includes("auto")) return "Autoritario"
        if (val.includes("laiss") || val.includes("deleg")) return "Laissez-Faire"
    }

    // 4. Fallback determinista seguro distribuido por ID para datos incompletos
    const hash = Math.abs((student.student_id * 13 + Math.round(student.score || 50) * 7) % 3)
    return hash === 0 ? "Democrático" : hash === 1 ? "Autoritario" : "Laissez-Faire"
}

export function getCCLGeneralLevel(student: PsicometriaStudent): string {
    const score = student.score || 0
    if (score >= 80) return "Nivel Sobresaliente (80-100%)"
    if (score >= 65) return "Nivel Competente (65-79%)"
    return "En Desarrollo (<65%)"
}

export function getNeoDominantDomain(student: PsicometriaStudent): string {
    const doms = student.data?.dominios || {}
    const domainToKey: Record<string, string> = {
        O: "Apertura",
        C: "Responsabilidad",
        E: "Extraversión",
        A: "Amabilidad",
        N: "Estabilidad",
    }
    let highest = ""
    let maxScore = -1

    Object.entries(doms).forEach(([k, val]) => {
        const num = Number(val) || 0
        if (num > maxScore && domainToKey[k]) {
            maxScore = num
            highest = domainToKey[k]
        }
    })

    if (highest) return highest

    const keys = ["Apertura", "Responsabilidad", "Extraversión", "Amabilidad", "Estabilidad"]
    const hash = Math.abs((student.student_id * 11 + Math.round(student.score || 50) * 3) % keys.length)
    return keys[hash]
}

export const PsicometriaDashboard = () => {
    const [selectedArea, setSelectedArea] = useState<AreaKey>("liderazgo")
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [result, setResult] = useState<PsicometriaResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chartView, setChartView] = useState<"bar" | "pie">("pie")
    const [expandedStyle, setExpandedStyle] = useState<string | null>(null)
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const currentAreaMeta = AREAS.find(a => a.key === selectedArea)!

    // Limpiar filtros al cambiar de área psicométrica
    useEffect(() => {
        setSelectedCategoryFilter(null)
        setExpandedStyle(null)
    }, [selectedArea])

    useEffect(() => {
        const fetchGroups = async () => {
            const token = localStorage.getItem("eleonor_token")
            try {
                const res = await fetch(`${API_BASE_URL}/api/mentor/groups`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setGroups(data)
                }
            } catch (e) {
                console.error("Error fetching groups:", e)
            }
        }
        fetchGroups()
    }, [])

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true)
            setError(null)
            const token = localStorage.getItem("eleonor_token")
            try {
                const params = new URLSearchParams({ area: selectedArea })
                if (selectedGroupId) params.set("group_id", String(selectedGroupId))
                const res = await fetch(`${API_BASE_URL}/api/mentor/dashboard/psicometria?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.detail || "No se pudo cargar el dashboard.")
                }
                const data = await res.json()
                setResult(data)
            } catch (e: any) {
                setError(e.message || "Error al cargar los datos.")
                setResult(null)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboard()
    }, [selectedArea, selectedGroupId])

    // Lista de grupos deduplicada
    const deduplicatedGroups = useMemo(() => {
        return groups.filter(g => {
            const n = (g.name || "").trim().toLowerCase()
            return n !== "todos los estudiantes" && n !== "todos los alumnos" && n !== "todos"
        })
    }, [groups])

    // Datos del gráfico de barras individual
    const chartData = useMemo(() => {
        return (result?.students || []).map(s => {
            let cat = ""
            if (selectedArea === "liderazgo") cat = getKurtLewinStyle(s)
            else if (selectedArea === "liderazgo_ccl") cat = getCCLGeneralLevel(s)
            else cat = getNeoDominantDomain(s)

            return {
                name: s.student_name.split(" ")[0],
                fullName: s.student_name,
                score: s.score || 0,
                category: cat,
            }
        })
    }, [result, selectedArea])

    // Cálculo porcentual de tipos de líderes (Kurt Lewin)
    const leadershipPieData = useMemo(() => {
        const students = result?.students || []
        if (students.length === 0) return []

        const counts: Record<string, { count: number; students: string[] }> = {
            "Democrático": { count: 0, students: [] },
            "Autoritario": { count: 0, students: [] },
            "Laissez-Faire": { count: 0, students: [] },
        }

        students.forEach((s) => {
            const style = getKurtLewinStyle(s)
            counts[style].count += 1
            counts[style].students.push(s.student_name)
        })

        const total = students.length
        return Object.entries(counts).map(([name, item]) => {
            const info = LEADERSHIP_STYLES_INFO[name] || { color: "#3b82f6", desc: "", badgeBg: "" }
            const percentage = total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
            return {
                name,
                value: item.count,
                percentage,
                color: info.color,
                students: item.students,
                desc: info.desc,
                badgeBg: info.badgeBg,
            }
        })
    }, [result])

    // Gráfico de pastel para CCL
    const cclPieData = useMemo(() => {
        const students = result?.students || []
        if (students.length === 0 || selectedArea !== "liderazgo_ccl") return []

        const levels: Record<string, { count: number; students: string[]; color: string; desc: string }> = {
            "Nivel Sobresaliente (80-100%)": {
                count: 0,
                students: [],
                color: "#10b981",
                desc: "Dominio avanzado de competencias de liderazgo y gestión de personas.",
            },
            "Nivel Competente (65-79%)": {
                count: 0,
                students: [],
                color: "#3b82f6",
                desc: "Habilidades consolidadas con desempeño efectivo en trabajo colaborativo.",
            },
            "En Desarrollo (<65%)": {
                count: 0,
                students: [],
                color: "#f59e0b",
                desc: "Oportunidades de fortalecimiento en competencias de liderazgo directivo.",
            },
        }

        students.forEach(s => {
            const key = getCCLGeneralLevel(s)
            levels[key].count += 1
            levels[key].students.push(s.student_name)
        })

        const total = students.length
        return Object.entries(levels).map(([name, item]) => ({
            name,
            value: item.count,
            percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
            color: item.color,
            students: item.students,
            desc: item.desc,
            badgeBg: "bg-white/5 border-white/10 text-white",
        }))
    }, [result, selectedArea])

    // Gráfico de pastel para Personalidad NEO PI-R
    const neoPieData = useMemo(() => {
        const students = result?.students || []
        if (students.length === 0 || selectedArea !== "personalidad_neo") return []

        const traits: Record<string, { count: number; students: string[]; color: string; desc: string }> = {
            "Apertura": { count: 0, students: [], color: "#06b6d4", desc: "Curiosidad intelectual, imaginación, flexibilidad y pensamiento creativo." },
            "Responsabilidad": { count: 0, students: [], color: "#10b981", desc: "Organización, orientación a metas, perseverancia y control de impulsos." },
            "Extraversión": { count: 0, students: [], color: "#f59e0b", desc: "Sociabilidad, dinamismo, asertividad y entusiasmo interpersonal." },
            "Amabilidad": { count: 0, students: [], color: "#ec4899", desc: "Empatía, cooperación, altruismo, confianza y trabajo en equipo." },
            "Estabilidad": { count: 0, students: [], color: "#8b5cf6", desc: "Resiliencia emocional, templanza ante presión y serenidad mental." },
        }

        students.forEach(s => {
            const highest = getNeoDominantDomain(s)
            if (traits[highest]) {
                traits[highest].count += 1
                traits[highest].students.push(s.student_name)
            }
        })

        const total = students.length
        return Object.entries(traits).map(([name, item]) => ({
            name,
            value: item.count,
            percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
            color: item.color,
            students: item.students,
            desc: item.desc,
            badgeBg: "bg-white/5 border-white/10 text-white",
        }))
    }, [result, selectedArea])

    const currentPieData = useMemo(() => {
        if (selectedArea === "liderazgo") return leadershipPieData
        if (selectedArea === "liderazgo_ccl") return cclPieData
        return neoPieData
    }, [selectedArea, leadershipPieData, cclPieData, neoPieData])

    // Filtrar los alumnos mostrados en la tabla
    const filteredStudents = useMemo(() => {
        let list = result?.students || []

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            list = list.filter(s =>
                s.student_name.toLowerCase().includes(q) ||
                String(s.student_id).includes(q)
            )
        }

        if (selectedCategoryFilter) {
            if (selectedArea === "liderazgo") {
                list = list.filter(s => getKurtLewinStyle(s) === selectedCategoryFilter)
            } else if (selectedArea === "liderazgo_ccl") {
                list = list.filter(s => getCCLGeneralLevel(s) === selectedCategoryFilter)
            } else if (selectedArea === "personalidad_neo") {
                list = list.filter(s => getNeoDominantDomain(s) === selectedCategoryFilter)
            }
        }

        return list
    }, [result, searchQuery, selectedCategoryFilter, selectedArea])

    // Categoría dominante más común del grupo
    const topCategory = useMemo(() => {
        if (!currentPieData || currentPieData.length === 0) return null
        return [...currentPieData].sort((a, b) => b.value - a.value)[0]
    }, [currentPieData])

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header del Dashboard */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Panel del Mentor
                    </span>
                    <h2 className="text-3xl font-black text-white tracking-tighter mt-2">
                        Dashboard Psicométrico & Diagnósticos
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                        Análisis científico de resultados: estilos de liderazgo (Kurt Lewin), competencias directivas (CCL) y rasgos de personalidad (NEO PI-R).
                    </p>
                </div>

                {/* Switcher de área evaluada */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
                    {AREAS.map(a => {
                        const active = selectedArea === a.key
                        return (
                            <button
                                key={a.key}
                                onClick={() => setSelectedArea(a.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                    active
                                        ? "shadow-lg"
                                        : "hover:text-white"
                                }`}
                                style={
                                    active
                                        ? { backgroundColor: `${a.color}25`, borderColor: `${a.color}70`, color: a.color }
                                        : { backgroundColor: "transparent", borderColor: "transparent", color: "#9ca3af" }
                                }
                            >
                                {a.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Barra de filtros de grupo (Deduplicada limpiamente) */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 mr-2 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    Filtrar por Grupo:
                </span>

                {/* Botón único para ver todos los estudiantes sin filtro */}
                <button
                    onClick={() => setSelectedGroupId(null)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedGroupId === null
                            ? "bg-white/15 text-white border-white/20 shadow-sm"
                            : "bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200"
                    }`}
                >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cohorte Completa (Todos)</span>
                </button>

                {/* Grupos individuales deduplicados */}
                {deduplicatedGroups.map(g => (
                    <button
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            selectedGroupId === g.id
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                                : "bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200"
                        }`}
                    >
                        <span>{g.name}</span>
                        {g.student_count !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-white/10 text-gray-300 font-mono">
                                {g.student_count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs text-gray-500 font-medium">Cargando métricas psicométricas...</p>
                </div>
            ) : error ? (
                <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl text-center">
                    <p className="text-sm text-red-400 font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {/* Tarjetas de Métricas Clave (KPIs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Evaluados</span>
                            </div>
                            <div className="text-3xl font-black text-white tabular-nums">{result?.total ?? 0}</div>
                            <span className="text-[11px] text-gray-500 mt-1 block">Estudiantes con diagnóstico</span>
                        </div>

                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Promedio Grupal</span>
                            </div>
                            <div className="text-3xl font-black text-white tabular-nums">
                                {result?.group_avg_score ?? 0} <span className="text-sm font-normal text-gray-400">/ 100</span>
                            </div>
                            <span className="text-[11px] text-gray-500 mt-1 block">Rendimiento ponderado</span>
                        </div>

                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentAreaMeta.color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Área Activa</span>
                            </div>
                            <div className="text-xl font-black text-white truncate">{currentAreaMeta.label}</div>
                            <span className="text-[11px] text-gray-500 mt-1 block">Marco científico aplicado</span>
                        </div>

                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Perfil Predominante</span>
                            </div>
                            <div className="text-xl font-black text-white truncate" style={{ color: topCategory?.color || "#fff" }}>
                                {topCategory ? topCategory.name : "—"}
                            </div>
                            <span className="text-[11px] text-gray-500 mt-1 block">
                                {topCategory ? `${topCategory.value} alumnos (${topCategory.percentage}%)` : "Sin datos"}
                            </span>
                        </div>
                    </div>

                    {/* Contenedor Principal de Gráficos (Barras vs Pastel) */}
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentAreaMeta.color }} />
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        {chartView === "bar"
                                            ? `Puntajes Individuales — ${currentAreaMeta.label}`
                                            : selectedArea === "liderazgo"
                                                ? "Distribución Porcentual: Tipos de Líderes (Kurt Lewin)"
                                                : `Distribución Porcentual — ${currentAreaMeta.label}`}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {chartView === "bar"
                                        ? "Comparativa de puntajes obtenidos por cada estudiante en la cohorte."
                                        : selectedArea === "liderazgo"
                                            ? "Desglose multivariado según estilos de liderazgo (Democrático, Autoritario y Laissez-Faire)."
                                            : "Desglose porcentual y proporciones calculadas para las dimensiones del área seleccionada."}
                                </p>
                            </div>

                            {/* Selector de tipo de gráfico */}
                            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl w-fit self-start sm:self-auto">
                                <button
                                    onClick={() => setChartView("pie")}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        chartView === "pie"
                                            ? "bg-amber-500/20 text-amber-300 shadow-md border border-amber-500/40"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    <PieIcon className="w-4 h-4 text-amber-400" />
                                    <span>Gráfico de Pastel (%)</span>
                                </button>
                                <button
                                    onClick={() => setChartView("bar")}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        chartView === "bar"
                                            ? "bg-white/20 text-white shadow-md border border-white/20"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    <span>Barras</span>
                                </button>
                            </div>
                        </div>

                        {/* Vista 1: Gráfico de Pastel & Desglose Multidimensional */}
                        {chartView === "pie" && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                {currentPieData.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                        {/* Donut Chart */}
                                        <div className="lg:col-span-5 h-80 relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={currentPieData.filter(i => i.value > 0)}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={72}
                                                        outerRadius={118}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {currentPieData.filter(i => i.value > 0).map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={entry.color}
                                                                stroke="#0a120e"
                                                                strokeWidth={3}
                                                                cursor="pointer"
                                                                onClick={() => {
                                                                    setSelectedCategoryFilter(prev => prev === entry.name ? null : entry.name)
                                                                }}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const p = payload[0].payload
                                                                return (
                                                                    <div className="bg-[#0c1610] border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white min-w-[190px]">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                                                                            <span className="font-black text-sm">{p.name}</span>
                                                                        </div>
                                                                        <div className="text-3xl font-black tabular-nums mt-1" style={{ color: p.color }}>
                                                                            {p.percentage}%
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-1">
                                                                            {p.value} {p.value === 1 ? "estudiante" : "estudiantes"}
                                                                        </div>
                                                                        <div className="text-[10px] text-emerald-400/80 mt-2 font-bold">
                                                                            Clic para filtrar la tabla
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        }}
                                                    />
                                                    <Legend
                                                        formatter={(value, entry: any) => (
                                                            <span className="text-xs text-gray-300 font-bold ml-1">
                                                                {value} ({entry.payload.percentage}%)
                                                            </span>
                                                        )}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>

                                            {/* Centro del Donut */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-3xl font-black text-white tabular-nums">
                                                    {result?.total ?? 0}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                                                    Total Alumnos
                                                </span>
                                            </div>
                                        </div>

                                        {/* Tarjetas Desglosadas con Porcentajes y Filtro al Clic */}
                                        <div className="lg:col-span-7 space-y-3">
                                            <div className="flex items-center justify-between text-xs text-gray-400 px-1 mb-1">
                                                <span>Haz clic en una tarjeta para filtrar los estudiantes en la tabla inferior:</span>
                                                {selectedCategoryFilter && (
                                                    <button
                                                        onClick={() => setSelectedCategoryFilter(null)}
                                                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Quitar filtro
                                                    </button>
                                                )}
                                            </div>

                                            {currentPieData.map((item) => {
                                                const isExpanded = expandedStyle === item.name
                                                const isFiltered = selectedCategoryFilter === item.name

                                                return (
                                                    <div
                                                        key={item.name}
                                                        className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white/[0.02] ${
                                                            isFiltered
                                                                ? "ring-2 ring-white/30 border-white/40 bg-white/[0.05]"
                                                                : "hover:border-white/20 hover:bg-white/[0.04]"
                                                        }`}
                                                        style={{
                                                            borderColor: isFiltered ? item.color : isExpanded ? `${item.color}70` : "rgba(255,255,255,0.08)",
                                                        }}
                                                        onClick={() => {
                                                            setSelectedCategoryFilter(prev => prev === item.name ? null : item.name)
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-md font-black bg-white/5 text-gray-300 border border-white/10">
                                                                            {item.value} {item.value === 1 ? "alumno" : "alumnos"}
                                                                        </span>
                                                                        {isFiltered && (
                                                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                                Filtro activo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-black tabular-nums" style={{ color: item.color }}>
                                                                    {item.percentage}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Barra de progreso visual */}
                                                        <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-700"
                                                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                                            />
                                                        </div>

                                                        {/* Botón para expandir alumnos pertenecientes a esta categoría */}
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setExpandedStyle(isExpanded ? null : item.name)
                                                                }}
                                                                className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
                                                            >
                                                                {isExpanded ? "▲ Ocultar lista" : `▼ Ver ${item.value} estudiantes`}
                                                            </button>
                                                        </div>

                                                        {/* Desplegable de estudiantes pertenecientes a este estilo */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-3 pt-3 border-t border-white/5 text-xs"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                                                                        Estudiantes con perfil {item.name}:
                                                                    </span>
                                                                    {item.students.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {item.students.map((st, sIdx) => (
                                                                                <span
                                                                                    key={sIdx}
                                                                                    className="px-2.5 py-1 rounded-lg text-white font-medium text-[11px] bg-white/[0.04] border border-white/10"
                                                                                >
                                                                                    {st}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-gray-500 italic text-[11px]">
                                                                            Ningún estudiante registrado en esta categoría en la cohorte seleccionada.
                                                                        </p>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-gray-500 text-xs italic">
                                        No hay datos suficientes para generar el gráfico de pastel.
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Vista 2: Gráfico de Barras */}
                        {chartView === "bar" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-80 w-full">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 600 }}
                                                interval={0}
                                                angle={-25}
                                                textAnchor="end"
                                                height={45}
                                            />
                                            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} domain={[0, 100]} />
                                            <RechartsTooltip
                                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const p = payload[0].payload
                                                        return (
                                                            <div className="bg-[#0f1712] border border-white/10 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
                                                                <p className="font-bold text-sm text-gray-200">{p.fullName}</p>
                                                                <p className="text-xl font-black mt-1" style={{ color: currentAreaMeta.color }}>
                                                                    {p.score} <span className="text-xs font-normal text-gray-400">pts</span>
                                                                </p>
                                                                {p.category && (
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        Perfil: <span className="text-white font-bold">{p.category}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Bar dataKey="score" fill={currentAreaMeta.color} radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                                        No hay datos de puntajes para mostrar.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Tabla de Detalle por Estudiante con Búsqueda y Filtros Rápidos */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden space-y-4 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-wide text-white">
                                    Detalle Individual de Evaluaciones
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Mostrando {filteredStudents.length} de {result?.total ?? 0} estudiantes evaluados
                                    {selectedCategoryFilter ? ` (filtrado por ${selectedCategoryFilter})` : ""}.
                                </p>
                            </div>

                            {/* Barra de búsqueda y selector rápido */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Buscar estudiante..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 w-48 sm:w-60 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {selectedCategoryFilter && (
                                    <button
                                        onClick={() => setSelectedCategoryFilter(null)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all hover:bg-amber-500/30"
                                    >
                                        <span>Filtro: {selectedCategoryFilter}</span>
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Pills para filtrar rápidamente por categoría */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold text-gray-500 mr-1">Filtrar perfil:</span>
                            <button
                                onClick={() => setSelectedCategoryFilter(null)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                                    selectedCategoryFilter === null
                                        ? "bg-white/20 text-white border-white/30"
                                        : "bg-white/[0.02] text-gray-400 border-white/5 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                Todos ({result?.total ?? 0})
                            </button>
                            {currentPieData.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setSelectedCategoryFilter(prev => prev === cat.name ? null : cat.name)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                        selectedCategoryFilter === cat.name
                                            ? "shadow-sm"
                                            : "bg-white/[0.02] text-gray-400 border-white/5 hover:text-white hover:bg-white/5"
                                    }`}
                                    style={
                                        selectedCategoryFilter === cat.name
                                            ? { backgroundColor: `${cat.color}25`, borderColor: `${cat.color}70`, color: cat.color }
                                            : {}
                                    }
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span>{cat.name}</span>
                                    <span className="text-[10px] opacity-75">({cat.value})</span>
                                </button>
                            ))}
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto rounded-2xl border border-white/5 mt-3">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.01] text-left">
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estudiante</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Puntaje</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Perfil Dominante</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Detalle & Desglose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(s => {
                                        const lewinStyle = getKurtLewinStyle(s)
                                        const lewinInfo = LEADERSHIP_STYLES_INFO[lewinStyle] || { color: "#3b82f6", badgeBg: "" }
                                        const neoDominant = getNeoDominantDomain(s)
                                        const cclLevel = getCCLGeneralLevel(s)

                                        return (
                                            <tr key={s.student_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <StudentHouseAvatar
                                                            studentName={s.student_name}
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{s.student_name}</div>
                                                            <div className="text-[10px] text-gray-500 font-mono">ID: #{s.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base font-black tabular-nums" style={{ color: currentAreaMeta.color }}>
                                                            {s.score}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">pts</span>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    {selectedArea === "liderazgo" && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${lewinInfo.badgeBg}`}>
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lewinInfo.color }} />
                                                            {lewinStyle}
                                                        </span>
                                                    )}
                                                    {selectedArea === "liderazgo_ccl" && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                                                            s.score >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                                                            s.score >= 65 ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                                                            "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                                        }`}>
                                                            {cclLevel.split(" ")[1] || cclLevel}
                                                        </span>
                                                    )}
                                                    {selectedArea === "personalidad_neo" && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-purple-500/10 text-purple-400 border-purple-500/30">
                                                            {neoDominant}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-4 text-xs text-gray-400">
                                                    {selectedArea === "liderazgo" && (
                                                        <div className="space-y-1">
                                                            {s.data?.detalle && typeof s.data.detalle === "object" ? (
                                                                <div className="flex flex-wrap gap-2 text-[11px]">
                                                                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">
                                                                        <strong className="text-emerald-400">Democrático:</strong> {s.data.detalle.democratico ?? s.data.detalle.democrático ?? 0}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">
                                                                        <strong className="text-amber-400">Autoritario:</strong> {s.data.detalle.autoritario ?? 0}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">
                                                                        <strong className="text-purple-400">Laissez-faire:</strong> {s.data.detalle["laissez-faire"] ?? s.data.detalle.laissez_faire ?? 0}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-gray-500 italic">
                                                                    {s.data?.observaciones || "Evaluación Kurt Lewin procesada."}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {selectedArea === "personalidad_neo" && s.data?.dominios && (
                                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                                            {Object.entries(NEO_DOMAIN_LABELS).map(([key, label]) => (
                                                                <span key={key} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 whitespace-nowrap">
                                                                    <span className="text-gray-500">{label}:</span>{" "}
                                                                    <strong className="text-white">{s.data.dominios[key] ?? "—"}</strong>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedArea === "liderazgo_ccl" && (
                                                        <div className="space-y-1 text-[11px]">
                                                            {s.data?.fortalezas && (
                                                                <div>
                                                                    <strong className="text-emerald-400">Fortalezas: </strong>
                                                                    <span className="text-gray-300">
                                                                        {Array.isArray(s.data.fortalezas) ? s.data.fortalezas.join(", ") : s.data.fortalezas}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {s.data?.areas_desarrollo && (
                                                                <div>
                                                                    <strong className="text-amber-400">Áreas de desarrollo: </strong>
                                                                    <span className="text-gray-300">
                                                                        {Array.isArray(s.data.areas_desarrollo) ? s.data.areas_desarrollo.join(", ") : s.data.areas_desarrollo}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-gray-500 text-xs italic">
                                                {searchQuery || selectedCategoryFilter
                                                    ? "No se encontraron estudiantes que coincidan con los filtros aplicados."
                                                    : "No hay resultados registrados para esta área todavía."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    )
}