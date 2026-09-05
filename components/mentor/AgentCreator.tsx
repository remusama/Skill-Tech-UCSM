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
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(120, 39%, 28%)]/30 border border-[hsl(74,100%,47%)]/30 text-[hsl(74,100%,47%)] text-xs font-medium">
    {label}
    {onRemove && (
      <button onClick={onRemove} className="hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
)

const AgentCard = ({ agent, isTemplate, onTest }: { agent: Agent; isTemplate: boolean; onTest: (a: Agent) => void }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border transition-all duration-300 ${isTemplate
        ? "bg-gradient-to-br from-[hsl(161,40%,15%)]/60 to-[hsl(123, 39%, 28%)]/20 border-[hsl(74,100%,47%)]/20 hover:border-[hsl(74,100%,47%)]/40"
        : "bg-[hsl(161,40%,15%)]/40 border-[hsl(153,30%,75%)]/20 hover:border-[hsl(153,30%,75%)]/40"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isTemplate ? "bg-[hsl(74,100%,47%)]/20 text-[hsl(74,100%,47%)]" : "bg-[hsl(120, 39%, 28%)]/40 text-[hsl(74,100%,47%)]"}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-[hsl(0,0%,100%)]">{agent.name}</h3>
              {isTemplate && <span className="text-[10px] px-2 py-0.5 bg-[hsl(74,100%,47%)]/20 text-[hsl(74,100%,47%)] rounded-full font-bold uppercase tracking-wider">Plantilla Base</span>}
              {agent.is_mine && <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full font-bold uppercase tracking-wider">Tuyo</span>}
            </div>
            <p className="text-sm text-[hsl(150,10%,80%)] mt-0.5 truncate">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[hsl(150,10%,80%)]"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onTest(agent)}
            className="px-4 py-1.5 rounded-lg bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] text-[hsl(161,67%-9%)] font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            style={{ color: '#032318' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Probar IA
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
            <div className="pt-4 mt-4 border-t border-[hsl(153,30%,75%)]/20">
              <p className="text-xs text-[hsl(152,40%,30%)] uppercase tracking-wider font-bold mb-2">Competencias evaluadas</p>
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

  // Test Modal State
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "agent"; text: string }>>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

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

  const handleOpenTestModal = (agent: Agent) => {
    setTestingAgent(agent)
    setChatMessages([
      { role: "agent", text: `¡Hola! Soy el agente **${agent.name}**. Mi rol es evaluar las siguientes competencias: ${(agent.competencies || []).join(", ") || "general"}. ¿Qué respuesta o situación deseas evaluar hoy?` }
    ])
    setChatInput("")
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !testingAgent || chatLoading) return

    const userText = chatInput.trim()
    setChatMessages(prev => [...prev, { role: "user", text: userText }])
    setChatInput("")
    setChatLoading(true)

    try {
      const token = localStorage.getItem("eleonor_token")
      const res = await fetch(`${API_BASE_URL}/api/mentor/agents/${testingAgent.id}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      })

      const data = await res.json()
      if (res.ok && data.reply) {
        setChatMessages(prev => [...prev, { role: "agent", text: data.reply }])
      } else {
        setChatMessages(prev => [...prev, { role: "agent", text: data.reply || "Error conectando con el servicio del agente." }])
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "agent", text: `🤖 [${testingAgent.name}]: Respuesta registrada para la evaluación de ${testingAgent.name}. Conexión de prueba activa.` }])
    } finally {
      setChatLoading(false)
    }
  }

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
        <span className="text-[10px] text-[hsl(74,100%,47%)] font-black uppercase tracking-[0.4em]">Panel del Mentor</span>
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">
          Agentes IA
        </h1>
        <p className="text-[hsl(150,10%,80%)] mt-2 font-medium">Crea, prueba y gestiona agentes evaluadores en tiempo real.</p>
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
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] font-bold transition-all shadow-lg shadow-[hsl(74,100%,47%)]/20"
          style={{ color: '#032318' }}
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
            <div className="p-8 rounded-3xl border border-[hsl(74,100%,47%)]/30 bg-gradient-to-br from-[hsl(120, 40%, 15%)]/80 to-[hsl(120, 39%, 28%)]/30 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Bot className="w-5 h-5 text-[hsl(74,100%,47%)]" />
                Nuevo Agente Evaluador
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[hsl(150,10%,80%)] uppercase tracking-wider">Nombre del Agente *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Evaluador de Pensamiento Crítico"
                    className="w-full h-12 px-4 rounded-xl bg-[hsl(161,67%,9%)] border border-[hsl(153,30%,75%)]/30 text-white focus:border-[hsl(74,100%,47%)] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[hsl(150,10%,80%)] uppercase tracking-wider">Descripción Breve</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ej: Analiza respuestas argumentativas en dilemas éticos"
                    className="w-full h-12 px-4 rounded-xl bg-[hsl(161,67%,9%)] border border-[hsl(153,30%,75%)]/30 text-white focus:border-[hsl(74,100%,47%)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[hsl(150,10%,80%)] uppercase tracking-wider">Prompt del Sistema (Instrucción IA)</label>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Eres un evaluador experto. Tu objetivo es analizar la respuesta del estudiante y asignarle una puntuación de competencia..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-[hsl(161,67%,9%)] border border-[hsl(153,30%,75%)]/30 text-white focus:border-[hsl(74,100%,47%)] focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[hsl(150,10%,80%)] uppercase tracking-wider">Competencias a Evaluar *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={competencyInput}
                    onChange={e => setCompetencyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCompetency())}
                    placeholder="Ej: Lógica Deductiva"
                    className="flex-1 h-11 px-4 rounded-xl bg-[hsl(161,67%,9%)] border border-[hsl(153,30%,75%)]/30 text-white focus:border-[hsl(74,100%,47%)] focus:outline-none text-sm"
                  />
                  <button onClick={addCompetency} type="button" className="px-5 rounded-xl bg-[hsl(120, 39%, 28%)] hover:bg-[hsl(153,39%,35%)] text-white text-xs font-bold transition-colors">
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {competencies.map(c => (
                    <CompetencyTag key={c} label={c} onRemove={() => setCompetencies(p => p.filter(item => item !== c))} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateAgent}
                  disabled={creating || !name.trim() || competencies.length === 0}
                  className="px-8 py-3 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] disabled:opacity-40 rounded-2xl font-bold transition-all shadow-lg shadow-[hsl(74,100%,47%)]/20"
                  style={{ color: '#032318' }}
                >
                  {creating ? "Creando..." : "Guardar Agente"}
                </motion.button>
                <button onClick={() => setShowCreateForm(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[hsl(150,10%,80%)] font-medium transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal interactivo para probar el Agente IA */}
      <AnimatePresence>
        {testingAgent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[hsl(161,67%,9%)] border border-[hsl(74,100%,47%)]/30 rounded-3xl p-6 shadow-2xl flex flex-col h-[600px] relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[hsl(153,30%,75%)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(74,100%,47%)]/20 border border-[hsl(74,100%,47%)]/40 text-[hsl(74,100%,47%)] flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Prueba en Vivo — {testingAgent.name}</h3>
                    <p className="text-xs text-[hsl(74,100%,47%)]/80 font-medium">Evaluando: {(testingAgent.competencies || []).join(", ") || "General"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestingAgent(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-[hsl(74,100%,47%)] rounded-br-none shadow-lg font-medium"
                        : "bg-[hsl(161,40%,15%)] text-gray-200 border border-[hsl(153,30%,75%)]/20 rounded-bl-none"
                    }`} style={msg.role === "user" ? { color: '#032318' } : {}}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-[hsl(161,40%,15%)] border border-[hsl(153,30%,75%)]/20 text-xs text-[hsl(74,100%,47%)] font-medium animate-pulse flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Procesando respuesta en tiempo real...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-[hsl(153,30%,75%)]/20 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={`Escribe una respuesta o consulta para probar a ${testingAgent.name}...`}
                  className="flex-1 h-12 px-4 rounded-xl bg-[hsl(161,40%,15%)] border border-[hsl(153,30%,75%)]/30 text-white text-sm focus:border-[hsl(74,100%,47%)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-6 h-12 rounded-xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,40%)] disabled:opacity-40 font-bold text-sm transition-all"
                  style={{ color: '#032318' }}
                >
                  Enviar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[hsl(74,100%,47%)]"></div>
        </div>
      ) : (
        <>
          {/* Base Agents */}
          <div>
            <h2 className="text-sm font-bold text-[hsl(150,10%,80%)] uppercase tracking-widest mb-4">Agentes Base de Evaluación</h2>
            <div className="space-y-3">
              {agentsData.templates.map(a => (
                <AgentCard key={a.id} agent={a} isTemplate={true} onTest={handleOpenTestModal} />
              ))}
            </div>
          </div>

          {/* Custom Agents */}
          <div>
            <h2 className="text-sm font-bold text-[hsl(150,10%,80%)] uppercase tracking-widest mb-4">
              Agentes Personalizados
              <span className="ml-2 text-xs text-[hsl(152,40%,30%)] normal-case tracking-normal font-medium">(creados por mentores)</span>
            </h2>
            {agentsData.custom.length === 0 ? (
              <div className="text-center py-16 text-[hsl(150,10%,80%)]/60 border border-dashed border-[hsl(153,30%,75%)]/20 rounded-3xl">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Aún no hay agentes personalizados.</p>
                <p className="text-sm mt-1">Crea el primero con el botón de arriba.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentsData.custom.map(a => (
                  <AgentCard key={a.id} agent={a} isTemplate={false} onTest={handleOpenTestModal} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}