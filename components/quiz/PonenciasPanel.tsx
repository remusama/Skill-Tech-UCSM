"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { API_BASE_URL } from "@/lib/config"
import {
  MessageSquarePlus, Pencil, Trash2, Send,
  ChevronDown, ChevronUp, Loader2, EyeOff, User,
  AlertCircle
} from "lucide-react"

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Ponencia {
  id: string
  titulo: string
  ponente: string
  descripcion: string
  created_at: string
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
  es_mia: boolean
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
    const d = new Date(iso)
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// ── Subcomponente: Card de preguntas de una ponencia ─────────────────────────

function PonenciaCard({ ponencia }: { ponencia: Ponencia }) {
  const [expanded, setExpanded] = useState(false)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loadingPreguntas, setLoadingPreguntas] = useState(false)
  const [nuevaPregunta, setNuevaPregunta] = useState("")
  const [enviarAnonimo, setEnviarAnonimo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const permiteAnonimos = ponencia.permite_anonimos !== false

  const cargarPreguntas = useCallback(async () => {
    setLoadingPreguntas(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/${ponencia.id}/preguntas`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Error al cargar preguntas")
      const data: Pregunta[] = await res.json()
      setPreguntas(data)
    } catch {
      setError("No se pudieron cargar las preguntas.")
    } finally {
      setLoadingPreguntas(false)
    }
  }, [ponencia.id])

  useEffect(() => {
    if (expanded) cargarPreguntas()
  }, [expanded, cargarPreguntas])

  const handleEnviar = async () => {
    const texto = nuevaPregunta.trim()
    if (!texto) return
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/${ponencia.id}/preguntas`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          texto,
          es_anonimo: permiteAnonimos ? enviarAnonimo : false,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error al enviar pregunta")
      }
      const nueva: Pregunta = await res.json()
      setPreguntas(prev => [nueva, ...prev])
      setNuevaPregunta("")
    } catch (e: any) {
      setError(e.message || "Error al enviar pregunta")
    } finally {
      setEnviando(false)
    }
  }

  const handleEditar = async (id: string) => {
    const texto = editTexto.trim()
    if (!texto) return
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/preguntas/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ texto }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error al editar pregunta")
      }
      const actualizada: Pregunta = await res.json()
      setPreguntas(prev => prev.map(p => (p.id === id ? actualizada : p)))
      setEditandoId(null)
      setEditTexto("")
    } catch (e: any) {
      setError(e.message || "Error al editar la pregunta")
    } finally {
      setGuardando(false)
    }
  }

  const handleBorrar = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar esta pregunta?")) return
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/preguntas/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error al borrar pregunta")
      }
      setPreguntas(prev => prev.filter(p => p.id !== id))
    } catch (e: any) {
      setError(e.message || "Error al borrar la pregunta")
    }
  }

  const iniciarEdicion = (p: Pregunta) => {
    setEditandoId(p.id)
    setEditTexto(p.texto)
    setError(null)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEditTexto("")
    setError(null)
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-md overflow-hidden transition-all shadow-sm hover:border-slate-300 dark:hover:border-white/20">
      {/* Header de la ponencia */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start justify-between p-4 md:p-5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sesión Activa
            </span>
            <span className="text-xs text-slate-400 dark:text-white/30">•</span>
            <span className="text-xs text-slate-500 dark:text-white/40">
              {formatFecha(ponencia.created_at)}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
            {ponencia.titulo}
          </h3>
          <p className="text-xs text-slate-600 dark:text-white/60 font-medium mt-0.5">
            Ponente: <span className="font-semibold text-slate-800 dark:text-white/90">{ponencia.ponente}</span>
          </p>
          {ponencia.descripcion && (
            <p className="text-xs text-slate-500 dark:text-white/40 mt-1 line-clamp-2">
              {ponencia.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 flex-shrink-0 mt-1">
          <span className="text-xs font-medium">
            {expanded ? "Cerrar" : "Participar"}
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Panel expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 dark:border-white/10 p-4 md:p-5 space-y-4 bg-slate-50/50 dark:bg-black/20"
          >
            {/* Campo para nueva pregunta */}
            <div className="space-y-2.5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-white/80">
                  Haz tu pregunta al expositor:
                </label>

                {/* Selector de anonimato */}
                {permiteAnonimos ? (
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setEnviarAnonimo(false)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        !enviarAnonimo
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <User size={12} />
                      <span>Con mi nombre</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnviarAnonimo(true)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        enviarAnonimo
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <EyeOff size={12} />
                      <span>Anónimo</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-white/40 flex items-center gap-1">
                    <User size={10} /> Nombre visible requerido por el ponente
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={nuevaPregunta}
                  onChange={e => setNuevaPregunta(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleEnviar()
                    }
                  }}
                  placeholder={
                    enviarAnonimo
                      ? "Escribe tu pregunta de forma anónima..."
                      : "Escribe tu pregunta con tu nombre visible..."
                  }
                  maxLength={500}
                  rows={2}
                  className="w-full bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500 transition-colors pr-14"
                />

                <button
                  onClick={handleEnviar}
                  disabled={enviando || !nuevaPregunta.trim()}
                  className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md"
                  title="Enviar pregunta"
                >
                  {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/30">
                <span>
                  {enviarAnonimo
                    ? "🕶️ Tu nombre no será mostrado al ponente ni a otros alumnos."
                    : "👤 Tu nombre aparecerá junto a tu pregunta."}
                </span>
                <span>{nuevaPregunta.length}/500</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </p>
            )}

            {/* Lista de preguntas */}
            {loadingPreguntas ? (
              <div className="flex items-center justify-center py-6 text-slate-500 dark:text-white/40">
                <Loader2 size={18} className="animate-spin mr-2 text-emerald-500" />
                <span className="text-xs">Cargando preguntas de la ponencia...</span>
              </div>
            ) : preguntas.length === 0 ? (
              <p className="text-center text-xs text-slate-500 dark:text-white/40 py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                Aún no hay preguntas para esta ponencia. ¡Sé el primero en participar!
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-white/50">
                  {preguntas.length} {preguntas.length === 1 ? "pregunta realizada" : "preguntas realizadas"}
                </p>

                {preguntas.map(p => (
                  <div
                    key={p.id}
                    className={`rounded-xl p-3.5 text-sm border transition-all ${
                      p.es_mia
                        ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20"
                        : "bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {editandoId === p.id ? (
                      /* Modo edición */
                      <div className="space-y-2">
                        <textarea
                          value={editTexto}
                          onChange={e => setEditTexto(e.target.value)}
                          maxLength={500}
                          rows={2}
                          className="w-full bg-white dark:bg-black/30 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white resize-none focus:outline-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelarEdicion}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleEditar(p.id)}
                            disabled={guardando || !editTexto.trim()}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium transition-colors flex items-center gap-1"
                          >
                            {guardando && <Loader2 size={12} className="animate-spin" />}
                            Guardar cambios
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Modo lectura */
                      <div>
                        <p className="text-slate-900 dark:text-white/90 leading-relaxed font-normal">
                          {p.texto}
                        </p>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/40">
                            {p.es_mia ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                Tú {p.es_anonimo ? "(Anónimo)" : "(Visible)"}
                              </span>
                            ) : p.es_anonimo ? (
                              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-white/50">
                                <EyeOff size={10} /> Alumno Anónimo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-white/70">
                                <User size={10} /> {p.user_name || "Alumno"}
                              </span>
                            )}
                            <span>•</span>
                            <span>{formatFecha(p.created_at)}</span>
                            {p.updated_at !== p.created_at && (
                              <span className="text-[10px] text-slate-400 dark:text-white/30">(editada)</span>
                            )}
                          </div>

                          {p.es_mia && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => iniciarEdicion(p)}
                                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                                title="Editar mi pregunta"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleBorrar(p.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="Borrar mi pregunta"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────

export function PonenciasPanel() {
  const [ponencias, setPonencias] = useState<Ponencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarPonencias = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Error al cargar ponencias")
      const data: Ponencia[] = await res.json()
      setPonencias(data)
    } catch {
      setError("No se pudieron cargar las ponencias activas.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPonencias()
  }, [cargarPonencias])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={22} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Ponencias y Conferencias
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-white/60">
            Participa en vivo con preguntas a los ponentes. Puedes enviarlas identificándote o de forma anónima.
          </p>
        </div>

        <button
          onClick={cargarPonencias}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-700 dark:text-white transition-colors"
          title="Actualizar lista de ponencias"
        >
          <Loader2 size={16} className={loading ? "animate-spin" : "opacity-0"} />
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 dark:text-white/40">
          <Loader2 size={24} className="animate-spin text-emerald-500 mr-2" />
          <span className="text-sm font-medium">Cargando ponencias activas...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10 space-y-3 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button
            onClick={cargarPonencias}
            className="text-xs px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-semibold transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && ponencias.length === 0 && (
        <div className="text-center py-16 space-y-2 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-transparent">
          <MessageSquarePlus size={36} className="mx-auto text-slate-400 dark:text-white/20" />
          <p className="text-sm font-bold text-slate-700 dark:text-white/60">
            No hay ponencias activas en este momento.
          </p>
          <p className="text-xs text-slate-500 dark:text-white/40">
            Cuando tu mentor inicie una sesión de preguntas para una ponencia, aparecerá aquí automáticamente.
          </p>
        </div>
      )}

      {!loading && !error && ponencias.length > 0 && (
        <div className="space-y-3.5">
          {ponencias.map(p => (
            <PonenciaCard key={p.id} ponencia={p} />
          ))}
        </div>
      )}
    </div>
  )
}
