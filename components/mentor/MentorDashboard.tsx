"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Search, Folder, ChevronRight, BarChart3,
    Plus, X, ArrowLeft, CheckCircle, Archive, Copy, FileText,
    BookOpen, Loader2, Trash2, Edit, ExternalLink
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { QuantumResultsView } from "../admin/QuantumResultsView"

interface Student {
    id: number
    username: string
    full_name: string
    top_skill: string
    average_level: number
}

interface Group {
    id: number
    name: string
    description: string
    student_count: number
}

interface MentorDashboardProps {
    view?: "dashboard" | "students" | "groups" | "archives"
}

const FolderCard = ({ title, subtitle, isSelected, onClick, count, isGroup }: {
    title: string, subtitle: string, isSelected: boolean,
    onClick: () => void, count: number, isGroup?: boolean
}) => (
    <motion.div
        whileHover={{ scale: 1.02, translateY: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden cursor-pointer p-6 rounded-3xl border transition-all duration-500 h-full flex flex-col justify-between ${isSelected
            ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
    >
        <div className="absolute top-0 right-0 p-4 opacity-10">
            {isGroup ? <Folder className="w-12 h-12" /> : <Users className="w-12 h-12" />}
        </div>
        <div className="relative z-10 flex-grow">
            <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${isSelected ? "text-purple-400" : "text-gray-500"}`}>
                {subtitle}
            </span>
            <h3 className="font-bold mt-1 text-2xl tracking-tight">{title}</h3>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-4 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{count} Estudiantes</span>
        </div>
        {isSelected && (
            <motion.div
                layoutId="activeFolderIndicator"
                className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"
            />
        )}
    </motion.div>
)

const StudentRow = ({ student, idx, onClick }: { student: Student, idx: number, onClick: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04 }}
        onClick={onClick}
        className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl cursor-pointer transition-all duration-300"
    >
        <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20 text-purple-400 font-bold text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="font-bold text-base tracking-tight">{student.full_name}</h3>
                <p className="text-sm text-gray-400">@{student.username}</p>
            </div>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-6 text-sm">
            <div className="text-center md:text-right">
                <p className="text-gray-500 mb-1 text-xs">Competencia principal</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-medium text-xs">
                    <BarChart3 className="w-3 h-3" />
                    {student.top_skill}
                </span>
            </div>
            <div className="text-center md:text-right">
                <p className="text-gray-500 mb-1 text-xs">Nivel promedio</p>
                <span className="font-bold text-base">{student.average_level.toFixed(1)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
    </motion.div>
)

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
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#110826] border border-white/10 rounded-3xl p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Crear Grupo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    <input value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nombre del grupo (ej: Mentoría A - Agosto 2026)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30" />
                    <input value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30" />
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="Buscar estudiante..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 ring-purple-500/30 text-sm"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">
                        Agregar estudiantes ({selectedIds.length} seleccionados)
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {filteredStudents.map(s => {
                            const sel = selectedIds.includes(s.id)
                            return (
                                <div key={s.id} onClick={() => toggle(s.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${sel ? "bg-purple-500/10 border-purple-500/30" : "bg-white/5 border-white/5 hover:border-white/15"}`}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "bg-purple-500 border-purple-500" : "border-white/20"}`}>
                                        {sel && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                                        {s.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{s.full_name}</p>
                                        <p className="text-xs text-gray-500">@{s.username}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 font-medium transition-colors text-sm">Cancelar</button>
                    <button disabled={!name.trim() || creating} onClick={handleCreate}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-40 rounded-xl text-white font-bold text-sm">
                        {creating ? "Creando..." : "Crear Grupo"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── ARCHIVES VIEW ──────────────────────────────────────────────────────────────
const ArchivesView = () => {
    const [exams, setExams] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [duplicating, setDuplicating] = useState<number | null>(null)

    const load = async () => {
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/archives/exams`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setExams(await res.json())
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

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
        if (s === "draft") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-32 text-gray-500">
                    <Archive className="w-14 h-14 mx-auto mb-4 opacity-20" />
                    <p className="text-base font-medium">No hay exámenes guardados.</p>
                    <p className="text-sm mt-1">Crea un examen desde el panel de exámenes.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {exams.map((exam, i) => (
                        <motion.div key={exam.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-base">{exam.title}</h3>
                                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border ${statusBadge(exam.status)}`}>
                                            {exam.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-0.5">Agente: <span className="text-purple-300">{exam.agent_name}</span></p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span>{exam.question_count} preguntas</span>
                                        <span>{exam.assignment_count} asignaciones</span>
                                        {exam.created_at && <span>{new Date(exam.created_at).toLocaleDateString('es-PE')}</span>}
                                    </div>
                                    {exam.competencies?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {exam.competencies.slice(0, 3).map((c: string) => (
                                                <span key={c} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">{c}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleDuplicate(exam.id)}
                                    disabled={duplicating === exam.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-300 text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    {duplicating === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                    Duplicar
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

export const MentorDashboard = ({ view = "dashboard" }: MentorDashboardProps) => {
    const [students, setStudents] = useState<Student[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [viewingStudentId, setViewingStudentId] = useState<number | null>(null)
    const [viewingStudentName, setViewingStudentName] = useState("")
    const [quantumData, setQuantumData] = useState<any>(null)
    const [quantumLoading, setQuantumLoading] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
    const [groupStudents, setGroupStudents] = useState<Student[]>([])
    const [groupStudentsLoading, setGroupStudentsLoading] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem("eleonor_token")
            try {
                const [studentsRes, groupsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/mentor/students`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/api/mentor/groups`, { headers: { Authorization: `Bearer ${token}` } })
                ])
                if (studentsRes.ok) setStudents(await studentsRes.json())
                if (groupsRes.ok) setGroups(await groupsRes.json())
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
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/students/${studentId}/quantum`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setQuantumData(await res.json())
            else console.error("Quantum API error:", res.status, await res.text())
        } catch (err) {
            console.error("Error fetching quantum data:", err)
        } finally {
            setQuantumLoading(false)
        }
    }

    const handleStudentClick = (student: Student) => {
        setViewingStudentId(student.id)
        setViewingStudentName(student.full_name)
        fetchQuantumData(student.id)
    }

    // Load group students when a group is selected
    const handleGroupSelect = async (groupId: number) => {
        if (selectedGroup === groupId) {
            setSelectedGroup(null)
            setGroupStudents([])
            return
        }
        setSelectedGroup(groupId)
        setGroupStudentsLoading(true)
        const token = localStorage.getItem("eleonor_token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/mentor/groups/${groupId}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) setGroupStudents(await res.json())
        } catch (err) {
            console.error("Error fetching group students:", err)
        } finally {
            setGroupStudentsLoading(false)
        }
    }

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredGroupStudents = groupStudents.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const SearchBar = () => (
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar estudiante..."
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-2 ring-purple-500/20 w-full md:w-64 transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
            </div>
        )
    }

    if (viewingStudentId) {
        return (
            <div className="space-y-6">
                <button onClick={() => { setViewingStudentId(null); setQuantumData(null) }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                {quantumLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                    </div>
                ) : (
                    <QuantumResultsView
                        studentName={viewingStudentName}
                        onBack={() => { setViewingStudentId(null); setQuantumData(null) }}
                        data={quantumData}
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
                    <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Archivos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Exámenes guardados. Duplica cualquier examen para reutilizarlo como plantilla.</p>
                </div>
                <ArchivesView />
            </div>
        )
    }

    // ── DASHBOARD ──────────────────────────────────────────────────────────────
    if (view === "dashboard") {
        return (
            <div className="space-y-12 max-w-7xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Dashboard</h1>
                        <p className="text-gray-500 mt-2 font-medium">Vista general del estado de tus estudiantes y grupos.</p>
                    </div>
                    <SearchBar />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { label: "Estudiantes", value: students.length, sub: "En total" },
                        { label: "Grupos", value: groups.length, sub: "Activos" },
                        { label: "Nivel Promedio", value: students.length ? (students.reduce((a, s) => a + s.average_level, 0) / students.length).toFixed(1) : "—", sub: "Global" },
                    ].map(stat => (
                        <div key={stat.label} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-black mt-1">{stat.value}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {groups.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Grupos activos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {groups.map(g => (
                                <FolderCard key={g.id} title={g.name} subtitle="Grupo de Mentoría"
                                    count={g.student_count} isGroup isSelected={false} onClick={() => {}} />
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center justify-between">
                        <span>Estudiantes</span>
                        <span className="text-sm font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full">{filteredStudents.length} resultados</span>
                    </h2>
                    <div className="grid gap-3">
                        {filteredStudents.slice(0, 8).map((s, i) => (
                            <StudentRow key={s.id} student={s} idx={i} onClick={() => handleStudentClick(s)} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── MIS ESTUDIANTES ────────────────────────────────────────────────────────
    if (view === "students") {
        return (
            <div className="space-y-10 max-w-7xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Mis Estudiantes</h1>
                        <p className="text-gray-500 mt-2 font-medium">Click en un estudiante para ver su análisis de habilidades.</p>
                    </div>
                    <SearchBar />
                </div>
                <div className="grid gap-3">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-24 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No hay estudiantes registrados.</p>
                        </div>
                    ) : (
                        filteredStudents.map((s, i) => (
                            <StudentRow key={s.id} student={s} idx={i} onClick={() => handleStudentClick(s)} />
                        ))
                    )}
                </div>
            </div>
        )
    }

    // ── GRUPOS ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        students={students}
                        onClose={() => setShowCreateGroup(false)}
                        onCreated={g => setGroups(prev => [...prev, g])}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">Grupos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Organiza tus estudiantes en grupos para asignarles exámenes.</p>
                </div>
                <button onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all whitespace-nowrap">
                    <Plus className="w-4 h-4" /> Nuevo Grupo
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-32 text-gray-500">
                    <Folder className="w-14 h-14 mx-auto mb-4 opacity-20" />
                    <p className="text-base font-medium">No tienes grupos aún.</p>
                    <p className="text-sm mt-1">Crea tu primer grupo para organizar a tus estudiantes.</p>
                    <button onClick={() => setShowCreateGroup(true)}
                        className="mt-6 flex items-center gap-2 px-5 py-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-300 font-medium text-sm mx-auto hover:bg-purple-600/30 transition-colors">
                        <Plus className="w-4 h-4" /> Crear primer grupo
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateGroup(true)}
                            className="border border-dashed border-white/15 hover:border-purple-500/40 rounded-3xl p-6 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[160px] text-gray-500 hover:text-purple-300 transition-all">
                            <Plus className="w-8 h-8" />
                            <span className="text-sm font-medium">Nuevo Grupo</span>
                        </motion.div>
                        {groups.map(g => (
                            <FolderCard key={g.id} title={g.name}
                                subtitle={g.description || "Grupo de Mentoría"}
                                count={g.student_count} isGroup
                                isSelected={selectedGroup === g.id}
                                onClick={() => handleGroupSelect(g.id)} />
                        ))}
                    </div>

                    {selectedGroup !== null && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold">Estudiantes en el grupo</h2>
                                <SearchBar />
                            </div>
                            {groupStudentsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : filteredGroupStudents.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">Este grupo no tiene estudiantes aún.</div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredGroupStudents.map((s, i) => (
                                        <StudentRow key={s.id} student={s} idx={i} onClick={() => handleStudentClick(s)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
