"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Sparkles, ChevronDown, ChevronUp, X, Check, Bot } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface Agent {
  id: number
  name: string
  description: string
  competencies: string[]
  is_template: boolean
  is_mine?: boolean
  system_prompt?: string
}

interface AgentsData {
  templates: Agent[]
  custom: Agent[]
}

const CompetencyTag = ({ label, onRemove }: { label: string; onRemove?: () => void }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium">
    {label}
    {onRemove && (
      <button onClick={onRemove} className="hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
)

const AgentCard = ({ agent, isTemplate, onSelect }: { agent: Agent; isTemplate: boolean; onSelect: (a: Agent) => void }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${isTemplate
        ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-400/40"
        : "bg-white/5 border-white/10 hover:border-white/20"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isTemplate ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base">{agent.name}</h3>
              {isTemplate && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-bold uppercase tracking-wider">Plantilla</span>}
              {agent.is_mine && <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-bold uppercase tracking-wider">Tuyo</span>}
            </div>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onSelect(agent)}
            className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-colors"
          >
            Usar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Competencias evaluadas</p>
              <div className="flex flex-wrap gap-2">
                {(agent.competencies || []).map(c => <CompetencyTag key={c} label={c} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const AgentCreator = () => {
  const [agentsData, setAgentsData] = useState<AgentsData>({ templates: [], custom: [] })
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [competencies, setCompetencies] = useState<string[]>([])
  const [competencyInput, setCompetencyInput] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchAgents = async () => {
    const token = localStorage.getItem("eleonor_token")
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setAgentsData(await res.json())
    } catch (err) {
      console.error("Error fetching agents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAgents() }, [])

  const addCompetency = () => {
    const trimmed = competencyInput.trim()
    if (trimmed && !competencies.includes(trimmed)) {
      setCompetencies(prev => [...prev, trimmed])
      setCompetencyInput("")
    }
  }

  const handleCreateAgent = async () => {
    if (!name.trim() || competencies.length === 0) return
    setCreating(true)
    const token = localStorage.getItem("eleonor_token")
    try {
      const res = await fetch(`${API_BASE_URL}/api/mentor/agents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, system_prompt: systemPrompt, competencies })
      })
      if (res.ok) {
        setSuccessMessage(`Agente "${name}" creado exitosamente.`)
        setName(""); setDescription(""); setSystemPrompt(""); setCompetencies([])
        setShowCreateForm(false)
        fetchAgents()
        setTimeout(() => setSuccessMessage(""), 4000)
      }
    } catch (err) {
      console.error("Error creating agent:", err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div>
        <span className="text-[10px] text-purple-500 font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">
          Agentes IA
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Crea y configura agentes evaluadores personalizados.</p>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-3 px-5 py-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Create button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateForm(s => !s)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Crear Agente
        </motion.button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Nuevo Agente Evaluador
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre *</label>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej: Evaluador de Liderazgo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</label>
                  <input
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="¿Qué evalúa este agente?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instrucciones / Personalidad del Agente</label>
                <textarea
                  value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe cómo debe evaluar este agente. Ej: 'Eres un evaluador experto en habilidades de liderazgo. Usa preguntas abiertas y evalúa con objetividad...'"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Competencias Evaluadas *</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={competencyInput} onChange={e => setCompetencyInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCompetency()}
                    placeholder="Ej: Liderazgo, Autonomía..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/30 transition-all"
                  />
                  <button onClick={addCompetency} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 rounded-xl text-purple-300 font-bold transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {competencies.map(c => (
                    <CompetencyTag key={c} label={c} onRemove={() => setCompetencies(prev => prev.filter(x => x !== c))} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateAgent}
                  disabled={creating || !name.trim() || competencies.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 rounded-2xl text-white font-bold transition-all shadow-lg shadow-purple-500/20"
                >
                  {creating ? "Creando..." : "Guardar Agente"}
                </motion.button>
                <button onClick={() => setShowCreateForm(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Base Agents */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Agentes Base</h2>
            <div className="space-y-3">
              {agentsData.templates.map(a => (
                <AgentCard key={a.id} agent={a} isTemplate={true} onSelect={() => {}} />
              ))}
            </div>
          </div>

          {/* Custom Agents */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Agentes Personalizados
              <span className="ml-2 text-xs text-gray-600 normal-case tracking-normal font-medium">(creados por mentores)</span>
            </h2>
            {agentsData.custom.length === 0 ? (
              <div className="text-center py-16 text-gray-600 border border-dashed border-white/10 rounded-3xl">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Aún no hay agentes personalizados.</p>
                <p className="text-sm mt-1">Crea el primero con el botón de arriba.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentsData.custom.map(a => (
                  <AgentCard key={a.id} agent={a} isTemplate={false} onSelect={() => {}} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
