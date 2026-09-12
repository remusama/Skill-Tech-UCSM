import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, Zap, Activity, Target, Sparkles, TrendingUp, Calendar, Users, Edit3, Save, Clock, CheckCircle2, Sliders, ChevronLeft, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from 'recharts'
import { API_BASE_URL } from "@/lib/config"

interface MetricProps {
    label: string
    value: string | number
    icon: any
    color: string
    description: string
}

const TechnicalMetric = ({ label, value, icon: Icon, color, description }: MetricProps) => (
    <div className="flex flex-col gap-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group">
        <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest font-mono">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${color.replace('bg-', 'shadow-[0_0_8px_rgba(255,255,255,0.4)] bg-')} animate-pulse`}></div>
        </div>
        <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-white tracking-tighter font-mono">{value}</div>
            <Icon className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
        </div>
        <div className="text-[8px] text-gray-600 font-medium leading-tight uppercase tracking-tighter line-clamp-1">
            {description}
        </div>
    </div>
)

interface SessionHistory {
    id: number
    score: number
    area: string
    date: string
    data?: any
}

interface QuantumData {
    learning_energy: string
    energy_percentage: number
    academic_risk: string
    recommendation: string
    topography: Record<string, number>
    performance_avg: number
    total_exams: number
    last_exam_date: string
    top_skill: string
    history: {
        academic: SessionHistory[]
        personal: SessionHistory[]
    }
}

interface PracticalSnapshot {
    id: string
    date: string
    average: number
    scores: Record<string, number>
}

const PRACTICAL_ITEMS = [
    { id: "escucha_activa", label: "Escucha Activa", desc: "Capacidad de atender, comprender e interpretar adecuadamente las ideas." },
    { id: "comunicacion_asertiva", label: "Comunicación Asertiva", desc: "Expresión clara, directa y respetuosa de puntos de vista y conceptos." },
    { id: "trabajo_equipo", label: "Trabajo en Equipo", desc: "Colaboración armónica, soporte mutuo y consecución de metas grupales." },
    { id: "liderazgo_gestion", label: "Liderazgo y Gestión", desc: "Organización, orientación e inspiración efectiva del equipo." },
    { id: "pensamiento_critico", label: "Pensamiento Crítico", desc: "Análisis reflexivo, razonado y objetivo de argumentos e información." },
    { id: "resolucion_problemas", label: "Resolución de Problemas", desc: "Afrontamiento eficaz de desacuerdos, contingencias y desafíos." },
    { id: "adaptabilidad_autogestion", label: "Adaptabilidad y Autogestión", desc: "Flexibilidad frente al cambio y autorregulación del aprendizaje." }
]

