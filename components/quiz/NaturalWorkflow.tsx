"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    ConnectionMode,
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    EdgeProps,
    ControlButton,
    ReactFlowProvider,
    useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from "framer-motion"
import {
    Brain, Calculator, Microscope, Code,
    Lightbulb, RefreshCw, User, Star, Minus,
    Zap, Activity, Cpu, Database, Network,
    Maximize, ZoomIn, ZoomOut, AlertTriangle, TrendingUp, CheckCircle, Target,
    Trophy, Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { academicAreas, personalAreas } from "@/lib/data/courseData"
import { fetchUserProfile } from "@/lib/api/user"
import { DiagnosisEleonorOverlay } from "./DiagnosisEleonorOverlay"
import { LewinResults } from "./LewinResults"
import { NeoPiRResults } from "./NeoPiRResults"
import { CepvResults } from "./CepvResults"

// --- Types ---

interface NaturalWorkflowProps {
    skills: any[];
    mentorSkills?: any[];
    onFeedbackRequest?: (node: any) => void;
}

// --- Icons Map (Fallback) ---
const ICON_MAP: Record<string, any> = {
    'Usuario': User,
}

// --- Custom Edge (StreamEdge) ---
const StreamEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Parse color from the string "from-emerald-400 to-cyan-500" or hex
    let strokeColor = '#d946ef'; // Default Magenta
    if (data?.color) {
        if (data.color.includes('emerald') || data.color.includes('green')) strokeColor = '#34d399';
        else if (data.color.includes('blue') || data.color.includes('cyan')) strokeColor = '#22d3ee';
        else if (data.color.includes('purple') || data.color.includes('violet')) strokeColor = '#a855f7';
        else if (data.color.includes('rose') || data.color.includes('red')) strokeColor = '#fb7185';
        else if (data.color.includes('yellow') || data.color.includes('amber')) strokeColor = '#facc15';
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeOpacity: 0.15, stroke: strokeColor, strokeWidth: 1.5 }} />
            <circle r="2" fill={strokeColor}>
                <animateMotion dur={data?.type === 'sub' ? "4s" : "3s"} repeatCount="indefinite" path={edgePath}>
                    <mpath href={`#${id}`} />
                </animateMotion>
            </circle>
            <path
                d={edgePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1}
                strokeDasharray="5,5"
                className="animate-dash opacity-40"
            />
        </>
    );
};


// --- Custom Node (HolographicNode) ---

