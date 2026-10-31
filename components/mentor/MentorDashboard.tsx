"use client"

import { useState, useEffect, ComponentProps } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Search, Folder, ChevronRight, ChevronDown, BarChart3,
    Plus, X, ArrowLeft, CheckCircle, Archive, Copy, FileText,
    BookOpen, Loader2, Trash2, Edit, ExternalLink, Clock,
    Presentation, Download, Play, Bot, Sparkles, Volume2, Shield, Flame, Wrench, AlertTriangle, Database, Layers, Table
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { useEleonor } from "@/contexts/eleonor-context"
import { QuantumResultsView } from "../admin/QuantumResultsView"
import { MoyaPresentationAssistant } from "./MoyaPresentationAssistant"
import { AgentCreator } from "./AgentCreator"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"
import {
    CASAS_INFO,
    ALL_48_STUDENTS,
    getStudentHouseProfile,
    playStudentHouseAudio,
    StudentHouseProfile,
    CasaInfo
} from "@/lib/casasData"

// Caché en memoria para transiciones instantáneas (Stale-While-Revalidate)
let cachedMentorStudents: Student[] | null = null
let cachedMentorGroups: Group[] | null = null
let cachedArchivesExams: any[] | null = null

interface Student {
    id: number
    username: string
    full_name: string
    email?: string
    top_skill: string
    average_level: number
    completed_exams?: string[]
}

interface Group {
    id: number
    name: string
    description: string
    house?: "APEX" | "IGNIS" | "NEXUS" | "VISIO" | null
    student_count: number
}

interface StudentExamAnswer {
    question: string
    question_type: string
    answer: string | number | null
}

interface StudentExam {
    exam_id: number
    title: string
    agent_name: string
    status: string
    completed: boolean
    answers: StudentExamAnswer[]
}

const matchesStudentSearch = (student: Student, term: string) => {
    const normalizedTerm = term.trim().toLowerCase()

    if (!normalizedTerm) return true

    return (
        student.full_name.toLowerCase().includes(normalizedTerm) ||
        student.username.toLowerCase().includes(normalizedTerm) ||
        (student.email ? student.email.toLowerCase().includes(normalizedTerm) : false)
    )
}

const getGroupHouseKey = (group: Group): "APEX" | "IGNIS" | "NEXUS" | "VISIO" | null => {
    if (group.house) return group.house
    const upper = (group.name || "").toUpperCase()
    if (upper.includes("APEX")) return "APEX"
    if (upper.includes("IGNIS")) return "IGNIS"
    if (upper.includes("NEXUS")) return "NEXUS"
    if (upper.includes("VISIO")) return "VISIO"
    return null
}

interface MentorDashboardProps {
    view?: "dashboard" | "students" | "groups" | "archives"
    initialSubTab?: "students" | "groups"
    initialArchiveTab?: "presentations" | "agents" | "exams"
}

