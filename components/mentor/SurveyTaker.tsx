"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
type QuestionType = "text" | "multiple_choice" | "likert_5"
type MentorExamQuestion = {
    id: number
    question: string
    question_type: QuestionType
    options: { value: number; label: string }[] | string[] | []
    order: number
    dimension: string | null
}
type MentorExamData = {
    id: number
    title: string
    description: string | null
    questions: MentorExamQuestion[]
}
type AnswerValue = { value_numeric?: number; value_text?: string }
const LIKERT_LABELS: Record<number, string> = {
    1: "Totalmente en desacuerdo",
    2: "En desacuerdo",
    3: "Neutral",
    4: "De acuerdo",
    5: "Totalmente de acuerdo",
}
const DIMENSION_LABELS: Record<string, string> = {
    aprendizaje_aplicabilidad: "Aprendizaje y Aplicabilidad Práctica",
    metodologia_vivencial: "Metodología Vivencial e Inmersión",
    facilitacion_conduccion: "Facilitación y Conducción Experta",
    interaccion_social_networking: "Interacción Social y Networking",
}
type Demographics = {
    edad_rango?: string
    rol?: string
    participo_antes?: boolean
}
export function SurveyTaker({ examId, onCompleted }: { examId: number; onCompleted?: () => void }) {
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [exam, setExam] = useState<MentorExamData | null>(null)
    const [answers, setAnswers] = useState<Record<number, AnswerValue>>({})
    const [demographics, setDemographics] = useState<Demographics>({})
    const [showDemographics, setShowDemographics] = useState(true)
    const [submitted, setSubmitted] = useState(false)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
    const getToken = () =>
        typeof window !== "undefined" ? localStorage.getItem("eleonor_token") : null
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const token = getToken()
                const resp = await fetch(`${API_BASE_URL}/api/student/mentor-exams`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!resp.ok) throw new Error("No se pudo cargar la encuesta")
                const exams = await resp.json()
                const found = Array.isArray(exams) ? exams.find((e: any) => e.id === examId) : null
                if (!found) throw new Error("Encuesta no encontrada o no asignada a tu usuario")
                setExam(found)
                if (found.status === "completed") {
                    setSubmitted(true)
                }
            } catch (err: any) {
                setError(err.message || "Ocurrió un error al cargar la encuesta")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [examId])
    const likertQuestions = exam?.questions.filter(q => q.question_type === "likert_5") ?? []
    const openQuestions = exam?.questions.filter(q => q.question_type === "text") ?? []
    const groupedByDimension = likertQuestions.reduce<Record<string, MentorExamQuestion[]>>((acc, q) => {
        const key = q.dimension || "general"
        if (!acc[key]) acc[key] = []
        acc[key].push(q)
        return acc
    }, {})
    const setLikertAnswer = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: { value_numeric: value } }))
    }
    const setTextAnswer = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: { value_text: value } }))
    }
    const totalQuestions = (exam?.questions.length ?? 0)
    const answeredCount = Object.keys(answers).filter(qId => {
        const a = answers[Number(qId)]
        return a?.value_numeric !== undefined || (a?.value_text && a.value_text.trim().length > 0)
    }).length
    const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
    const handleSubmit = async () => {
        if (!exam) return
        const missing = exam.questions.filter(q => {
            const a = answers[q.id]
            if (q.question_type === "likert_5") return a?.value_numeric === undefined
            if (q.question_type === "text") return !a?.value_text || a.value_text.trim().length === 0
            return false
        })
        if (missing.length > 0) {
            setError(`Faltan ${missing.length} pregunta(s) por responder.`)
            return
        }
        try {
            setSubmitting(true)
            setError(null)
            const token = getToken()
            const payload = {
                answers: Object.entries(answers).map(([questionId, value]) => ({
                    question_id: Number(questionId),
                    ...value,
                })),
                demographics: Object.keys(demographics).length > 0 ? demographics : undefined,
            }
            const resp = await fetch(`${API_BASE_URL}/api/mentor/exams/${exam.id}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}))
                throw new Error(errBody.detail || "No se pudo enviar la encuesta")
            }
            setSubmitted(true)
            onCompleted?.()
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al enviar tus respuestas")
        } finally {
            setSubmitting(false)
        }
    }
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-70" />
                <p className="text-sm opacity-60">Cargando encuesta...</p>
            </div>
        )
    }
    if (error && !exam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-white text-sm">{error}</p>
            </div>
        )
    }
    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center p-8"
            >
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">¡Gracias por responder!</h3>
                <p className="text-gray-400 text-sm max-w-md">
                    Tus respuestas fueron registradas correctamente.
                </p>
            </motion.div>
        )
    }
    if (!exam) return null
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 text-white">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
                {exam.description && (
                    <p className="text-sm text-gray-400 leading-relaxed">{exam.description}</p>
                )}
            </div>
            <div className="mb-8 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progreso</span>
                    <span>{answeredCount} / {totalQuestions}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
            {showDemographics && (
                <Card className="p-5 mb-8 bg-white/5 border-white/10">
                    <h3 className="text-sm font-semibold mb-4 opacity-80">Datos generales</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">Edad</Label>
                            <Select onValueChange={v => setDemographics(prev => ({ ...prev, edad_rango: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un rango" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="18-25">18-25</SelectItem>
                                    <SelectItem value="26-35">26-35</SelectItem>
                                    <SelectItem value="36-45">36-45</SelectItem>
                                    <SelectItem value="46+">46 a más</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">Rol / Perfil profesional</Label>
                            <input
                                type="text"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder="Ej: Analista de RRHH"
                                onChange={e => setDemographics(prev => ({ ...prev, rol: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-xs text-gray-400 mb-1.5 block">
                                ¿Ha participado antes en cursos o eventos vivenciales similares?
                            </Label>
                            <RadioGroup
                                className="flex gap-6 mt-1"
                                onValueChange={v => setDemographics(prev => ({ ...prev, participo_antes: v === "si" }))}
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="si" id="participo-si" />
                                    <Label htmlFor="participo-si" className="text-sm font-normal">Sí</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="no" id="participo-no" />
                                    <Label htmlFor="participo-no" className="text-sm font-normal">No</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </Card>
            )}
            {Object.entries(groupedByDimension).map(([dimension, questions]) => (
                <div key={dimension} className="mb-8">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/80 mb-4">
                        {DIMENSION_LABELS[dimension] || dimension}
                    </h3>
                    <div className="space-y-6">
                        {questions.map(q => (
                            <Card key={q.id} className="p-5 bg-white/5 border-white/10">
                                <p className="text-sm mb-4 leading-relaxed">{q.question}</p>
                                <RadioGroup
                                    className="flex flex-wrap gap-x-6 gap-y-3"
                                    value={answers[q.id]?.value_numeric?.toString() ?? ""}
                                    onValueChange={v => setLikertAnswer(q.id, Number(v))}
                                >
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <div key={val} className="flex items-center gap-2">
                                            <RadioGroupItem value={val.toString()} id={`q${q.id}-${val}`} />
                                            <Label htmlFor={`q${q.id}-${val}`} className="text-xs font-normal text-gray-300">
                                                {LIKERT_LABELS[val]}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
            {openQuestions.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/80 mb-4">
                        Preguntas abiertas
                    </h3>
                    <div className="space-y-6">
                        {openQuestions.map(q => (
                            <Card key={q.id} className="p-5 bg-white/5 border-white/10">
                                <p className="text-sm mb-3 leading-relaxed">{q.question}</p>
                                <Textarea
                                    placeholder="Escribe tu respuesta aquí..."
                                    value={answers[q.id]?.value_text ?? ""}
                                    onChange={e => setTextAnswer(q.id, e.target.value)}
                                    className="min-h-[100px] bg-white/5 border-white/10"
                                />
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm mb-4 flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" /> {error}
                    </motion.p>
                )}
            </AnimatePresence>
            <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
                size="lg"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                    </>
                ) : (
                    "Enviar respuestas"
                )}
            </Button>
        </div>
    )
}