export const QuantumResultsView = ({
    studentName,
    studentId,
    onBack,
    data,
    onNextStudent,
    onPrevStudent,
    hasNextStudent,
    hasPrevStudent,
    currentIndex,
    totalStudents,
    activeExam
}: {
    studentName: string
    studentId?: number | null
    onBack: () => void
    data: QuantumData | null
    onNextStudent?: () => void
    onPrevStudent?: () => void
    hasNextStudent?: boolean
    hasPrevStudent?: boolean
    currentIndex?: number
    totalStudents?: number
    activeExam?: {
        id: string
        title: string
        category: string
        description: string
    } | null
}) => {
    const [activeChart, setActiveChart] = useState<'academic' | 'personal'>('academic')
    const [viewMode, setViewMode] = useState<'charts' | 'diagnostics'>('charts')
    const [diagLevel, setDiagLevel] = useState<'groups' | 'areas' | 'exams' | 'detail'>('groups')
    const [selectedGroup, setSelectedGroup] = useState<'academic' | 'personal' | null>(null)
    const [selectedArea, setSelectedArea] = useState<string | null>(null)
    const [selectedDiagnostic, setSelectedDiagnostic] = useState<SessionHistory | null>(null)
    const [attendanceRate, setAttendanceRate] = useState<number | string>(85)

    // Si viene desde la vista de un examen específico, ir directo a las respuestas de ese examen
    useEffect(() => {
        if (activeExam) {
            setViewMode('diagnostics')
            setSelectedGroup('academic')
            setDiagLevel('detail')

            const examTitleLower = activeExam.title.toLowerCase()
            const examIdLower = activeExam.id.toLowerCase()

            const matchAcademic = data?.history?.academic?.find(h =>
                h.area.toLowerCase().includes(examIdLower) ||
                examTitleLower.includes(h.area.toLowerCase())
            )
            const matchPersonal = data?.history?.personal?.find(h =>
                h.area.toLowerCase().includes(examIdLower) ||
                examTitleLower.includes(h.area.toLowerCase())
            )

            const matchedItem = matchAcademic || matchPersonal

            if (matchedItem) {
                setSelectedDiagnostic(matchedItem)
            } else {
                setSelectedDiagnostic({
                    id: 101,
                    score: 88,
                    area: activeExam.title,
                    date: new Date().toLocaleDateString('es-PE'),
                    data: {
                        nivel_etiqueta: "Evaluado",
                        nivel_rango: "80–95",
                        razonamiento_vector: { analitico: 0.88, divergente: 0.80, intuitivo: 0.84, practico: 0.92 }
                    }
                })
            }
        }
    }, [activeExam, studentId, data])

    // Cargar % de asistencia del estudiante
    useEffect(() => {
        if (!studentId) return
        const token = localStorage.getItem("eleonor_token")
        fetch(`${API_BASE_URL}/api/attendance/student/${studentId}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.ok ? res.json() : null)
            .then(att => {
                if (att?.stats?.rate !== undefined) {
                    setAttendanceRate(att.stats.rate)
                }
            })
            .catch(() => {})
    }, [studentId])

    // --- RENDIMIENTO PRÁCTICO & LÍNEA DE TIEMPO ---
    const storageKey = studentId ? `practical_eval_student_${studentId}` : `practical_eval_default`

    const [timeline, setTimeline] = useState<PracticalSnapshot[]>(() => {
        if (typeof window === "undefined") return []
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            } catch (e) {}
        }
        return [
            {
                id: "init-1",
                date: "01/09/2026 10:00",
                average: 3.8,
                scores: {
                    escucha_activa: 4.0,
                    comunicacion_asertiva: 3.5,
                    trabajo_equipo: 4.0,
                    liderazgo_gestion: 3.5,
                    pensamiento_critico: 4.0,
                    resolucion_problemas: 3.5,
                    adaptabilidad_autogestion: 4.0
                }
            }
        ]
    })

    const [likertScores, setLikertScores] = useState<Record<string, number>>(() => {
        if (timeline.length > 0) {
            return { ...timeline[timeline.length - 1].scores }
        }
        return {
            escucha_activa: 3.5,
            comunicacion_asertiva: 3.5,
            trabajo_equipo: 3.5,
            liderazgo_gestion: 3.5,
            pensamiento_critico: 3.5,
            resolucion_problemas: 3.5,
            adaptabilidad_autogestion: 3.5
        }
    })

    const [isEditingPractical, setIsEditingPractical] = useState(false)
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null)
    const [toastMessage, setToastMessage] = useState("")

    const handleScoreChange = (id: string, value: number) => {
        setLikertScores(prev => ({ ...prev, [id]: value }))
    }

    const handleSavePractical = () => {
        const nowStr = new Date().toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        const vals = Object.values(likertScores)
        const avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))

        const newSnapshot: PracticalSnapshot = {
            id: `snap-${Date.now()}`,
            date: nowStr,
            average: avg,
            scores: { ...likertScores }
        }

        const updated = [...timeline, newSnapshot]
        setTimeline(updated)
        setSelectedSnapshotId(newSnapshot.id)
        if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(updated))
        }
        setIsEditingPractical(false)
        setToastMessage("¡Cambios guardados en la línea de tiempo!")
        setTimeout(() => setToastMessage(""), 4000)
    }

    const handleSelectSnapshot = (snap: PracticalSnapshot) => {
        setSelectedSnapshotId(snap.id)
        setLikertScores({ ...snap.scores })
        setIsEditingPractical(false)
    }

    // Característica más puntuada
    const getTopCharacteristic = () => {
        if (!likertScores || Object.keys(likertScores).length === 0) {
            return (data?.top_skill && data.top_skill !== 'N/A') ? data.top_skill : "En análisis"
        }
        let topKey = ""
        let maxVal = -1
        Object.entries(likertScores).forEach(([k, v]) => {
            if (v > maxVal) {
                maxVal = v
                topKey = k
            }
        })
        const foundItem = PRACTICAL_ITEMS.find(item => item.id === topKey)
        return foundItem ? `${foundItem.label} (${maxVal.toFixed(1)}/5)` : "En análisis"
    }

    const AREA_COLORS: Record<string, string> = {
        "ciencias": "#10b981",
        "ciencia": "#10b981",
        "matematicas": "#3b82f6",
        "humanidades": "#f59e0b",
        "ingenieria": "#06b6d4",
        "medicina": "#ef4444",
        "razonamiento": "#eab308",
        "aprendizaje": "#22c55e",
        "criterio": "#4f46e5",
        "adaptabilidad": "#a855f7",
        "autonomia": "#f43f5e",
        "cognitivo-academico": "#0891b2",
        "personajes": "#8b5cf6",
        "logica": "#06b6d4",
        "creatividad": "#f43f5e",
        "comprension lectora": "#ef4444"
    }

    const PALETTE = ["#10b981", "#3b82f6", "#f59e0b", "#06b6d4", "#ef4444", "#eab308", "#a855f7", "#f43f5e"];

    const getAreaColor = (area: string) => {
        const normalized = area.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (AREA_COLORS[normalized]) {
            return AREA_COLORS[normalized];
        }
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
        }
        return PALETTE[Math.abs(hash) % PALETTE.length];
    }

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(74,100%,47%)]"></div>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Cargando datos del perfil...</p>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-20"
        >
            {/* Header con flechas de navegación entre estudiantes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[hsl(161,40%,12%)]/70 border border-[hsl(153,30%,75%)]/20 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="p-3 bg-[hsl(161,40%,18%)] border border-[hsl(153,30%,75%)]/20 rounded-2xl hover:bg-[hsl(74,100%,47%)] hover:text-slate-950 text-white transition-all shadow-md"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </motion.button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[hsl(74,100%,47%)] font-black uppercase tracking-[0.3em]">
                                Perfil del Estudiante
                            </span>
                            {activeExam && (
                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[hsl(74,100%,47%)]/15 border border-[hsl(74,100%,47%)]/40 text-[hsl(74,100%,47%)] font-bold uppercase tracking-wider">
                                    Examen: {activeExam.title}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase italic">{studentName}</h1>
                    </div>
                </div>

                {/* Controles de Navegación < > entre Estudiantes */}
                {totalStudents !== undefined && totalStudents > 0 && (
                    <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/20 px-4 py-2 rounded-2xl shrink-0">
                        <span className="text-xs font-bold text-slate-300">
                            Estudiante <span className="text-[hsl(74,100%,47%)]">{(currentIndex ?? 0) + 1}</span> de {totalStudents}
                        </span>
                        <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                            <button
                                type="button"
                                disabled={!hasPrevStudent}
                                onClick={onPrevStudent}
                                title="Estudiante anterior"
                                className="p-2 rounded-xl bg-slate-900 hover:bg-[hsl(74,100%,47%)] hover:text-slate-950 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                disabled={!hasNextStudent}
                                onClick={onNextStudent}
                                title="Siguiente estudiante"
                                className="p-2 rounded-xl bg-slate-900 hover:bg-[hsl(74,100%,47%)] hover:text-slate-950 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Viz Area */}
            <div className="grid grid-cols-1 gap-8">
                {/* Cognitive Core Map */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(161,40%,10%)] via-slate-950 to-[hsl(161,50%,6%)] border border-emerald-500/20 rounded-[2.5rem] p-6 lg:p-8 min-h-[650px] shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none"></div>

                    {/* Technical Metric Overlay Header - Compact & Green design */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 relative z-20">
                        <TechnicalMetric
                            label="% ASISTENCIA"
                            value={`${attendanceRate}%`}
                            icon={Users}
                            color="bg-emerald-500"
                            description="Porcentaje global de asistencia."
                        />
                        <TechnicalMetric
                            label="TESTS REALIZADOS"
                            value={data.total_exams || 0}
                            icon={Activity}
                            color="bg-teal-500"
                            description="Cantidad de exámenes completados."
                        />
                        <TechnicalMetric
                            label="CARACTERÍSTICA DESTACADA"
                            value={getTopCharacteristic()}
                            icon={Target}
                            color="bg-[hsl(74,100%,47%)]"
                            description="Característica más puntuada."
                        />
                        <TechnicalMetric
                            label="ÚLTIMA ACTIVIDAD"
                            value={(data.last_exam_date && data.last_exam_date !== 'N/A') ? data.last_exam_date : "En análisis"}
                            icon={Calendar}
                            color="bg-emerald-400"
                            description="Fecha de evaluación más reciente."
                        />
                    </div>
                    <div className="absolute top-0 right-0 p-8">
                        <Sparkles className="w-8 h-8 text-[hsl(74,100%,47%)]/20 animate-pulse" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full gap-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tighter italic text-white">Mapa de Tendencias Cognitivas</h2>
                                <p className="text-slate-400 text-xs max-w-lg font-medium tracking-tight">Su mentor sugiere patrones de habilidad basados en las evidencias observadas.</p>
                            </div>

                            <button
                                onClick={() => {
                                    const nextMode = viewMode === 'charts' ? 'diagnostics' : 'charts';
                                    setViewMode(nextMode);
                                    if (nextMode === 'diagnostics') setDiagLevel('groups');
                                    setSelectedDiagnostic(null);
                                }}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl transition-all duration-500 shadow-xl ${viewMode === 'diagnostics'
                                    ? 'bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow-[0_0_25px_rgba(186,239,0,0.3)]'
                                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-emerald-500/10'
                                    }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Perfiles</span>
                            </button>
                        </div>

                        {/* Navigation / Switcher */}
                        <div className="flex items-center justify-between gap-4 mb-6 border-b border-emerald-500/10 pb-4">
                            <div className="flex gap-3">
                                {(['academic', 'personal'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setActiveChart(type);
                                            setViewMode('charts');
                                        }}
                                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative group/btn ${activeChart === type && viewMode === 'charts'
                                            ? 'bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow-[0_0_20px_rgba(186,239,0,0.3)]'
                                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {activeChart === type && viewMode === 'charts' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></div>}
                                            {type === 'academic' ? 'Rendimiento Práctico' : 'Historial Personal'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expansion Area */}
                        <div className="flex-1">
                            {viewMode === 'charts' ? (
                                activeChart === 'academic' ? (
                                    /* RENDIMIENTO PRÁCTICO SECTION */
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {toastMessage && (
                                            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-lg">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                {toastMessage}
                                            </div>
                                        )}

                                        {/* Línea de Tiempo (Timeline) */}
                                        <div className="p-5 rounded-[2rem] bg-slate-900/60 border border-emerald-500/15 space-y-3 shadow-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                                    <Clock className="w-4 h-4" />
                                                    Línea de Tiempo de Historiales y Evaluación Práctica
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {timeline.length} registro(s) guardado(s)
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                {timeline.map((snap) => {
                                                    const isSelected = selectedSnapshotId === snap.id || (selectedSnapshotId === null && snap.id === timeline[timeline.length - 1]?.id)
                                                    return (
                                                        <button
                                                            key={snap.id}
                                                            onClick={() => handleSelectSnapshot(snap)}
                                                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border text-xs font-medium transition-all shrink-0 ${isSelected
                                                                ? "bg-[hsl(74,100%,47%)]/20 border-[hsl(74,100%,47%)] text-white shadow-[0_0_15px_rgba(186,239,0,0.2)]"
                                                                : "bg-slate-900/80 border-emerald-500/10 text-slate-400 hover:bg-slate-800"
                                                                }`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${isSelected ? "bg-[hsl(74,100%,47%)] animate-ping" : "bg-slate-600"}`} />
                                                            <div className="text-left">
                                                                <p className="font-mono text-[10px] font-bold text-slate-300">{snap.date}</p>
                                                                <p className="text-[11px] font-black text-[hsl(74,100%,47%)]">Promedio: {snap.average.toFixed(1)} / 5.0</p>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Header de Acciones de Rendimiento Práctico */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2rem] bg-gradient-to-r from-[hsl(161,40%,15%)] via-slate-900 to-[hsl(161,40%,12%)] border border-emerald-500/20 shadow-xl">
                                            <div>
                                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                                    <Sliders className="w-5 h-5 text-[hsl(74,100%,47%)]" />
                                                    Evaluación de Competencias (Escala Likert 1 a 5)
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {isEditingPractical
                                                        ? "Arrastre las barras de 1 a 5 puntos para actualizar la calificación del estudiante."
                                                        : "Modo vista previa. Haga clic en Actualizar para modificar puntuaciones."}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditingPractical(!isEditingPractical)}
                                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${isEditingPractical
                                                        ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                                                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                                        }`}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    {isEditingPractical ? "Cancelar" : "Actualizar"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={!isEditingPractical}
                                                    onClick={handleSavePractical}
                                                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs tracking-wider uppercase bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] text-slate-950 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-[hsl(74,100%,47%)]/20"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>

                                        {/* 7 Items Likert Sliders Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {PRACTICAL_ITEMS.map((item) => {
                                                const currentVal = likertScores[item.id] || 3.5
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${isEditingPractical
                                                            ? "bg-[hsl(161,40%,14%)]/70 border-[hsl(74,100%,47%)]/50 shadow-lg shadow-emerald-950/40"
                                                            : "bg-slate-900/60 border-emerald-500/10 hover:border-emerald-500/30"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="font-bold text-sm text-white tracking-wide">{item.label}</h4>
                                                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="text-base font-black text-[hsl(74,100%,47%)] font-mono">
                                                                    {currentVal.toFixed(1)}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-bold"> / 5.0</span>
                                                            </div>
                                                        </div>

                                                        {/* Slider Barra arrastrable */}
                                                        <div className="space-y-2 pt-1">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                step="0.5"
                                                                value={currentVal}
                                                                disabled={!isEditingPractical}
                                                                onChange={e => handleScoreChange(item.id, parseFloat(e.target.value))}
                                                                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[hsl(74,100%,47%)] disabled:opacity-60 disabled:cursor-not-allowed"
                                                            />

                                                            <div className="flex justify-between text-[9px] font-mono text-gray-500 uppercase font-bold">
                                                                <span>1 (Inicial)</span>
                                                                <span>2 (En desarrollo)</span>
                                                                <span>3 (Aceptable)</span>
                                                                <span>4 (Competente)</span>
                                                                <span>5 (Sobresaliente)</span>
                                                            </div>

                                                            {/* Botones de selección rápida si está editando */}
                                                            {isEditingPractical && (
                                                                <div className="flex justify-between gap-1 pt-1">
                                                                    {[1, 2, 3, 4, 5].map(pt => (
                                                                        <button
                                                                            key={pt}
                                                                            type="button"
                                                                            onClick={() => handleScoreChange(item.id, pt)}
                                                                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors ${currentVal === pt
                                                                                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                                                                                : "bg-white/5 hover:bg-white/10 text-gray-300"
                                                                                }`}
                                                                        >
                                                                            {pt} pts
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* HISTORIAL PERSONAL CHART */
                                    <div className="h-[400px] w-full mt-4">
                                        {data.history.personal.length > 0 ? (() => {
                                            const uniqueAreas = Array.from(new Set(data.history.personal.map(h => h.area)))
                                            const dateMap = new Map<string, any>()
                                            data.history.personal.forEach(h => {
                                                if (!dateMap.has(h.date)) dateMap.set(h.date, { date: h.date })
                                                dateMap.get(h.date)[h.area] = h.score
                                            })
                                            const sortedData = Array.from(dateMap.values()).sort((a, b) =>
                                                new Date(a.date).getTime() - new Date(b.date).getTime()
                                            )

                                            return (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={sortedData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            stroke="#4b5563"
                                                            fontSize={11}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            dy={15}
                                                            tickFormatter={(str) => {
                                                                const d = new Date(str)
                                                                return `${d.getDate()}/${d.getMonth() + 1}`
                                                            }}
                                                        />
                                                        <YAxis stroke="#4b5563" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} />
                                                        <Tooltip
                                                            content={({ active, payload, label }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="bg-[#0a051ac0] border border-white/10 p-6 rounded-[2rem] shadow-2xl backdrop-blur-2xl border-l-[6px] border-l-purple-500">
                                                                            <div className="text-[10px] text-gray-500 uppercase font-black mb-4 tracking-widest">{label}</div>
                                                                            <div className="space-y-3">
                                                                                {payload.map((p: any, i: number) => (
                                                                                    <div key={i} className="flex items-center justify-between gap-10">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                                                                                            <span className="text-xs font-black text-white uppercase tracking-tighter">{p.name}</span>
                                                                                        </div>
                                                                                        <span className="text-xs font-black text-purple-400">{p.value}%</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        {uniqueAreas.map((area) => (
                                                            <Line
                                                                key={area}
                                                                type="monotone"
                                                                dataKey={area}
                                                                name={area}
                                                                stroke={getAreaColor(area)}
                                                                strokeWidth={5}
                                                                dot={{ r: 5, fill: getAreaColor(area), strokeWidth: 0 }}
                                                                activeDot={{ r: 10, stroke: '#fff', strokeWidth: 3 }}
                                                                connectNulls={false}
                                                                animationDuration={2000}
                                                            />
                                                        ))}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )
                                        })() : (
                                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
                                                <Calendar className="w-16 h-16 text-white/5 mb-6" />
                                                <p className="text-sm text-gray-600 font-black uppercase tracking-[0.3em]">Nodos de memoria no detectados</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="animate-in fade-in duration-700">
                                    {/* Nested Folder Navigation Header */}
                                    {diagLevel !== 'groups' && (
                                        <div className="flex items-center gap-4 mb-12">
                                            <button
                                                onClick={() => {
                                                    if (diagLevel === 'areas') setDiagLevel('groups');
                                                    if (diagLevel === 'exams') setDiagLevel('areas');
                                                    if (diagLevel === 'detail') setDiagLevel('exams');
                                                }}
                                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group hover:scale-105"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-orange-400 group-hover:-translate-x-1 transition-transform" />
                                            </button>
                                            <div className="flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.2em] text-gray-500">
                                                <button onClick={() => setDiagLevel('groups')} className="hover:text-white transition-colors">Sistema</button>
                                                {selectedGroup && (
                                                    <>
                                                        <span className="text-white/10 font-thin">/</span>
                                                        <button onClick={() => setDiagLevel('areas')} className="text-orange-400 hover:text-orange-300 transition-colors">{selectedGroup}</button>
                                                    </>
                                                )}
                                                {selectedArea && diagLevel !== 'areas' && (
                                                    <>
                                                        <span className="text-white/10 font-thin">/</span>
                                                        <button onClick={() => setDiagLevel('exams')} className="text-orange-400 hover:text-orange-300 transition-colors">{selectedArea}</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* UI Level Implementation */}
                                    <div className="min-h-[400px]">
                                        {/* Level 1: Groups */}
                                        {diagLevel === 'groups' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                                                {(['academic', 'personal'] as const).map((group) => (
                                                    <button
                                                        key={group}
                                                        onClick={() => {
                                                            setSelectedGroup(group);
                                                            setDiagLevel('areas');
                                                        }}
                                                        className="group relative h-64 bg-white/[0.03] rounded-[3rem] border border-white/10 hover:bg-white/[0.07] transition-all duration-700 hover:scale-[1.03] overflow-hidden"
                                                    >
                                                        <div className={`absolute top-0 left-0 w-2 h-full ${group === 'academic' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                        <div className="relative flex flex-col items-center justify-center h-full gap-8">
                                                            <div className="relative h-28 w-36">
                                                                <div className={`absolute bottom-0 left-0 w-full h-[85%] rounded-[2rem] shadow-2xl border-l border-white/10 ${group === 'academic' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                                                                <div className={`absolute top-[10%] left-0 w-20 h-7 rounded-t-[1.5rem] ${group === 'academic' ? 'bg-purple-700' : 'bg-blue-700'}`}></div>
                                                                <div className="absolute inset-0 flex items-center justify-center pb-2">
                                                                    <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <h3 className="text-2xl font-black uppercase text-white tracking-[0.3em] mb-2">{group === 'academic' ? 'Académico' : 'Personal'}</h3>
                                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{data.history[group].length} Perfiles orientativos</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Level 2: Areas */}
                                        {diagLevel === 'areas' && selectedGroup && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                                {Array.from(new Set(data.history[selectedGroup].map(h => h.area))).map((area) => (
                                                    <button
                                                        key={area}
                                                        onClick={() => {
                                                            setSelectedArea(area);
                                                            setDiagLevel('exams');
                                                        }}
                                                        className="group flex flex-col items-center p-10 bg-white/5 rounded-[3rem] border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
                                                    >
                                                        <div className="mb-6 relative h-20 w-24">
                                                            <div className="absolute bottom-0 left-0 w-full h-[85%] rounded-2xl shadow-xl border-l border-white/10" style={{ backgroundColor: getAreaColor(area) }}></div>
                                                            <div className="absolute top-[10%] left-0 w-12 h-5 rounded-t-2xl" style={{ backgroundColor: getAreaColor(area), filter: 'brightness(0.8)' }}></div>
                                                        </div>
                                                        <h3 className="text-[11px] font-black uppercase text-white group-hover:text-orange-400 transition-colors text-center tracking-tighter leading-tight mb-2">{area}</h3>
                                                        <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-gray-500 uppercase">
                                                            {data.history[selectedGroup].filter(h => h.area === area).length} Sesiones
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Level 3: Individual Exams */}
                                        {diagLevel === 'exams' && selectedGroup && selectedArea && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                                {data.history[selectedGroup].filter(h => h.area === selectedArea).map((exam, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setSelectedDiagnostic(exam);
                                                            setDiagLevel('detail');
                                                        }}
                                                        className="group flex flex-col items-start p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                                            <Activity className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="mb-6 relative h-14 w-20">
                                                            <div className="absolute bottom-0 left-0 w-full h-[85%] rounded-xl shadow-lg flex items-center justify-center font-black text-white text-[10px]" style={{ backgroundColor: getAreaColor(exam.area) }}>
                                                                {exam.score}%
                                                            </div>
                                                            <div className="absolute top-[10%] left-0 w-10 h-4 rounded-t-xl" style={{ backgroundColor: getAreaColor(exam.area), filter: 'brightness(0.7)' }}></div>
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase text-white mb-1">ID #{exam.id}</div>
                                                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{exam.date}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Level 4: Detail View */}
                                        {diagLevel === 'detail' && selectedDiagnostic && (
                                            <div className="bg-white/5 rounded-[4rem] p-16 border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto backdrop-blur-3xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                                                    <Brain className="w-64 h-64" />
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-16">
                                                        <div>
                                                            <div className="flex items-center gap-5 mb-4">
                                                                <div className="w-5 h-5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] animate-pulse" style={{ backgroundColor: getAreaColor(selectedDiagnostic.area) }}></div>
                                                                <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none">{selectedDiagnostic.area}</h3>
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-black uppercase tracking-[0.4em] ml-1">Perfil Orientativo · {selectedDiagnostic.date}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-white tracking-tighter tabular-nums mb-1">
                                                                {selectedDiagnostic.data?.nivel_etiqueta || (
                                                                    selectedDiagnostic.score >= 80 ? "Experto" :
                                                                    selectedDiagnostic.score >= 60 ? "Competente" :
                                                                    selectedDiagnostic.score >= 40 ? "En Desarrollo" : "Inicial"
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-bold text-orange-400 tabular-nums mb-1">
                                                                Rango estimado: {selectedDiagnostic.data?.nivel_rango || `${Math.max(0, selectedDiagnostic.score - 9)}–${Math.min(100, selectedDiagnostic.score + 10)}`}
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Tendencia orientativa</div>
                                                        </div>
                                                    </div>

                                                    {(selectedDiagnostic.data?.razonamiento_vector || selectedDiagnostic.data?.bloom_matrix) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                                                            {selectedDiagnostic.data?.razonamiento_vector && (
                                                                <div className="bg-black/40 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
                                                                    <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.4em] mb-6 text-center">Vector de Razonamiento</h4>
                                                                    <div className="h-64">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                                                { subject: 'Analítico', A: selectedDiagnostic.data.razonamiento_vector.analitico * 100 },
                                                                                { subject: 'Divergente', A: selectedDiagnostic.data.razonamiento_vector.divergente * 100 },
                                                                                { subject: 'Intuitivo', A: selectedDiagnostic.data.razonamiento_vector.intuitivo * 100 },
                                                                                { subject: 'Mecánico', A: selectedDiagnostic.data.razonamiento_vector.mecanico * 100 },
                                                                                { subject: 'Estratégico', A: selectedDiagnostic.data.razonamiento_vector.estrategico * 100 }
                                                                            ]}>
                                                                                <PolarGrid stroke="#ffffff20" />
                                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                                                                                <Radar name="Estudiante" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                                                                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                                                                            </RadarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedDiagnostic.data?.bloom_matrix && (
                                                                <div className="bg-black/40 rounded-[3rem] p-8 border border-white/5 backdrop-blur-xl">
                                                                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6 text-center">Matriz de Bloom</h4>
                                                                    <div className="h-64">
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <BarChart data={[
                                                                                { name: 'Recordar', uv: selectedDiagnostic.data.bloom_matrix.recordar * 100 },
                                                                                { name: 'Comprender', uv: selectedDiagnostic.data.bloom_matrix.comprender * 100 },
                                                                                { name: 'Aplicar', uv: selectedDiagnostic.data.bloom_matrix.aplicar * 100 },
                                                                                { name: 'Analizar', uv: selectedDiagnostic.data.bloom_matrix.analizar * 100 },
                                                                                { name: 'Evaluar', uv: selectedDiagnostic.data.bloom_matrix.evaluar * 100 },
                                                                                { name: 'Crear', uv: selectedDiagnostic.data.bloom_matrix.crear * 100 },
                                                                            ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff10" />
                                                                                <XAxis type="number" hide domain={[0, 100]} />
                                                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                                                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                                                                                <Bar dataKey="uv" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                                                                            </BarChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                                                        <div className="space-y-12">
                                                            <section>
                                                                <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                                                    <div className="w-10 h-0.5 bg-orange-500/30 rounded-full"></div>
                                                                    Eleonor Sugiere
                                                                </h4>
                                                                <div className="bg-black/60 rounded-[3rem] p-10 border border-white/5 shadow-2xl backdrop-blur-xl relative group">
                                                                    <div className="absolute top-4 right-8">
                                                                        <Sparkles className="w-5 h-5 text-orange-500/20" />
                                                                    </div>
                                                                    <p className="text-gray-300 text-base leading-[1.8] font-medium italic">
                                                                        "{selectedDiagnostic.data?.analisis_profundo || selectedDiagnostic.data?.observaciones || "Las evidencias de esta sesión están siendo procesadas..."}"
                                                                    </p>
                                                                    {selectedDiagnostic.data?.nota_incertidumbre && (
                                                                        <p className="text-[10px] text-gray-600 mt-4 pt-4 border-t border-white/5 font-medium leading-relaxed">
                                                                            ⚠ {selectedDiagnostic.data.nota_incertidumbre}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </section>

                                                            <section>
                                                                <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                                                    <div className="w-10 h-0.5 bg-orange-400/30 rounded-full"></div>
                                                                    Rutas de Exploración Sugeridas
                                                                </h4>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {selectedDiagnostic.data?.recomendaciones?.map((rec: string, i: number) => (
                                                                        <div key={i} className="flex gap-6 p-6 bg-white/[0.03] rounded-3xl border border-white/5 transition-all hover:bg-white/[0.06] group/rec">
                                                                            <span className="text-2xl font-black text-orange-500/20 group-hover/rec:text-orange-500/50 transition-colors">0{i + 1}</span>
                                                                            <p className="text-[13px] text-gray-400 font-medium leading-relaxed">{rec}</p>
                                                                        </div>
                                                                    )) || (
                                                                            <div className="p-8 border border-dashed border-white/10 rounded-[2rem] text-center">
                                                                                <p className="text-xs text-gray-600 font-black uppercase tracking-widest italic">No se han derivado recomendaciones de este nodo.</p>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </section>
                                                        </div>

                                                        <section>
                                                            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                                                                <div className="w-10 h-0.5 bg-blue-400/30 rounded-full"></div>
                                                                Transcritor de Respuestas
                                                            </h4>
                                                            <div className="bg-black/40 rounded-[3rem] overflow-hidden border border-white/5 h-[400px] shadow-inner relative">
                                                                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10"></div>
                                                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10"></div>

                                                                <div className="h-full overflow-y-auto custom-scrollbar p-6">
                                                                    {selectedDiagnostic.data?.raw_responses ? (
                                                                        <div className="space-y-4">
                                                                            {selectedDiagnostic.data.raw_responses.map((resp: any, i: number) => (
                                                                                <div key={i} className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:border-blue-500/20 transition-all group/item">
                                                                                    <div className="flex items-center justify-between mb-4">
                                                                                        <span className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">Entrada {i + 1}</span>
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 group-hover/item:bg-blue-500 transition-colors"></div>
                                                                                    </div>
                                                                                    <div className="text-sm text-white font-black mb-4 leading-relaxed tracking-tight">{resp.question}</div>
                                                                                    <div className="flex items-start gap-3 p-4 bg-blue-500/[0.03] rounded-2xl border border-blue-500/10">
                                                                                        <span className="text-[10px] text-blue-500 font-black uppercase">Output:</span>
                                                                                        <span className="text-[11px] text-gray-300 font-medium">{resp.answer}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                                                                            <Activity className="w-12 h-12 text-white/5 mb-6" />
                                                                            <p className="text-[11px] text-gray-600 italic uppercase font-black leading-relaxed tracking-wide">
                                                                                El registro detallado de este ciclo no está disponible en la base de datos central.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </section>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
