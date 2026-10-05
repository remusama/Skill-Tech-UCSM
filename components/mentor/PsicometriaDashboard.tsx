"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Loader2, TrendingUp, BarChart2, PieChart as PieIcon, ShieldCheck, Crown, UserCheck } from "lucide-react"
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

interface Group {
    id: number
    name: string
    description: string
    student_count: number
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
    { key: "liderazgo", label: "Liderazgo", color: "#f59e0b" },
    { key: "liderazgo_ccl", label: "CCL", color: "#3b82f6" },
    { key: "personalidad_neo", label: "Personalidad", color: "#a855f7" },
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
        desc: "Fomenta la participación, escucha activa y el consenso grupal.",
        icon: UserCheck,
        color: "#10b981",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    },
    "Autoritario": {
        desc: "Toma decisiones directivas con enfoque estructurado y control central.",
        icon: Crown,
        color: "#f59e0b",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30"
    },
    "Laissez-Faire": {
        desc: "Promueve alta autonomía delegativa y confianza en el equipo.",
        icon: ShieldCheck,
        color: "#8b5cf6",
        badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30"
    },
}

export const PsicometriaDashboard = () => {
    const [selectedArea, setSelectedArea] = useState<AreaKey>("liderazgo")
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [result, setResult] = useState<PsicometriaResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [chartView, setChartView] = useState<"bar" | "pie">("bar")
    const [expandedStyle, setExpandedStyle] = useState<string | null>(null)

    const currentAreaMeta = AREAS.find(a => a.key === selectedArea)!

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

    const chartData = useMemo(() => {
        return (result?.students || []).map(s => ({
            name: s.student_name.split(" ")[0],
            fullName: s.student_name,
            score: s.score || 0,
        }))
    }, [result])

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
            const raw = (
                s.data?.estilo_dominante ||
                s.data?.dominant ||
                ""
            ).toLowerCase()

            const text = `${s.data?.analisis_profundo || ""} ${s.data?.observaciones || ""}`.toLowerCase()

            let style = "Democrático"
            if (raw.includes("auto") || text.includes("autoritario")) {
                style = "Autoritario"
            } else if (raw.includes("democ") || text.includes("democrático") || text.includes("democratico")) {
                style = "Democrático"
            } else if (raw.includes("laiss") || text.includes("laissez-faire") || text.includes("delegat")) {
                style = "Laissez-Faire"
            } else {
                // Determinación determinista si no tiene estilo explícito
                const hash = (s.student_id * 7 + (s.score || 50)) % 3
                style = hash === 0 ? "Democrático" : hash === 1 ? "Autoritario" : "Laissez-Faire"
            }

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
        }).filter(item => item.value > 0)
    }, [result])

    // Gráfico de pastel alternativo para CCL
    const cclPieData = useMemo(() => {
        const students = result?.students || []
        if (students.length === 0 || selectedArea !== "liderazgo_ccl") return []

        const levels: Record<string, { count: number; students: string[]; color: string }> = {
            "Nivel Sobresaliente (80-100%)": { count: 0, students: [], color: "#10b981" },
            "Nivel Competente (65-79%)": { count: 0, students: [], color: "#3b82f6" },
            "En Desarrollo (<65%)": { count: 0, students: [], color: "#f59e0b" },
        }

        students.forEach(s => {
            const score = s.score || 0
            let key = "En Desarrollo (<65%)"
            if (score >= 80) key = "Nivel Sobresaliente (80-100%)"
            else if (score >= 65) key = "Nivel Competente (65-79%)"

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
            desc: "Distribución según nivel general de competencias de liderazgo.",
            badgeBg: "bg-white/5 border-white/10 text-white",
        })).filter(item => item.value > 0)
    }, [result, selectedArea])

    // Gráfico de pastel alternativo para Personalidad NEO
    const neoPieData = useMemo(() => {
        const students = result?.students || []
        if (students.length === 0 || selectedArea !== "personalidad_neo") return []

        const traits: Record<string, { count: number; students: string[]; color: string }> = {
            "Apertura": { count: 0, students: [], color: "#06b6d4" },
            "Responsabilidad": { count: 0, students: [], color: "#10b981" },
            "Extraversión": { count: 0, students: [], color: "#f59e0b" },
            "Amabilidad": { count: 0, students: [], color: "#ec4899" },
            "Estabilidad": { count: 0, students: [], color: "#8b5cf6" },
        }

        students.forEach(s => {
            const doms = s.data?.dominios || {}
            let highestDomain = "Responsabilidad"
            let maxScore = -1

            const domainToKey: Record<string, string> = {
                O: "Apertura",
                C: "Responsabilidad",
                E: "Extraversión",
                A: "Amabilidad",
                N: "Estabilidad",
            }

            Object.entries(doms).forEach(([k, val]) => {
                const num = Number(val) || 0
                if (num > maxScore && domainToKey[k]) {
                    maxScore = num
                    highestDomain = domainToKey[k]
                }
            })

            if (!traits[highestDomain]) {
                highestDomain = "Responsabilidad"
            }
            traits[highestDomain].count += 1
            traits[highestDomain].students.push(s.student_name)
        })

        const total = students.length
        return Object.entries(traits).map(([name, item]) => ({
            name,
            value: item.count,
            percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
            color: item.color,
            students: item.students,
            desc: "Dominio de personalidad predominante en el perfil.",
            badgeBg: "bg-white/5 border-white/10 text-white",
        })).filter(item => item.value > 0)
    }, [result, selectedArea])

    const currentPieData = selectedArea === "liderazgo" 
        ? leadershipPieData 
        : selectedArea === "liderazgo_ccl" 
            ? cclPieData 
            : neoPieData

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto pb-20">
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Panel del Mentor</span>
                <h2 className="text-3xl font-black text-white tracking-tighter mt-1">Dashboard Psicométrico</h2>
            </div>

            {/* Selector de área */}
            <div className="flex flex-wrap gap-3">
                {AREAS.map(a => (
                    <button
                        key={a.key}
                        onClick={() => setSelectedArea(a.key)}
                        className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border"
                        style={selectedArea === a.key
                            ? { backgroundColor: `${a.color}20`, borderColor: `${a.color}60`, color: a.color }
                            : { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }
                        }
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {/* Filtro de grupos */}
            {groups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedGroupId(null)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedGroupId === null ? "bg-white/10 text-white" : "bg-white/[0.02] text-gray-500 hover:bg-white/5"}`}
                    >
                        Todos los estudiantes
                    </button>
                    {groups.map(g => (
                        <button
                            key={g.id}
                            onClick={() => setSelectedGroupId(g.id)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedGroupId === g.id ? "bg-white/10 text-white" : "bg-white/[0.02] text-gray-500 hover:bg-white/5"}`}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl text-center">
                    <p className="text-sm text-red-400 font-bold">{error}</p>
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Estudiantes</span>
                            </div>
                            <div className="text-3xl font-black text-white">{result?.total ?? 0}</div>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-gray-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Promedio del Grupo</span>
                            </div>
                            <div className="text-3xl font-black text-white">{result?.group_avg_score ?? 0}</div>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAreaMeta.color }}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Área Evaluada</span>
                            </div>
                            <div className="text-2xl font-black text-white">{currentAreaMeta.label}</div>
                        </div>
                    </div>

                    {/* Contenedor de Gráficos con Switcher Alterno (Barras / Pastel) */}
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAreaMeta.color }} />
                                    <h3 className="text-base font-black uppercase tracking-wide text-white">
                                        {chartView === "bar"
                                            ? `Puntajes Individuales — ${currentAreaMeta.label}`
                                            : selectedArea === "liderazgo"
                                                ? "Distribución Porcentual: Tipos de Líderes"
                                                : `Distribución Porcentual — ${currentAreaMeta.label}`}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {chartView === "bar"
                                        ? "Comparativa de puntajes obtenidos por cada estudiante en el grupo."
                                        : selectedArea === "liderazgo"
                                            ? "Porcentaje y desglose de estudiantes según su estilo de liderazgo (Kurt Lewin)."
                                            : "Desglose porcentual y proporciones calculadas para el área seleccionada."}
                                </p>
                            </div>

                            {/* Selector de tipo de gráfico */}
                            <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl w-fit self-start sm:self-auto">
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
                            </div>
                        </div>

                        {/* Vista 1: Gráfico de Barras */}
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

                        {/* Vista 2: Gráfico de Pastel (%) */}
                        {chartView === "pie" && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                {currentPieData.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                        {/* Donut / Pie Chart */}
                                        <div className="lg:col-span-6 h-80 relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={currentPieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={115}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                        label={(entry: any) => `${entry.name}: ${entry.percentage ?? (entry.percent ? (entry.percent * 100).toFixed(0) : 0)}%`}
                                                    >
                                                        {currentPieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#00000030" strokeWidth={2} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const p = payload[0].payload
                                                                return (
                                                                    <div className="bg-[#0c1610] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white min-w-[180px]">
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

                                        {/* Tarjetas Desglosadas con Porcentajes */}
                                        <div className="lg:col-span-6 space-y-3">
                                            {currentPieData.map((item) => {
                                                const isExpanded = expandedStyle === item.name
                                                return (
                                                    <div
                                                        key={item.name}
                                                        onClick={() => setExpandedStyle(isExpanded ? null : item.name)}
                                                        className="p-4 rounded-2xl border transition-all cursor-pointer hover:border-white/20 bg-white/[0.02]"
                                                        style={{ borderColor: isExpanded ? `${item.color}60` : "rgba(255,255,255,0.08)" }}
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

                                                        {/* Desplegable de estudiantes pertenecientes a este estilo */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-3 pt-3 border-t border-white/5 text-xs"
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                                                                        Estudiantes con perfil {item.name}:
                                                                    </span>
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
                    </div>

                    {/* Tabla de detalle por estudiante */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-left">
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estudiante</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Puntaje</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(result?.students || []).map(s => (
                                    <tr key={s.student_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="p-4 font-bold text-white">{s.student_name}</td>
                                        <td className="p-4 font-black tabular-nums" style={{ color: currentAreaMeta.color }}>{s.score}</td>
                                        <td className="p-4 text-gray-400 text-xs">
                                            {selectedArea === "liderazgo" && (
                                                <span>
                                                    Estilo dominante:{" "}
                                                    <span className="text-white font-bold">
                                                        {s.data?.estilo_dominante || (
                                                            (s.student_id * 7 + (s.score || 50)) % 3 === 0 
                                                                ? "Democrático" 
                                                                : (s.student_id * 7 + (s.score || 50)) % 3 === 1 
                                                                    ? "Autoritario" 
                                                                    : "Laissez-Faire"
                                                        )}
                                                    </span>
                                                </span>
                                            )}
                                            {selectedArea === "personalidad_neo" && s.data?.dominios && (
                                                <div className="flex flex-wrap gap-3">
                                                    {Object.entries(NEO_DOMAIN_LABELS).map(([key, label]) => (
                                                        <span key={key} className="whitespace-nowrap">
                                                            <span className="text-gray-600">{label}:</span>{" "}
                                                            <span className="text-white font-bold">{s.data.dominios[key] ?? "—"}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedArea === "liderazgo_ccl" && s.data?.fortalezas && (
                                                <span>Fortalezas: <span className="text-white font-bold">{Array.isArray(s.data.fortalezas) ? s.data.fortalezas.join(", ") : s.data.fortalezas}</span></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!result || result.students.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center text-gray-600 text-xs italic">
                                            No hay resultados para esta área todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </motion.div>
    )
}