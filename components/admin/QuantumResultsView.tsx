"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, Zap, Activity, Target, Sparkles, TrendingUp, Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from 'recharts'

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

export const QuantumResultsView = ({ studentName, onBack, data }: { studentName: string, onBack: () => void, data: QuantumData | null }) => {
    const [activeChart, setActiveChart] = useState<'academic' | 'personal'>('academic')
    const [viewMode, setViewMode] = useState<'charts' | 'diagnostics'>('charts')
    const [diagLevel, setDiagLevel] = useState<'groups' | 'areas' | 'exams' | 'detail'>('groups')
    const [selectedGroup, setSelectedGroup] = useState<'academic' | 'personal' | null>(null)
    const [selectedArea, setSelectedArea] = useState<string | null>(null)
    const [selectedDiagnostic, setSelectedDiagnostic] = useState<SessionHistory | null>(null)

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
        // Consistent hash for unknown areas
        let hash = 0;
        for (let i = 0; i < normalized.length; i++) {
            hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
        }
        return PALETTE[Math.abs(hash) % PALETTE.length];
    }

    if (!data) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando Núcleo Neuronal...</p>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12 pb-20"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.1, x: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>
                    <div>
                        <div className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em] mb-1">Perfil Orientativo de Tendencias Cognitivas</div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">{studentName}</h1>
                    </div>
                </div>
            </div>

            {/* UI Placeholder for spacing or other top elements if needed */}

            {/* Main Viz Area - Expanded to full width */}
            <div className="grid grid-cols-1 gap-8">
                {/* Cognitive Core Map */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#120530] to-[#050110] border border-white/10 rounded-[3rem] p-8 lg:p-10 min-h-[700px] shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none"></div>

                    {/* Technical Metric Overlay Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 relative z-20">
                        <TechnicalMetric
                            label="PROMEDIO_GEN"
                            value={`${data.performance_avg}%`}
                            icon={Brain}
                            color="bg-purple-500"
                            description="Rendimiento histórico del estudiante."
                        />
                        <TechnicalMetric
                            label="EXÁMENES_TOT"
                            value={data.total_exams}
                            icon={Activity}
                            color="bg-blue-500"
                            description="Evaluaciones completadas."
                        />
                        <TechnicalMetric
                            label="ÁREA_FUERTE"
                            value={data.top_skill}
                            icon={Target}
                            color="bg-green-500"
                            description="Mayor destreza demostrada."
                        />
                        <TechnicalMetric
                            label="ÚLT_ACTIVIDAD"
                            value={data.last_exam_date}
                            icon={Calendar}
                            color="bg-orange-500"
                            description="Fecha de evaluación más reciente."
                        />
                    </div>
                    <div className="absolute top-0 right-0 p-12">
                        <Sparkles className="w-10 h-10 text-purple-500/20 animate-pulse" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full gap-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter italic text-white">Mapa de Tendencias Cognitivas</h2>
                                <p className="text-gray-500 text-xs max-w-lg font-medium tracking-tight">Su mentor sugiere patrones de habilidad basados en las evidencias observadas. Los rangos son orientativos.</p>
                            </div>

                            <button
                                onClick={() => {
                                    const nextMode = viewMode === 'charts' ? 'diagnostics' : 'charts';
                                    setViewMode(nextMode);
                                    if (nextMode === 'diagnostics') setDiagLevel('groups');
                                    setSelectedDiagnostic(null);
                                }}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] transition-all duration-700 group overflow-hidden relative shadow-2xl ${viewMode === 'diagnostics'
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-[0_0_40px_rgba(249,115,22,0.3)]'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <div className="relative flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-6 h-5 bg-current rounded-sm opacity-20 -rotate-3 translate-y-1"></div>
                                        <div className="w-6 h-5 bg-current rounded-md absolute inset-0"></div>
                                        <div className="w-3 h-0.5 bg-white/40 absolute top-1.5 left-1.5 rounded-full"></div>
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Perfiles</span>
                                </div>
                            </button>
                        </div>

                        {/* Navigation / Switcher */}
                        <div className="flex items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                            <div className="flex gap-3">
                                {(['academic', 'personal'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setActiveChart(type);
                                            setViewMode('charts');
                                        }}
                                        className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-700 relative group/btn ${activeChart === type && viewMode === 'charts'
                                            ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.2)]'
                                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {activeChart === type && viewMode === 'charts' && <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>}
                                            {type === 'academic' ? 'Historial Académico' : 'Historial Personal'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Expansion Area */}
                        <div className="flex-1">
                            {viewMode === 'charts' ? (
                                <div className="h-[400px] w-full mt-4">
                                    {data.history[activeChart].length > 0 ? (() => {
                                        const uniqueAreas = Array.from(new Set(data.history[activeChart].map(h => h.area)))
                                        const dateMap = new Map<string, any>()
                                        data.history[activeChart].forEach(h => {
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
