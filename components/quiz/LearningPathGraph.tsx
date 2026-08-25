"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Brain, Calculator, Microscope, Code,
    Lightbulb, RefreshCw, User, Star, Target,
    Award, TrendingUp, Zap, Plus, Minus, Move,
    Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// --- Types ---

import { useEleonor } from "@/contexts/eleonor-context"

interface Node {
    id: string
    label: string
    icon: any
    type: 'root' | 'core' | 'soft'
    x: number
    y: number
    level: number
    status: 'locked' | 'in-progress' | 'mastered'
    branch: 'tl' | 'tr' | 'bl' | 'br' // TopLeft, TopRight, etc.
    recommendation?: string
    dependencies?: string[]
}

interface LearningPathGraphProps {
    skills: any[]
}

// --- Constants ---

const BRANCH_CONFIG = {
    tl: { angle: 225, color: "#bf00ff" }, // Top Left (Communication/Flexibility) - using degrees for visualization mentally
    tr: { angle: 315, color: "#00ffff" }, // Top Right (Math/Autogestión)
    br: { angle: 45, color: "#bf00ff" },  // Bottom Right (Science/Critical Thinking)
    bl: { angle: 135, color: "#00ffff" }, // Bottom Left (Tech/Metacognition)
}

// Helper to convert degree to radian
const toRad = (deg: number) => (deg * Math.PI) / 180

