"use client"

import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/lib/config"
import {
  Plus, Trash2, Loader2, MessageSquarePlus,
  ChevronDown, ChevronUp, RefreshCw
} from "lucide-react"

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
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// ── Subcomponente: Preguntas de una ponencia (vista docente) ──────────────────

function PreguntasDocente({ ponencia }: { ponencia: Ponencia }) {
  const [expanded, setExpanded] = useState(false)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ponencias/${ponencia.id}/preguntas`,
        { headers: authHeaders() }
      )
      if (res.ok) setPreguntas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [ponencia.id])

  useEffect(() => {
    if (expanded) cargar()
  }, [expanded, cargar])

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{ponencia.titulo}</p>
          <p className="text-xs text-white/50">{ponencia.ponente}</p>
          {ponencia.descripcion && (
            <p className="text-xs text-white/40 mt-0.5 truncate">{ponencia.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <span className="text-xs text-white/30">{formatFecha(ponencia.created_at)}</span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50 font-medium">
              {preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={cargar}
              disabled={loading}
              className="text-white/40 hover:text-white transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-white/40" />
            </div>
          )}

          {!loading && preguntas.length === 0 && (
            <p className="text-xs text-white/30 text-center py-3">
              Sin preguntas todavía.
            </p>
          )}

          {!loading && preguntas.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {preguntas.map((p, i) => (
                <div key={p.id} className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-white/30 font-mono mt-0.5 flex-shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 leading-relaxed">{p.texto}</p>
                      <p className="text-xs text-white/30 mt-1">{formatFecha(p.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function PonenciasManagerPanel() {
  const [ponencias, setPonencias] = useState<Ponencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulario nueva ponencia
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [ponente, setPonente] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [creando, setCreando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Confirmación de eliminación
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  const cargarPonencias = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      setPonencias(await res.json())
    } catch {
      setError("No se pudieron cargar las ponencias.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarPonencias()
  }, [cargarPonencias])

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
        body: JSON.stringify({ titulo: t, ponente: p, descripcion: descripcion.trim() }),
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
      setMostrarForm(false)
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setCreando(false)
    }
  }

  const handleEliminar = async (id: string) => {
    setEliminandoId(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/ponencias/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      setPonencias(prev => prev.filter(p => p.id !== id))
    } catch {
      setError("No se pudo eliminar la ponencia.")
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={20} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Gestión de Ponencias</h2>
          </div>
          <p className="text-sm text-white/50">
            Crea y gestiona las ponencias. Los estudiantes podrán enviar preguntas desde su panel.
          </p>
        </div>
        <button
          onClick={() => { setMostrarForm(v => !v); setFormError(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors flex-shrink-0 ml-4"
        >
          <Plus size={15} />
          Nueva
        </button>
      </div>

      {/* Formulario nueva ponencia */}
      {mostrarForm && (
        <div className="border border-amber-500/30 bg-amber-900/10 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-amber-300">Nueva ponencia</p>

          <div className="space-y-2">
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Título de la ponencia *"
              maxLength={120}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <input
              type="text"
              value={ponente}
              onChange={e => setPonente(e.target.value)}
              placeholder="Nombre del ponente *"
              maxLength={80}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción breve (opcional)"
              maxLength={300}
              rows={2}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMostrarForm(false); setFormError(null) }}
              className="text-sm px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={creando || !titulo.trim() || !ponente.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
              {creando && <Loader2 size={14} className="animate-spin" />}
              Crear ponencia
            </button>
          </div>
        </div>
      )}

      {/* Error global */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Lista de ponencias */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : ponencias.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <MessageSquarePlus size={32} className="mx-auto text-white/20" />
          <p className="text-sm text-white/40">
            Aún no hay ponencias.<br />Crea la primera con el botón "Nueva".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ponencias.map(p => (
            <div key={p.id} className="group relative">
              <PreguntasDocente ponencia={p} />
              {/* Botón eliminar — aparece al hacer hover */}
              <button
                onClick={() => handleEliminar(p.id)}
                disabled={eliminandoId === p.id}
                className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-1 rounded"
                title="Desactivar ponencia"
              >
                {eliminandoId === p.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Trash2 size={14} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
