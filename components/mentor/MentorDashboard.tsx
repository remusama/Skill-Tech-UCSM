"use client"

import { useState, useEffect, ComponentProps } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Search, Folder, ChevronRight, ChevronDown, BarChart3,
    Plus, X, ArrowLeft, CheckCircle, Archive, Copy, FileText,
    BookOpen, Loader2, Trash2, Edit, ExternalLink, Clock,
    Presentation, Download, Play, Bot, Sparkles, Volume2, Shield, Flame
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
    isPlayingAudio
}: {
    student: Student
    idx: number
    onClick: () => void
    onPlayAudio?: (studentName: string) => void
    isPlayingAudio?: boolean
}) => {
    const profile = getStudentHouseProfile(student.full_name || student.username || student.email || "")
    const houseInfo = profile ? CASAS_INFO[profile.house] : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.005, 0.06), duration: 0.15 }}
            onClick={onClick}
            className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-slate-900/50 hover:bg-slate-900/80 border border-emerald-500/10 hover:border-emerald-500/30 rounded-2xl cursor-pointer transition-all duration-200"
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
                        <h3 className="font-bold text-base tracking-tight text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {student.full_name}
                        </h3>
                        {houseInfo && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${houseInfo.badgeBg} ${houseInfo.badgeText} ${houseInfo.borderColor} flex items-center gap-1`}>
                                <img src={houseInfo.logo} alt="" className="w-3 h-3 object-contain" />
                                {houseInfo.name}
                            </span>
                        )}
                        {profile?.classroom && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                                {profile.classroom}
                            </span>
                        )}
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
        id: "cepv",
        title: "CEPV (Estilos de Vida y Valores)",
        category: "Examen Psicométrico",
        description: "Evaluación de estilos de vida, valores y preferencias formativas."
    },
    {
        id: "ccl",
        title: "CCL (Competencias de Liderazgo)",
        category: "Examen Psicométrico",
        description: "Evaluación psicométrica de competencias clave de liderazgo."
    },
    {
        id: "expectativas",
        title: "Expectativas del Estudiante",
        category: "Test de Diagnóstico",
        description: "Encuesta sobre expectativas de desarrollo académico y personal."
    }
]

// Tarea 6B — Vista de perfil de estudiante con pestañas: Perfil Cognitivo / Exámenes
const StudentProfileView = ({
    studentId,
    quantumProps,
}: {
    studentId: number
    quantumProps: ComponentProps<typeof QuantumResultsView>
}) => {
    const [activeTab, setActiveTab] = useState<'cognitive' | 'exams'>('cognitive')
    const [exams, setExams] = useState<StudentExam[]>([])
    const [examsLoading, setExamsLoading] = useState(false)
    const [examsError, setExamsError] = useState<string | null>(null)
    const [expandedExamId, setExpandedExamId] = useState<number | null>(null)

    useEffect(() => {
        if (activeTab !== 'exams') return
        const fetchExams = async () => {
            setExamsLoading(true)
            setExamsError(null)
            const token = localStorage.getItem("eleonor_token")
            try {
                const res = await fetch(`${API_BASE_URL}/api/mentor/students/${studentId}/exams`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.detail || "No se pudieron cargar los exámenes.")
                }
                setExams(await res.json())
            } catch (e: any) {
                setExamsError(e.message || "Error al cargar los exámenes.")
            } finally {
                setExamsLoading(false)
            }
        }
        fetchExams()
        // Se vuelve a pedir cada vez que cambia el estudiante (studentId), no en cada render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, studentId])

    return (
        <div className="space-y-6">
            {/* Pestañas */}
            <div className="flex gap-2 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('cognitive')}
                    className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'cognitive' ? 'border-[hsl(74,100%,47%)] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    📊 Perfil Cognitivo
                </button>
                <button
                    onClick={() => setActiveTab('exams')}
                    className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'exams' ? 'border-[hsl(74,100%,47%)] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    📝 Exámenes
                </button>
            </div>

            {activeTab === 'cognitive' && <QuantumResultsView {...quantumProps} />}

            {activeTab === 'exams' && (
                <div className="space-y-3">
                    {examsLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                        </div>
                    ) : examsError ? (
                        <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl text-center">
                            <p className="text-sm text-red-400 font-bold">{examsError}</p>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center">
                            <p className="text-xs text-gray-600 font-black uppercase tracking-widest italic">Este estudiante no tiene exámenes asignados.</p>
                        </div>
                    ) : (
                        exams.map(exam => {
                            const isExpanded = expandedExamId === exam.exam_id
                            return (
                                <div key={exam.exam_id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedExamId(isExpanded ? null : exam.exam_id)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <div className="text-left">
                                                <div className="text-sm font-bold text-white">{exam.title}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{exam.agent_name}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${exam.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {exam.completed ? 'Completado' : exam.status}
                                            </span>
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                        </div>
                                    </button>
                                    {isExpanded && (
                                        <div className="border-t border-white/5 p-5 space-y-4">
                                            {exam.answers.length === 0 ? (
                                                <p className="text-xs text-gray-600 italic">Este estudiante aún no ha respondido este examen.</p>
                                            ) : (
                                                exam.answers.map((a, i) => (
                                                    <div key={i} className="p-4 bg-black/20 rounded-2xl border border-white/5">
                                                        <div className="text-xs font-bold text-white mb-2">{a.question}</div>
                                                        <div className="text-xs text-gray-400">{a.answer ?? "—"}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
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
    onClose
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
                        />
                    ))}
                </div>
            )}
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
    const [studentSubTab, setStudentSubTab] = useState<"students" | "groups">(
        view === "groups" ? "groups" : initialSubTab
    )
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

    // Sincronizar subpestaña si cambia la vista o prop
    useEffect(() => {
        if (view === "groups") {
            setStudentSubTab("groups")
        } else if (view === "students" && initialSubTab) {
            setStudentSubTab(initialSubTab)
        }
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
        // Pre-cargar inmediatamente los 12 alumnos de la casa sin demora
        const houseRoster = ALL_48_STUDENTS.filter(s => s.house === houseKey).map(s => ({
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
                            4 Evaluaciones Diagnósticas
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
                        {studentSubTab === "students"
                            ? "Click en un estudiante para ver su análisis de habilidades."
                            : "Organiza tus estudiantes en grupos para actividades y seguimiento."}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Switch Integrado: Estudiantes / Grupos */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-emerald-500/20 shadow-xl">
                        <button
                            onClick={() => setStudentSubTab("students")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                studentSubTab === "students"
                                    ? "bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Estudiantes ({students.length})</span>
                        </button>
                        <button
                            onClick={() => setStudentSubTab("groups")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                studentSubTab === "groups"
                                    ? "bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                            }`}
                        >
                            <Folder className="w-4 h-4" />
                            <span>Grupos ({groups.length})</span>
                        </button>
                    </div>

                    {studentSubTab === "students" ? (
                        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    ) : (
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] rounded-xl text-slate-950 font-bold text-xs shadow-lg shadow-[hsl(74,100%,47%)]/15 transition-all whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Grupo
                        </button>
                    )}
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
                            students={groupStudents.length > 0 ? groupStudents : (selectedHouse ? ALL_48_STUDENTS.filter(s => s.house === selectedHouse).map(s => ({
                                id: s.id,
                                username: s.username,
                                full_name: s.full_name,
                                email: s.email,
                                top_skill: s.top_skill,
                                average_level: 4.7,
                                completed_exams: []
                            })) : [])}
                            loading={groupStudentsLoading}
                            searchTerm={teamSearchTerm}
                            setSearchTerm={setTeamSearchTerm}
                            onStudentClick={(s) => handleStudentClick(s, groupStudents.length > 0 ? groupStudents : filteredStudents)}
                            onPlayAudio={togglePlayAudio}
                            playingStudent={playingAudioStudent}
                            onClose={() => {
                                setSelectedGroup(null)
                                setSelectedHouse(null)
                                setGroupStudents([])
                            }}
                        />
                    )}
                </>
            )}
        </div>
    )
}