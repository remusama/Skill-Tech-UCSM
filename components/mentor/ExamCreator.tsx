"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, FileText, Users, Check, Plus, Trash2, ChevronRight, Send, X, ChevronDown } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface Agent {
  id: number
  name: string
  description: string
  competencies: string[]
  is_template: boolean
}

interface Student {
  id: number
  full_name: string
  username: string
}

interface Group {
  id: number
  name: string
  student_count: number
}

interface Question {
  question: string
  question_type: "text" | "multiple_choice"
  options: string[]  // Only for multiple_choice
  correct_answer?: string
  order: number
}

const STEPS = [
  { id: 1, label: "Agente", icon: Bot },
  { id: 2, label: "Examen", icon: FileText },
  { id: 3, label: "Preguntas", icon: Plus },
  { id: 4, label: "Asignar", icon: Users },
  { id: 5, label: "Publicar", icon: Send },
]

export const ExamCreator = () => {
  const [step, setStep] = useState(1)
  const [agents, setAgents] = useState<{ templates: Agent[], custom: Agent[] }>({ templates: [], custom: [] })
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  // Accordion state
  const [showTemplates, setShowTemplates] = useState(true)
  const [showCustom, setShowCustom] = useState(true)

  // Selections
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([{ question: "", question_type: "text", options: [], correct_answer: "", order: 0 }])
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [createdExamId, setCreatedExamId] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("eleonor_token")
    const fetchAll = async () => {
      try {
        const [agentsRes, studentsRes, groupsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/mentor/agents`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/mentor/students`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/mentor/groups`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (agentsRes.ok) setAgents(await agentsRes.json())
        if (studentsRes.ok) setStudents(await studentsRes.json())
        if (groupsRes.ok) setGroups(await groupsRes.json())
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const allAgents = [...agents.templates, ...agents.custom]

  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleGroupSelection = (id: number) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: "", question_type: "text", options: [], correct_answer: "", order: prev.length }])
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })))
  }

  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      if (field === "question_type" && value === "text") return { ...q, [field]: value, options: [], correct_answer: "" }
      return { ...q, [field]: value }
    }))
  }

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const newOpts = [...q.options, ""]
      const correct = q.correct_answer || "A"
      return { ...q, options: newOpts, correct_answer: correct }
    }))
  }

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = value
      return { ...q, options: opts }
    }))
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const newOpts = q.options.filter((_, j) => j !== oIdx)
      let correct = q.correct_answer || "A"
      const removedChar = String.fromCharCode(65 + oIdx)
      if (correct === removedChar) {
        correct = "A"
      } else if (correct > removedChar) {
        correct = String.fromCharCode(correct.charCodeAt(0) - 1)
      }
      return { ...q, options: newOpts, correct_answer: correct }
    }))
  }

  const handleCreateAndAssign = async () => {
    if (!selectedAgent || !title.trim()) return
    setPublishing(true)
    const token = localStorage.getItem("eleonor_token")

    try {
      const createRes = await fetch(`${API_BASE_URL}/api/mentor/exams`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          title,
          description,
          questions: questions
            .filter(q => q.question.trim())
            .map(q => ({
              question: q.question,
              question_type: q.question_type,
              options: q.question_type === "multiple_choice" ? q.options.filter(o => o.trim()) : [],
              correct_answer: q.question_type === "multiple_choice" ? (q.correct_answer || "A") : null,
              order: q.order
            }))
        })
      })

      if (!createRes.ok) throw new Error("Failed to create exam")
      const exam = await createRes.json()
      setCreatedExamId(exam.id)

      const assignRes = await fetch(`${API_BASE_URL}/api/mentor/exams/${exam.id}/assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: selectedStudentIds, group_ids: selectedGroupIds })
      })

      if (assignRes.ok) setPublished(true)
    } catch (err) {
      console.error("Error publishing exam:", err)
    } finally {
      setPublishing(false)
    }
  }

  const resetForm = () => {
    setStep(1); setSelectedAgent(null); setTitle(""); setDescription("")
    setQuestions([{ question: "", question_type: "text", options: [], correct_answer: "", order: 0 }])
    setSelectedStudentIds([]); setSelectedGroupIds([])
    setPublished(false); setCreatedExamId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: '#baef00' }}></div>
      </div>
    )
  }

  if (published) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-32 space-y-6"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(186, 239, 0, 0.15)' }}>
          <Check className="w-10 h-10" style={{ color: '#baef00' }} />
        </div>
        <h2 className="text-3xl font-black tracking-tight">¡Examen Publicado!</h2>
        <p className="text-gray-400 text-center max-w-sm">
          El examen <strong className="text-white">"{title}"</strong> fue asignado correctamente a los estudiantes seleccionados.
        </p>
        {selectedAgent && (
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedAgent.competencies.map(c => (
              <span key={c} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(186, 239, 0, 0.1)', border: '1px solid rgba(186, 239, 0, 0.3)', color: '#baef00' }}>{c}</span>
            ))}
          </div>
        )}
        <button onClick={resetForm} className="px-8 py-3 rounded-2xl text-black font-bold mt-4 shadow-lg" style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}>
          Crear otro examen
        </button>
      </motion.div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10">
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#baef00' }}>Panel del Mentor</span>
        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tighter mt-1">
          Crear Examen
        </h1>
        <p className="text-gray-400 mt-2 font-medium">Diseña evaluaciones y asígnalas a tus estudiantes.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isDone = step > s.id
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 flex-1 ${isActive ? "border" : isDone ? "border" : "bg-white/5 border border-white/5"}`}
                style={{
                  backgroundColor: isActive ? 'rgba(186, 239, 0, 0.15)' : isDone ? 'rgba(186, 239, 0, 0.08)' : undefined,
                  borderColor: isActive ? 'rgba(186, 239, 0, 0.4)' : isDone ? 'rgba(186, 239, 0, 0.2)' : undefined
                }}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive || isDone ? "text-black font-bold" : "bg-white/10 text-gray-400"}`}
                  style={{ backgroundColor: isActive || isDone ? '#baef00' : undefined }}
                >
                  {isDone ? <Check className="w-4 h-4 text-black" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-bold hidden sm:block`}
                  style={{ color: isActive ? '#baef00' : isDone ? '#cae13c' : '#889990' }}
                >{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-700 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Select Agent */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold">Selecciona un Agente</h2>
          <p className="text-gray-400 text-sm">El agente define las competencias que serán evaluadas en este examen.</p>
          
          <div className="space-y-4">
            {/* Base Agents Accordion */}
            <div className="border border-white/10 rounded-2xl overflow-hidden" style={{ backgroundColor: 'hsl(161, 40%, 15% / 0.4)' }}>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/15 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" style={{ color: '#baef00' }} />
                  <span className="font-bold text-sm text-gray-200">Agentes Base ({agents.templates.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showTemplates ? "transform rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {showTemplates && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 pt-2 space-y-3 overflow-hidden"
                  >
                    {agents.templates.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-2">No hay agentes base disponibles.</p>
                    ) : (
                      agents.templates.map(a => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAgent(a)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedAgent?.id === a.id ? "shadow-lg" : "bg-white/5 border-white/5 hover:border-white/15"}`}
                          style={{
                            backgroundColor: selectedAgent?.id === a.id ? 'rgba(186, 239, 0, 0.12)' : undefined,
                            borderColor: selectedAgent?.id === a.id ? 'rgba(186, 239, 0, 0.4)' : undefined,
                            boxShadow: selectedAgent?.id === a.id ? '0 0 15px rgba(186, 239, 0, 0.1)' : undefined
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(186, 239, 0, 0.15)', color: '#baef00' }}>
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">{a.name}</h4>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{a.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex flex-wrap gap-1">
                              {(a.competencies || []).slice(0, 2).map(c => (
                                <span key={c} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: 'rgba(186, 239, 0, 0.1)', color: '#baef00' }}>{c}</span>
                              ))}
                            </div>
                            {selectedAgent?.id === a.id && <Check className="w-4 h-4" style={{ color: '#baef00' }} />}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Custom Agents Accordion */}
            <div className="border border-white/10 rounded-2xl overflow-hidden" style={{ backgroundColor: 'hsl(161, 40%, 15% / 0.4)' }}>
              <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/15 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: '#cae13c' }} />
                  <span className="font-bold text-sm text-gray-200">Agentes Personalizados ({agents.custom.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showCustom ? "transform rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {showCustom && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 pt-2 space-y-3 overflow-hidden"
                  >
                    {agents.custom.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-2">No tienes agentes personalizados creados.</p>
                    ) : (
                      agents.custom.map(a => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAgent(a)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${selectedAgent?.id === a.id ? "shadow-lg" : "bg-white/5 border-white/5 hover:border-white/15"}`}
                          style={{
                            backgroundColor: selectedAgent?.id === a.id ? 'rgba(186, 239, 0, 0.12)' : undefined,
                            borderColor: selectedAgent?.id === a.id ? 'rgba(186, 239, 0, 0.4)' : undefined,
                            boxShadow: selectedAgent?.id === a.id ? '0 0 15px rgba(186, 239, 0, 0.1)' : undefined
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(202, 225, 60, 0.15)', color: '#cae13c' }}>
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">{a.name}</h4>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{a.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex flex-wrap gap-1">
                              {(a.competencies || []).slice(0, 2).map(c => (
                                <span key={c} className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: 'rgba(202, 225, 60, 0.1)', color: '#cae13c' }}>{c}</span>
                              ))}
                            </div>
                            {selectedAgent?.id === a.id && <Check className="w-4 h-4" style={{ color: '#baef00' }} />}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!selectedAgent}
              onClick={() => setStep(2)}
              className="px-8 py-3 disabled:opacity-40 rounded-2xl text-black font-bold transition-all shadow-lg"
              style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}
            >
              Continuar
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Exam Info */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold">Información del Examen</h2>
          {selectedAgent && (
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(186, 239, 0, 0.08)', border: '1px solid rgba(186, 239, 0, 0.2)' }}>
              <Bot className="w-5 h-5 flex-shrink-0" style={{ color: '#baef00' }} />
              <div>
                <p className="text-xs text-gray-400">Agente seleccionado</p>
                <p className="font-bold" style={{ color: '#baef00' }}>{selectedAgent.name}</p>
              </div>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {selectedAgent.competencies.map(c => <span key={c} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(186, 239, 0, 0.15)', color: '#baef00' }}>{c}</span>)}
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título del Examen *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Evaluación de Liderazgo - Julio 2026"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': '#baef00' } as any} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe el objetivo de esta evaluación..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all resize-none" style={{ '--tw-ring-color': '#baef00' } as any} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-medium transition-colors">Atrás</button>
            <button disabled={!title.trim()} onClick={() => setStep(3)} className="px-8 py-3 disabled:opacity-40 rounded-2xl text-black font-bold shadow-lg" style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}>Continuar</button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Questions */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold">Preguntas del Test</h2>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3" style={{ backgroundColor: 'hsl(161, 40%, 15% / 0.3)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-black text-xs font-black flex-shrink-0" style={{ backgroundColor: '#baef00' }}>{idx + 1}</span>
                  <input
                    value={q.question}
                    onChange={e => updateQuestion(idx, "question", e.target.value)}
                    placeholder="Escribe la pregunta..."
                    className="flex-1 bg-transparent focus:outline-none placeholder-gray-600 text-sm text-white"
                  />
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Question type selector */}
                <div className="flex gap-2 ml-10">
                  {(["text", "multiple_choice"] as const).map(type => (
                    <button key={type} onClick={() => updateQuestion(idx, "question_type", type)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${q.question_type === type ? "" : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10"}`}
                      style={q.question_type === type ? { backgroundColor: 'rgba(186, 239, 0, 0.2)', color: '#baef00', borderColor: 'rgba(186, 239, 0, 0.4)' } : undefined}
                    >
                      {type === "text" ? "Respuesta abierta" : "Opción múltiple"}
                    </button>
                  ))}
                </div>
                {/* Multiple choice options */}
                {q.question_type === "multiple_choice" && (
                  <div className="ml-10 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Opciones de respuesta (Selecciona una respuesta correcta)</p>
                    {q.options.map((opt, oIdx) => {
                      const optChar = String.fromCharCode(65 + oIdx)
                      const isCorrect = q.correct_answer === optChar
                      return (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">{optChar}</span>
                          <input
                            value={opt}
                            onChange={e => updateOption(idx, oIdx, e.target.value)}
                            placeholder={`Opción ${optChar}...`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 text-white" style={{ '--tw-ring-color': '#baef00' } as any}
                          />
                          {/* Correct Answer Switch */}
                          <button
                            type="button"
                            onClick={() => updateQuestion(idx, "correct_answer", optChar)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 flex-shrink-0 border ${isCorrect
                              ? ""
                              : "bg-white/5 text-gray-500 border-white/5 hover:border-white/15"
                            }`}
                            style={isCorrect ? { backgroundColor: 'rgba(186, 239, 0, 0.2)', color: '#baef00', borderColor: 'rgba(186, 239, 0, 0.4)' } : undefined}
                          >
                            <Check className={`w-3 h-3 ${isCorrect ? "opacity-100" : "opacity-30"}`} />
                            {isCorrect ? "Correcta" : "Marcar Correcta"}
                          </button>
                          <button onClick={() => removeOption(idx, oIdx)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                    {q.options.length < 5 && (
                      <button onClick={() => addOption(idx)}
                        className="flex items-center gap-1.5 text-xs transition-colors mt-1" style={{ color: '#baef00' }}>
                        <Plus className="w-3 h-3" /> Agregar opción
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={addQuestion} className="flex items-center gap-2 px-5 py-3 border border-dashed border-white/20 hover:border-white/40 rounded-2xl text-gray-400 transition-colors w-full justify-center">
            <Plus className="w-4 h-4" /> Agregar Pregunta
          </button>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(2)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-medium transition-colors">Atrás</button>
            <button onClick={() => setStep(4)} className="px-8 py-3 rounded-2xl text-black font-bold shadow-lg" style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}>Continuar</button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Assign */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold">Asignar Evaluación</h2>

          {groups.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Grupos</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {groups.map(g => {
                  const isSelected = selectedGroupIds.includes(g.id)
                  return (
                    <motion.div key={g.id} whileTap={{ scale: 0.98 }} onClick={() => toggleGroupSelection(g.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? "" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                      style={isSelected ? { backgroundColor: 'rgba(186, 239, 0, 0.12)', borderColor: 'rgba(186, 239, 0, 0.4)' } : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{g.name}</p>
                          <p className="text-xs text-gray-400">{g.student_count} estudiantes</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5" style={{ color: '#baef00' }} />}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Estudiantes Individuales</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {students.map(s => {
                const isSelected = selectedStudentIds.includes(s.id)
                return (
                  <motion.div key={s.id} whileTap={{ scale: 0.99 }} onClick={() => toggleStudentSelection(s.id)}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${isSelected ? "" : "bg-white/3 border-white/5 hover:border-white/15"}`}
                    style={isSelected ? { backgroundColor: 'rgba(186, 239, 0, 0.1)', borderColor: 'rgba(186, 239, 0, 0.3)' } : undefined}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "text-black" : "bg-white/10 text-gray-400"}`}
                      style={{ backgroundColor: isSelected ? '#baef00' : undefined }}
                    >
                      {s.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white">{s.full_name}</p>
                      <p className="text-xs text-gray-500">@{s.username}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#baef00' }} />}
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(3)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-medium transition-colors">Atrás</button>
            <button
              disabled={selectedStudentIds.length === 0 && selectedGroupIds.length === 0}
              onClick={() => setStep(5)}
              className="px-8 py-3 disabled:opacity-40 rounded-2xl text-black font-bold shadow-lg"
              style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}
            >
              Revisar y Publicar
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Review & Publish */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold">Resumen del Examen</h2>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-5" style={{ backgroundColor: 'hsl(161, 40%, 15% / 0.4)' }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Agente</p>
                <p className="font-bold" style={{ color: '#baef00' }}>{selectedAgent?.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedAgent?.competencies.map(c => <span key={c} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(186, 239, 0, 0.15)', color: '#baef00' }}>{c}</span>)}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Examen</p>
                <p className="font-bold text-white">{title}</p>
                {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
              </div>
            </div>
            <div className="border-t border-white/5 pt-4 grid sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-white">{questions.filter(q => q.question.trim()).length}</p>
                <p className="text-xs text-gray-500 mt-1">Preguntas</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{selectedStudentIds.length}</p>
                <p className="text-xs text-gray-500 mt-1">Estudiantes directos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{selectedGroupIds.length}</p>
                <p className="text-xs text-gray-500 mt-1">Grupos</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(4)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 font-medium transition-colors">Atrás</button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateAndAssign}
              disabled={publishing}
              className="flex items-center gap-2 px-8 py-3 disabled:opacity-50 rounded-2xl text-black font-bold shadow-lg"
              style={{ backgroundColor: '#baef00', boxShadow: '0 10px 25px -5px rgba(186, 239, 0, 0.3)' }}
            >
              <Send className="w-4 h-4" />
              {publishing ? "Publicando..." : "Publicar Examen"}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}