const FolderCard = ({ title, subtitle, isSelected, onClick, count, isGroup }: {
    title: string, subtitle: string, isSelected: boolean,
    onClick: () => void, count: number, isGroup?: boolean
}) => (
    <motion.div
        whileHover={{ scale: 1.02, translateY: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden cursor-pointer p-6 rounded-3xl border transition-all duration-200 h-full flex flex-col justify-between ${isSelected
            ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "bg-slate-900/60 border-emerald-500/10 hover:border-emerald-500/30"
            }`}
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400">
            {isGroup ? <Folder className="w-12 h-12" /> : <Users className="w-12 h-12" />}
        </div>
        <div className="relative z-10 flex-grow">
            <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${isSelected ? "text-emerald-400" : "text-slate-400"}`}>
                {subtitle}
            </span>
            <h3 className="font-bold mt-1 text-2xl tracking-tight text-slate-100">{title}</h3>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-4 text-xs text-slate-400">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>{count} Estudiantes</span>
        </div>
        {isSelected && (
            <motion.div
                layoutId="activeFolderIndicator"
                className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"
            />
        )}
    </motion.div>
)

const TeamHouseCard = ({
    houseKey,
    group,
    isSelected,
    onClick
}: {
    houseKey: "APEX" | "IGNIS" | "NEXUS" | "VISIO"
    group?: Group
    isSelected: boolean
    onClick: () => void
}) => {
    const info = CASAS_INFO[houseKey]
    const studentCount = group?.student_count ?? 12

    return (
        <motion.div
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden cursor-pointer p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between group ${
                isSelected
                    ? "bg-slate-900/95 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/40"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-xl"
            }`}
        >
            <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                style={{ backgroundColor: info.glowColor }}
            />

            <div>
                <div className="flex items-start justify-between gap-4">
                    <div className="relative w-14 h-14 rounded-2xl bg-slate-950/80 border border-white/10 p-2 shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                            src={info.logo}
                            alt={`Casa ${info.name}`}
                            className="w-full h-full object-contain filter drop-shadow"
                        />
                    </div>
                    <span className={`text-[10px] uppercase tracking-[0.2em] font-black px-3 py-1 rounded-full border ${info.badgeBg} ${info.badgeText} ${info.borderColor}`}>
                        {info.element}
                    </span>
                </div>

                <div className="mt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipo Oficial</span>
                    <h3 className="font-black text-2xl tracking-tight text-white mt-0.5">
                        Equipo {info.name}
                    </h3>
                    <p className={`text-xs font-semibold mt-1 ${info.badgeText} italic`}>
                        "{info.motto}"
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {info.description}
                    </p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">{studentCount} Estudiantes</span>
                </div>
                <div className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                    isSelected ? info.badgeText : "text-slate-400 group-hover:text-white"
                }`}>
                    <span>{isSelected ? "Seleccionado" : "Ver Roster"}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            {isSelected && (
                <motion.div
                    layoutId="activeTeamIndicator"
                    className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${info.gradient}`}
                />
            )}
        </motion.div>
    )
}

const StudentRow = ({
    student,
    idx,
    onClick,
    onPlayAudio,
    isPlayingAudio,
    isTimelineHighlighted = false,
    onDeleteUser
}: {
    student: Student
    idx: number
    onClick: () => void
    onPlayAudio?: (studentName: string) => void
    isPlayingAudio?: boolean
    isTimelineHighlighted?: boolean
    onDeleteUser?: (student: Student) => void
}) => {
    const profile = getStudentHouseProfile(student.full_name || student.username || student.email || "")
    const houseInfo = profile ? CASAS_INFO[profile.house] : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.005, 0.06), duration: 0.15 }}
            onClick={onClick}
            className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                isTimelineHighlighted
                    ? "bg-slate-900/90 border-2 border-[hsl(74,100%,47%)] shadow-[0_0_25px_rgba(186,239,0,0.25)] ring-1 ring-[hsl(74,100%,47%)]/30"
                    : "bg-slate-900/50 hover:bg-slate-900/80 border border-emerald-500/10 hover:border-emerald-500/30"
            }`}
        >
            <div className="flex items-center gap-4">
                <StudentHouseAvatar
                    studentName={student.full_name}
                    username={student.username}
                    email={student.email}
                    size="md"
                    className="group-hover:scale-105 transition-transform"
                />
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-base tracking-tight transition-all duration-300 flex items-center gap-2 flex-wrap ${
                            isTimelineHighlighted
                                ? "text-[hsl(74,100%,47%)] [text-shadow:0_0_15px_rgba(186,239,0,0.9)] animate-pulse font-black"
                                : "text-slate-100 group-hover:text-emerald-400"
                        }`}>
                            <span>{student.full_name}</span>
                            {isTimelineHighlighted && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_12px_rgba(186,239,0,0.6)]">
                                    <Sparkles className="w-3 h-3 text-slate-950" />
                                    Línea de Tiempo Actualizada
                                </span>
                            )}
                        </h3>
                        {houseInfo && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${houseInfo.badgeBg} ${houseInfo.badgeText} ${houseInfo.borderColor} flex items-center gap-1`}>
                                <img src={houseInfo.logo} alt="" className="w-3 h-3 object-contain" />
                                {houseInfo.name}
                            </span>
                        )}
                        {/* Se eliminó la etiqueta de grado/sección (5º A) */}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">@{student.username}</p>
                </div>
            </div>

            <div className="mt-3 md:mt-0 flex items-center gap-4 md:gap-6 text-sm flex-wrap">
                {profile?.audio_path && onPlayAudio && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onPlayAudio(student.full_name)
                        }}
                        title="Escuchar veredicto del Sombrero Seleccionador"
                        className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isPlayingAudio
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse"
                                : "bg-slate-950/60 hover:bg-slate-800 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
                        }`}
                    >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isPlayingAudio ? "Reproduciendo..." : "Audio"}</span>
                    </button>
                )}

                <div className="text-left md:text-right">
                    <p className="text-slate-400 mb-1 text-xs">Competencia principal</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-xs border border-emerald-500/20">
                        <BarChart3 className="w-3 h-3" />
                        {student.top_skill || profile?.top_skill || "General"}
                    </span>
                </div>

                <div className="text-left md:text-right">
                    <p className="text-slate-400 mb-1 text-xs">Nivel promedio</p>
                    <span className="font-bold text-base text-slate-200">
                        {(student.average_level > 0 ? student.average_level : 4.5).toFixed(1)}
                    </span>
                </div>

                {onDeleteUser && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDeleteUser(student)
                        }}
                        title="Eliminar usuario completo (Panel Desarrollador)"
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/50 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}

                <div className="w-9 h-9 rounded-full bg-slate-800/80 text-slate-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    )
}

const CreateGroupModal = ({ students, onClose, onCreated }: {
    students: Student[], onClose: () => void, onCreated: (g: Group) => void
}) => {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [creating, setCreating] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const toggle = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

    const filteredStudents = students.filter(s =>
        matchesStudentSearch(s, searchTerm)
    )

    const handleCreate = async () => {
        if (!name.trim()) return
        setCreating(true)
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/groups`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, student_ids: selectedIds })
            })
            if (res.ok) {
                const data = await res.json()
                onCreated({ id: data.group_id, name, description, student_count: selectedIds.length })
                onClose()
            }
        } catch (err) {
            console.error("Error creando grupo:", err)
        } finally {
            setCreating(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 space-y-5 shadow-2xl shadow-emerald-950/30"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-100">Crear Grupo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nombre del grupo (ej: Mentoría A - Agosto 2026)"
                        className="w-full bg-slate-950/60 border border-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ring-emerald-500/30" />
                    <input value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="w-full bg-slate-950/60 border border-emerald-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ring-emerald-500/30" />
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="Buscar estudiante..."
                        className="w-full bg-slate-950/60 border border-emerald-500/20 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ring-emerald-500/30 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                            Agregar estudiantes ({selectedIds.length} seleccionados)
                        </p>
                        {filteredStudents.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const allFilteredIds = filteredStudents.map(s => s.id)
                                    const areAllSelected = allFilteredIds.every(id => selectedIds.includes(id))
                                    if (areAllSelected) {
                                        setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)))
                                    } else {
                                        setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])))
                                    }
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider transition-colors px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20"
                            >
                                {filteredStudents.every(s => selectedIds.includes(s.id)) ? "Desmarcar todo" : "Seleccionar todo"}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {filteredStudents.map(s => {
                            const sel = selectedIds.includes(s.id)
                            return (
                                <div key={s.id} onClick={() => toggle(s.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-950/40 border-emerald-500/10 hover:border-emerald-500/20 text-slate-300"}`}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                                        {sel && <CheckCircle className="w-3 h-3 text-slate-950 font-black" />}
                                    </div>
                                    <StudentHouseAvatar
                                        studentName={s.full_name}
                                        username={s.username}
                                        email={s.email}
                                        size="xs"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate text-slate-100">{s.full_name}</p>
                                        <p className="text-xs text-slate-400">@{s.username}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition-colors text-sm">Cancelar</button>
                    <button disabled={!name.trim() || creating} onClick={handleCreate}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 rounded-xl text-slate-950 font-bold text-sm shadow-lg shadow-emerald-900/30">
                        {creating ? "Creando..." : "Crear Grupo"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── ARCHIVES VIEW ──────────────────────────────────────────────────────────────
const MOCK_PRESENTATIONS = [
    {
        id: 1,
        title: "Sombrero seleccionador",
        category: "Dinámica de Diagnóstico",
        slides: 18,
        format: "PPTX",
        date: "08/09/2026",
        description: "Dinámica interactiva de clasificación de talentos y perfilado cuántico guiada por Moya en tamaño de asistente."
    },
    {
        id: 2,
        title: "Liderazgo Asertivo y Dinámicas de Equipo",
        category: "Capacitación",
        slides: 24,
        format: "PDF",
        date: "04/09/2026",
        description: "Conceptos clave de comunicación no violenta, delegación efectiva y trabajo colaborativo."
    },
    {
        id: 3,
        title: "Interpretación de Resultados NEO-PI-R",
        category: "Guía de Diagnóstico",
        slides: 15,
        format: "PPTX",
        date: "01/09/2026",
        description: "Marco conceptual de los Cinco Grandes rasgos de personalidad para mentoría individual."
    },
    {
        id: 4,
        title: "Estrategias de Adaptación y Pensamiento Crítico",
        category: "Sesión Práctica",
        slides: 20,
        format: "PDF",
        date: "25/08/2026",
        description: "Herramientas de análisis reflexivo y resolución de dilemas éticos y complejos."
    }
]

const ArchivesView = ({
    students = [],
    initialTab = "presentations"
}: {
    students?: Student[]
    initialTab?: "presentations" | "agents" | "exams"
}) => {
    const { enterPresence } = useEleonor()
    const [activeTab, setActiveTab] = useState<"presentations" | "agents" | "exams">(initialTab)
    const [exams, setExams] = useState<any[]>(() => cachedArchivesExams || [])
    const [loading, setLoading] = useState(() => !cachedArchivesExams && activeTab === "exams")
    const [duplicating, setDuplicating] = useState<number | null>(null)
    const [presentations] = useState(MOCK_PRESENTATIONS)
    const [selectedPres, setSelectedPres] = useState<typeof MOCK_PRESENTATIONS[0] | null>(null)
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab)
        }
    }, [initialTab])

    useEffect(() => {
        if (selectedPres) {
            enterPresence("INTERVENTION")
        } else {
            enterPresence("IDLE_VISIBLE")
        }
    }, [selectedPres, enterPresence])

    const load = async () => {
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/archives/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                cachedArchivesExams = data
                setExams(data)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        if (!cachedArchivesExams) {
            load()
        }
    }, [])

    const handleDuplicate = async (examId: number) => {
        setDuplicating(examId)
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/exams/${examId}/duplicate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) { await load() }
        } catch (e) { console.error(e) }
        finally { setDuplicating(null) }
    }

    const statusBadge = (s: string) => {
        if (s === "published") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        if (s === "draft") return "bg-amber-500/10 text-amber-400 border-amber-500/20"
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }

    return (
        <div className="space-y-8">
            {/* Switch de Navegación Estilizado Skill Tech */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-900/80 border border-emerald-500/20 rounded-3xl backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-2xl border border-emerald-500/10 flex-wrap">
                    <button
                        onClick={() => setActiveTab("presentations")}
                        className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 ${activeTab === "presentations"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_20px_rgba(186,239,0,0.35)] font-black"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                    >
                        <Presentation className="w-4 h-4" />
                        <span>Presentaciones</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === "presentations" ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
                            }`}>
                            {presentations.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("agents")}
                        className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 ${activeTab === "agents"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_20px_rgba(186,239,0,0.35)] font-black"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                    >
                        <Bot className="w-4 h-4" />
                        <span>Agentes IA</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                            Modular
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("exams")}
                        className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2.5 ${activeTab === "exams"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_20px_rgba(186,239,0,0.35)] font-black"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>Plantillas Guardadas</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeTab === "exams" ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
                            }`}>
                            {exams.length}
                        </span>
                    </button>
                </div>

                <div className="text-xs text-slate-400 px-3 font-medium">
                    {activeTab === "presentations" ? "Recursos interactivos y diapositivas de mentoría" : activeTab === "agents" ? "Creación y gestión de agentes evaluadores con IA" : "Historial y duplicación de plantillas"}
                </div>
            </div>

            {activeTab === "agents" ? (
                /* AGENTES IA INTEGRADO EN ARCHIVOS */
                <div className="pt-2">
                    <AgentCreator />
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-[hsl(74,100%,47%)]" />
                </div>
            ) : activeTab === "exams" ? (
                /* SECCIÓN DE EXÁMENES GUARDADOS */
                exams.length === 0 ? (
                    <div className="text-center py-32 text-slate-500 bg-slate-900/40 rounded-3xl border border-emerald-500/10 p-8">
                        <Archive className="w-14 h-14 mx-auto mb-4 opacity-20 text-[hsl(74,100%,47%)]" />
                        <p className="text-base font-medium text-slate-300">No hay plantillas guardadas.</p>
                        <p className="text-sm mt-1 text-slate-500">Puedes gestionar y configurar tus agentes desde la pestaña Agentes IA.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {exams.map((exam, i) => (
                            <motion.div key={exam.id}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.1) }}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-emerald-500/10 hover:border-emerald-500/40 rounded-3xl transition-all duration-200 shadow-xl"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[hsl(74,100%,47%)] flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-base text-slate-100">{exam.title}</h3>
                                            <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border ${statusBadge(exam.status)}`}>
                                                {exam.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">Agente: <span className="text-emerald-300 font-medium">{exam.agent_name}</span></p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                                            <span>{exam.question_count} preguntas</span>
                                            <span>•</span>
                                            <span>{exam.assignment_count} asignaciones</span>
                                            {exam.created_at && (
                                                <>
                                                    <span>•</span>
                                                    <span>{new Date(exam.created_at).toLocaleDateString('es-PE')}</span>
                                                </>
                                            )}
                                        </div>
                                        {exam.competencies?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {exam.competencies.slice(0, 3).map((c: string) => (
                                                    <span key={c} className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">{c}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleDuplicate(exam.id)}
                                        disabled={duplicating === exam.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-[hsl(74,100%,47%)] hover:text-slate-950 border border-emerald-500/20 rounded-xl text-slate-200 text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                                    >
                                        {duplicating === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                        Duplicar Plantilla
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            ) : (
                /* SECCIÓN DE PRESENTACIONES */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {presentations.map((pres, i) => (
                            <motion.div
                                key={pres.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="p-6 bg-slate-900/60 border border-emerald-500/15 hover:border-[hsl(74,100%,47%)]/40 rounded-3xl transition-all duration-300 shadow-xl flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                            {pres.category}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                                            {pres.format}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-white mt-1.5 group-hover:text-[hsl(74,100%,47%)] transition-colors">
                                        {pres.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                        {pres.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-emerald-500/10 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                                        <span>{pres.slides} Diapositivas</span>
                                        <span>•</span>
                                        <span>{pres.date}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setSelectedPres(pres); setCurrentSlide(0); }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 text-xs font-black transition-all shadow-[0_0_20px_rgba(186,239,0,0.3)]">
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            Iniciar presentación
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Moya Asistente Interactivo de Presentación */}
            <AnimatePresence>
                {selectedPres && (
                    <MoyaPresentationAssistant
                        students={students}
                        onClose={() => setSelectedPres(null)}
                        presentationTitle={selectedPres.title}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}


// Top-level SearchBar to avoid unmounting on keystrokes
const SearchBar = ({ searchTerm, setSearchTerm, placeholder = "Buscar..." }: {
    searchTerm: string
    setSearchTerm: (term: string) => void
    placeholder?: string
}) => (
    <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(150,10%,80%)]/50 pointer-events-none" />
        <input
            type="text"
            placeholder={placeholder}
            className="bg-[hsl(161,67%,9%)]/60 border border-[hsl(153,30%,75%)]/20 rounded-2xl py-3 pl-12 pr-6 text-white placeholder:text-[hsl(150,10%,80%)]/40 focus:outline-none focus:ring-2 focus:ring-[hsl(74,100%,47%)]/30 w-full md:w-64 transition-all shadow-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
    </div>
)

const DASHBOARD_EXAMS = [
    {
        id: "neo-pi-r",
        title: "NEO-PI-R (Personalidad)",
        category: "Examen Psicométrico",
        description: "Evaluación psicométrica de rasgo de personalidad NEO (Cinco Grandes)."
    },
    {
        id: "ccl",
        title: "CCL (Competencias de Liderazgo)",
        category: "Examen Psicométrico",
        description: "Evaluación psicométrica de competencias clave de liderazgo."
    },
    {
        id: "expectativas",
        title: "Expectativas del Estudiante (CEPV)",
        category: "Test de Diagnóstico",
        description: "Encuesta sobre expectativas vivenciales, aplicabilidad, facilitación y networking."
    }
]

// Vista directa del perfil del estudiante (sin pestañas de Perfil Cognitivo / Exámenes)
const StudentProfileView = ({
    studentId,
    quantumProps,
}: {
    studentId: number
    quantumProps: ComponentProps<typeof QuantumResultsView>
}) => {
    return <QuantumResultsView {...quantumProps} />
}

const PersonalizedTeamView = ({
    houseKey,
    group,
    students,
    loading,
    searchTerm,
    setSearchTerm,
    onStudentClick,
    onPlayAudio,
    playingStudent,
    onClose,
    isStudentHighlighted,
    onDeleteUser
}: {
    houseKey?: "APEX" | "IGNIS" | "NEXUS" | "VISIO" | null
    group?: Group | null
    students: Student[]
    loading: boolean
    searchTerm: string
    setSearchTerm: (s: string) => void
    onStudentClick: (student: Student) => void
    onPlayAudio: (studentName: string) => void
    playingStudent: string | null
    onClose: () => void
    isStudentHighlighted?: (s: Student) => boolean
    onDeleteUser?: (student: Student) => void
}) => {
    const info = houseKey ? CASAS_INFO[houseKey] : null

    const filtered = students.filter(s => matchesStudentSearch(s, searchTerm))

    return (
        <div className="space-y-6 pt-6 border-t border-emerald-500/20">
            {/* Banner Hero Personalizado del Equipo */}
            {info ? (
                <div className={`relative overflow-hidden rounded-3xl border ${info.borderColor} bg-slate-900/90 p-6 md:p-8 shadow-2xl backdrop-blur-md`}>
                    <div
                        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
                        style={{ backgroundColor: info.glowColor }}
                    />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-950/90 border border-white/10 p-3 shadow-2xl flex items-center justify-center flex-shrink-0">
                                <img src={info.logo} alt={`Casa ${info.name}`} className="w-full h-full object-contain filter drop-shadow-lg" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-0.5 rounded-full border ${info.badgeBg} ${info.badgeText} ${info.borderColor}`}>
                                        Casa {info.name} · {info.element}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">12 Integrantes Oficiales</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
                                    Equipo {info.name}
                                </h2>
                                <p className={`text-sm font-semibold italic mt-1 ${info.badgeText}`}>
                                    "{info.motto}"
                                </p>
                                <p className="text-xs text-slate-300/80 max-w-2xl mt-2 leading-relaxed">
                                    {info.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                            >
                                Volver a Equipos
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/20">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Grupo Personalizado</span>
                        <h2 className="text-2xl font-black text-white mt-0.5">{group?.name || "Grupo de Mentoría"}</h2>
                        <p className="text-xs text-slate-400 mt-1">{group?.description || "Estudiantes asignados al grupo"}</p>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300">
                        Volver a Grupos
                    </button>
                </div>
            )}

            {/* Buscador de integrantes */}
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Lista Personalizada de Integrantes
                </h3>
                <div className="w-72">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar en este equipo..." />
                </div>
            </div>

            {/* Listado de integrantes */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm bg-slate-900/30 rounded-2xl border border-slate-800">
                    No se encontraron estudiantes para este filtro en el equipo.
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((s, i) => (
                        <StudentRow
                            key={s.id}
                            student={s}
                            idx={i}
                            onClick={() => onStudentClick(s)}
                            onPlayAudio={onPlayAudio}
                            isPlayingAudio={playingStudent === s.full_name}
                            isTimelineHighlighted={isStudentHighlighted ? isStudentHighlighted(s) : false}
                            onDeleteUser={onDeleteUser}
                        />
                    ))}
                </div>
            )}


        </div>
    )
}

