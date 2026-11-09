"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as PIXI from "pixi.js"
import {
  Users, Award, Compass, Sparkles, CheckCircle2,
  Lock, Play, RotateCcw, Volume2, VolumeX, Maximize2,
  Minimize2, ChevronRight, Info, Shield, Star, Trophy,
  MessageSquare, HelpCircle, ArrowRight, ArrowLeft
} from "lucide-react"

// Ensure nearest-neighbor crisp pixel scaling
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST

// --- GESTORES UCSM (PERSONAJES DEL AFICHE) ---
export interface GestorCharacter {
  id: string
  name: string
  title: string
  role: string
  bio: string
  avatarUrl: string
  tip: string
  palette: {
    skin: string
    hair: string
    shirt: string
    accent: string
    pants: string
  }
}

export const GESTORES_UCSM: GestorCharacter[] = [
  {
    id: "mateo",
    name: "Mateo",
    title: "Líder de Estrategia",
    role: "Gestor Estratégico",
    bio: "Enfocado en visión de proyecto, articulación de objetivos y toma de decisiones ágiles con los equipos de la UCSM.",
    avatarUrl: "/sprites/gestor_mateo.jpg",
    tip: "¡Hola! Para liderar un proyecto en la UCSM, primero escucha a tu equipo y define un objetivo claro con resultados medibles.",
    palette: {
      skin: "#fef3c7",
      hair: "#451a03", // Rizado castaño oscuro
      shirt: "#047857", // Verde polo UCSM
      accent: "#34d399",
      pants: "#1e3a8a" // Jeans
    }
  },
  {
    id: "elena",
    name: "Elena",
    title: "Coordinadora de Innovación",
    role: "Gestora de Innovación INICIA",
    bio: "Especialista en incubación ágil, metodologías de emprendimiento y dinamización de comunidades universitarias.",
    avatarUrl: "/sprites/gestor_elena.jpg",
    tip: "En INICIA aprendemos que una idea solo vale cuando se valida en el campus con usuarios reales. ¡No tengas miedo a pivotar!",
    palette: {
      skin: "#fef08a",
      hair: "#0f172a", // Cabello largo oscuro
      shirt: "#0284c7", // Casaca universitaria
      accent: "#ffffff",
      pants: "#1e293b"
    }
  },
  {
    id: "diego",
    name: "Diego",
    title: "Gestor Tecnológico",
    role: "Gestor de Métricas y OKRs",
    bio: "Apasionado por el prototipado tecnológico, seguimiento de hitos mediante OKRs y finanzas colaborativas.",
    avatarUrl: "/sprites/gestor_diego.jpg",
    tip: "Los OKRs te permiten avanzar por sprints semanales. Divide el gran objetivo en entregables tangibles cada 7 días.",
    palette: {
      skin: "#fef3c7",
      hair: "#020617", // Cabello corto con lentes
      shirt: "#111827", // Polera negra
      accent: "#38bdf8",
      pants: "#334155"
    }
  },
  {
    id: "valeria",
    name: "Valeria",
    title: "Gestora de Alianzas",
    role: "Gestora de Comunicación y Pitch",
    bio: "Lidera la comunicación asertiva, empatía con usuarios, storytelling persuasivo y conexión con aliados clave.",
    avatarUrl: "/sprites/gestor_valeria.jpg",
    tip: "Tu pitch debe emocionar en los primeros 30 segundos. Cuenta el problema real de los estudiantes antes de hablar de tu solución.",
    palette: {
      skin: "#fef3c7",
      hair: "#78350f", // Cabello ondulado
      shirt: "#d97706", // Blusa beige / tan
      accent: "#fde047",
      pants: "#0f172a"
    }
  }
]

