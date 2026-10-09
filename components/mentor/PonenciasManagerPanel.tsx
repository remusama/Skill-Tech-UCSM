"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { API_BASE_URL } from "@/lib/config"
import {
  Plus, Trash2, Loader2, MessageSquarePlus,
  ChevronDown, ChevronUp, RefreshCw, Eye, EyeOff,
  Sparkles, Maximize2, X, AlertTriangle, User,
  Pause, Play, ShieldAlert, HelpCircle,
  ChevronLeft, ChevronRight, CheckCircle2
} from "lucide-react"

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Ponencia {
  id: string
  titulo: string
  ponente: string
  descripcion: string
  created_at: string
  activa: string
  permite_anonimos?: boolean
}

interface Pregunta {
  id: string
  ponencia_id: string
  user_id: string
  user_name?: string
  user_classroom?: string
  texto: string
  created_at: string
  updated_at: string
  es_anonimo?: boolean
  es_mia?: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// ── Subcomponente: Texto con animación suave de revelado ─────────────────────

function AnimatedQuestionText({ text, speed = 0.015 }: { text: string; speed?: number }) {
  const words = useMemo(() => text.split(" "), [text])

  return (
    <motion.p
      className="text-sm md:text-base text-white/95 leading-relaxed font-medium"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: speed,
          },
        },
      }}
    >
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          variants={{
            hidden: { opacity: 0, y: 3, filter: "blur(2px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  )
}

// ── Subcomponente: Modal de Proyección / Spotlight ───────────────────────────

interface SpotlightModalProps {
  pregunta: Pregunta | null
  index: number
  total: number
  ponencia: Ponencia
  soloAnonimos: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function SpotlightModal({
  pregunta,
  index,
  total,
  ponencia,
  soloAnonimos,
  onClose,
  onPrev,
  onNext,
}: SpotlightModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, onPrev, onNext])

  if (!pregunta) return null

  const autorTexto = soloAnonimos
    ? `Estudiante #${index + 1}`
    : pregunta.es_anonimo
    ? "Anónimo (A petición del alumno)"
    : pregunta.user_name || "Estudiante"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-black/95 border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden"
        >
          {/* Luz ambiental de fondo */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Barra superior del foco */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                Modo Proyección en Vivo
              </span>
              <span className="text-xs text-white/40 font-mono">
                Pregunta {index + 1} de {total}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar proyección (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Información de la ponencia */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {ponencia.titulo}
            </h4>
            <p className="text-xs text-white/50">Ponente: {ponencia.ponente}</p>
          </div>

          {/* Texto de la pregunta con tipografía destacada y animación */}
          <div className="my-8 min-h-[140px] flex items-center justify-center text-center px-4">
            <motion.p
              key={pregunta.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-xl md:text-3xl font-semibold text-white leading-relaxed md:leading-normal drop-shadow-sm tracking-tight"
            >
              “{pregunta.texto}”
            </motion.p>
          </div>

          {/* Información del autor y fecha */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                {soloAnonimos || pregunta.es_anonimo ? (
                  <EyeOff size={18} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  {autorTexto}
                  {!soloAnonimos && pregunta.user_classroom && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {pregunta.user_classroom}
                    </span>
                  )}
                </p>
                <p className="text-xs text-white/40">{formatFecha(pregunta.created_at)}</p>
              </div>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={index === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Anterior (Flecha izquierda)"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={onNext}
                disabled={index === total - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Siguiente (Flecha derecha)"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Subcomponente: Lista de Preguntas de una Ponencia (Vista Mentor) ─────────

function PreguntasDocente({
  ponencia,
  soloAnonimos,
}: {
  ponencia: Ponencia
  soloAnonimos: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(false)
  const [spotlightIndex, setSpotlightIndex] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ponencias/${ponencia.id}/preguntas`,
        { headers: authHeaders() }
      )
      if (res.ok) {
        const data = await res.json()
        setPreguntas(data)
      }
    } catch (e) {
      console.error("Error al cargar preguntas:", e)
    } finally {
      setLoading(false)
    }
  }, [ponencia.id])

  useEffect(() => {
    if (expanded) cargar()
  }, [expanded, cargar])

  const activa = ponencia.activa === "1"

  return (
    <>
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-md transition-all hover:border-white/20">
        <div
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  activa ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {activa ? "En Vivo" : "Pausada"}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/40">{formatFecha(ponencia.created_at)}</span>
              {ponencia.permite_anonimos && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5">
                  <EyeOff size={10} /> Admite anónimos
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-tight truncate">
              {ponencia.titulo}
            </h3>
            <p className="text-xs font-medium text-amber-200/70 mt-0.5">
              Ponente: <span className="text-white/80">{ponencia.ponente}</span>
            </p>
            {ponencia.descripcion && (
              <p className="text-xs text-white/40 mt-1 line-clamp-1">
                {ponencia.descripcion}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(v => !v)
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors"
            >
              <span>{expanded ? "Ocultar" : "Ver preguntas"}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Panel desplegado */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/10 p-4 md:p-5 space-y-4 bg-black/20"
            >
              {/* Barra de estado y actualización */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white/70">
                    {preguntas.length} {preguntas.length === 1 ? "pregunta recibida" : "preguntas recibidas"}
                  </p>
                  <span className="text-xs text-white/30">•</span>
                  <span className="text-xs text-white/40">
                    Modo:{" "}
                    <strong className={soloAnonimos ? "text-amber-300 font-semibold" : "text-emerald-400 font-semibold"}>
                      {soloAnonimos ? "Solo Anónimos" : "Mostrar Nombres"}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={cargar}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-300 transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                  title="Actualizar preguntas en vivo"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin text-amber-400" : ""} />
                  <span>Refrescar</span>
                </button>
              </div>

              {/* Cargando */}
              {loading && (
                <div className="flex items-center justify-center py-8 text-white/40">
                  <Loader2 size={20} className="animate-spin text-amber-400 mr-2" />
                  <span className="text-xs">Cargando preguntas de estudiantes...</span>
                </div>
              )}

              {/* Sin preguntas */}
              {!loading && preguntas.length === 0 && (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <HelpCircle size={28} className="mx-auto text-white/20 mb-2" />
                  <p className="text-xs font-semibold text-white/50">
                    Aún no han llegado preguntas de los estudiantes.
                  </p>
                  <p className="text-[11px] text-white/30 mt-1">
                    Las preguntas enviadas aparecerán aquí automáticamente.
                  </p>
                </div>
              )}

              {/* Lista de preguntas */}
              {!loading && preguntas.length > 0 && (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {preguntas.map((p, i) => {
                    const esAnon = soloAnonimos || p.es_anonimo
                    const autorLabel = soloAnonimos
                      ? `Estudiante #${i + 1}`
                      : p.es_anonimo
                      ? "Anónimo (A petición del alumno)"
                      : p.user_name || "Estudiante"

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="group relative bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 hover:border-amber-500/30 rounded-2xl p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          {/* Identidad del autor */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
                              #{i + 1}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                              {esAnon ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px]">
                                  <EyeOff size={11} className="text-amber-400" />
                                  {autorLabel}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                                  <User size={11} />
                                  {autorLabel}
                                </span>
                              )}
                              {!soloAnonimos && p.user_classroom && (
                                <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                  {p.user_classroom}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-white/30">
                              {formatFecha(p.created_at)}
                            </span>
                          </div>

                          {/* Botón de destacar / proyectar */}
                          <button
                            onClick={() => setSpotlightIndex(i)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 transition-all flex-shrink-0"
                            title="Destacar y proyectar en pantalla grande"
                          >
                            <Sparkles size={12} />
                            <span className="hidden sm:inline">Destacar</span>
                          </button>
                        </div>

                        {/* Texto de la pregunta con animación de tipeo/revelado */}
                        <div className="pt-1">
                          <AnimatedQuestionText text={p.texto} />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Spotlight / Proyección */}
      {spotlightIndex !== null && preguntas[spotlightIndex] && (
        <SpotlightModal
          pregunta={preguntas[spotlightIndex]}
          index={spotlightIndex}
          total={preguntas.length}
          ponencia={ponencia}
          soloAnonimos={soloAnonimos}
          onClose={() => setSpotlightIndex(null)}
          onPrev={() => setSpotlightIndex(v => (v !== null && v > 0 ? v - 1 : v))}
          onNext={() =>
            setSpotlightIndex(v =>
              v !== null && v < preguntas.length - 1 ? v + 1 : v
            )
          }
        />
      )}
    </>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────

export function PonenciasManagerPanel() {
  const [ponencias, setPonencias] = useState<Ponencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Opción sobre mostrar nombres o solo anónimos (persistido en localStorage)
  const [soloAnonimos, setSoloAnonimos] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ponencias_modo_anonimo") === "true"
    }
    return false
  })

  // Alternar modo y guardar
  const handleToggleModoAnonimo = (valor: boolean) => {
    setSoloAnonimos(valor)
    if (typeof window !== "undefined") {
      localStorage.setItem("ponencias_modo_anonimo", String(valor))
    }
  }

  // Formulario nueva ponencia
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [ponente, setPonente] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [permiteAnonimos, setPermiteAnonimos] = useState(true)
  const [creando, setCreando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal de confirmación para eliminar/desactivar ponencia
  const [ponenciaAEliminar, setPonenciaAEliminar] = useState<Ponencia | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // Cargar ponencias (incluyendo inactivas para el docente)
  const cargarPonencias = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias?incluir_inactivas=true`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPonencias(data)
    } catch {
      setError("No se pudieron cargar las ponencias.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPonencias()
  }, [cargarPonencias])

  // Crear ponencia
  const handleCrear = async () => {
    const t = titulo.trim()
    const p = ponente.trim()
    if (!t || !p) {
      setFormError("El título y el nombre del ponente son obligatorios.")
      return
    }
    setCreando(true)
    setFormError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          titulo: t,
          ponente: p,
          descripcion: descripcion.trim(),
          permite_anonimos: permiteAnonimos,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error al crear ponencia")
      }
      const nueva: Ponencia = await res.json()
      setPonencias(prev => [nueva, ...prev])
      setTitulo("")
      setPonente("")
      setDescripcion("")
      setPermiteAnonimos(true)
      setMostrarForm(false)
    } catch (e: any) {
      setFormError(e.message || "Error al crear la ponencia")
    } finally {
      setCreando(false)
    }
  }

  // Alternar activa / pausada
  const handleToggleActiva = async (p: Ponencia) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/${p.id}/toggle-activa`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      const actualizada: Ponencia = await res.json()
      setPonencias(prev =>
        prev.map(item => (item.id === p.id ? actualizada : item))
      )
    } catch {
      setError("No se pudo cambiar el estado de la ponencia.")
    }
  }

  // Eliminar o desactivar
  const handleConfirmarEliminacion = async (permanente: boolean) => {
    if (!ponenciaAEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ponencias/${ponenciaAEliminar.id}?permanente=${permanente}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      )
      if (!res.ok) throw new Error()

      if (permanente) {
        setPonencias(prev => prev.filter(p => p.id !== ponenciaAEliminar.id))
      } else {
        setPonencias(prev =>
          prev.map(p =>
            p.id === ponenciaAEliminar.id ? { ...p, activa: "0" } : p
          )
        )
      }
      setPonenciaAEliminar(null)
    } catch {
      setError("No se pudo completar la eliminación de la ponencia.")
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 px-2">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <MessageSquarePlus size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Gestión de Ponencias
              </h2>
              <p className="text-xs text-white/60">
                Crea conferencias y modera preguntas en tiempo real con modo proyector.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setMostrarForm(v => !v)
              setFormError(null)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus size={16} />
            Nueva Ponencia
          </button>
        </div>
      </div>

      {/* Barra de opciones: Modo Nombres vs Solo Anónimos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Visualización de Preguntas:
          </span>
          <span className="text-[11px] text-white/50">
            (Afecta a la vista del mentor y al proyector)
          </span>
        </div>

        {/* Switch segmentado */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl w-fit">
          <button
            onClick={() => handleToggleModoAnonimo(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !soloAnonimos
                ? "bg-amber-500 text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Eye size={13} />
            Mostrar Nombres
          </button>
          <button
            onClick={() => handleToggleModoAnonimo(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              soloAnonimos
                ? "bg-amber-500 text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <EyeOff size={13} />
            Solo Anónimos (Proyector)
          </button>
        </div>
      </div>

      {/* Formulario Nueva Ponencia */}
      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-black/40 to-black/60 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Crear Nueva Ponencia
                </h3>
              </div>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80">
                  Título de la Ponencia *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej: Liderazgo Tecnológico e Inteligencia Artificial"
                  maxLength={120}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80">
                  Nombre del Ponente / Expositor *
                </label>
                <input
                  type="text"
                  value={ponente}
                  onChange={e => setPonente(e.target.value)}
                  placeholder="Ej: Dra. María Elena Valdivia"
                  maxLength={80}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">
                Descripción o Temas Principales (Opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Breve reseña o ejes temáticos de la presentación..."
                maxLength={300}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Checkbox para permitir anónimos */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
              <input
                type="checkbox"
                checked={permiteAnonimos}
                onChange={e => setPermiteAnonimos(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
              />
              <div className="text-xs">
                <p className="font-semibold text-white">
                  Permitir que los estudiantes envíen preguntas de forma anónima
                </p>
                <p className="text-white/40 text-[11px]">
                  Si se desactiva, todas las preguntas requerirán mostrar el nombre del estudiante.
                </p>
              </div>
            </label>

            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                {formError}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setMostrarForm(false)}
                className="text-xs px-4 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={creando || !titulo.trim() || !ponente.trim()}
                className="text-xs px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {creando && <Loader2 size={14} className="animate-spin" />}
                Guardar Ponencia
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Global */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Lista de Ponencias */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 size={24} className="animate-spin text-amber-400 mr-2" />
          <span className="text-sm font-medium">Cargando ponencias...</span>
        </div>
      ) : ponencias.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] space-y-3">
          <MessageSquarePlus size={36} className="mx-auto text-white/20" />
          <p className="text-sm font-semibold text-white/60">
            Aún no has creado ponencias.
          </p>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Crea una ponencia para que tus alumnos puedan enviarte preguntas en vivo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ponencias.map(p => (
            <div key={p.id} className="relative group">
              <PreguntasDocente ponencia={p} soloAnonimos={soloAnonimos} />

              {/* Botones de acción rápida en la esquina superior derecha */}
              <div className="absolute top-4 right-28 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Botón Pausar / Activar */}
                <button
                  onClick={() => handleToggleActiva(p)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 text-white/60 hover:text-amber-300 border border-white/10 transition-colors"
                  title={p.activa === "1" ? "Pausar ponencia (dejar de recibir preguntas)" : "Reactivar ponencia"}
                >
                  {p.activa === "1" ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Botón Quitar / Eliminar */}
                <button
                  onClick={() => setPonenciaAEliminar(p)}
                  className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 transition-colors"
                  title="Quitar / Eliminar ponencia"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación para eliminar / quitar ponencia */}
      <AnimatePresence>
        {ponenciaAEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">¿Quitar ponencia?</h3>
                  <p className="text-xs text-white/50">{ponenciaAEliminar.titulo}</p>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Elige si deseas desactivarla (ocultarla a los alumnos para no recibir más preguntas, pero conservando su registro) o eliminarla permanentemente junto con todas sus preguntas.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleConfirmarEliminacion(false)}
                  disabled={eliminando}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors text-center"
                >
                  Desactivar y ocultar (Recomendado)
                </button>

                <button
                  onClick={() => handleConfirmarEliminacion(true)}
                  disabled={eliminando}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors text-center flex items-center justify-center gap-2"
                >
                  {eliminando && <Loader2 size={14} className="animate-spin" />}
                  Eliminar definitivamente
                </button>

                <button
                  onClick={() => setPonenciaAEliminar(null)}
                  disabled={eliminando}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