const DeveloperUserManagementModal = ({
    students,
    onClose,
    onDeleteUser,
    preselectedStudent = null
}: {
    students: Student[]
    onClose: () => void
    onDeleteUser: (student: Student) => Promise<void>
    preselectedStudent?: Student | null
}) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(preselectedStudent)
    const [confirmInput, setConfirmInput] = useState("")
    const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("")

    const filtered = students.filter(s => matchesStudentSearch(s, searchTerm))

    const handleConfirmDelete = async () => {
        if (!selectedStudentForDelete) return
        setDeletingId(selectedStudentForDelete.id)
        try {
            await onDeleteUser(selectedStudentForDelete)
            setDeleteSuccessMsg(`¡Usuario ${selectedStudentForDelete.full_name} (ID: ${selectedStudentForDelete.id}) eliminado permanentemente!`)
            setSelectedStudentForDelete(null)
            setConfirmInput("")
            setTimeout(() => setDeleteSuccessMsg(""), 5000)
        } catch (err) {
            console.error("Error al eliminar usuario:", err)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 border border-emerald-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-emerald-950/50 overflow-hidden"
            >
                {/* Modal Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                    Desarrollador / Admin
                                </span>
                                <h2 className="text-xl font-black text-white">Eliminación de Usuarios Completos</h2>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Función en Mis Estudiantes para purgar cuentas completas en la base de datos (asistencias, notas, evaluaciones e historial).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {deleteSuccessMsg && (
                    <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{deleteSuccessMsg}</span>
                    </div>
                )}

                {/* Sub-diálogo de confirmación forzada */}
                {selectedStudentForDelete ? (
                    <div className="p-6 space-y-5 bg-red-950/20 border-b border-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-black text-white">
                                    ¿Confirmar eliminación permanente de usuario?
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Se borrará permanentemente la cuenta de <span className="font-bold text-red-300">{selectedStudentForDelete.full_name}</span> (@{selectedStudentForDelete.username}, ID: {selectedStudentForDelete.id}), eliminando asistencias, evaluaciones prácticas, historial y resultados.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-medium">
                                Escribe <span className="font-mono text-red-300 font-bold">ELIMINAR</span> para confirmar:
                            </label>
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="ELIMINAR"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-red-500/40 text-white font-mono text-sm focus:outline-none focus:border-red-400"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedStudentForDelete(null)
                                    setConfirmInput("")
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={confirmInput.trim().toUpperCase() !== "ELIMINAR" || deletingId !== null}
                                onClick={handleConfirmDelete}
                                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/60 flex items-center gap-2 transition-all"
                            >
                                {deletingId !== null ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Eliminando de la Base de Datos...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar Definitivamente
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Search Bar */}
                <div className="p-6 pb-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar estudiante por nombre, usuario, correo o ID para purgar..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                </div>

                {/* Students List */}
                <div className="p-6 pt-0 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs">
                            No se encontraron estudiantes para este criterio.
                        </div>
                    ) : (
                        filtered.map((st) => (
                            <div
                                key={st.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <StudentHouseAvatar studentName={st.full_name} size="sm" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white">{st.full_name}</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                                ID: {st.id}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">@{st.username} {st.email ? `· ${st.email}` : ""}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedStudentForDelete(st)}
                                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar Usuario</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    )
}



const PowerBiExportModal = ({
    students,
    onClose
}: {
    students: Student[]
    onClose: () => void
}) => {
    const [activeTab, setActiveTab] = useState<"live" | "files" | "dax">("live")
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncSuccess, setSyncSuccess] = useState(false)

    // Base URL dinámico para Power BI
    const liveEndpoint = typeof window !== "undefined"
        ? `${window.location.origin.replace(":3000", ":8000")}/api/mentor/export/powerbi/master.csv`
        : "http://localhost:8000/api/mentor/export/powerbi/master.csv"

    const liveTimelineEndpoint = typeof window !== "undefined"
        ? `${window.location.origin.replace(":3000", ":8000")}/api/mentor/export/powerbi/timeline.csv`
        : "http://localhost:8000/api/mentor/export/powerbi/timeline.csv"

    const liveCasasEndpoint = typeof window !== "undefined"
        ? `${window.location.origin.replace(":3000", ":8000")}/api/mentor/export/powerbi/casas.csv`
        : "http://localhost:8000/api/mentor/export/powerbi/casas.csv"

    // Sincronizar evaluaciones recientes de localStorage con el backend al abrir
    useEffect(() => {
        const syncEvals = async () => {
            setIsSyncing(true)
            try {
                const clientEvals: Record<string, any> = {}
                if (typeof window !== "undefined") {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i)
                        if (key && key.startsWith("practical_eval_student_")) {
                            const sId = key.replace("practical_eval_student_", "")
                            try {
                                const parsed = JSON.parse(localStorage.getItem(key) || "[]")
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    clientEvals[sId] = parsed
                                }
                            } catch {}
                        }
                    }
                }
                const token = localStorage.getItem("eleonor_token")
                await fetch(`${API_BASE_URL}/api/mentor/export/powerbi/sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ evaluations: clientEvals })
                })
                setSyncSuccess(true)
            } catch (err) {
                console.warn("Aviso al sincronizar con backend para Power BI:", err)
            } finally {
                setIsSyncing(false)
            }
        }
        syncEvals()
    }, [])

    const handleCopy = (text: string, label: string) => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(text)
            setCopiedUrl(label)
            setTimeout(() => setCopiedUrl(null), 3000)
        }
    }

    const downloadCsvFromBackend = (endpoint: string, filename: string) => {
        const fullUrl = `${API_BASE_URL}${endpoint}`
        const a = document.createElement("a")
        a.href = fullUrl
        a.download = filename
        a.target = "_blank"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 border border-yellow-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-yellow-950/40 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-xl flex items-center justify-center">
                            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Microsoft Power BI
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-400" /> Auto-Actualizable
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                                Exportación de Datos para Power BI
                            </h2>
                            <p className="text-xs text-slate-400">
                                Modelo de datos analítico (Star Schema) con soporte de actualización continua de estudiantes, casas y línea de tiempo.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-header Tabs */}
                <div className="flex border-b border-white/10 px-6 bg-slate-900/50 gap-2">
                    <button
                        onClick={() => setActiveTab("live")}
                        className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === "live"
                                ? "border-yellow-400 text-yellow-300 bg-yellow-400/5"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>1. Conexión en Vivo (Auto-Actualizable)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("files")}
                        className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === "files"
                                ? "border-yellow-400 text-yellow-300 bg-yellow-400/5"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Download className="w-4 h-4" />
                        <span>2. Descarga de Tablas (.CSV)</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("dax")}
                        className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === "dax"
                                ? "border-yellow-400 text-yellow-300 bg-yellow-400/5"
                                : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>3. Modelo Estrella & DAX</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    {/* TAB 1: LIVE CONNECTION */}
                    {activeTab === "live" && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                                        ¿Cómo funciona la Actualización en Power BI?
                                    </h4>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Al conectar Power BI mediante esta URL web, el reporte queda vinculado dinámicamente. Cada vez que tú o cualquier mentor <span className="font-bold text-white">califique una competencia, guarde un hito en la línea de tiempo o tome asistencia</span>, solo debes presionar el botón <strong className="text-yellow-400">"Actualizar"</strong> en la cinta de opciones de Power BI y todos los gráficos se sincronizarán al segundo.
                                    </p>
                                </div>
                            </div>

                            {/* URLs Feed */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-yellow-400" />
                                    URLs de Origen de Datos Web (Web Data Feeds)
                                </h3>

                                {/* Master URL */}
                                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white flex items-center gap-2">
                                            <Table className="w-3.5 h-3.5 text-emerald-400" />
                                            Tabla Maestra Consolidada (Recomendada para 1 solo clic)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(liveEndpoint, "master")}
                                            className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                                        >
                                            {copiedUrl === "master" ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedUrl === "master" ? "¡Copiado!" : "Copiar URL"}
                                        </button>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 select-all overflow-x-auto">
                                        {liveEndpoint}
                                    </div>
                                </div>

                                {/* Timeline URL */}
                                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-white flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                            Fact_LineaTiempo_Competencias (Para gráficos temporales)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(liveTimelineEndpoint, "timeline")}
                                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                                        >
                                            {copiedUrl === "timeline" ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedUrl === "timeline" ? "¡Copiado!" : "Copiar URL"}
                                        </button>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 select-all overflow-x-auto">
                                        {liveTimelineEndpoint}
                                    </div>
                                </div>
                            </div>

                            {/* Step by step guide */}
                            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Guía Rápida de Configuración en Power BI Desktop (3 pasos):
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
                                    <li>Abre <span className="text-white font-bold">Power BI Desktop</span> y en la pestaña Inicio haz clic en <span className="text-yellow-400 font-bold">Obtener datos ➔ Desde la web</span>.</li>
                                    <li>Pega la URL copiada arriba y presiona <span className="text-white font-bold">Aceptar</span> (en configuración de autenticación selecciona "Acceso anónimo" o "Básico").</li>
                                    <li>Power BI detectará automáticamente el archivo delimitado por comas UTF-8. Haz clic en <span className="text-emerald-400 font-bold">Cargar</span>. ¡A partir de ese momento, cualquier cambio se sincroniza con el botón <strong>Actualizar</strong>!</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DOWNLOAD CSV FILES */}
                    {activeTab === "files" && (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Descarga los archivos en formato CSV con codificación <strong className="text-white">UTF-8 con marca de orden de bytes (BOM)</strong>, lo que garantiza que Microsoft Power BI y Excel en Windows reconozcan tildes, caracteres especiales y números decimales sin ninguna corrupción.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Tabla Maestra */}
                                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                Recomendado
                                            </span>
                                            <h4 className="font-bold text-sm text-white">Tabla Maestra Consolidada</h4>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Incluye a los 48 estudiantes, Casa, Lema, % Asistencia, las 7 competencias Likert y exámenes completados en una sola tabla desnormalizada.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => downloadCsvFromBackend("/api/mentor/export/powerbi/master.csv", "SkillTech_PowerBI_Maestro.csv")}
                                        className="w-full py-2.5 px-4 rounded-xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[hsl(74,100%,47%)]/20 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar Maestro (.CSV)
                                    </button>
                                </div>

                                {/* Fact Linea de Tiempo */}
                                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                                Series Temporales
                                            </span>
                                            <h4 className="font-bold text-sm text-white">Fact_LineaTiempo_Competencias</h4>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Historial cronológico de observaciones y snapshots. Ideal para gráficos de líneas de evolución temporal por estudiante y casa.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => downloadCsvFromBackend("/api/mentor/export/powerbi/timeline.csv", "SkillTech_PowerBI_Fact_LineaTiempo.csv")}
                                        className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar Línea de Tiempo (.CSV)
                                    </button>
                                </div>

                                {/* Dim Casas */}
                                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                Dimensión
                                            </span>
                                            <h4 className="font-bold text-sm text-white">Dim_Casas_Liderazgo</h4>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Metadatos oficiales de las 4 Casas (APEX, IGNIS, NEXUS, VISIO): lemas, elementos, colores corporativos y descripciones.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => downloadCsvFromBackend("/api/mentor/export/powerbi/casas.csv", "SkillTech_PowerBI_Dim_Casas.csv")}
                                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar Dim Casas (.CSV)
                                    </button>
                                </div>

                                {/* JSON Dataset */}
                                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                Power Query
                                            </span>
                                            <h4 className="font-bold text-sm text-white">Dataset Completo (.JSON)</h4>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Estructura relacional anidada con metadatos de sincronización para transformaciones avanzadas en Power Query Editor.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => downloadCsvFromBackend("/api/mentor/export/powerbi/data.json", "SkillTech_PowerBI_Dataset.json")}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar JSON (.JSON)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: DAX & DATA MODEL */}
                    {activeTab === "dax" && (
                        <div className="space-y-6">
                            {/* Star Schema Diagram */}
                            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Esquema Estrella Recomendado (Star Schema)
                                </h4>
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                                    <div className="text-purple-400 font-bold">[Dim_Casas]</div>
                                    <div className="text-slate-500">└─ ID_Casa (1) ───────────┐</div>
                                    <div className="text-slate-500">                         ▼</div>
                                    <div className="text-emerald-400 font-bold pl-12">[Dim_Estudiantes]</div>
                                    <div className="text-slate-500 pl-12">└─ ID_Estudiante (1) ────────┐</div>
                                    <div className="text-slate-500 pl-12">                          ▼</div>
                                    <div className="text-cyan-400 font-bold pl-24">[Fact_LineaTiempo_Competencias]</div>
                                </div>
                            </div>

                            {/* Recommended DAX Measures */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
                                    Fórmulas DAX Listas para Usar:
                                </h4>

                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-yellow-300">Promedio General de Competencias</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy("Promedio_Competencias = AVERAGE(Fact_LineaTiempo[Puntuacion_Likert])", "dax1")}
                                                className="text-[11px] font-bold text-slate-400 hover:text-white"
                                            >
                                                {copiedUrl === "dax1" ? "¡Copiado!" : "Copiar"}
                                            </button>
                                        </div>
                                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto">
                                            Promedio_Competencias = AVERAGE(Fact_LineaTiempo[Puntuacion_Likert])
                                        </pre>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-yellow-300">Tasa de Asistencia Promedio (%)</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy("Tasa_Asistencia = AVERAGE(Dim_Estudiantes[Porcentaje_Asistencia])", "dax2")}
                                                className="text-[11px] font-bold text-slate-400 hover:text-white"
                                            >
                                                {copiedUrl === "dax2" ? "¡Copiado!" : "Copiar"}
                                            </button>
                                        </div>
                                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto">
                                            Tasa_Asistencia = AVERAGE(Dim_Estudiantes[Porcentaje_Asistencia])
                                        </pre>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-yellow-300">Cantidad de Evaluaciones Sobresalientes (≥ 4.5)</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy("Evaluaciones_Sobresalientes = CALCULATE(COUNTROWS(Fact_LineaTiempo), Fact_LineaTiempo[Puntuacion_Likert] >= 4.5)", "dax3")}
                                                className="text-[11px] font-bold text-slate-400 hover:text-white"
                                            >
                                                {copiedUrl === "dax3" ? "¡Copiado!" : "Copiar"}
                                            </button>
                                        </div>
                                        <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto">
                                            {"Evaluaciones_Sobresalientes = CALCULATE(COUNTROWS(Fact_LineaTiempo), Fact_LineaTiempo[Puntuacion_Likert] >= 4.5)"}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        48 Estudiantes Oficiales UCSM · 4 Casas (APEX, IGNIS, NEXUS, VISIO)
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </div>
    )
}


export const MentorDashboard = ({
    view = "dashboard",
    initialSubTab = "students",
    initialArchiveTab = "presentations"
}: MentorDashboardProps) => {
    const [students, setStudents] = useState<Student[]>(() => cachedMentorStudents || [])
    const [groups, setGroups] = useState<Group[]>(() => cachedMentorGroups || [])
    const [loading, setLoading] = useState(() => !cachedMentorStudents || !cachedMentorGroups)
    const [searchTerm, setSearchTerm] = useState("")
    const [studentSubTab, setStudentSubTab] = useState<"students" | "groups">("groups")
    const [showDevModal, setShowDevModal] = useState(false)
    const [showPowerBiModal, setShowPowerBiModal] = useState(false)
    const [devSelectedStudent, setDevSelectedStudent] = useState<Student | null>(null)
    const [timelineHighlights, setTimelineHighlights] = useState<Record<string | number, number>>(() => {
        if (typeof window === "undefined") return {}
        try {
            return JSON.parse(localStorage.getItem("skilltech_timeline_highlights") || "{}")
        } catch {
            return {}
        }
    })

    useEffect(() => {
        const handleTimelineUpdate = (e: any) => {
            if (e?.detail) {
                const { studentId, studentName, timestamp } = e.detail
                setTimelineHighlights(prev => ({
                    ...prev,
                    ...(studentId ? { [studentId]: timestamp } : {}),
                    ...(studentName ? { [studentName]: timestamp } : {})
                }))
            }
        }
        window.addEventListener("studentTimelineChanged" as any, handleTimelineUpdate)
        return () => window.removeEventListener("studentTimelineChanged" as any, handleTimelineUpdate)
    }, [])

    const isStudentHighlighted = (s: Student) => {
        const ts = timelineHighlights[s.id] || timelineHighlights[s.full_name]
        if (!ts) return false
        return Date.now() - ts < 2 * 60 * 60 * 1000 // 2 horas
    }

    const handleDeleteUserComplete = async (targetStudent: Student) => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const queryParams = new URLSearchParams()
            if (targetStudent.username) queryParams.append("username", targetStudent.username)
            if (targetStudent.email) queryParams.append("email", targetStudent.email)

            const res = await fetch(`${API_BASE_URL}/api/user/${targetStudent.id}?${queryParams.toString()}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })
            if (!res.ok && res.status !== 404) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Error al eliminar usuario en el servidor")
            }
        } catch (e) {
            console.warn("Aviso al eliminar en backend:", e)
        }

        // LIMPIEZA TOTAL EN LOCALSTORAGE (Notas, evaluaciones prácticas y highlights)
        try {
            localStorage.removeItem(`practical_eval_student_${targetStudent.id}`)
            localStorage.removeItem(`practical_eval_student_${targetStudent.username}`)
            localStorage.removeItem(`practical_eval_student_${targetStudent.full_name}`)
            const highlights = JSON.parse(localStorage.getItem("skilltech_timeline_highlights") || "{}")
            delete highlights[targetStudent.id]
            delete highlights[targetStudent.full_name]
            delete highlights[targetStudent.username]
            localStorage.setItem("skilltech_timeline_highlights", JSON.stringify(highlights))
        } catch {}

        // Purgar de los estados del frontend
        setStudents(prev => prev.filter(s => s.id !== targetStudent.id && s.username !== targetStudent.username && s.full_name !== targetStudent.full_name))
        setGroupStudents(prev => prev.filter(s => s.id !== targetStudent.id && s.username !== targetStudent.username && s.full_name !== targetStudent.full_name))
        if (cachedMentorStudents) {
            cachedMentorStudents = cachedMentorStudents.filter(s => s.id !== targetStudent.id && s.username !== targetStudent.username && s.full_name !== targetStudent.full_name)
        }
    }

    const handleOpenDeleteUserModal = (student: Student) => {
        setDevSelectedStudent(student)
        setShowDevModal(true)
    }
    const [viewingStudentId, setViewingStudentId] = useState<number | null>(null)
    const [viewingStudentName, setViewingStudentName] = useState("")
    const [quantumData, setQuantumData] = useState<any>(null)
    const [quantumLoading, setQuantumLoading] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
    const [selectedHouse, setSelectedHouse] = useState<"APEX" | "IGNIS" | "NEXUS" | "VISIO" | null>(null)
    const [teamSearchTerm, setTeamSearchTerm] = useState("")
    const [playingAudioStudent, setPlayingAudioStudent] = useState<string | null>(null)
    const [audioPlayerRef, setAudioPlayerRef] = useState<HTMLAudioElement | null>(null)
    const [groupStudents, setGroupStudents] = useState<Student[]>([])
    const [groupStudentsLoading, setGroupStudentsLoading] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [selectedExamModal, setSelectedExamModal] = useState<typeof DASHBOARD_EXAMS[0] | null>(null)

    // Mantener siempre en grupos
    useEffect(() => {
        setStudentSubTab("groups")
    }, [view, initialSubTab])

    // Group & Exam Status Filter state inside exam modal
    const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all")
    const [activeExamForProfile, setActiveExamForProfile] = useState<typeof DASHBOARD_EXAMS[0] | null>(null)
    const [groupStudentsMap, setGroupStudentsMap] = useState<Record<number, Student[]>>({})
    const [activeStudentList, setActiveStudentList] = useState<Student[]>([])

    const isStudentExamCompleted = (studentId: number, examId: string) => {
        const student = students.find(s => s.id === studentId) || activeStudentList.find(s => s.id === studentId)
        if (!student) return false
        if (student.completed_exams && Array.isArray(student.completed_exams)) {
            const targetId = examId.toLowerCase()
            return student.completed_exams.some(ce => {
                const norm = ce.toLowerCase()
                if (targetId === "expectativas" || targetId === "cepv") {
                    return norm.includes("expectativa") || norm.includes("cepv")
                }
                return norm === targetId || norm.includes(targetId) || targetId.includes(norm)
            })
        }
        return false
    }

    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem("eleonor_token")
            try {
                const [studentsRes, groupsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/mentor/students`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/api/mentor/groups`, { headers: { Authorization: `Bearer ${token}` } })
                ])
                if (studentsRes.ok) {
                    const st = await studentsRes.json()
                    cachedMentorStudents = st
                    setStudents(st)
                }
                if (groupsRes.ok) {
                    const gr = await groupsRes.json()
                    cachedMentorGroups = gr
                    setGroups(gr)
                }
            } catch (err) {
                console.error("Error fetching mentor data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    const fetchQuantumData = async (studentId: number) => {
        setQuantumData(null)
        setQuantumLoading(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token") || sessionStorage.getItem("eleonor_token") || sessionStorage.getItem("token")
        try {
            let res = await fetch(`${API_BASE_URL}/api/mentor/students/${studentId}/quantum`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.status === 404) {
                // Fallback attempt for production backend routing without /api prefix
                res = await fetch(`${API_BASE_URL}/mentor/students/${studentId}/quantum`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            }
            if (res.ok) setQuantumData(await res.json())
            else console.error("Quantum API error:", res.status, await res.text())
        } catch (err) {
            console.error("Error fetching quantum data:", err)
        } finally {
            setQuantumLoading(false)
        }
    }

    const fetchGroupStudentsIfNeeded = async (groupId: number) => {
        if (groupStudentsMap[groupId]) return groupStudentsMap[groupId]
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/groups/${groupId}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setGroupStudentsMap(prev => ({ ...prev, [groupId]: data }))
                return data
            }
        } catch (err) {
            console.error("Error fetching group students:", err)
        }
        return []
    }

    const handleGroupFilterChange = async (val: string) => {
        setSelectedGroupFilter(val)
        if (val !== "all") {
            const gId = parseInt(val, 10)
            if (!isNaN(gId)) {
                await fetchGroupStudentsIfNeeded(gId)
            }
        }
    }

    const getBaseModalStudents = () => {
        if (selectedGroupFilter === "all") return students
        const gId = parseInt(selectedGroupFilter, 10)
        return groupStudentsMap[gId] || []
    }

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredGroupStudents = groupStudents.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredExamStudents = getBaseModalStudents().filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.username.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matchesSearch) return false

        if (!selectedExamModal) return true
        const isCompleted = isStudentExamCompleted(s.id, selectedExamModal.id)

        if (statusFilter === "completed") return isCompleted
        if (statusFilter === "pending") return !isCompleted
        return true
    })

    const handleStudentClick = (student: Student, currentList?: Student[], examCtx?: typeof DASHBOARD_EXAMS[0] | null) => {
        const listToUse = currentList && currentList.length > 0 ? currentList : (selectedExamModal ? filteredExamStudents : filteredStudents)
        setActiveStudentList(listToUse)
        setActiveExamForProfile(examCtx || selectedExamModal || null)
        setSelectedExamModal(null)
        setViewingStudentId(student.id)
        setViewingStudentName(student.full_name)
        fetchQuantumData(student.id)
    }

    // Student Navigation controls
    const currentIndex = activeStudentList.findIndex(s => s.id === viewingStudentId)
    const totalStudents = activeStudentList.length
    const hasPrevStudent = currentIndex > 0
    const hasNextStudent = currentIndex >= 0 && currentIndex < totalStudents - 1

    const handleNextStudent = () => {
        if (hasNextStudent) {
            const nextStudent = activeStudentList[currentIndex + 1]
            setViewingStudentId(nextStudent.id)
            setViewingStudentName(nextStudent.full_name)
            fetchQuantumData(nextStudent.id)
        }
    }

    const handlePrevStudent = () => {
        if (hasPrevStudent) {
            const prevStudent = activeStudentList[currentIndex - 1]
            setViewingStudentId(prevStudent.id)
            setViewingStudentName(prevStudent.full_name)
            fetchQuantumData(prevStudent.id)
        }
    }

    const togglePlayAudio = async (studentName: string) => {
        if (playingAudioStudent === studentName && audioPlayerRef) {
            audioPlayerRef.pause()
            setAudioPlayerRef(null)
            setPlayingAudioStudent(null)
            return
        }

        if (audioPlayerRef) {
            audioPlayerRef.pause()
        }

        const profile = getStudentHouseProfile(studentName)
        if (!profile) return

        setPlayingAudioStudent(studentName)
        const audio = await playStudentHouseAudio(
            profile,
            () => {
                setPlayingAudioStudent(null)
                setAudioPlayerRef(null)
            },
            () => {
                setPlayingAudioStudent(null)
                setAudioPlayerRef(null)
            }
        )
        if (audio) {
            setAudioPlayerRef(audio)
        } else {
            setPlayingAudioStudent(null)
        }
    }

    const loadGroupStudents = async (groupId: number) => {
        if (groupId < 0) return
        setGroupStudentsLoading(true)
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/groups/${groupId}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setGroupStudents(data)
                }
            }
        } catch (err) {
            console.error("Error fetching group students:", err)
        } finally {
            setGroupStudentsLoading(false)
        }
    }

    const handleHouseSelect = (houseKey: "APEX" | "IGNIS" | "NEXUS" | "VISIO") => {
        if (selectedHouse === houseKey) {
            setSelectedHouse(null)
            setSelectedGroup(null)
            setGroupStudents([])
            return
        }

        setSelectedHouse(houseKey)
        // Cargar los alumnos de la casa desde los estudiantes reales en BD
        const dbHouseStudents = students.filter(s => {
            const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
            return prof?.house === houseKey
        })
        const houseRoster = dbHouseStudents.length > 0 ? dbHouseStudents : ALL_48_STUDENTS.filter(s => s.house === houseKey).map(s => ({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            email: s.email,
            top_skill: s.top_skill,
            average_level: 4.7,
            completed_exams: []
        }))
        setGroupStudents(houseRoster)

        const matchingGroup = groups.find(g => getGroupHouseKey(g) === houseKey)
        if (matchingGroup) {
            setSelectedGroup(matchingGroup.id)
            loadGroupStudents(matchingGroup.id)
        } else {
            setSelectedGroup(-1)
        }
    }

    // Load group students when a group is selected
    const handleGroupSelect = async (groupId: number) => {
        if (selectedGroup === groupId) {
            setSelectedGroup(null)
            setSelectedHouse(null)
            setGroupStudents([])
            return
        }
        const targetGroup = groups.find(g => g.id === groupId)
        const hKey = targetGroup ? getGroupHouseKey(targetGroup) : null
        setSelectedHouse(hKey)
        setSelectedGroup(groupId)
        loadGroupStudents(groupId)
    }



    if (loading) {
        return (
            <div className="flex items-center justify-center py-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(74,100%,47%)]" />
            </div>
        )
    }

    if (viewingStudentId) {
        return (
            <div className="space-y-6">
                {quantumLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[hsl(74,100%,47%)]" />
                    </div>
                ) : (
                    <StudentProfileView
                        studentId={viewingStudentId}
                        quantumProps={{
                            studentName: viewingStudentName,
                            studentId: viewingStudentId,
                            onBack: () => { setViewingStudentId(null); setQuantumData(null); setActiveExamForProfile(null) },
                            data: quantumData,
                            onNextStudent: handleNextStudent,
                            onPrevStudent: handlePrevStudent,
                            hasNextStudent: hasNextStudent,
                            hasPrevStudent: hasPrevStudent,
                            currentIndex: currentIndex >= 0 ? currentIndex : 0,
                            totalStudents: totalStudents,
                            activeExam: activeExamForProfile,
                        }}
                    />
                )}
            </div>
        )
    }

    // ── ARCHIVES ───────────────────────────────────────────────────────────────
    if (view === "archives") {
        return (
            <div className="space-y-10 max-w-7xl mx-auto pb-20">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#baef00' }}>Panel del Mentor</span>
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Archivos</h1>
                    <p className="text-[hsl(150,10%,80%)] mt-2 font-medium">Presentaciones interactivas, recursos de mentoría y configuración de agentes IA.</p>
                </div>
                <ArchivesView students={students} initialTab={initialArchiveTab} />
            </div>
        )
    }

    // ── DASHBOARD ──────────────────────────────────────────────────────────────
    if (view === "dashboard") {
        return (
            <div className="space-y-12 max-w-7xl mx-auto pb-20">
                {/* Modal para ver respuestas del examen seleccionado */}
                <AnimatePresence>
                    {selectedExamModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                                className="w-full max-w-3xl bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[85vh] flex flex-col"
                            >
                                <div className="flex items-start justify-between border-b border-emerald-500/20 pb-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                            {selectedExamModal.category}
                                        </span>
                                        <h2 className="text-2xl font-black text-white mt-1">{selectedExamModal.title}</h2>
                                        <p className="text-xs text-slate-400 mt-1">{selectedExamModal.description}</p>
                                    </div>
                                    <button onClick={() => setSelectedExamModal(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                                        Estudiantes ({filteredExamStudents.length})
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {/* Selector / Switch de Grupo */}
                                        <div className="relative flex items-center gap-1.5 bg-slate-950/90 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-lg group hover:border-emerald-500/50 transition-colors">
                                            <Folder className="w-3.5 h-3.5 text-[hsl(74,100%,47%)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GRUPO:</span>
                                            <select
                                                value={selectedGroupFilter}
                                                onChange={(e) => handleGroupFilterChange(e.target.value)}
                                                className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
                                            >
                                                <option value="all" className="bg-slate-900 text-slate-100">Todos los grupos</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id.toString()} className="bg-slate-900 text-slate-100">{g.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Switch Segmentado de Estado (Skill Tech Glowing Switch) */}
                                        <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-emerald-500/30 shadow-lg">
                                            {[
                                                { id: "all", label: "Todos", icon: Users, color: "text-slate-200" },
                                                { id: "completed", label: "Realizados", icon: CheckCircle, color: "text-emerald-400" },
                                                { id: "pending", label: "Pendientes", icon: Clock, color: "text-amber-400" },
                                            ].map((tab) => {
                                                const isActive = statusFilter === tab.id
                                                const Icon = tab.icon
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        onClick={() => setStatusFilter(tab.id as any)}
                                                        className={`relative px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300 flex items-center gap-1.5 ${isActive
                                                                ? "text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)] bg-[hsl(74,100%,47%)] font-black"
                                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                                                            }`}
                                                    >
                                                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950 font-bold" : tab.color}`} />
                                                        <span>{tab.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar..." />
                                    </div>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto pr-1 flex-grow max-h-[450px]">
                                    {filteredExamStudents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-6 bg-slate-950/60 rounded-3xl border border-dashed border-emerald-500/20 text-center space-y-4 my-2">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                                                <Clock className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black text-white uppercase tracking-wider">Aún no completó los datos</h3>
                                                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                                                    {statusFilter === "completed"
                                                        ? "No se encontraron estudiantes que hayan realizado esta evaluación de diagnóstico."
                                                        : statusFilter === "pending"
                                                            ? "No existen estudiantes pendientes bajo este criterio de búsqueda."
                                                            : "No se encontraron estudiantes que coincidan con la búsqueda."}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-emerald-400/80 font-medium">
                                                💡 Puedes usar los switches y filtros de arriba para cambiar de grupo o ver el estado global.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredExamStudents.map((student) => {
                                            const isCompleted = selectedExamModal ? isStudentExamCompleted(student.id, selectedExamModal.id) : true
                                            return (
                                                <div
                                                    key={student.id}
                                                    onClick={() => handleStudentClick(student, filteredExamStudents, selectedExamModal)}
                                                    className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-emerald-500/10 hover:border-emerald-500/40 rounded-2xl cursor-pointer transition-all duration-300 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <StudentHouseAvatar
                                                            studentName={student.full_name}
                                                            username={student.username}
                                                            email={student.email}
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <h4 className="font-bold text-xs text-slate-100 group-hover:text-emerald-400 transition-colors">
                                                                {student.full_name}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-400">@{student.username}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {isCompleted ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Realizado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                                                                <Clock className="w-3 h-3" />
                                                                Pendiente
                                                            </span>
                                                        )}
                                                        <button className="flex items-center gap-1 text-xs text-slate-300 group-hover:text-emerald-400 font-bold px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 transition-all">
                                                            Ver Respuestas / Perfil
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#baef00' }}>Panel del Mentor</span>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Dashboard</h1>
                        <p className="text-[hsl(150,10%,80%)] mt-2 font-medium">Vista general de tus exámenes de diagnóstico y estado de estudiantes.</p>
                    </div>
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: "Estudiantes", value: students.length, sub: "En total" },
                        { label: "Grupos", value: groups.length, sub: "Activos" },
                        { label: "Nivel Promedio", value: students.length ? (students.reduce((a, s) => a + s.average_level, 0) / students.length).toFixed(1) : "—", sub: "Global" },
                    ].map(stat => (
                        <div key={stat.label} className="p-5 bg-[hsl(161,40%,15%)]/60 border border-[hsl(153,30%,75%)]/20 rounded-2xl shadow-xl">
                            <p className="text-xs text-[hsl(150,10%,80%)] uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-black mt-1 text-white">{stat.value}</p>
                            <p className="text-xs text-[hsl(150,10%,80%)]/50 mt-0.5">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {groups.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold text-[hsl(150,10%,80%)] uppercase tracking-widest mb-4">Grupos activos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {groups.map(g => (
                                <FolderCard key={g.id} title={g.name} subtitle="Grupo de Mentoría"
                                    count={g.student_count} isGroup isSelected={false} onClick={() => { }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Sección de Exámenes en lugar de Estudiantes */}
                <div>
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center justify-between text-white">
                        <span>Exámenes</span>
                        <span className="text-sm font-medium text-[hsl(150,10%,80%)] bg-[hsl(161,67%,9%)]/60 border border-[hsl(153,30%,75%)]/20 px-3 py-1 rounded-full">
                            3 Evaluaciones Diagnósticas
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DASHBOARD_EXAMS.map(exam => (
                            <motion.div
                                key={exam.id}
                                whileHover={{ scale: 1.01, translateY: -2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedExamModal(exam)}
                                className="cursor-pointer p-6 rounded-3xl bg-[hsl(161,40%,15%)]/60 border border-[hsl(153,30%,75%)]/20 hover:border-[hsl(74,100%,47%)]/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[hsl(74,100%,47%)]">
                                            {exam.category}
                                        </span>
                                        <h3 className="font-bold text-xl text-white mt-1">{exam.title}</h3>
                                        <p className="text-xs text-[hsl(150,10%,80%)]/70 mt-1">{exam.description}</p>
                                    </div>
                                    <div className="p-3 bg-[hsl(74,100%,47%)]/10 rounded-2xl text-[hsl(74,100%,47%)] border border-[hsl(74,100%,47%)]/20 shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between text-xs pt-4 border-t border-[hsl(153,30%,75%)]/10">
                                    <span className="text-[hsl(150,10%,80%)] font-medium flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-[hsl(74,100%,47%)]" />
                                        Ver respuestas de estudiantes
                                    </span>
                                    <span className="text-[hsl(74,100%,47%)] font-bold flex items-center gap-1">
                                        Acceder <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── MIS ESTUDIANTES (INTEGRA LISTA DE ESTUDIANTES Y GESTIÓN DE GRUPOS) ───
    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        students={students}
                        onClose={() => setShowCreateGroup(false)}
                        onCreated={g => {
                            setGroups(prev => {
                                const next = [...prev, g]
                                cachedMentorGroups = next
                                return next
                            })
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#baef00' }}>Panel del Mentor</span>
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Mis Estudiantes</h1>
                    <p className="text-[hsl(150,10%,80%)] mt-2 font-medium">
                        Organiza tus estudiantes en grupos para actividades y seguimiento.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Vista fija en Grupos y Botón de Panel de Desarrollador */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(74,100%,47%)] text-slate-950 font-black rounded-xl text-xs shadow-[0_0_15px_rgba(186,239,0,0.35)]">
                        <Folder className="w-4 h-4" />
                        <span>Grupos ({groups.length})</span>
                    </div>

                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] rounded-xl text-slate-950 font-bold text-xs shadow-lg shadow-[hsl(74,100%,47%)]/15 transition-all whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Grupo
                    </button>

                    <button
                        onClick={() => setShowPowerBiModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 rounded-xl font-black text-xs shadow-lg shadow-amber-950/20 transition-all whitespace-nowrap"
                        title="Exportar datos del Dashboard para Power BI (Auto-Actualizable)"
                    >
                        <BarChart3 className="w-4 h-4 text-yellow-400" />
                        <span>Exportar Power BI</span>
                    </button>

                    <button
                        onClick={() => {
                            setDevSelectedStudent(null)
                            setShowDevModal(true)
                        }}
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl font-bold text-xs shadow-lg transition-all whitespace-nowrap"
                        title="Abrir Panel de Desarrollador para eliminar usuarios completos"
                    >
                        <Wrench className="w-4 h-4" /> Panel Desarrollador
                    </button>
                </div>
            </div>

            {studentSubTab === "students" ? (
                /* PESTAÑA 1: LISTADO GLOBAL DE ESTUDIANTES */
                <div className="grid gap-3">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-24 text-[hsl(150,10%,80%)]/40">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20 text-[hsl(74,100%,47%)]" />
                            <p className="text-sm text-[hsl(150,10%,80%)]">No hay estudiantes registrados.</p>
                        </div>
                    ) : (
                        filteredStudents.map((s, i) => (
                            <StudentRow
                                key={s.id}
                                student={s}
                                idx={i}
                                onClick={() => handleStudentClick(s, filteredStudents)}
                                onPlayAudio={togglePlayAudio}
                                isPlayingAudio={playingAudioStudent === s.full_name}
                            />
                        ))
                    )}
                </div>
            ) : (
                /* PESTAÑA 2: GRUPOS INTEGRADOS Y EQUIPOS DE CASAS */
                <>
                    {/* 1. SECCIÓN DE EQUIPOS OFICIALES DE CASAS (APEX, IGNIS, NEXUS, VISIO) */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(74,100%,47%)]">
                                    Sistema de Casas UCSM
                                </span>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                                    <Shield className="w-6 h-6 text-emerald-400" />
                                    Equipos Oficiales de Casas
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Equipos formados por el Sombrero Seleccionador para el desarrollo de competencias de liderazgo y habilidades blandas (12 estudiantes por casa).
                                </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                                4 Equipos · 48 Estudiantes
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(["APEX", "IGNIS", "NEXUS", "VISIO"] as const).map(houseKey => {
                                const matchingGroup = groups.find(g => getGroupHouseKey(g) === houseKey)
                                const isSelected = selectedHouse === houseKey || (selectedGroup !== null && matchingGroup?.id === selectedGroup)

                                return (
                                    <TeamHouseCard
                                        key={houseKey}
                                        houseKey={houseKey}
                                        group={matchingGroup}
                                        isSelected={isSelected}
                                        onClick={() => handleHouseSelect(houseKey)}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    {/* 2. OTROS GRUPOS PERSONALIZADOS DEL MENTOR */}
                    {(() => {
                        const customGroups = groups.filter(g => !getGroupHouseKey(g))
                        return (
                            <div className="space-y-4 pt-6 border-t border-slate-800/80">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Folder className="w-5 h-5 text-[hsl(74,100%,47%)]" />
                                            Grupos Adicionales de Mentoría
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Grupos dinámicos creados por mentores para seguimiento específico o proyectos.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateGroup(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-emerald-400" /> Crear Grupo
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowCreateGroup(true)}
                                        className="border border-dashed border-[hsl(153,30%,75%)]/30 hover:border-[hsl(74,100%,47%)]/50 rounded-3xl p-6 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px] text-[hsl(150,10%,80%)] hover:text-[hsl(74,100%,47%)] transition-all bg-[hsl(161,40%,15%)]/40 shadow-xl">
                                        <Plus className="w-7 h-7 text-[hsl(74,100%,47%)]" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Nuevo Grupo</span>
                                    </motion.div>

                                    {customGroups.map(g => (
                                        <FolderCard key={g.id} title={g.name}
                                            subtitle={g.description || "Grupo de Mentoría"}
                                            count={g.student_count} isGroup
                                            isSelected={selectedGroup === g.id && !selectedHouse}
                                            onClick={() => handleGroupSelect(g.id)} />
                                    ))}
                                </div>
                            </div>
                        )
                    })()}

                    {/* 3. VISTA PERSONALIZADA DEL EQUIPO O GRUPO SELECCIONADO */}
                    {(selectedGroup !== null || selectedHouse !== null) && (
                        <PersonalizedTeamView
                            houseKey={selectedHouse || (selectedGroup ? getGroupHouseKey(groups.find(g => g.id === selectedGroup) || ({} as Group)) : null)}
                            group={selectedGroup ? groups.find(g => g.id === selectedGroup) || null : null}
                            students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? (() => {
                                const dbMatches = students.filter(s => {
                                    const prof = getStudentHouseProfile(s.full_name || s.username || s.email || "")
                                    return prof?.house === selectedHouse
                                })
                                return dbMatches.length > 0 ? dbMatches : ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({
                                    id: s.id,
                                    username: s.username,
                                    full_name: s.full_name,
                                    email: s.email,
                                    top_skill: s.top_skill,
                                    average_level: 4.7,
                                    completed_exams: []
                                }))
                            })() : [])}
                            loading={groupStudentsLoading}
                            searchTerm={teamSearchTerm}
                            setSearchTerm={setTeamSearchTerm}
                            onStudentClick={(s) => handleStudentClick(s, groupStudents.length > 0 ? groupStudents : filteredStudents)}
                            onPlayAudio={togglePlayAudio}
                            playingStudent={playingAudioStudent}
                            isStudentHighlighted={isStudentHighlighted}
                            onDeleteUser={handleOpenDeleteUserModal}
                            onClose={() => {
                                setSelectedGroup(null)
                                setSelectedHouse(null)
                                setGroupStudents([])
                            }}
                        />
                    )}
                </>
            )}

            {/* Modal de Exportación para Power BI */}
            {showPowerBiModal && (
                <PowerBiExportModal
                    students={students.length > 0 ? students : ALL_48_STUDENTS.map(s => ({
                        id: s.id,
                        username: s.username,
                        full_name: s.full_name,
                        email: s.email,
                        top_skill: s.top_skill,
                        average_level: 4.7,
                        completed_exams: []
                    }))}
                    onClose={() => setShowPowerBiModal(false)}
                />
            )}

            {/* Modal del Panel de Desarrollador para Eliminación de Usuarios */}
            {showDevModal && (
                <DeveloperUserManagementModal
                    students={students.length > 0 ? students : ALL_48_STUDENTS.map(s => ({
                        id: s.id,
                        username: s.username,
                        full_name: s.full_name,
                        email: s.email,
                        top_skill: s.top_skill,
                        average_level: 4.7,
                        completed_exams: []
                    }))}
                    preselectedStudent={devSelectedStudent}
                    onClose={() => {
                        setShowDevModal(false)
                        setDevSelectedStudent(null)
                    }}
                    onDeleteUser={handleDeleteUserComplete}
                />
            )}
        </div>
    )
}