export function LearningPathGraph({ skills }: LearningPathGraphProps) {
    const { enterPresence } = useEleonor()
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [scale, setScale] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ w: 1200, h: 800 }) // Default large canvas

    const handleNodeInteraction = (nodeLabel: string) => {
        enterPresence('INTERVENTION')
        window.dispatchEvent(new CustomEvent('eleonor-send-message', {
            detail: {
                type: 'analyze_node',
                payload: {
                    node: nodeLabel
                }
            }
        }))
    }

    // Handle Resize mainly to center initially, but keeps canvas large for panning
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                // We actually want a fixed large canvas for the graph to live in, 
                // but we can adjust initial view or bounding if needed.
                // For now, let's keep the graph universe largely static to ensure stability,
                // but responsive to 'scale' based on device.
                const width = window.innerWidth
                if (width < 768) {
                    setScale(0.6) // Auto-shrink for mobile
                } else {
                    setScale(1)
                }
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // --- Dynamic Node Generation ---

    const nodes = useMemo(() => {
        const findLevel = (area: string) => {
            const skill = skills.find(s => s.area.toLowerCase().includes(area.toLowerCase()))
            return skill ? skill.level : 30 // Simulation default
        }

        const cx = dimensions.w / 2
        const cy = dimensions.h / 2

        // Distances
        const coreDist = 200
        const softDist = 380

        // Root
        const rootNode: Node = {
            id: "root", label: "Usuario", icon: User, type: "root",
            x: cx, y: cy, level: 100, status: "mastered", branch: 'tl' // branch irrelevant for root
        }

        // Branch Definitions based on Image
        // TL: Comms -> Flexibility
        // TR: Math -> Autogestión
        // BL: Tech -> Metacognition
        // BR: Science -> Critical Thinking

        const branches = [
            {
                id: 'tl',
                core: { id: 'comunicacion', label: 'Comunicación', icon: Star },
                soft: { id: 'flexibilidad', label: 'Flexibilidad', icon: RefreshCw },
                angle: 225
            },
            {
                id: 'tr',
                core: { id: 'matematica', label: 'Matemática', icon: Calculator },
                soft: { id: 'autogestion', label: 'Autogestión', icon: Zap },
                angle: 315
            },
            {
                id: 'bl',
                core: { id: 'tecnologia', label: 'Tecnología', icon: Code },
                soft: { id: 'metacognicion', label: 'Metacognición', icon: Lightbulb },
                angle: 135
            },
            {
                id: 'br',
                core: { id: 'ciencia', label: 'Ciencia', icon: Microscope },
                soft: { id: 'critico', label: 'Pensamiento Crítico', icon: Brain },
                angle: 45
            },
        ]

        const generatedNodes: Node[] = [rootNode]

        branches.forEach(b => {
            const rad = toRad(b.angle)

            // Core Node
            const coreX = cx + Math.cos(rad) * coreDist
            const coreY = cy + Math.sin(rad) * coreDist
            const coreLevel = findLevel(b.core.label)

            generatedNodes.push({
                ...b.core,
                type: 'core',
                x: coreX, y: coreY,
                level: coreLevel,
                status: coreLevel > 50 ? 'mastered' : 'in-progress',
                branch: b.id as any,
                dependencies: ['root'],
                recommendation: `Domina los fundamentos de ${b.core.label} para avanzar.`
            })

            // Soft Node (linked to Core)
            const softX = cx + Math.cos(rad) * softDist
            const softY = cy + Math.sin(rad) * softDist
            const softLevel = findLevel(b.soft.label)

            generatedNodes.push({
                ...b.soft,
                type: 'soft',
                x: softX, y: softY,
                level: softLevel,
                status: softLevel > 50 ? 'mastered' : 'in-progress',
                branch: b.id as any,
                dependencies: [b.core.id],
                recommendation: `${b.soft.label} es crucial para aplicar tus conocimientos de ${b.core.label}.`
            })
        })

        return generatedNodes
    }, [skills, dimensions])


    // --- Render Helpers ---

    const renderLines = () => {
        return nodes.map(node => {
            if (!node.dependencies) return null
            return node.dependencies.map(depId => {
                const depNode = nodes.find(n => n.id === depId)
                if (!depNode) return null

                // Different styles for Root->Core vs Core->Soft
                const isRootConnection = depNode.type === 'root'
                const strokeColor = node.branch === 'tr' || node.branch === 'bl' ? '#00ffff' : '#d946ef'

                return (
                    <g key={`${depId}-${node.id}`}>
                        <motion.line
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            x1={depNode.x} y1={depNode.y}
                            x2={node.x} y2={node.y}
                            stroke={strokeColor}
                            strokeWidth={isRootConnection ? 2 : 1}
                            strokeOpacity={0.6}
                        />
                        {/* Animated Particle for flow */}
                        <motion.circle r="3" fill="white">
                            <animateMotion
                                dur="3s"
                                repeatCount="indefinite"
                                path={`M${depNode.x},${depNode.y} L${node.x},${node.y}`}
                            />
                        </motion.circle>
                    </g>
                )
            })
        })
    }

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4))
    const handleCenter = () => {
        setScale(window.innerWidth < 768 ? 0.6 : 1)
        // Here we would ideally reset position too if we controlled x/y of drag
    }

    return (
        <div className="w-full h-full relative bg-[#050110] rounded-[2rem] border border-white/10 overflow-hidden group shadow-2xl">
            {/* Dynamic Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: 'center'
                }}
            />

            {/* UI Overlay Controls */}
            <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Nexus Cognitivo</h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">Sistema de Proyección v2.4</p>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                <Button onClick={handleCenter} size="icon" className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors">
                    <Maximize2 className="w-4 h-4" />
                </Button>
                <div className="h-px w-full bg-white/10 my-1" />
                <Button onClick={handleZoomIn} size="icon" className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors">
                    <Plus className="w-4 h-4" />
                </Button>
                <Button onClick={handleZoomOut} size="icon" className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors">
                    <Minus className="w-4 h-4" />
                </Button>
            </div>

            {/* Infinite Canvas */}
            <motion.div
                ref={containerRef}
                className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
                style={{
                    touchAction: "none" // Prevents browser scroll on mobile
                }}
            >
                <motion.div
                    drag
                    dragConstraints={{ left: -dimensions.w / 2, right: dimensions.w / 2, top: -dimensions.h / 2, bottom: dimensions.h / 2 }}
                    style={{ scale, width: dimensions.w, height: dimensions.h }}
                    className="relative flex items-center justify-center origin-center"
                >
                    {/* Connection Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {renderLines()}
                    </svg>

                    {/* Nodes Layer */}
                    {nodes.map(node => (
                        <NodeComponent
                            key={node.id}
                            node={node}
                            isSelected={selectedNode?.id === node.id}
                            onClick={() => {
                                setSelectedNode(node)

                                // Trigger Eleonor Analysis
                                // Find matching skill
                                const skill = skills.find(s => s.area.toLowerCase().includes(node.label.toLowerCase()) || node.label.toLowerCase().includes(s.area.toLowerCase()))

                                if (skill && (skill.current_diagnosis || skill.level > 0)) {
                                    console.log("Triggering analysis for:", node.label)
                                    // 1. Show Eleonor
                                    // We need useEleonor context. I need to move this logic up or wrap the component.
                                    // Since I can't easily wrap inside the map, I'll assume I can access context in the main component.
                                    handleNodeInteraction(node.label)
                                } else {
                                    console.log("No diagnosis data for:", node.label)
                                }
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Detail Slider Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-[#0B0121]/95 backdrop-blur-3xl border-l border-white/10 p-8 z-30 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.8)]"
                    >
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all"
                        >
                            <Minus className="w-6 h-6 rotate-45" />
                        </button>

                        <div className="mt-12 mb-8 flex flex-col items-center">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center border-2 mb-6 shadow-[0_0_50px_-10px_currentColor]",
                                nodeColor(nodeBranchColor(selectedNode))
                            )}>
                                <selectedNode.icon className="w-10 h-10 text-white" />
                            </div>
                            <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{selectedNode.type === 'root' ? 'Perfil Central' : selectedNode.type}</span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase text-center leading-none">{selectedNode.label}</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8">
                            {/* Circular Progress */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                                        <motion.circle
                                            initial={{ strokeDashoffset: 377 }}
                                            animate={{ strokeDashoffset: 377 - (377 * selectedNode.level / 100) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            cx="64" cy="64" r="60"
                                            stroke={nodeBranchColor(selectedNode)}
                                            strokeWidth="6" fill="none" strokeDasharray="377"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white">{selectedNode.level}%</span>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest mt-2">Nivel de Sincronización</span>
                            </div>

                            {/* Recommendation */}
                            {selectedNode.recommendation && (
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${nodeBranchColor(selectedNode).replace('text', 'bg')}`} />
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">
                                        <Brain className="w-3 h-3" /> Recomendación IA
                                    </h4>
                                    <p className="text-sm font-medium text-gray-300 italic leading-relaxed">
                                        "{selectedNode.recommendation}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 mt-4">
                            Ver Detalles Completos
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- Subcomponents & Utils ---

function NodeComponent({ node, isSelected, onClick }: { node: Node, isSelected: boolean, onClick: () => void }) {
    const isRoot = node.type === 'root'
    const color = nodeBranchColor(node)

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.15 }}
            style={{ top: node.y, left: node.x }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            onClick={onClick}
        >
            {/* Outer Ring / Pulse */}
            <div className={cn(
                "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
                isSelected ? "opacity-30 animate-pulse" : "group-hover:opacity-20",
                nodeColorBg(color)
            )} />

            {/* Main Circle */}
            <div className={cn(
                "relative flex items-center justify-center rounded-full border-2 bg-[#050110] transition-colors duration-300 shadow-[0_0_30px_-5px_transparent]",
                isRoot ? "w-24 h-24 border-white z-20" : "w-16 h-16 z-10",
                isSelected ? `shadow-[0_0_30px_-5px_currentColor] border-white` : "",
                nodeColorBorder(color),
                nodeColorText(color)
            )}>
                <node.icon className={cn(isRoot ? "w-10 h-10 text-white" : "w-7 h-7")} />
            </div>

            {/* Label */}
            <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap pointer-events-none">
                <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-[#050110]/80 backdrop-blur-md",
                    nodeColorBorder(color),
                    nodeColorText(color)
                )}>
                    {node.label}
                </span>
                {!isRoot && (
                    <span className={cn("text-[9px] font-black mt-1", nodeColorText(color))}>
                        {node.level}%
                    </span>
                )}
            </div>
        </motion.div>
    )
}

// Color Utils based on positions
function nodeBranchColor(node: Node) {
    if (node.type === 'root') return 'white'
    return (node.branch === 'tr' || node.branch === 'bl') ? 'cyan' : 'magenta'
}

function nodeColor(color: string) {
    if (color === 'white') return 'border-white text-white'
    if (color === 'cyan') return 'border-[#00ffff] text-[#00ffff]'
    return 'border-[#bf00ff] text-[#bf00ff]'
}

function nodeColorBorder(color: string) {
    if (color === 'white') return 'border-white'
    if (color === 'cyan') return 'border-[#00ffff]'
    return 'border-[#bf00ff]'
}

function nodeColorText(color: string) {
    if (color === 'white') return 'text-white'
    if (color === 'cyan') return 'text-[#00ffff]'
    return 'text-[#bf00ff]'
}

function nodeColorBg(color: string) {
    if (color === 'white') return 'bg-white'
    if (color === 'cyan') return 'bg-[#00ffff]'
    return 'bg-[#bf00ff]'
}
