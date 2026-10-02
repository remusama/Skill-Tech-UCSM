"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Loader2, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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

export const PsicometriaDashboard = () => {
    const [selectedArea, setSelectedArea] = useState<AreaKey>("liderazgo")
    const [groups, setGroups] = useState<Group[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [result, setResult] = useState<PsicometriaResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    const chartData = (result?.students || []).map(s => ({
        name: s.student_name.split(" ")[0],
        score: s.score || 0,
    }))

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

                    {/* Gráfico de barras */}
                    {chartData.length > 0 && (
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                                    <Bar dataKey="score" fill={currentAreaMeta.color} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

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
                                            {selectedArea === "liderazgo" && s.data?.estilo_dominante && (
                                                <span>Estilo dominante: <span className="text-white font-bold">{s.data.estilo_dominante}</span></span>
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