// --- 10 SESIONES CON RETOS INTERACTIVOS ---
export interface SessionChallenge {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface SessionNode {
  id: number
  code: string
  title: string
  subtitle: string
  desc: string
  objectives: string[]
  topics: string[]
  reward: number
  step: number
  max: number
  status: "completed" | "active" | "locked"
  type: "sprout" | "speech" | "starRing" | "team" | "book" | "gear" | "chest" | "speechBubble" | "starReview" | "castleBoss"
  x: number
  y: number
  challenge: SessionChallenge
}

const INITIAL_NODES: SessionNode[] = [
  {
    id: 0,
    code: "SESIÓN 01",
    title: "Inducción y Misión de Gestores",
    subtitle: "Bienvenida al Ecosistema UCSM",
    desc: "Alineación de objetivos de la Red de Gestores UCSM 2026 e integración con la Incubadora de Empresas INICIA.",
    objectives: [
      "Conocer el rol del Gestor en el ecosistema de innovación universitaria.",
      "Identificar los canales de soporte de la Dirección de Innovación y Desarrollo.",
      "Definir el compromiso de liderazgo estudiantil para el periodo 2026."
    ],
    topics: ["ADN UCSM e INICIA", "Cultura de Innovación", "Código de Ética"],
    reward: 20,
    step: 1,
    max: 1,
    status: "completed",
    type: "sprout",
    x: 180,
    y: 560,
    challenge: {
      question: "¿Cuál es el propósito principal de un Gestor en el Programa de Liderazgo UCSM?",
      options: [
        "Articular proyectos de innovación y acompañar a los equipos hacia soluciones reales en el campus.",
        "Aprobar presupuestos sin consulta previa con los mentores.",
        "Trabajar de forma aislada sin interactuar con otras facultades."
      ],
      correctIndex: 0,
      explanation: "El Gestor actúa como puente dinamizador entre las facultades, los estudiantes y la Incubadora INICIA."
    }
  },
  {
    id: 1,
    code: "SESIÓN 02",
    title: "Diagnóstico y Mapeo de Ecosistema",
    subtitle: "Detección de Oportunidades en Campus",
    desc: "Mapeo de necesidades estudiantiles, proyectos en curso y retos prioritarios de las facultades.",
    objectives: [
      "Aplicar matrices de empatía y observación activa en el campus.",
      "Identificar vacíos y áreas prioritarias de intervención tecnológica.",
      "Sistematizar hallazgos para las mesas de trabajo de gestores."
    ],
    topics: ["Técnicas de Escucha Activa", "Mapeo de Stakeholders", "Priorización"],
    reward: 25,
    step: 3,
    max: 3,
    status: "completed",
    type: "speech",
    x: 420,
    y: 440,
    challenge: {
      question: "¿Cuál es la herramienta recomendada para empatizar directamente con las necesidades estudiantiles?",
      options: [
        "Mapa de Empatía y entrevistas de observación en el campus.",
        "Comprar un software genérico sin consultar al usuario.",
        "Asumir lo que los estudiantes necesitan basándose en corazonadas."
      ],
      correctIndex: 0,
      explanation: "La observación directa y las entrevistas cualitativas revelan los dolores y fricciones reales de los estudiantes."
    }
  },
  {
    id: 2,
    code: "SESIÓN 03",
    title: "Design Thinking y Validación Ágil",
    subtitle: "Co-creación Centrada en el Usuario",
    desc: "Metodologías de innovación aplicada: empatizar, definir, idear, prototipar y testear con estudiantes reales.",
    objectives: [
      "Dominar las 5 fases de Design Thinking en proyectos de gestión.",
      "Diseñar experimentos rápidos para validar hipótesis de valor.",
      "Aprender a iterar ágilmente ante retroalimentación temprana."
    ],
    topics: ["Fases de Design Thinking", "Ideación sin Filtro", "Validación en Terreno"],
    reward: 30,
    step: 1,
    max: 3,
    status: "active",
    type: "starRing",
    x: 680,
    y: 440,
    challenge: {
      question: "¿Qué debes hacer si en la fase de testeo los estudiantes rechazan tu propuesta inicial?",
      options: [
        "Agradecer el feedback, analizar los puntos de fricción e iterar la idea rápidamente.",
        "Ignorar los comentarios y forzar la solución original.",
        "Cancelar el proyecto definitivamente sin analizar las causas."
      ],
      correctIndex: 0,
      explanation: "El fracaso temprano en prototipado ahorra tiempo y recursos; iterar es la esencia del Design Thinking."
    }
  },
  {
    id: 3,
    code: "SESIÓN 04",
    title: "Equipos de Alto Rendimiento",
    subtitle: "Liderazgo Horizontal y Sinergia",
    desc: "Coordinación efectiva, sinergia multidisciplinaria y resolución constructiva de conflictos en equipos.",
    objectives: [
      "Gestionar dinámicas de equipo basadas en confianza y responsabilidad compartida.",
      "Aplicar feedback bidireccional y comunicación asertiva.",
      "Desarrollar matrices RACI para delegación clara de tareas."
    ],
    topics: ["Liderazgo Servidor", "Matriz RACI", "Gestión de Conflictos"],
    reward: 35,
    step: 0,
    max: 2,
    status: "locked",
    type: "team",
    x: 920,
    y: 560,
    challenge: {
      question: "¿Cómo promueve un Gestor Líder la autonomía y el alto rendimiento en su equipo?",
      options: [
        "Clarificando metas y roles (RACI) y fomentando la seguridad psicológica para opinar.",
        "Micro-gestionando cada minuto de trabajo de sus compañeros.",
        "Tomando todas las decisiones en solitario."
      ],
      correctIndex: 0,
      explanation: "La seguridad psicológica y los roles claros potencian la iniciativa individual y el rendimiento colectivo."
    }
  },
  {
    id: 4,
    code: "SESIÓN 05",
    title: "Prototipado Rápido y Lean Canvas",
    subtitle: "De la Idea a la Propuesta de Valor",
    desc: "Estructuración ágil de modelos de servicio y productos mínimos viables aplicados al campus UCSM.",
    objectives: [
      "Completar el lienzo Lean Canvas enfocado en proyectos universitarios.",
      "Construir prototipos de baja y media fidelidad en menos de 48 horas.",
      "Medir tasas de adopción e interés de la comunidad estudiantil."
    ],
    topics: ["Lean Canvas Universitario", "Prototipado Rápido", "Testeo Cuantitativo"],
    reward: 40,
    step: 0,
    max: 2,
    status: "locked",
    type: "book",
    x: 1160,
    y: 440,
    challenge: {
      question: "¿Cuál es el principal beneficio de un Producto Mínimo Viable (MVP)?",
      options: [
        "Aprender con el menor esfuerzo posible si el usuario realmente valora la propuesta.",
        "Tener un producto 100% perfecto antes de mostrárselo a nadie.",
        "Gastar todo el presupuesto en la primera semana."
      ],
      correctIndex: 0,
      explanation: "El MVP minimiza el desperdicio y maximiza el aprendizaje validado con usuarios reales."
    }
  },
  {
    id: 5,
    code: "SESIÓN 06",
    title: "Gestión Ágil de Proyectos (OKRs)",
    subtitle: "Metas Claras y Ejecución Medible",
    desc: "Framework de Objetivos y Resultados Clave (OKRs) para monitorear el progreso y celebrar micro-victorias.",
    objectives: [
      "Formular OKRs trimestrales inspiradores y cuantitativos.",
      "Implementar sprints semanales de seguimiento ágil.",
      "Utilizar tableros Kanban para visibilidad total de entregables."
    ],
    topics: ["Estructura de OKRs", "Reuniones Stand-up de 15 Min", "Retrospectivas"],
    reward: 45,
    step: 0,
    max: 2,
    status: "locked",
    type: "gear",
    x: 1400,
    y: 560,
    challenge: {
      question: "¿Cuál de estos es un Resultado Clave (KR) bien formulado para un proyecto de gestión?",
      options: [
        "Aumentar la tasa de participación estudiantil de 15% a 45% al cierre del ciclo.",
        "Hacer que el proyecto sea genial y divertido.",
        "Pensar en ideas durante las reuniones."
      ],
      correctIndex: 0,
      explanation: "Un Resultado Clave debe ser medible, tener línea base y meta temporal específica."
    }
  },
  {
    id: 6,
    code: "SESIÓN 07",
    title: "Economía P2P & Finanzas MyL",
    subtitle: "Sostenibilidad y Recursos Colaborativos",
    desc: "Gestión transparente de recursos, micro-transacciones QR y apalancamiento del ecosistema MyL UCSM.",
    objectives: [
      "Presupuestar iniciativas de gestoría de manera eficiente y transparente.",
      "Utilizar transacciones P2P y liquidaciones con código QR.",
      "Fomentar la economía circular de mérito y reconocimientos en el campus."
    ],
    topics: ["Presupuestos Lean", "Pasarela QR P2P", "Incentivos MyL"],
    reward: 50,
    step: 0,
    max: 1,
    status: "locked",
    type: "chest",
    x: 1640,
    y: 440,
    challenge: {
      question: "¿Cómo aporta la economía P2P de tokens MyL a la sostenibilidad de los proyectos estudiantiles?",
      options: [
        "Facilita intercambios directos, incentivos por mérito y transparencia total en transacciones.",
        "Obliga a intermediarios bancarios lentos y burocráticos.",
        "Elimina la necesidad de planificar gastos."
      ],
      correctIndex: 0,
      explanation: "El modelo P2P MyL democratiza el acceso a recursos y premia el compromiso activo de los gestores."
    }
  },
  {
    id: 7,
    code: "SESIÓN 08",
    title: "Storytelling y Pitch de Alto Impacto",
    subtitle: "Comunicación Persuasiva y Visión",
    desc: "Técnicas de narrativa emocional y estructura de pitch para captar aliados, mentores e inversión.",
    objectives: [
      "Estructurar un pitch elevator de 3 minutos con impacto memorable.",
      "Diseñar diapositivas visuales minimalistas con foco en datos reales.",
      "Manejar preguntas difíciles de jurados y directivos universitarios."
    ],
    topics: ["Estructura Gancho-Problema-Solución", "Lenguaje No Verbal", "Manejo de Q&A"],
    reward: 60,
    step: 0,
    max: 2,
    status: "locked",
    type: "speechBubble",
    x: 1880,
    y: 560,
    challenge: {
      question: "¿Cuál es el primer elemento que debe captar la atención en los primeros 20 segundos de un pitch?",
      options: [
        "Un 'gancho' potente que conecte con un problema real y urgente de la audiencia.",
        "Leer los términos legales y antecedentes históricos extensos.",
        "Pedir dinero de inmediato sin explicar la solución."
      ],
      correctIndex: 0,
      explanation: "El gancho emocional o dato de impacto genera curiosidad y prepara a la audiencia para la propuesta."
    }
  },
  {
    id: 8,
    code: "SESIÓN 09",
    title: "Demo Day & Comité INICIA",
    subtitle: "Simulación ante Jurados y Mentores",
    desc: "Presentación final de proyectos de gestoría ante evaluadores de la Incubadora de Empresas INICIA.",
    objectives: [
      "Defender el modelo de impacto y viabilidad técnica de cada proyecto.",
      "Recibir feedback de expertos del ecosistema empresarial arequipeño.",
      "Ajustar los planes de despliegue antes del lanzamiento oficial."
    ],
    topics: ["Rúbricas de Evaluación INICIA", "Pitch en Vivo", "Planes de Mitigación"],
    reward: 75,
    step: 0,
    max: 3,
    status: "locked",
    type: "starReview",
    x: 2110,
    y: 440,
    challenge: {
      question: "¿Cómo debe responder un Gestor cuando un evaluador de INICIA cuestiona la viabilidad de su proyecto?",
      options: [
        "Agradecer la perspectiva, respaldar con datos de validación y mostrar disposición a ajustar el plan.",
        "Discutir a la defensiva e interrumpir al evaluador.",
        "Abandonar la sala de presentación."
      ],
      correctIndex: 0,
      explanation: "La madurez para recibir crítica constructiva y fundamentar con datos es la marca de un verdadero líder."
    }
  },
  {
    id: 9,
    code: "SESIÓN 10",
    title: "Castillo de Liderazgo UCSM 2026",
    subtitle: "Cumbre de Gestores y Graduación",
    desc: "Gran clausura oficial: Certificación de Gestores Líderes 2026 y despliegue del plan de innovación anual.",
    objectives: [
      "Consolidar la Red Oficial de Gestores UCSM 2026.",
      "Recibir la certificación de Liderazgo y Gestión de Innovación.",
      "Establecer la hoja de ruta de transferencias para los siguientes ciclos."
    ],
    topics: ["Ceremonia de Graduación", "Pacto de Liderazgo UCSM", "Despliegue Institucional"],
    reward: 100,
    step: 0,
    max: 3,
    status: "locked",
    type: "castleBoss",
    x: 2380,
    y: 440,
    challenge: {
      question: "¿Qué representa la culminación exitosa de la Ruta de Gestores UCSM 2026?",
      options: [
        "El inicio del compromiso activo para transformar positivamente la comunidad universitaria y el ecosistema.",
        "El fin de todo aprendizaje o iniciativa.",
        "Un certificado sin aplicación práctica."
      ],
      correctIndex: 0,
      explanation: "La graduación formaliza el rol del Gestor como agente de cambio permanente en la Universidad Católica de Santa María."
    }
  }
]

// --- SINTETIZADOR DE AUDIO RETRO 16-BIT (WEB AUDIO API) ---
class RetroAudioEngine {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  playStep() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "square"
    osc.frequency.setValueAtTime(140, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.05)
  }

  playCoin() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(987.77, now) // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08) // E6
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  }

  playSelect() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  playFanfare() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.09
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(freq, now)
      gain.gain.setValueAtTime(0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(this.ctx!.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    })
  }

  playWrong() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.setValueAtTime(160, now + 0.1)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  }
}

const retroAudio = new RetroAudioEngine()

