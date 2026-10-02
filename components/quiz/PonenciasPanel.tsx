"use client"

import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/lib/config"
import { MessageSquarePlus, Pencil, Trash2, Send, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Ponencia {
  id: string
  titulo: string
  ponente: string
  descripcion: string
  created_at: string
}

interface Pregunta {
  id: string
  ponencia_id: string
  user_id: string
  texto: string
  created_at: string
  updated_at: string
  es_mia: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("eleonor_token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("es-PE", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
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
  const [enviando, setEnviando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (e) {
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
        body: JSON.stringify({ texto }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Error al enviar pregunta")
      }
      const nueva: Pregunta = await res.json()
      setPreguntas(prev => [nueva, ...prev])
      setNuevaPregunta("")
    } catch (e: any) {
      setError(e.message)
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
      setPreguntas(prev => prev.map(p => p.id === id ? actualizada : p))
      setEditandoId(null)
      setEditTexto("")
    } catch (e: any) {
      setError(e.message)
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
      setError(e.message)
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
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all">
      {/* Header de la ponencia */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-semibold text-white text-sm truncate">{ponencia.titulo}</h3>
          <p className="text-xs text-white/50 mt-0.5">{ponencia.ponente}</p>
          {ponencia.descripcion && (
            <p className="text-xs text-white/40 mt-1 line-clamp-2">{ponencia.descripcion}</p>
          )}
        </div>
        <span className="text-white/40 flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4">

          {/* Campo para nueva pregunta */}
          <div className="space-y-2">
            <label className="text-xs text-white/60 font-medium">Tu pregunta para esta ponencia</label>
            <div className="flex gap-2">
              <textarea
                value={nuevaPregunta}
                onChange={e => setNuevaPregunta(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleEnviar()
                  }
                }}
                placeholder="Escribe tu pregunta aquí... (Enter para enviar)"
                maxLength={500}
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                onClick={handleEnviar}
                disabled={enviando || !nuevaPregunta.trim()}
                className="self-end px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                title="Enviar pregunta"
              >
                {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-xs text-white/30 text-right">{nuevaPregunta.length}/500</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Lista de preguntas */}
          {loadingPreguntas ? (
            <div className="flex items-center justify-center py-6 text-white/40">
              <Loader2 size={18} className="animate-spin mr-2" />
              <span className="text-sm">Cargando preguntas...</span>
            </div>
          ) : preguntas.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-4">
              Aún no hay preguntas para esta ponencia. ¡Sé el primero!
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-white/40">{preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""}</p>
              {preguntas.map(p => (
                <div
                  key={p.id}
                  className={`rounded-lg p-3 text-sm border transition-colors ${
                    p.es_mia
                      ? "bg-emerald-900/20 border-emerald-500/20"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {editandoId === p.id ? (
                    // Modo edición
                    <div className="space-y-2">
                      <textarea
                        value={editTexto}
                        onChange={e => setEditTexto(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white/40"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelarEdicion}
                          className="text-xs px-3 py-1 rounded-md border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleEditar(p.id)}
                          disabled={guardando || !editTexto.trim()}
                          className="text-xs px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors flex items-center gap-1"
                        >
                          {guardando ? <Loader2 size={12} className="animate-spin" /> : null}
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo lectura
                    <div>
                      <p className="text-white/90 leading-relaxed">{p.texto}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/30">
                          {p.es_mia && <span className="text-emerald-400 mr-2">Tú</span>}
                          {formatFecha(p.created_at)}
                          {p.updated_at !== p.created_at && (
                            <span className="ml-1 text-white/20">(editada)</span>
                          )}
                        </span>
                        {p.es_mia && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => iniciarEdicion(p)}
                              className="text-white/40 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleBorrar(p.id)}
                              className="text-white/40 hover:text-red-400 transition-colors"
                              title="Borrar"
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
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

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
      setError("No se pudieron cargar las ponencias.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPonencias()
  }, [cargarPonencias])

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Ponencias</h2>
        </div>
        <p className="text-sm text-white/50">
          Haz tus preguntas a los ponentes. Puedes editarlas o borrarlas en cualquier momento.
        </p>
      </div>

      {/* Estados */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Cargando ponencias...</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10 space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={cargarPonencias}
            className="text-xs px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && ponencias.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <MessageSquarePlus size={32} className="mx-auto text-white/20" />
          <p className="text-sm text-white/40">
            Aún no hay ponencias disponibles.<br />Vuelve más tarde.
          </p>
        </div>
      )}

      {!loading && !error && ponencias.length > 0 && (
        <div className="space-y-3">
          {ponencias.map(p => (
            <PonenciaCard key={p.id} ponencia={p} />
          ))}
        </div>
      )}
    </div>
  )
}