const HolographicNode = ({ data, selected }: any) => {
    // Use icon from data if available, else map, else User
    const Icon = data.icon || ICON_MAP[data.label] || User
    const isRoot = data.type === 'root'
    const isArea = data.type === 'area'
    const isMentor = data.type === 'mentor'

    // Color determination
    let colorClass = 'text-[#d946ef]';
    let borderClass = 'border-[#d946ef]/50';
    let bgGlow = 'bg-[#d946ef]/10';
    let shadowGlow = 'shadow-[0_0_40px_-10px_rgba(217,70,239,0.5)]';

    if (isRoot) {
        colorClass = 'text-white';
        borderClass = 'border-white/50';
        bgGlow = 'bg-white/10';
        shadowGlow = 'shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]';
    } else if (data.color) {
        // Simplistic mapping for Tailwind gradients descriptions to specific hexes for glow
        if (data.color.includes('emerald') || data.color.includes('green')) {
            colorClass = 'text-emerald-400';
            borderClass = 'border-emerald-400/50';
            bgGlow = 'bg-emerald-400/10';
            shadowGlow = 'shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)]';
        } else if (data.color.includes('blue') || data.color.includes('cyan')) {
            colorClass = 'text-cyan-400';
            borderClass = 'border-cyan-400/50';
            bgGlow = 'bg-cyan-400/10';
            shadowGlow = 'shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]';
        } else if (data.color.includes('purple') || data.color.includes('violet')) {
            colorClass = 'text-purple-400';
            borderClass = 'border-purple-400/50';
            bgGlow = 'bg-purple-400/10';
            shadowGlow = 'shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]';
        } else if (data.color.includes('yellow') || data.color.includes('amber')) {
            colorClass = 'text-yellow-400';
            borderClass = 'border-yellow-400/50';
            bgGlow = 'bg-yellow-400/10';
            shadowGlow = 'shadow-[0_0_40px_-10px_rgba(250,204,21,0.5)]';
        } else if (data.color.includes('rose') || data.color.includes('red')) {
            colorClass = 'text-rose-400';
            borderClass = 'border-rose-400/50';
            bgGlow = 'bg-rose-400/10';
            shadowGlow = 'shadow-[0_0_40px_-10px_rgba(251,113,133,0.5)]';
        }
    }

    const sizeClass = isRoot ? "w-32 h-32 rounded-full" : isArea ? "w-24 h-24 rounded-[2rem]" : "w-16 h-16 rounded-2xl";
    const labelSize = isRoot ? "text-[10px]" : isArea ? "text-[9px]" : "text-[8px]";

    return (
        <div className="relative group">
            <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full top-0 left-0 bg-transparent border-none" />
            <Handle type="source" position={Position.Top} className="opacity-0 w-full h-full top-0 left-0 bg-transparent border-none" />

            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() }}
                className="relative"
            >
                {/* Main Glass Container */}
                <div className={cn(
                    "relative flex flex-col items-center justify-center backdrop-blur-xl transition-all duration-500",
                    sizeClass,
                    "border-2",
                    borderClass,
                    bgGlow,
                    shadowGlow,
                    selected ? "scale-110 brightness-125 ring-2 ring-offset-2 ring-offset-black ring-white/50" : "hover:scale-105"
                )}>
                    <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] mix-blend-overlay rounded-inherit pointer-events-none" />

                    <div className={cn("relative z-10 p-2 rounded-xl mb-1", isRoot ? "" : "bg-black/20")}>
                        <Icon className={cn(isRoot ? "w-12 h-12" : isArea ? "w-8 h-8" : "w-5 h-5", colorClass, "drop-shadow-[0_0_10px_currentColor]")} />
                    </div>

                    {/* Level Indicator */}
                    {!isRoot && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="50%" cy="50%" r="46%"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={isArea ? 2 : 1.5}
                                strokeDasharray="250"
                                strokeDashoffset={250 - (250 * (data.level || 0) / 100)}
                                className={cn("opacity-80 transition-all duration-1000", colorClass)}
                            />
                        </svg>
                    )}
                </div>

                {/* Label */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-center w-40 pointer-events-none z-20">
                    <div className={cn(
                        "relative px-2 py-1 bg-[#050110]/90 border backdrop-blur-md rounded-md",
                        borderClass
                    )}>
                        <span className={cn(
                            "block font-black uppercase tracking-wider leading-none",
                            labelSize,
                            colorClass
                        )}>
                            {data.label}
                        </span>
                        {!isRoot && (
                            <span className={cn("block text-[8px] font-bold mt-0.5", colorClass)}>{data.level}%</span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

const nodeTypes = {
    holographic: HolographicNode
}

const edgeTypes = {
    stream: StreamEdge
}

// --- Main Component ---

function NaturalWorkflowContent({ skills, mentorSkills = [], onFeedbackRequest }: NaturalWorkflowProps & { onFeedbackRequest?: (node: string) => void }) {
    const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null)
    const [activeStage, setActiveStage] = useState(0)
    const [userName, setUserName] = useState<string>('Usuario')
    const [showFullReport, setShowFullReport] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await fetchUserProfile()
                if (user) {
                    setUserName(user.full_name || user.username || 'Usuario')
                }
            } catch (err) {
                console.error("Error fetching user:", err)
            }
        }
        fetchUser()
    }, [])

    // Sync activeStage to latest diagnosis when node changes
    useEffect(() => {
        if (selectedNodeData?.diagnosis) {
            const diags = Array.isArray(selectedNodeData.diagnosis)
                ? selectedNodeData.diagnosis
                : [selectedNodeData.diagnosis];
            setActiveStage(diags.length - 1);
        }
    }, [selectedNodeData]);

    const { zoomIn, zoomOut, fitView } = useReactFlow()

    const { initialNodes, initialEdges } = useMemo(() => {
        const normalize = (str: string) =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

        const findSkill = (name: string) => {
            const normalizedTarget = normalize(name);
            const matches = skills.filter(s => {
                const normalizedSkill = normalize(s.area || '');
                if (normalizedTarget.includes('psicometria')) {
                    return normalizedSkill.includes('psicometria') ||
                           normalizedSkill.includes('liderazgo') ||
                           normalizedSkill.includes('personalidad');
                }
                if (normalizedTarget.includes('expectativas')) {
                    return normalizedSkill.includes('expectativas') ||
                           normalizedSkill.includes('cepv');
                }
                return normalizedSkill.includes(normalizedTarget) || normalizedTarget.includes(normalizedSkill);
            });

            if (matches.length === 0) return null;

            const levels = matches.map(m => m.level || 0).filter(l => l > 0);
            const avgLevel = levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : (matches[0]?.level || 0);

            const combinedDiagnoses: any[] = [];
            matches.forEach(m => {
                const history = m.current_diagnosis;
                if (Array.isArray(history)) {
                    combinedDiagnoses.push(...history);
                } else if (history) {
                    combinedDiagnoses.push(history);
                }
            });

            return {
                level: avgLevel,
                current_diagnosis: combinedDiagnoses.length > 0 ? combinedDiagnoses : null
            };
        }

        const cx = 0
        const cy = 0
        const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768
        const areaRadius = isMobileWidth ? 220 : 350

        const nodes: Node[] = []
        const edges: Edge[] = []

        // Determine General Diagnosis / Global Synthesis
        let generalDiagnosis = null;
        let rootLevel = 0;
        
        if (skills && skills.length > 0) {
            const evaluatedSkills = skills.filter(s => s.level > 0);
            if (evaluatedSkills.length > 0) {
                rootLevel = Math.round(evaluatedSkills.reduce((acc, s) => acc + s.level, 0) / evaluatedSkills.length);
                const sorted = [...evaluatedSkills].sort((a, b) => b.level - a.level);
                const topSkill = sorted[0];
                const bottomSkill = sorted[sorted.length - 1];
                
                let pattern = "homogéneo y equilibrado";
                if (topSkill.level - bottomSkill.level > 30) pattern = "altamente especializado, pero con brechas importantes";
                else if (topSkill.level - bottomSkill.level > 15) pattern = "en desarrollo focalizado";
                
                let report = `He completado tu análisis global. Tu índice de madurez cognitiva actual se establece en un ${rootLevel}%. Basado en tus respuestas, tu mapeo neuronal revela un patrón de aprendizaje ${pattern}.\n\n`;
                
                if (topSkill) {
                    report += `Tu mayor fortaleza se encuentra en el área de **${topSkill.area.toUpperCase()}** (${topSkill.level}%), la cual está actuando como tu pilar analítico principal. `;
                }
                
                if (bottomSkill && bottomSkill.level < 50) {
                    report += `Sin embargo, identifico una oportunidad de mejora crítica en **${bottomSkill.area.toUpperCase()}** que podría estar limitando tu potencial general.\n\n`;
                } else if (bottomSkill && topSkill.area !== bottomSkill.area) {
                    report += `Tu punto de menor optimización relativa es **${bottomSkill.area.toUpperCase()}** (${bottomSkill.level}%).\n\n`;
                } else {
                    report += `\n\n`;
                }
                
                report += "Te recomiendo enfocar tus próximos esfuerzos en las áreas de menor rendimiento. Así lograrás equilibrar tu perfil y evitar posibles cuellos de botella en tu aprendizaje a largo plazo.";

                generalDiagnosis = {
                    nivel: rootLevel,
                    observaciones: report,
                    razonamiento: `PERFIL GLOBAL`,
                    analisis_profundo: `Se ha completado el mapeo neuronal del usuario. El patrón predominante indica un desarrollo ${pattern}.`,
                    puntos_fuertes: topSkill ? [`Alta competencia en ${topSkill.area}`] : [],
                    recomendaciones: bottomSkill ? [`Focalizar estudio práctico en ${bottomSkill.area}`, "Mantener consistencia en el ecosistema de aprendizaje"] : ["Mantener el nivel actual en todas las áreas"]
                };
            }
        }

        nodes.push({
            id: 'root',
            type: 'holographic',
            position: { x: cx - 64, y: cy - 64 },
            data: { 
                label: userName.toUpperCase(), 
                type: 'root', 
                level: rootLevel || 100,
                diagnosis: generalDiagnosis || {
                    observaciones: "Sistema en calibración. Completa tu primera evaluación para que el agente base pueda generar tu mapeo cognitivo general.",
                    razonamiento: "PERFIL BASE"
                }
            }
        })

        const allAreas = [...academicAreas, ...personalAreas].filter(area =>
            area.id !== 'personajes' && area.id !== 'cognitivo-academico'
        )
        const totalAreas = allAreas.length
        const angleStep = 360 / totalAreas

        allAreas.forEach((area, index) => {
            const angleDeg = index * angleStep
            const angleRad = (angleDeg * Math.PI) / 180
            const areaX = cx + Math.cos(angleRad) * areaRadius
            const areaY = cy + Math.sin(angleRad) * areaRadius

            const skillData = findSkill(area.name)
            const areaLevel = skillData ? skillData.level : 0

            nodes.push({
                id: area.id,
                type: 'holographic',
                position: { x: areaX - 48, y: areaY - 48 },
                data: {
                    label: area.name,
                    type: 'area',
                    level: areaLevel,
                    icon: area.icon,
                    color: area.color,
                    diagnosis: skillData?.current_diagnosis || null,
                    recommendation: `Módulo ${area.name}: ${areaLevel}% completado.`
                }
            })

            edges.push({
                id: `e-root-${area.id}`,
                source: 'root',
                target: area.id,
                type: 'stream',
                data: { color: area.color, type: 'main' },
                animated: true
            })
        })

        // --- Mentor exam nodes (outer ring) ---
        if (mentorSkills && mentorSkills.length > 0) {
            const mentorRadius = isMobileWidth ? 380 : 560
            const mentorAngleStep = 360 / mentorSkills.length
            mentorSkills.forEach((ms, idx) => {
                const angleDeg = idx * mentorAngleStep - 30 // slight offset
                const angleRad = (angleDeg * Math.PI) / 180
                const mx = cx + Math.cos(angleRad) * mentorRadius
                const my = cy + Math.sin(angleRad) * mentorRadius
                const nodeId = `mentor_${ms.id || idx}`
                nodes.push({
                    id: nodeId,
                    type: 'holographic',
                    position: { x: mx - 48, y: my - 48 },
                    data: {
                        label: ms.area,
                        type: 'mentor',
                        level: ms.level || 70,
                        color: 'from-purple-400 to-fuchsia-500',
                        diagnosis: {
                            nivel: ms.level || 70,
                            razonamiento: `Examen de Mentoría: ${ms.examTitle || ms.area}`,
                            observaciones: ms.competencies?.length
                                ? `Competencias evaluadas: ${ms.competencies.join(', ')}.`
                                : 'Examen de mentoría completado.',
                        },
                        isMentorExam: true
                    }
                })
                edges.push({
                    id: `e-root-${nodeId}`,
                    source: 'root',
                    target: nodeId,
                    type: 'stream',
                    data: { color: 'from-purple-400 to-fuchsia-500', type: 'mentor' },
                    animated: true
                })
            })
        }

        return { initialNodes: nodes, initialEdges: edges }
    }, [skills, userName, mentorSkills])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    useEffect(() => {
        setNodes(initialNodes)
    }, [initialNodes, setNodes])

    useEffect(() => {
        setEdges(initialEdges)
    }, [initialEdges, setEdges])

    // Centrar la vista del grafo automáticamente en el canvas
    useEffect(() => {
        const timer = setTimeout(() => {
            fitView({ padding: 0.15, duration: 600 });
        }, 500);
        return () => clearTimeout(timer);
    }, [fitView, nodes.length])

    const onNodeClick = useCallback((event: any, node: Node) => {
        setSelectedNodeData(node.data)
        setActiveStage(0) // Reset to latest/first stage on click
    }, [])

    return (
        <div className="w-full h-full relative bg-[#03000a] rounded-[2rem] border border-white/5 overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,1)] group">
            <style jsx global>{`
                .react-flow__attribution { display: none !important; }
            `}</style>

            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#03000a] to-[#03000a]" />
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-soft-light" />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            </div>

            {/* HUD Header */}
            <div className="absolute top-8 left-8 z-20 pointer-events-none">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-full" />
                    <div>
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 italic uppercase tracking-tighter">
                            SKILL<span className="text-purple-500">NEXUS</span>
                        </h3>
                        <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.4em]">Neural Mapping Interface v3.0</p>
                    </div>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                minZoom={0.5}
                maxZoom={2}
                className="bg-transparent relative z-10"
                proOptions={{ hideAttribution: true }}
            />

            {/* CUSTOM CONTROLS OVERLAY */}
            <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-2">
                <Button onClick={() => zoomIn()} className="w-10 h-10 rounded-xl bg-[#050110]/80 border border-white/10 text-cyan-400 hover:bg-white/10 p-0 shadow-xl"><ZoomIn className="w-5 h-5" /></Button>
                <Button onClick={() => zoomOut()} className="w-10 h-10 rounded-xl bg-[#050110]/80 border border-white/10 text-purple-400 hover:bg-white/10 p-0 shadow-xl"><ZoomOut className="w-5 h-5" /></Button>
                <Button onClick={() => fitView()} className="w-10 h-10 rounded-xl bg-[#050110]/80 border border-white/10 text-white hover:bg-white/10 p-0 shadow-xl"><Maximize className="w-5 h-5" /></Button>
            </div>

            {/* Detail Sidebar - Glassmorphic */}
            <AnimatePresence>
                {selectedNodeData && (
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] bg-[#03000a]/90 backdrop-blur-3xl border-l border-white/10 p-8 md:p-12 z-50 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,1)] overflow-y-auto custom-scrollbar"
                    >
                        <button onClick={() => setSelectedNodeData(null)} className="absolute top-8 right-8 px-6 py-2.5 rounded-2xl bg-red-500/20 border-2 border-red-500/50 flex items-center gap-3 hover:bg-red-500/40 text-red-200 transition-all z-50 shadow-[0_0_20px_rgba(239,68,68,0.4)] group">
                            <span className="text-[11px] font-black uppercase tracking-widest">Cerrar</span>
                            <div className="bg-red-500/40 p-1 rounded-full group-hover:scale-110 transition-transform">
                                <Minus className="w-4 h-4 rotate-45" strokeWidth={3} />
                            </div>
                        </button>

                        <div className="mt-8 mb-8 flex flex-col items-start relative">
                            <div className="text-[120px] md:text-[160px] leading-none font-black absolute -top-10 -left-6 text-white/[0.02] select-none pointer-events-none italic">
                                {selectedNodeData.level}%
                            </div>
                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border rounded-full border-white/20 text-white bg-white/5">
                                {selectedNodeData.type === 'root' ? 'CORE IDENTITY' : 'AREA NODAL'}
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-3 mb-8">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Diagnóstico de Área</span>
                            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none text-center">
                                {selectedNodeData.label}
                            </h2>
                            <div className={cn("h-1 w-24 rounded-full bg-gradient-to-r", selectedNodeData.color || "from-purple-500 to-cyan-500")} />
                        </div>

                        {/* Progress Bar */}
                        {(() => {
                            const diags = Array.isArray(selectedNodeData.diagnosis) ? selectedNodeData.diagnosis : (selectedNodeData.diagnosis ? [selectedNodeData.diagnosis] : []);
                            // Count all separate evaluations as steps
                            const progress = Math.min(diags.length, 3);
                            return (
                                <div className="mb-10 bg-white/[0.02] border border-white/5 rounded-3xl p-6 w-full">
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Hitos de Evaluación</span>
                                            <span className="text-lg font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                                                {progress >= 3 ? (
                                                    <span className="text-yellow-400 animate-pulse">Análisis Completo</span>
                                                ) : (
                                                    `Fase ${progress}/3`
                                                )}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                                            progress >= 3 ? "bg-yellow-400/20 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.3)]" : "bg-white/5"
                                        )}>
                                            <Trophy className={cn("w-5 h-5", progress >= 3 ? "text-yellow-400 animate-bounce" : "text-white/20")} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 h-2 px-1">
                                        {[1, 2, 3].map(step => (
                                            <div key={step} className={cn("flex-1 rounded-full transition-all duration-700", step <= progress ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-white/5")} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* History Timeline */}
                        {Array.isArray(selectedNodeData.diagnosis) && selectedNodeData.diagnosis.length > 1 && (
                            <div className="mb-10 w-full px-2">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4 block">Historial de Evaluación</span>
                                <div className="flex items-center justify-between relative px-4">
                                    <div className="absolute left-8 right-8 h-0.5 bg-white/5 z-0" />
                                    {selectedNodeData.diagnosis.map((_: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveStage(idx)}
                                            className={cn(
                                                "relative z-10 w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
                                                activeStage === idx
                                                    ? "bg-purple-500 border-purple-400 scale-125 shadow-[0_0_20px_rgba(181,0,209,0.5)]"
                                                    : "bg-[#0b0121] border-white/10 hover:border-white/30"
                                            )}
                                        >
                                            <span className={cn("text-[10px] font-black", activeStage === idx ? "text-white" : "text-white/40")}>
                                                E{idx + 1}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 flex-1 w-full">
                            {(() => {
                                const diags = Array.isArray(selectedNodeData.diagnosis) ? selectedNodeData.diagnosis : (selectedNodeData.diagnosis ? [selectedNodeData.diagnosis] : []);
                                const currentDiag = diags[activeStage] || diags[diags.length - 1];
                                if (!currentDiag) return (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                                        <Target className="w-12 h-12 text-white/20" />
                                        <p className="text-xs text-white/30 uppercase tracking-widest font-black">Sin Datos de Área</p>
                                    </div>
                                );
                                return (
                                    <>
                                        {/* Main Observation - Quantum Core */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group/obs"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/obs:opacity-20 transition-opacity">
                                                <Brain className="w-16 h-16 text-purple-500" />
                                            </div>
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4 block">Síntesis de Diagnóstico</span>
                                            <div className="text-sm md:text-base font-medium text-white/90 leading-relaxed space-y-4 border-l-4 border-purple-500 pl-6 py-1">
                                                {currentDiag.observaciones.split('\n').map((paragraph: string, i: number) => {
                                                    if (!paragraph.trim()) return null;
                                                    const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                                                    return (
                                                        <p key={i}>
                                                            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-black">{part}</strong> : part)}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>

                                        {/* Removed: Dual Metric Cards and State Indicators per user request */}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="mt-10 space-y-4">
                            <Button onClick={() => setShowFullReport(true)} className="w-full h-14 rounded-xl bg-purple-600/20 text-purple-200 border border-purple-500/50 font-black uppercase tracking-widest text-[10px] hover:bg-purple-500/40 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                Ver Reporte Detallado
                            </Button>
                            <Button className="w-full h-14 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 transition-all">Feedback Eleonor</Button>
                            <p className="text-[7px] text-center font-bold text-white/10 uppercase tracking-widest">v3.0 Cognitive Module</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFullReport && selectedNodeData && selectedNodeData.diagnosis && (() => {
                    const raw = Array.isArray(selectedNodeData.diagnosis) 
                        ? selectedNodeData.diagnosis[activeStage] || selectedNodeData.diagnosis[selectedNodeData.diagnosis.length - 1]
                        : selectedNodeData.diagnosis;

                    if (!raw) return null;

                    // 1. Lewin Test custom results screen
                    if (raw.estilo_dominante || raw.detalle || raw.counts || (raw.observaciones && raw.observaciones.toLowerCase().includes('lewin'))) {
                        const counts = raw.detalle || raw.counts || { autoritario: 6, democratico: 3, "laissez-faire": 2 };
                        const dominant = raw.estilo_dominante || raw.dominant || "autoritario";
                        return (
                            <LewinResults 
                                result={{ counts, dominant, isTied: raw.isTied }} 
                                onExit={() => setShowFullReport(false)} 
                            />
                        );
                    }

                    // 2. NEO PI-R custom results screen
                    if (raw.dominios && raw.facetas) {
                        return (
                            <NeoPiRResults 
                                result={{ domains: raw.dominios, facets: raw.facetas, gender: raw.gender || "M", raw: raw.raw }} 
                                onExit={() => setShowFullReport(false)} 
                            />
                        );
                    }

                    // 3. CEPV-20 custom results screen
                    if (raw.avg) {
                        return (
                            <CepvResults 
                                result={{ avg: raw.avg, openAns: raw.openAns, overall_avg: raw.overall_avg }} 
                                onExit={() => setShowFullReport(false)} 
                            />
                        );
                    }

                    // 4. Default / Generic Diagnosis Overlay
                    const analysisData = {
                        ...raw,
                        razonamiento: raw.razonamiento || raw.razonamiento_tipo || "ANÁLISIS COGNITIVO",
                        puntos_fuertes: raw.puntos_fuertes || [],
                        recomendaciones: raw.recomendaciones || [],
                        analisis_profundo: raw.analisis_profundo || ""
                    };

                    return (
                        <DiagnosisEleonorOverlay 
                            analysis={analysisData} 
                            onClose={() => setShowFullReport(false)} 
                        />
                    );
                })()}
            </AnimatePresence>
        </div>
    )
}

export function NaturalWorkflow(props: NaturalWorkflowProps) {
    return (
        <ReactFlowProvider>
            <NaturalWorkflowContent {...props} />
        </ReactFlowProvider>
    )
}