// Procedural pixel canvas helper
function createPixelTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): PIXI.Texture {
  const c = document.createElement("canvas")
  c.width = width
  c.height = height
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingEnabled = false
  drawFn(ctx, width, height)
  return PIXI.Texture.from(c)
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  palette: Record<string, string>,
  pixelSize = 1,
  offsetX = 0,
  offsetY = 0
) {
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r]
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      if (ch !== "." && ch !== " " && palette[ch]) {
        ctx.fillStyle = palette[ch]
        ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize, pixelSize, pixelSize)
      }
    }
  }
}

export function GestoresOverworldMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const heroSpriteRef = useRef<PIXI.Sprite | null>(null)
  const cameraTargetXRef = useRef<number>(0)
  const worldContainerRef = useRef<PIXI.Container | null>(null)
  const skyContainerRef = useRef<PIXI.Container | null>(null)
  const nodesGfxMapRef = useRef<Map<number, PIXI.Container>>(new Map())
  const isWalkingRef = useRef<boolean>(false)

  // Game & State Management
  const [selectedGestor, setSelectedGestor] = useState<GestorCharacter>(GESTORES_UCSM[0])
  const selectedGestorRef = useRef<GestorCharacter>(GESTORES_UCSM[0])
  selectedGestorRef.current = selectedGestor

  const [nodes, setNodes] = useState<SessionNode[]>(INITIAL_NODES)
  const nodesRef = useRef<SessionNode[]>(INITIAL_NODES)
  nodesRef.current = nodes

  const [currentNodeId, setCurrentNodeId] = useState<number>(2) // Starts at Sesión 03
  const currentNodeIdRef = useRef<number>(2)
  currentNodeIdRef.current = currentNodeId

  const [coins, setCoins] = useState<number>(120)
  const [lives, setLives] = useState<number>(182)
  // Camera and waypoints
  const heroWaypointsRef = useRef<{ x: number; y: number }[]>([])

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Modals & Dialogue
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false)
  const [showGestorModal, setShowGestorModal] = useState<boolean>(false)
  const [showPosterModal, setShowPosterModal] = useState<boolean>(false)
  const [activeCompanionDialogue, setActiveCompanionDialogue] = useState<GestorCharacter | null>(null)
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<number | null>(null)
  const [challengeResult, setChallengeResult] = useState<"idle" | "correct" | "wrong">("idle")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const activeNode = nodes[currentNodeId] || nodes[0]

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // --- SMOOTH CAMERA CENTERING (TRACKS WORLD COORDINATES) ---
  const smoothCenterCamera = useCallback((worldX: number) => {
    if (!containerRef.current) return
    const containerW = containerRef.current.clientWidth || window.innerWidth
    const desiredX = (containerW / 2) - worldX
    const minX = Math.min(0, containerW - 2580)
    cameraTargetXRef.current = Math.max(minX, Math.min(60, desiredX))
  }, [])

  // --- WALK HERO TO NODE SMOOTHLY (NATIVE PIXI TICKER - ZERO TEAR DOWN) ---
  const walkHeroToNode = useCallback((targetId: number) => {
    const startNode = nodesRef.current[currentNodeIdRef.current]
    const endNode = nodesRef.current[targetId]
    const hero = heroSpriteRef.current
    if (!endNode || !hero || hero.destroyed) return

    retroAudio.playSelect()
    setCurrentNodeId(targetId)
    currentNodeIdRef.current = targetId

    // Flip hero sprite facing direction
    if (endNode.x < hero.x) {
      hero.scale.x = -3.2
    } else if (endNode.x > hero.x) {
      hero.scale.x = 3.2
    }

    // Build orthogonal road waypoints
    const waypoints: { x: number; y: number }[] = []
    if (startNode.y !== endNode.y && Math.abs(startNode.x - endNode.x) > 10) {
      const midX = (startNode.x + endNode.x) / 2
      waypoints.push({ x: midX, y: startNode.y - 12 })
      waypoints.push({ x: midX, y: endNode.y - 12 })
    }
    waypoints.push({ x: endNode.x, y: endNode.y - 12 })

    heroWaypointsRef.current = waypoints
  }, [])

  // --- ANSWER SESSION CHALLENGE & REWARD ---
  const handleAnswerChallenge = (index: number) => {
    setSelectedChallengeOption(index)
    if (index === activeNode.challenge.correctIndex) {
      setChallengeResult("correct")
      retroAudio.playCoin()
      setCoins(c => c + activeNode.reward)
    } else {
      setChallengeResult("wrong")
      retroAudio.playWrong()
    }
  }

  // --- COMPLETE SESSION ---
  const handleCompleteSession = () => {
    retroAudio.playFanfare()
    const updated = nodes.map(n => {
      if (n.id === currentNodeId) {
        return {
          ...n,
          status: "completed" as const,
          step: Math.min(n.max, n.step + 1)
        }
      }
      // Unlock adjacent node
      if (n.id === currentNodeId + 1 && n.status === "locked") {
        return { ...n, status: "active" as const }
      }
      return n
    })

    setNodes(updated)
    nodesRef.current = updated
    setShowSessionModal(false)
    setSelectedChallengeOption(null)
    setChallengeResult("idle")
    showToast(`¡Excelente! ${activeNode.code} completada. +${activeNode.reward} XP.`)

    // Walk to newly unlocked node
    const nextNode = updated.find(n => n.id === currentNodeId + 1)
    if (nextNode) {
      setTimeout(() => walkHeroToNode(nextNode.id), 500)
    }
  }

  // --- INITIALIZE PIXI.JS STAGE EXACTLY ONCE ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Clean previous app if any
    if (appRef.current) {
      try {
        appRef.current.destroy(true, { children: true, texture: true })
      } catch (e) {
        // cleanup safe
      }
      appRef.current = null
    }

    const app = new PIXI.Application({
      resizeTo: el,
      backgroundColor: 0x02160d, // Dark emerald nocturnal UCSM sky
      antialias: false,
      resolution: 1
    })

    appRef.current = app
    el.innerHTML = ""
    el.appendChild(app.view as HTMLCanvasElement)

    const skyContainer = new PIXI.Container()
    const bgMountainsContainer = new PIXI.Container()
    const worldContainer = new PIXI.Container()

    skyContainerRef.current = skyContainer
    worldContainerRef.current = worldContainer

    app.stage.addChild(skyContainer)
    app.stage.addChild(bgMountainsContainer)
    app.stage.addChild(worldContainer)

    // 1. Twinkling Stars
    const stars: { gfx: PIXI.Graphics; speed: number; phase: number }[] = []
    for (let i = 0; i < 160; i++) {
      const star = new PIXI.Graphics()
      const size = i % 7 === 0 ? 4 : (i % 3 === 0 ? 3 : 2)
      const color = i % 8 === 0 ? 0x10b981 : (i % 4 === 0 ? 0xfbbf24 : 0xecfdf5)
      star.beginFill(color)
      star.drawRect(0, 0, size, size)
      star.endFill()
      star.x = Math.floor(Math.random() * 2800)
      star.y = Math.floor(Math.random() * 850)
      skyContainer.addChild(star)
      stars.push({ gfx: star, speed: 0.03 + Math.random() * 0.04, phase: Math.random() * 6 })
    }

    // 2. Parallax El Misti Volcano & Arequipa Mountain Silhouette (UCSM Identity)
    const mistiGfx = new PIXI.Graphics()
    // Distant mountain ridge
    mistiGfx.beginFill(0x062817)
    mistiGfx.drawPolygon([
      0, 520,
      350, 310,
      550, 420,
      880, 260, // Peak 1
      1100, 390,
      1420, 210, // El Misti Peak
      1580, 270,
      1890, 360,
      2200, 240,
      2600, 480,
      2600, 850,
      0, 850
    ])
    // Snow cap on El Misti peak
    mistiGfx.beginFill(0xecfdf5, 0.85)
    mistiGfx.drawPolygon([
      1420, 210,
      1385, 255,
      1410, 250,
      1425, 265,
      1450, 245,
      1470, 258,
      1455, 230
    ])
    mistiGfx.endFill()
    bgMountainsContainer.addChild(mistiGfx)

    // 3. Terrain Islands (UCSM Campus Floating Islands)
    const terrainGfx = new PIXI.Graphics()
    function drawPixelCloudIsland(
      gfx: PIXI.Graphics,
      x: number, y: number, w: number, h: number,
      fillHex: number, highlightHex: number, shadowHex: number
    ) {
      const step = 8
      gfx.beginFill(0x011910)
      gfx.drawRect(x - step, y, w + step * 2, h)
      gfx.drawRect(x, y - step, w, h + step * 2)

      gfx.beginFill(fillHex)
      gfx.drawRect(x, y, w, h)

      gfx.beginFill(highlightHex)
      gfx.drawRect(x + step, y, w - step * 2, step * 2)

      gfx.beginFill(shadowHex)
      gfx.drawRect(x, y + h - step * 3, w, step * 3)

      for (let px = x + step; px < x + w - step * 3; px += step * 6) {
        gfx.beginFill(0x011910)
        gfx.drawRect(px - 4, y + h, step * 3 + 8, step + 4)
        gfx.beginFill(shadowHex)
        gfx.drawRect(px, y + h - 4, step * 3, step + 4)
      }
      gfx.endFill()
    }

    // Main 10-session horizontal continent (from x=90 to x=2560)
    drawPixelCloudIsland(terrainGfx, 90, 320, 2460, 370, 0x0b3b24, 0x14532d, 0x052e16)

    // Distinct courtyards along the path
    drawPixelCloudIsland(terrainGfx, 460, 480, 380, 70, 0x022013, 0x064e3b, 0x01140c)
    drawPixelCloudIsland(terrainGfx, 1180, 480, 400, 70, 0x022013, 0x064e3b, 0x01140c)
    drawPixelCloudIsland(terrainGfx, 1880, 480, 380, 70, 0x022013, 0x064e3b, 0x01140c)

    worldContainer.addChild(terrainGfx)

    // 4. Cobblestone Amber Roads connecting the 10 Sessions
    const roadGfx = new PIXI.Graphics()
    function drawPixelRoad(x1: number, y1: number, x2: number, y2: number) {
      const thickness = 38
      const minX = Math.min(x1, x2) - thickness / 2
      const minY = Math.min(y1, y2) - thickness / 2
      const w = Math.abs(x2 - x1) + thickness
      const h = Math.abs(y2 - y1) + thickness

      roadGfx.beginFill(0x020617)
      roadGfx.drawRect(minX - 4, minY - 4, w + 8, h + 8)

      roadGfx.beginFill(0xfbbf24) // Gold edge
      roadGfx.drawRect(minX, minY, w, h)

      roadGfx.beginFill(0xd97706) // Inner amber dirt
      roadGfx.drawRect(minX + 4, minY + 4, w - 8, h - 8)

      // Cobble dots
      roadGfx.beginFill(0x92400e)
      for (let rx = minX + 10; rx < minX + w - 12; rx += 18) {
        for (let ry = minY + 10; ry < minY + h - 12; ry += 14) {
          roadGfx.drawRect(rx, ry, 4, 4)
        }
      }
      roadGfx.endFill()
    }

    for (let i = 0; i < INITIAL_NODES.length - 1; i++) {
      const a = INITIAL_NODES[i]
      const b = INITIAL_NODES[i + 1]
      if (a.y === b.y) {
        drawPixelRoad(a.x, a.y, b.x, b.y)
      } else {
        const midX = (a.x + b.x) / 2
        drawPixelRoad(a.x, a.y, midX, a.y)
        drawPixelRoad(midX, a.y, midX, b.y)
        drawPixelRoad(midX, b.y, b.x, b.y)
      }
    }
    worldContainer.addChild(roadGfx)

    // 5. Pixel Art Landmarks
    // Torre de Innovación UCSM (x=420, y=415)
    const towerTex = createPixelTexture(44, 60, (ctx) => {
      ctx.fillStyle = "#020617"; ctx.fillRect(20, 2, 4, 14)
      ctx.fillStyle = "#10b981"; ctx.fillRect(18, 0, 8, 6)
      ctx.fillStyle = "#6ee7b7"; ctx.fillRect(20, 1, 2, 2)
      ctx.fillStyle = "#020617"; ctx.fillRect(6, 14, 32, 44)
      ctx.fillStyle = "#334155"
      ctx.fillRect(8, 16, 4, 6); ctx.fillRect(16, 16, 4, 6)
      ctx.fillRect(24, 16, 4, 6); ctx.fillRect(32, 16, 4, 6)
      ctx.fillStyle = "#1e293b"; ctx.fillRect(8, 22, 28, 34)
      ctx.fillStyle = "#475569"; ctx.fillRect(10, 22, 6, 34)
      ctx.fillStyle = "#020617"
      ctx.fillRect(13, 27, 6, 8); ctx.fillRect(25, 27, 6, 8)
      ctx.fillStyle = "#020617"; ctx.fillRect(15, 41, 14, 15)
      ctx.fillStyle = "#047857"; ctx.fillRect(17, 43, 10, 13)
      ctx.fillStyle = "#fbbf24"; ctx.fillRect(17, 48, 10, 2)
    })
    const towerSprite = new PIXI.Sprite(towerTex)
    towerSprite.anchor.set(0.5, 1)
    towerSprite.scale.set(3)
    towerSprite.x = 420
    towerSprite.y = 415
    worldContainer.addChild(towerSprite)

    // Bosque de Incubación INICIA (x=790, y=415)
    const mushroomTex = createPixelTexture(68, 48, (ctx) => {
      ctx.fillStyle = "#020617"; ctx.fillRect(26, 20, 12, 26)
      ctx.fillStyle = "#cbd5e1"; ctx.fillRect(28, 22, 8, 22)
      ctx.fillStyle = "#020617"; ctx.fillRect(14, 6, 36, 16)
      ctx.fillStyle = "#10b981"; ctx.fillRect(16, 8, 32, 12)
      ctx.fillStyle = "#a7f3d0"; ctx.fillRect(20, 10, 10, 4); ctx.fillRect(36, 12, 6, 4)

      ctx.fillStyle = "#020617"; ctx.fillRect(10, 30, 8, 16)
      ctx.fillStyle = "#e2e8f0"; ctx.fillRect(12, 32, 4, 12)
      ctx.fillStyle = "#020617"; ctx.fillRect(2, 20, 24, 12)
      ctx.fillStyle = "#ec4899"; ctx.fillRect(4, 22, 20, 8)
      ctx.fillStyle = "#fbcfe8"; ctx.fillRect(8, 24, 6, 3)

      ctx.fillStyle = "#020617"; ctx.fillRect(48, 28, 8, 18)
      ctx.fillStyle = "#e2e8f0"; ctx.fillRect(50, 30, 4, 14)
      ctx.fillStyle = "#020617"; ctx.fillRect(38, 18, 28, 12)
      ctx.fillStyle = "#f59e0b"; ctx.fillRect(40, 20, 24, 8)
      ctx.fillStyle = "#fef08a"; ctx.fillRect(44, 22, 8, 3)
    })
    const mushroomSprite = new PIXI.Sprite(mushroomTex)
    mushroomSprite.anchor.set(0.5, 1)
    mushroomSprite.scale.set(3)
    mushroomSprite.x = 790
    mushroomSprite.y = 415
    worldContainer.addChild(mushroomSprite)

    // Barco Volador / Aceleradora UCSM (x=1260, y=170)
    const airshipTex = createPixelTexture(64, 36, (ctx) => {
      ctx.fillStyle = "#020617"
      ctx.fillRect(8, 14, 48, 16)
      ctx.fillRect(4, 8, 12, 14)
      ctx.fillRect(46, 6, 14, 16)
      ctx.fillRect(22, 8, 20, 8)

      ctx.fillStyle = "#059669"
      ctx.fillRect(10, 16, 44, 12)
      ctx.fillRect(6, 10, 8, 10)
      ctx.fillRect(48, 8, 10, 12)

      ctx.fillStyle = "#34d399"
      ctx.fillRect(10, 16, 44, 3)

      ctx.fillStyle = "#f59e0b"
      ctx.fillRect(24, 10, 16, 6)
      ctx.fillStyle = "#38bdf8"
      ctx.fillRect(28, 12, 3, 3); ctx.fillRect(34, 12, 3, 3)
    })
    const airshipSprite = new PIXI.Sprite(airshipTex)
    airshipSprite.anchor.set(0.5)
    airshipSprite.scale.set(3)
    airshipSprite.x = 1260
    airshipSprite.y = 170
    worldContainer.addChild(airshipSprite)

    // Domo Santuario de Equipos / Coworking MyL (Node 6, x=1640, y=555)
    const domeTex = createPixelTexture(36, 32, (ctx) => {
      ctx.fillStyle = "#020617"
      ctx.fillRect(4, 6, 28, 16)
      ctx.fillRect(8, 20, 20, 12)
      ctx.fillStyle = "#10b981"
      ctx.fillRect(6, 8, 24, 12)
      ctx.fillStyle = "#ecfdf5"
      ctx.fillRect(14, 10, 8, 8)
      ctx.fillRect(6, 12, 4, 6); ctx.fillRect(26, 12, 4, 6)
      ctx.fillStyle = "#fef3c7"
      ctx.fillRect(10, 22, 16, 8)
    })
    const domeSprite = new PIXI.Sprite(domeTex)
    domeSprite.anchor.set(0.5, 1)
    domeSprite.scale.set(3)
    domeSprite.x = 1640
    domeSprite.y = 560
    worldContainer.addChild(domeSprite)

    // Gran Castillo de Liderazgo UCSM 2026 (Sesión 10, x=2380, y=415)
    const castleTex = createPixelTexture(72, 60, (ctx) => {
      ctx.fillStyle = "#020617"
      ctx.fillRect(6, 10, 22, 48)
      ctx.fillRect(44, 6, 24, 52)
      ctx.fillRect(24, 24, 24, 34)

      ctx.fillStyle = "#047857"
      ctx.fillRect(8, 12, 18, 12)
      ctx.fillRect(46, 8, 20, 14)
      ctx.fillStyle = "#34d399"
      ctx.fillRect(10, 14, 8, 4); ctx.fillRect(48, 10, 10, 4)

      ctx.fillStyle = "#1e293b"
      ctx.fillRect(8, 24, 18, 32)
      ctx.fillRect(46, 22, 20, 34)
      ctx.fillRect(26, 28, 20, 28)

      ctx.fillStyle = "#020617"
      ctx.fillRect(14, 30, 6, 10)
      ctx.fillRect(53, 28, 6, 10)
      ctx.fillRect(31, 38, 10, 18)

      ctx.fillStyle = "#fbbf24"
      ctx.fillRect(34, 42, 4, 10)
      ctx.fillRect(31, 45, 10, 4)
    })
    const castleSprite = new PIXI.Sprite(castleTex)
    castleSprite.anchor.set(0.5, 1)
    castleSprite.scale.set(3.2)
    castleSprite.x = 2380
    castleSprite.y = 415
    worldContainer.addChild(castleSprite)

    // 6. Interactive Companion NPCs (Elena at Node 2, Diego at Node 5, Valeria at Node 7)
    const companionsConfig = [
      { gestor: GESTORES_UCSM[1], x: 740, y: 440 }, // Elena
      { gestor: GESTORES_UCSM[2], x: 1460, y: 560 }, // Diego
      { gestor: GESTORES_UCSM[3], x: 1940, y: 560 }  // Valeria
    ]

    companionsConfig.forEach(({ gestor, x, y }) => {
      const compTex = createPixelTexture(18, 24, (ctx) => {
        const m = [
          "....KKKKKKKK....",
          "...KCCCCCCCCK...",
          "..KCCCCCCCCCCK..",
          "..KBBBBBBBBBBK..",
          "..KWWKWWWWKWWK..",
          "..KWWKWWWWKWWK..",
          "...KWWWWWWWWK...",
          "...KKKKKKKKKK...",
          "..KBBBBBBBBBBK..",
          "..KBBYYYYYYBBK..",
          "...KBBBBBBBBK...",
          "...KBBK..KBBK...",
          "...KKKK..KKKK..."
        ]
        drawMatrix(ctx, m, {
          K: "#020617",
          C: gestor.palette.hair,
          B: gestor.palette.shirt,
          W: gestor.palette.skin,
          Y: gestor.palette.accent
        }, 1, 0, 4)
      })

      const compSprite = new PIXI.Sprite(compTex)
      compSprite.anchor.set(0.5, 0.85)
      compSprite.scale.set(3)
      compSprite.x = x
      compSprite.y = y - 12
      compSprite.eventMode = "static"
      compSprite.cursor = "pointer"

      // Floating Talk Icon above companion
      const talkTip = new PIXI.Text("TALK", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 8,
        fill: 0x38bdf8
      })
      talkTip.anchor.set(0.5)
      talkTip.y = -68
      compSprite.addChild(talkTip)

      compSprite.on("pointerdown", (e) => {
        e.stopPropagation()
        retroAudio.playSelect()
        setActiveCompanionDialogue(gestor)
      })

      worldContainer.addChild(compSprite)
    })

    // 7. Node Icons & Node Renderers
    const nodeIcons: Record<string, PIXI.Texture> = {
      sprout: createPixelTexture(16, 16, (ctx) => {
        const m = [
          ".......KK.......",
          "....KKKWWKKK....",
          "...KWWWWWWWWK...",
          "...KWWKKKKWWK...",
          "....KK.WW.KK....",
          ".......WW.......",
          ".......WW.......",
          "......KKKK......"
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#34d399" }, 1, 0, 4)
      }),
      speech: createPixelTexture(18, 16, (ctx) => {
        const m = [
          "..KKKKKKKK......",
          ".KWWWWWWWWK.....",
          ".KWKKKKKKWK.....",
          ".KWWWWWWWWKKKK..",
          ".KKKKWWKWYYYYYK.",
          "...KWWKYYYYYYYK.",
          "...KKK..KYYYYYK.",
          ".........KKKKKK."
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#ffffff", Y: "#38bdf8" }, 1, 1, 4)
      }),
      starRing: createPixelTexture(16, 16, (ctx) => {
        const m = [
          "......KKKK......",
          "......KWWK......",
          "..KKKKWWWWKKKK..",
          ".KWWWWWWWWWWWWK.",
          "..KKWWWWWWWWKK..",
          "...KWWWWWWWWK...",
          "..KWWKK..KKWWK..",
          "..KKK......KKK.."
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#fef08a" }, 1, 0, 4)
      }),
      team: createPixelTexture(18, 16, (ctx) => {
        const m = [
          "...KKKK..KKKK...",
          "..KYYYYKKYYYYK..",
          ".KYYYYYYYYYYYYK.",
          ".KYYYYYYYYYYYYK.",
          "..KYYYYYYYYYYK..",
          "...KYYYYYYYYK...",
          "....KYYYYYYK....",
          ".....KKKKKK....."
        ]
        drawMatrix(ctx, m, { K: "#020617", Y: "#f43f5e" }, 1, 1, 4)
      }),
      book: createPixelTexture(18, 16, (ctx) => {
        const m = [
          ".KKKKKK..KKKKKK.",
          "KWWWWWWKKWWWWWWK",
          "KWKKKKWKKWKKKKWK",
          "KWWWWWWKKWWWWWWK",
          "KWKKKKWKKWKKKKWK",
          "KWWWWWWKKWWWWWWK",
          ".KKKKKK..KKKKKK."
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#94a3b8" }, 1, 1, 4)
      }),
      gear: createPixelTexture(18, 16, (ctx) => {
        const m = [
          "....KKK..KKK....",
          "....KWWKKWWK....",
          ".KKKKWWWWWWKKKK.",
          ".KWWWWKKKKWWWWK.",
          ".KWWWWKKKKWWWWK.",
          ".KKKKWWWWWWKKKK.",
          "....KWWKKWWK....",
          "....KKK..KKK...."
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#38bdf8" }, 1, 1, 4)
      }),
      chest: createPixelTexture(18, 16, (ctx) => {
        const m = [
          "..KKKKKKKKKKKK..",
          ".KYYYYYYYYYYYYK.",
          ".KKKKKKKKKKKKKK.",
          ".KWWWWKKKKWWWWK.",
          ".KWWWWKYYKWWWWK.",
          ".KWWWWKKKKWWWWK.",
          ".KWWWWWWWWWWWWK.",
          "..KKKKKKKKKKKK.."
        ]
        drawMatrix(ctx, m, { K: "#020617", Y: "#fbbf24", W: "#d97706" }, 1, 1, 4)
      }),
      speechBubble: createPixelTexture(18, 16, (ctx) => {
        const m = [
          "...KKKKKKKKKK...",
          "..KWWWWWWWWWWK..",
          ".KWWKKKKKKKKWWK.",
          ".KWWWWWWWWWWWWK.",
          ".KWWWWWWWWWWWWK.",
          "..KKKKKKKWWKKK..",
          ".......KWWK.....",
          "........KK......"
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#f59e0b" }, 1, 1, 4)
      }),
      starReview: createPixelTexture(16, 16, (ctx) => {
        const m = [
          "......KKKK......",
          "......KWWK......",
          "..KKKKWWWWKKKK..",
          ".KWWWWWWWWWWWWK.",
          "..KKWWWWWWWWKK..",
          "...KWWWWWWWWK...",
          "..KWWKK..KKWWK..",
          "..KKK......KKK.."
        ]
        drawMatrix(ctx, m, { K: "#020617", W: "#a855f7" }, 1, 0, 4)
      }),
      castleBoss: createPixelTexture(20, 18, (ctx) => {
        const m = [
          ".KK.KKKK.KK.",
          "KYYKYYYYKYYK",
          "KYYKYYYYKYYK",
          "KYYYYYYYYYYK",
          "KYYKKKKKKYYK",
          "KYYKWWWWKYYK",
          "KYYKWWWWKYYK",
          ".KKKKKKKKKK."
        ]
        drawMatrix(ctx, m, { K: "#020617", Y: "#e11d48", W: "#fbbf24" }, 1, 1, 4)
      })
    }

    const nodesContainer = new PIXI.Container()
    worldContainer.addChild(nodesContainer)
    const startTipsList: PIXI.Container[] = []

    INITIAL_NODES.forEach((node) => {
      const nCont = new PIXI.Container()
      nCont.x = node.x
      nCont.y = node.y
      nCont.eventMode = "static"
      nCont.cursor = "pointer"

      const padGfx = new PIXI.Graphics()
      nCont.addChild(padGfx)

      const iconTex = nodeIcons[node.type] || nodeIcons.starRing
      const iconSprite = new PIXI.Sprite(iconTex)
      iconSprite.anchor.set(0.5)
      iconSprite.scale.set(2.4)
      iconSprite.y = -4
      nCont.addChild(iconSprite)

      const codeText = new PIXI.Text(`S-${node.id + 1}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        fill: 0xfef08a
      })
      codeText.anchor.set(0.5)
      codeText.y = 38
      nCont.addChild(codeText)

      // Start bubble for active node
      const startTip = new PIXI.Container()
      startTip.y = -62
      const bubbleGfx = new PIXI.Graphics()
      bubbleGfx.beginFill(0x020617)
      bubbleGfx.drawRect(-46, -18, 92, 32)
      bubbleGfx.beginFill(0x34d399)
      bubbleGfx.drawRect(-42, -14, 84, 24)
      bubbleGfx.beginFill(0x064e3b)
      bubbleGfx.drawRect(-38, -10, 76, 16)
      bubbleGfx.beginFill(0x34d399)
      bubbleGfx.drawRect(-6, 10, 12, 6)
      bubbleGfx.endFill()
      startTip.addChild(bubbleGfx)

      const startTxt = new PIXI.Text("START", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 10,
        fill: 0xecfdf5
      })
      startTxt.anchor.set(0.5)
      startTxt.y = -2
      startTip.addChild(startTxt)
      nCont.addChild(startTip)
      startTipsList.push(startTip)

      // Draw initial node pad visuals
      const renderPadVisuals = (status: "completed" | "active" | "locked") => {
        padGfx.clear()
        if (status === "active") {
          padGfx.beginFill(0x020617)
          padGfx.drawRect(-46, -38, 92, 76)
          padGfx.beginFill(0x1e293b)
          padGfx.drawRect(-42, -34, 84, 68)
          padGfx.beginFill(0x34d399)
          padGfx.drawRect(0, -34, 42, 34)
          padGfx.drawRect(16, 0, 26, 26)
        }

        const fillHex = status === "completed" ? 0x10b981 : (status === "active" ? 0x059669 : 0x1e293b)
        const shadowHex = status === "completed" ? 0x047857 : (status === "active" ? 0x022c22 : 0x0f172a)

        padGfx.beginFill(0x020617)
        padGfx.drawRect(-34, -26, 68, 56)
        padGfx.beginFill(0xfbbf24)
        padGfx.drawRect(-30, -22, 60, 48)
        padGfx.beginFill(shadowHex)
        padGfx.drawRect(-26, -18, 52, 40)
        padGfx.beginFill(fillHex)
        padGfx.drawRect(-26, -20, 52, 34)
        padGfx.endFill()

        startTip.visible = (status === "active")
        codeText.style.fill = status === "locked" ? 0x64748b : 0xfef08a
      }

      renderPadVisuals(node.status)
      ;(nCont as any).updateStatus = renderPadVisuals

      nCont.on("pointerdown", (e) => {
        e.stopPropagation()
        walkHeroToNode(node.id)
      })

      nodesGfxMapRef.current.set(node.id, nCont)
      nodesContainer.addChild(nCont)
    })

    // 8. 16-Bit Hero Sprite (Selected Gestor)
    const createHeroTexturesForGestor = (gestor: GestorCharacter) => {
      const f1 = createPixelTexture(16, 20, (ctx) => {
        const m = [
          "....KKKKKKKK....",
          "...KCCCCCCCCK...",
          "..KCCCCCCCCCCK..",
          "..KBBBBBBBBBBK..",
          "..KWWKWWWWKWWK..",
          "..KWWKWWWWKWWK..",
          "...KWWWWWWWWK...",
          "...KKKKKKKKKK...",
          "..KBBBBBBBBBBK..",
          "..KBBYYYYYYBBK..",
          "...KBBBBBBBBK...",
          "...KPPK..KPPK...",
          "...KKKK..KKKK..."
        ]
        drawMatrix(ctx, m, {
          K: "#020617",
          C: gestor.palette.hair,
          B: gestor.palette.shirt,
          W: gestor.palette.skin,
          Y: gestor.palette.accent,
          P: gestor.palette.pants
        }, 1, 0, 4)
      })

      const f2 = createPixelTexture(16, 20, (ctx) => {
        const m = [
          "....KKKKKKKK....",
          "...KCCCCCCCCK...",
          "..KCCCCCCCCCCK..",
          "..KBBBBBBBBBBK..",
          "..KWWKWWWWKWWK..",
          "..KWWKWWWWKWWK..",
          "...KWWWWWWWWK...",
          "...KKKKKKKKKK...",
          "..KBBBBBBBBBBK..",
          "..KBBYYYYYYBBK..",
          "...KBBBBBBBBK...",
          "..KPPK....KPPK..",
          "..KKKK....KKKK.."
        ]
        drawMatrix(ctx, m, {
          K: "#020617",
          C: gestor.palette.hair,
          B: gestor.palette.shirt,
          W: gestor.palette.skin,
          Y: gestor.palette.accent,
          P: gestor.palette.pants
        }, 1, 0, 3)
      })

      return [f1, f2]
    }

    let [hFrame1, hFrame2] = createHeroTexturesForGestor(selectedGestorRef.current)

    const hero = new PIXI.Sprite(hFrame1)
    hero.anchor.set(0.5, 0.85)
    hero.scale.set(3.2)
    hero.x = INITIAL_NODES[2].x
    hero.y = INITIAL_NODES[2].y - 12
    worldContainer.addChild(hero)
    heroSpriteRef.current = hero

    ;(app as any).updateGestorTextures = (newGestor: GestorCharacter) => {
      const [newF1, newF2] = createHeroTexturesForGestor(newGestor)
      hFrame1 = newF1
      hFrame2 = newF2
      hero.texture = hFrame1
    }

    // Set initial camera
    const containerW = el.clientWidth || window.innerWidth
    cameraTargetXRef.current = (containerW / 2) - INITIAL_NODES[2].x

    // 9. Smooth Animation Ticker Loop (60 FPS - Native PixiJS)
    let frameTick = 0
    app.ticker.add(() => {
      frameTick++

      // Airship bobbing
      if (airshipSprite && !airshipSprite.destroyed) {
        airshipSprite.y = 170 + Math.sin(frameTick * 0.04) * 8
      }

      // START Tooltip bounce
      startTipsList.forEach((st, idx) => {
        if (st && !st.destroyed && st.visible) {
          st.y = -62 + Math.sin(frameTick * 0.12 + idx) * 5
        }
      })

      // Hero waypoint movement along the road
      if (hero && !hero.destroyed && heroWaypointsRef.current.length > 0) {
        const target = heroWaypointsRef.current[0]
        const dx = target.x - hero.x
        const dy = target.y - hero.y
        const dist = Math.hypot(dx, dy)
        const speed = 7.5

        if (dist <= speed) {
          hero.x = target.x
          hero.y = target.y
          heroWaypointsRef.current.shift()
        } else {
          hero.x += (dx / dist) * speed
          hero.y += (dy / dist) * speed
        }
        smoothCenterCamera(hero.x)
        if (frameTick % 12 === 0) retroAudio.playStep()
      }

      // Smooth camera interpolation (Gentle 0.08 lerp prevents abrupt snapping)
      worldContainer.x += (cameraTargetXRef.current - worldContainer.x) * 0.08
      worldContainer.y = Math.max(-40, ((el.clientHeight || 750) - 800) * 0.45)

      // Parallax effect on distant mountains and sky
      bgMountainsContainer.x = worldContainer.x * 0.55
      bgMountainsContainer.y = worldContainer.y
      skyContainer.x = worldContainer.x * 0.2

      // Hero walking & idle animation
      if (frameTick % 16 === 0) {
        hero.texture = (hero.texture === hFrame1) ? hFrame2 : hFrame1
      }

      // Stars twinkle
      if (frameTick % 14 === 0) {
        stars.forEach(s => {
          s.gfx.alpha = 0.35 + 0.65 * Math.sin(frameTick * s.speed + s.phase)
        })
      }
    })

    // Drag to Pan across the 10 sessions
    let isDragging = false
    let dragStartX = 0

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      dragStartX = e.clientX
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartX
      dragStartX = e.clientX
      const cW = el.clientWidth || window.innerWidth
      const minX = Math.min(0, cW - 2580)
      cameraTargetXRef.current = Math.max(minX, Math.min(60, cameraTargetXRef.current + dx))
    }
    const onPointerUp = () => { isDragging = false }

    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      heroWaypointsRef.current = []
      heroSpriteRef.current = null
      nodesGfxMapRef.current.clear()

      if (appRef.current) {
        try {
          appRef.current.ticker.stop()
          appRef.current.destroy(true, { children: true, texture: false, baseTexture: false })
        } catch (e) {
          // cleanup safe
        }
        appRef.current = null
      }
    }
  }, []) // Empty dependency array: NEVER tears down the Pixi app on node changes!

  // --- REACTIVELY UPDATE HERO TEXTURE ON GESTOR SWITCH ---
  useEffect(() => {
    if (appRef.current && (appRef.current as any).updateGestorTextures) {
      ;(appRef.current as any).updateGestorTextures(selectedGestor)
    }
  }, [selectedGestor])

  // --- REACTIVELY UPDATE NODE VISUALS ON COMPLETION ---
  useEffect(() => {
    nodes.forEach(n => {
      const container = nodesGfxMapRef.current.get(n.id)
      if (container && (container as any).updateStatus) {
        ;(container as any).updateStatus(n.status)
      }
    })
  }, [nodes])

  // --- KEYBOARD CONTROLS (ARROWS / A & D / ENTER / E) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSessionModal || showGestorModal || showPosterModal || activeCompanionDialogue) return

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        const nextId = Math.min(nodesRef.current.length - 1, currentNodeIdRef.current + 1)
        walkHeroToNode(nextId)
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        const prevId = Math.max(0, currentNodeIdRef.current - 1)
        walkHeroToNode(prevId)
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        const node = nodesRef.current[currentNodeIdRef.current]
        if (node && node.status !== "locked") {
          setShowSessionModal(true)
        }
      } else if (e.key === "e" || e.key === "E") {
        // Talk to nearest companion
        const companions = [GESTORES_UCSM[1], GESTORES_UCSM[2], GESTORES_UCSM[3]]
        setActiveCompanionDialogue(companions[currentNodeIdRef.current % companions.length])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [walkHeroToNode, showSessionModal, showGestorModal, showPosterModal, activeCompanionDialogue])

  return (
    <div className={`relative w-full overflow-hidden transition-all duration-300 rounded-[2.5rem] border border-white/10 ${
      isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen bg-[#02150e]" : "h-[740px] md:h-[820px] bg-[#02150e]"
    }`}>
      {/* 2D PixiJS Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Retro Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 scanlines opacity-45" />

      {/* ===================================================================
           1. TOP-LEFT RETRO HUD: LEVEL UCSM 2026, TIMER 21:50 & MEDALS
           =================================================================== */}
      <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2 pointer-events-none">
        <div className="pixel-box px-3.5 py-2 flex items-center gap-2.5 pointer-events-auto shadow-xl">
          <span className="font-pixel text-xs sm:text-sm text-emerald-400 pixel-text-shadow tracking-tighter">
            UCSM 2026
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Meeting Timer Pill (From poster: 9:50 p.m. = 21:50) */}
        <div className="bg-[#050811] border-4 border-emerald-900/60 px-3 py-1 flex items-center gap-2 shadow-[0_4px_0_#000] pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-pixel text-[10px] sm:text-xs text-amber-300 tracking-widest">
            HOY 21:50
          </span>
        </div>

        {/* Star Medals */}
        <div className="flex items-center gap-1.5 pointer-events-auto mt-0.5">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shadow-md ${
                starIdx <= (currentNodeId >= 2 ? 2 : 1)
                  ? "bg-amber-500/20 border-amber-400 text-amber-400"
                  : "bg-slate-900 border-slate-700 text-slate-600"
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================
           2. TOP-CENTER BANNER: RUTA DE GESTORES UCSM 2026
           =================================================================== */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-stretch pointer-events-auto">
        <div className="pixel-banner-ucsm px-5 py-2.5 flex items-center gap-4 shadow-2xl">
          <div className="flex flex-col">
            <span className="font-pixel text-[9px] text-emerald-200 tracking-wider uppercase">
              REUNIÓN DE GESTORES • INICIA UCSM
            </span>
            <span className="font-silk font-bold text-sm text-white pixel-text-shadow mt-0.5">
              Ruta de Liderazgo: 10 Sesiones
            </span>
          </div>
          <div className="w-1 self-stretch bg-emerald-700" />
          <button
            onClick={() => setShowPosterModal(true)}
            title="Ver Afiche & Sprites IA"
            className="pixel-btn pixel-btn-amber px-3 py-2 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-950" />
            <span className="font-pixel text-[9px] text-amber-950 font-bold hidden lg:inline">AFICHE</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
           3. TOP-RIGHT HUD: GESTOR AVATAR SELECTOR, SOUND & FULLSCREEN
           =================================================================== */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Character Selector Pill */}
          <button
            onClick={() => setShowGestorModal(true)}
            className="pixel-box px-3 py-1.5 flex items-center gap-2.5 hover:border-emerald-400 transition-all cursor-pointer shadow-xl group"
          >
            <div className="w-9 h-9 rounded-md overflow-hidden border-2 border-emerald-400 bg-slate-900 flex-shrink-0">
              <img
                src={selectedGestor.avatarUrl}
                alt={selectedGestor.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-pixel text-[10px] text-emerald-300 leading-none">
                {selectedGestor.name}
              </span>
              <span className="font-silk text-[9px] text-slate-400 leading-tight">
                {selectedGestor.title}
              </span>
            </div>
            <span className="font-pixel text-[9px] text-amber-300 ml-1">▼</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              retroAudio.enabled = next
              showToast(next ? "Sonido 16-Bit: ACTIVADO" : "Sonido 16-Bit: SILENCIADO")
            }}
            className="pixel-btn pixel-btn-slate p-2 text-amber-300 hover:text-white"
            title="Audio Retro 16-Bit"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="pixel-btn pixel-btn-slate p-2 text-emerald-300 hover:text-white"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Lives Counter & Power-Up */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="pixel-box px-3 py-1.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-pixel text-[10px] text-slate-300">x</span>
            <span className="font-pixel text-xs text-white">{lives}</span>
          </div>

          <button
            onClick={() => {
              retroAudio.playFanfare()
              setLives(l => l + 1)
              showToast("¡Insignia de Gestor Líder activada! (+1 Vida)")
            }}
            title="Insignia de Líder UCSM"
            className="pixel-box w-11 h-11 flex items-center justify-center hover:border-amber-400 cursor-pointer active:translate-y-1 transition"
          >
            <Award className="w-5 h-5 text-amber-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ===================================================================
           4. BOTTOM-LEFT HUD: XP COINS & VIRTUAL RETRO CONTROLS
           =================================================================== */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          {/* XP Coins */}
          <div className="pixel-box px-3.5 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-[10px] text-slate-400">XP</span>
            <span className="font-pixel text-sm text-amber-300 font-bold">{coins}</span>
          </div>

          {/* Virtual D-Pad Movement Buttons (Smooth navigation without snapping) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => walkHeroToNode(Math.max(0, currentNodeId - 1))}
              disabled={currentNodeId === 0}
              className="pixel-btn pixel-btn-slate p-2 text-emerald-300 hover:text-white disabled:opacity-40"
              title="Sesión Anterior [A / ←]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => walkHeroToNode(Math.min(nodes.length - 1, currentNodeId + 1))}
              disabled={currentNodeId === nodes.length - 1}
              className="pixel-btn pixel-btn-slate p-2 text-emerald-300 hover:text-white disabled:opacity-40"
              title="Siguiente Sesión [D / →]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
           5. BOTTOM-RIGHT HUD: SESSION INSPECTOR & LAUNCHER
           =================================================================== */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto max-w-[92vw] sm:max-w-sm">
        <div className="pixel-box p-3.5 w-full shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b-4 border-slate-800 pb-2 mb-2">
            <span className="font-pixel text-[10px] text-emerald-400">{activeNode.code}</span>
            <span className="font-pixel text-[9px] text-amber-400">PASO {activeNode.step}/{activeNode.max}</span>
          </div>

          <h3 className="font-pixel text-xs sm:text-sm text-white leading-snug">
            {activeNode.title}
          </h3>
          <p className="font-silk text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
            {activeNode.desc}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                retroAudio.playSelect()
                setShowSessionModal(true)
              }}
              disabled={activeNode.status === "locked"}
              className={`pixel-btn flex-1 py-2.5 px-3 font-pixel text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 ${
                activeNode.status === "locked"
                  ? "pixel-btn-slate text-slate-500 cursor-not-allowed"
                  : "pixel-btn-emerald text-white"
              }`}
            >
              {activeNode.status === "locked" ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>BLOQUEADO</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>INICIAR SESIÓN (+{activeNode.reward} XP)</span>
                </>
              )}
            </button>

            <button
              onClick={() => smoothCenterCamera(activeNode.x)}
              title="Centrar Cámara"
              className="pixel-btn pixel-btn-slate px-3 py-2.5 font-pixel text-[10px] text-emerald-300"
            >
              CAM
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
           6. TOAST NOTIFICATION
           =================================================================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pixel-box px-4 py-2 text-emerald-300 font-pixel text-[10px] text-center shadow-2xl max-w-md border-emerald-500"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================
           7. MODAL DE SESIÓN: RETO & GUÍA INTERACTIVA
           =================================================================== */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pixel-box w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-4 border-slate-700 pb-3 mb-4">
                <div>
                  <span className="font-pixel text-[9px] text-emerald-400 uppercase block">
                    {activeNode.code} • PROGRAMA DE LIDERAZGO UCSM
                  </span>
                  <h2 className="font-pixel text-sm sm:text-base text-white mt-1">
                    {activeNode.title}
                  </h2>
                  <p className="font-silk text-xs text-amber-300 mt-0.5">{activeNode.subtitle}</p>
                </div>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="pixel-btn pixel-btn-slate px-2.5 py-1.5 font-pixel text-xs text-rose-400"
                >
                  ✕
                </button>
              </div>

              {/* Reto Interactivo de la Sesión */}
              <div className="space-y-4 text-xs font-silk text-slate-200">
                <div className="bg-[#07130e] border-2 border-emerald-800 p-3.5 rounded-lg">
                  <div className="font-pixel text-[10px] text-emerald-400 mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    RETO DE DECISIÓN DE LIDERAZGO
                  </div>
                  <p className="text-white font-medium mb-3">{activeNode.challenge.question}</p>

                  <div className="space-y-2">
                    {activeNode.challenge.options.map((opt, idx) => {
                      const isSelected = selectedChallengeOption === idx
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerChallenge(idx)}
                          className={`w-full text-left p-2.5 rounded-lg border-2 font-silk text-xs transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? (idx === activeNode.challenge.correctIndex
                                  ? "bg-emerald-950/80 border-emerald-400 text-emerald-200"
                                  : "bg-rose-950/80 border-rose-500 text-rose-200")
                              : "bg-[#09111c] border-slate-700 hover:border-slate-500 text-slate-300"
                          }`}
                        >
                          <span className="font-pixel text-[10px] text-amber-300 mt-0.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      )
                    })}
                  </div>

                  {challengeResult === "correct" && (
                    <div className="mt-3 p-2.5 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-300 text-[11px]">
                      ✓ <strong>¡Correcto!</strong> {activeNode.challenge.explanation}
                    </div>
                  )}

                  {challengeResult === "wrong" && (
                    <div className="mt-3 p-2.5 bg-rose-900/40 border border-rose-500 rounded text-rose-300 text-[11px]">
                      ✕ <strong>Intenta de nuevo:</strong> {activeNode.challenge.explanation}
                    </div>
                  )}
                </div>

                {/* Objetivos */}
                <div className="bg-[#070b14] border-2 border-slate-700 p-3 rounded-lg">
                  <div className="font-pixel text-[10px] text-cyan-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    OBJETIVOS CLAVE DE APRENDIZAJE
                  </div>
                  <ul className="space-y-1.5">
                    {activeNode.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-between items-center gap-3 pt-3 border-t-2 border-slate-800">
                <span className="font-pixel text-[10px] text-amber-300">
                  RECOMPENSA: +{activeNode.reward} XP
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="pixel-btn pixel-btn-slate px-4 py-2 font-pixel text-[10px] text-slate-300"
                  >
                    CERRAR
                  </button>
                  <button
                    onClick={handleCompleteSession}
                    disabled={challengeResult !== "correct" && activeNode.status !== "completed"}
                    className={`pixel-btn px-5 py-2.5 font-pixel text-[10px] text-white shadow-lg ${
                      challengeResult === "correct" || activeNode.status === "completed"
                        ? "pixel-btn-emerald"
                        : "pixel-btn-slate opacity-50 cursor-not-allowed"
                    }`}
                  >
                    COMPLETAR & RECLAMAR XP
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================
           8. MODAL DE DIÁLOGO CON COMPAÑEROS GESTORES (16-BIT JRPG DIALOG)
           =================================================================== */}
      <AnimatePresence>
        {activeCompanionDialogue && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-8 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pixel-box w-full max-w-2xl p-5 relative flex flex-col sm:flex-row gap-4 items-center"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-400 bg-black flex-shrink-0 shadow-lg">
                <img
                  src={activeCompanionDialogue.avatarUrl}
                  alt={activeCompanionDialogue.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-xs text-emerald-300">
                    {activeCompanionDialogue.name} • {activeCompanionDialogue.title}
                  </span>
                  <button
                    onClick={() => setActiveCompanionDialogue(null)}
                    className="pixel-btn pixel-btn-slate px-2 py-0.5 font-pixel text-[9px] text-rose-400"
                  >
                    ✕
                  </button>
                </div>
                <p className="font-silk text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#06121a] p-3 rounded-lg border border-slate-700">
                  "{activeCompanionDialogue.tip}"
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => {
                      retroAudio.playSelect()
                      setActiveCompanionDialogue(null)
                    }}
                    className="pixel-btn pixel-btn-emerald px-4 py-1.5 font-pixel text-[9px] text-white"
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================
           9. MODAL: SELECCIÓN DE GESTOR (AVATAR RETRO 16-BIT)
           =================================================================== */}
      <AnimatePresence>
        {showGestorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pixel-box w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-4 border-slate-700 pb-3 mb-4">
                <div>
                  <span className="font-pixel text-[9px] text-emerald-400 uppercase block">
                    EQUIPO DE LIDERAZGO UCSM 2026
                  </span>
                  <h2 className="font-pixel text-sm sm:text-base text-white mt-1">
                    SELECCIONA A TU GESTOR
                  </h2>
                </div>
                <button
                  onClick={() => setShowGestorModal(false)}
                  className="pixel-btn pixel-btn-slate px-2.5 py-1.5 font-pixel text-xs text-rose-400"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GESTORES_UCSM.map((gestor) => {
                  const isSelected = selectedGestor.id === gestor.id
                  return (
                    <div
                      key={gestor.id}
                      onClick={() => {
                        retroAudio.playSelect()
                        setSelectedGestor(gestor)
                        showToast(`¡Ahora juegas como ${gestor.name}!`)
                      }}
                      className={`p-3.5 rounded-xl border-4 transition-all cursor-pointer flex gap-3.5 items-start ${
                        isSelected
                          ? "bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          : "bg-[#0a1120] border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-400/60 bg-black flex-shrink-0 shadow-md">
                        <img
                          src={gestor.avatarUrl}
                          alt={gestor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-pixel text-xs text-white truncate">{gestor.name}</h4>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-black font-pixel text-[8px] rounded">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <span className="font-pixel text-[9px] text-amber-300 block mt-0.5">
                          {gestor.title}
                        </span>
                        <p className="font-silk text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {gestor.bio}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t-2 border-slate-800">
                <button
                  onClick={() => setShowGestorModal(false)}
                  className="pixel-btn pixel-btn-emerald px-6 py-2.5 font-pixel text-[10px] text-white"
                >
                  CONFIRMAR SELECCIÓN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================
           10. MODAL: AFICHE OFICIAL & SPRITES IA
           =================================================================== */}
      <AnimatePresence>
        {showPosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pixel-box w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-4 border-slate-700 pb-3 mb-4">
                <div>
                  <span className="font-pixel text-[9px] text-emerald-400 uppercase block">
                    MATERIAL GRÁFICO & SPRITES IA
                  </span>
                  <h2 className="font-pixel text-sm sm:text-base text-white mt-1">
                    AFICHE UCSM & SPRITES DE GESTORES
                  </h2>
                </div>
                <button
                  onClick={() => setShowPosterModal(false)}
                  className="pixel-btn pixel-btn-slate px-2.5 py-1.5 font-pixel text-xs text-rose-400"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#070b14] border-2 border-slate-700 p-3 rounded-xl flex flex-col">
                  <span className="font-pixel text-[10px] text-amber-300 mb-2">
                    HOJA DE SPRITES RETRO 16-BIT (IA)
                  </span>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-black flex-1 flex items-center justify-center">
                    <img
                      src="/sprites/gestores_spritesheet.jpg"
                      alt="Hoja de Sprites IA"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <p className="font-silk text-[10px] text-slate-400 mt-2">
                    Sprites generados con IA para los 4 gestores: Mateo, Elena, Diego y Valeria.
                  </p>
                </div>

                <div className="bg-[#070b14] border-2 border-slate-700 p-3 rounded-xl flex flex-col">
                  <span className="font-pixel text-[10px] text-emerald-400 mb-2">
                    PANEL DE SELECCIÓN DE PERSONAJES (IA)
                  </span>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-black flex-1 flex items-center justify-center">
                    <img
                      src="/sprites/gestores_select_hud.jpg"
                      alt="HUD de Selección de Gestores"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <p className="font-silk text-[10px] text-slate-400 mt-2">
                    Recreación pixel art inspirada en el afiche "Reunión de Gestores - UCSM 2026".
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPosterModal(false)}
                  className="pixel-btn pixel-btn-slate px-6 py-2 font-pixel text-[10px] text-emerald-300"
                >
                  ENTENDIDO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
