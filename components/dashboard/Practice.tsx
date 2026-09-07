"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Microscope, Calculator, BookMarked, Code, Stethoscope, BrainCircuit,
    FileText, BookOpen, Award, Clock, Calendar, ChevronRight, Play, Info,
    Zap, Lightbulb, Scale, RefreshCw, User, Brain
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuizInterface } from "../quiz/QuizInterface"
import { LewinLeadershipTest } from "../quiz/LewinLeadershipTest"
import { NeoPiRTest } from "../quiz/NeoPiRTest"
import { CepvSurvey } from "../quiz/CepvSurvey"
import { getRandomQuestions } from "../quiz/QuizData"
import { cn } from "@/lib/utils"
import { JourneyVisualizer } from "./JourneyVisualizer"

import { academicAreas, personalAreas } from "@/lib/data/courseData"

const allAreas = [...academicAreas, ...personalAreas]

// --- TEMAS ADAPTATIVOS (Contraste corregido para Light / Dark) ---
const THEMES: Record<string, { color: string, textColor: string, badge: string, tab: string, via: string }> = {
    ciencias: {
        color: "from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-500",
        textColor: "text-emerald-800 dark:text-emerald-400",
        badge: "text-emerald-900 bg-emerald-500/15 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
        tab: "bg-emerald-600 dark:bg-emerald-500",
        via: "via-emerald-500 dark:via-emerald-400"
    },
    matematicas: {
        color: "from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500",
        textColor: "text-blue-800 dark:text-blue-400",
        badge: "text-blue-900 bg-blue-500/15 border-blue-500/30 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20",
        tab: "bg-blue-600 dark:bg-blue-500",
        via: "via-blue-500 dark:via-blue-400"
    },
    humanidades: {
        color: "from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-500",
        textColor: "text-amber-800 dark:text-amber-400",
        badge: "text-amber-900 bg-amber-500/15 border-amber-500/30 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
        tab: "bg-amber-600 dark:bg-amber-500",
        via: "via-amber-500 dark:via-amber-400"
    },
    ingenieria: {
        color: "from-cyan-600 to-blue-700 dark:from-cyan-400 dark:to-blue-600",
        textColor: "text-cyan-800 dark:text-cyan-400",
        badge: "text-cyan-900 bg-cyan-500/15 border-cyan-500/30 dark:text-cyan-400 dark:bg-cyan-400/10 dark:border-cyan-400/20",
        tab: "bg-cyan-600 dark:bg-cyan-500",
        via: "via-cyan-500 dark:via-cyan-400"
    },
    medicina: {
        color: "from-rose-600 to-red-700 dark:from-rose-400 dark:to-red-600",
        textColor: "text-rose-800 dark:text-rose-400",
        badge: "text-rose-900 bg-rose-500/15 border-rose-500/30 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20",
        tab: "bg-rose-600 dark:bg-rose-500",
        via: "via-rose-500 dark:via-rose-400"
    },
    razonamiento: {
        color: "from-amber-600 to-orange-600 dark:from-yellow-400 dark:to-orange-500",
        textColor: "text-amber-800 dark:text-yellow-400",
        badge: "text-amber-900 bg-amber-500/15 border-amber-500/30 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20",
        tab: "bg-amber-600 dark:bg-yellow-500",
        via: "via-amber-500 dark:via-yellow-400"
    },
    aprendizaje: {
        color: "from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-600",
        textColor: "text-green-800 dark:text-green-400",
        badge: "text-green-900 bg-green-500/15 border-green-500/30 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/20",
        tab: "bg-green-600 dark:bg-green-500",
        via: "via-green-500 dark:via-green-400"
    },
    criterio: {
        color: "from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-600",
        textColor: "text-blue-800 dark:text-blue-400",
        badge: "text-blue-900 bg-blue-500/15 border-blue-500/30 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20",
        tab: "bg-blue-600 dark:bg-blue-500",
        via: "via-blue-500 dark:via-blue-400"
    },
    adaptabilidad: {
        color: "from-purple-600 to-pink-700 dark:from-purple-400 dark:to-pink-600",
        textColor: "text-purple-800 dark:text-purple-400",
        badge: "text-purple-900 bg-purple-500/15 border-purple-500/30 dark:text-purple-400 dark:bg-purple-400/10 dark:border-purple-400/20",
        tab: "bg-purple-600 dark:bg-purple-500",
        via: "via-purple-500 dark:via-purple-400"
    },
    autonomia: {
        color: "from-rose-600 to-red-700 dark:from-rose-400 dark:to-red-600",
        textColor: "text-rose-800 dark:text-rose-400",
        badge: "text-rose-900 bg-rose-500/15 border-rose-500/30 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20",
        tab: "bg-rose-600 dark:bg-rose-500",
        via: "via-rose-500 dark:via-rose-400"
    },
    psicometria: {
        color: "from-[#82610d] to-[#54400c] dark:from-[#d0b04d] dark:to-[#997a23]",
        textColor: "text-[#694d07] dark:text-[#d0b04d]",
        badge: "text-[#4a3604] bg-[#b89530]/20 border-[#b89530]/40 dark:text-[#d0b04d] dark:bg-[#d0b04d]/10 dark:border-[#d0b04d]/20",
        tab: "bg-[#82610d] dark:bg-[#d0b04d]",
        via: "via-[#82610d] dark:via-[#d0b04d]"
    },
    expectativas: {
        color: "from-[#444444] to-[#1c2e0e] dark:from-[#c7c7c7] dark:to-[#3c5a21]",
        textColor: "text-[#111111] dark:text-[#c7c7c7]",
        badge: "text-[#111e07] bg-[#273d15]/20 border-[#555555]/40 dark:text-[#3c5a21] dark:bg-[#3c5a21]/10 dark:border-[#c7c7c7]/20",
        tab: "bg-[#333333] dark:bg-[#3c5a21]",
        via: "via-[#333333] dark:via-[#3c5a21]"
    }
};

export function Practice({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const [activeCategory, setActiveCategory] = useState<'academica' | 'personal' | 'mentoria'>('mentoria')
    const [mentorExams, setMentorExams] = useState<any[]>([])
    const [loadingMentorExams, setLoadingMentorExams] = useState(false)
    
    const [selectedTab, setSelectedTab] = useState<'examenes' | 'practicas' | 'escenarios'>("examenes")
    
    const [selectedArea, setSelectedArea] = useState("ciencias")
    const [showNotification, setShowNotification] = useState(false)
    const [activeExam, setActiveExam] = useState<any>(null)
    const [examResults, setExamResults] = useState<any>(null)
    const [highlightedAreas, setHighlightedAreas] = useState<string[]>([])

    const currentAreas = activeCategory === 'academica' ? academicAreas : personalAreas
    const modulesRef = useRef<HTMLDivElement>(null)
    const practiceContainerRef = useRef<HTMLDivElement>(null)
    const topAnchorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleScrollModules = () => {
            setTimeout(() => {
                modulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                const scrollContainers = [
                    document.documentElement,
                    document.body,
                    document.querySelector('main'),
                    document.querySelector('.overflow-y-auto'),
                    document.querySelector('[data-practice-container]')
                ];
                scrollContainers.forEach(container => {
                    if (container && container !== modulesRef.current) {
                        const rect = modulesRef.current?.getBoundingClientRect();
                        if (rect) {
                            container.scrollTo({
                                top: container.scrollTop + rect.top - 80,
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            }, 300)
        }
        const handleScrollTop = () => {
            setTimeout(() => {
                if (topAnchorRef.current) {
                    topAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 200)
        }
        const handleShowAcademic = () => setActiveCategory('academica')
        const handleShowPersonal = () => setActiveCategory('personal')
        const handleHighlightCourses = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setHighlightedAreas(detail?.courses || [])
        }

        window.addEventListener('onboarding-scroll-modules', handleScrollModules)
        window.addEventListener('onboarding-scroll-top', handleScrollTop)
        window.addEventListener('onboarding-show-academic', handleShowAcademic)
        window.addEventListener('onboarding-show-personal', handleShowPersonal)
        window.addEventListener('onboarding-highlight-courses', handleHighlightCourses)

        return () => {
            window.removeEventListener('onboarding-scroll-modules', handleScrollModules)
            window.removeEventListener('onboarding-scroll-top', handleScrollTop)
            window.removeEventListener('onboarding-show-academic', handleShowAcademic)
            window.removeEventListener('onboarding-show-personal', handleShowPersonal)
            window.removeEventListener('onboarding-highlight-courses', handleHighlightCourses)
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem('eleonor_token')
        if (!token) return
        setLoadingMentorExams(true)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student/mentor-exams`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
            setMentorExams(Array.isArray(data) ? data : [])
        }).catch(() => {}).finally(() => setLoadingMentorExams(false))
    }, [])

    useEffect(() => {
        if (currentAreas.length === 0) return
        if (!currentAreas.find(a => a.id === selectedArea)) {
            setSelectedArea(currentAreas[0].id)
        }
    }, [activeCategory, currentAreas, selectedArea])

    const currentArea = useMemo(() => {
        if (currentAreas.length === 0) return null
        return allAreas.find(a => a.id === selectedArea) || currentAreas[0]
    }, [selectedArea, currentAreas])

    const theme = (currentArea ? THEMES[currentArea.id] : THEMES.psicometria) || THEMES.psicometria

    const handleStartExam = (exam: any) => {
        if (!currentArea) return;
        if (currentArea.id === "psicometria" || exam.disabled || exam.status?.includes("trabajando")) {
            return
        }
        if (currentArea.id === "expectativas" && exam.id === "cepv-20") {
            setActiveExam({ ...exam, areaName: currentArea.name, isCepv: true })
            return
        }
        const questions = getRandomQuestions(currentArea.id, exam.title, exam.questions)
        setActiveExam({ ...exam, questions, areaName: currentArea.name })
    }

    const handleCompleteExam = (results: any) => {
        setExamResults(results)
    }

    const handleFinishQuiz = () => {
        setActiveExam(null)
        setExamResults(null)
        if (onNavigate) onNavigate('diagnosis')
    }

    const handleCancelExam = () => {
        setActiveExam(null)
        setExamResults(null)
    }

    const handleStartMentorExam = (exam: any) => {
        const questions = (exam.questions || []).map((q: any, i: number) => ({
            id: i + 1,
            text: q.question,
            type: q.question_type === 'multiple_choice' ? 'multiple-choice' : 'open-ended',
            options: q.question_type === 'multiple_choice'
                ? (q.options || []).map((opt: string, j: number) => ({ id: String.fromCharCode(65 + j), text: opt }))
                : [],
            correctAnswer: q.correct_answer || '',
            skill: exam.agent_name || 'Habilidades'
        }))

        let initialAnswers = {}
        let initialIndex = 0
        let initialTime = 600

        const saved = localStorage.getItem(`mentor_exam_progress_${exam.id}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                initialAnswers = parsed.answers || {}
                initialIndex = parsed.currentQuestionIndex || 0
                initialTime = parsed.timeRemaining || 600
            } catch (e) {
                console.error("Error loading saved exam progress:", e)
            }
        }

        setActiveExam({
            ...exam,
            questions,
            areaName: exam.agent_name || 'Mentoría',
            initialAnswers,
            initialIndex,
            initialTime
        })
    }

    if (activeExam) {
        if ((activeExam as any).isCepv) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0121] overflow-auto">
                    <CepvSurvey onExit={handleCancelExam} />
                </motion.div>
            )
        }
        if ((activeExam as any).isLewin) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0121] overflow-auto">
                    <LewinLeadershipTest onExit={handleCancelExam} onComplete={() => {}} />
                </motion.div>
            )
        }
        if ((activeExam as any).isNeo) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0121] overflow-auto">
                    <NeoPiRTest onExit={handleCancelExam} />
                </motion.div>
            )
        }
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0B0121]"
            >
                <QuizInterface
                    title={activeExam.title}
                    area={activeExam.areaName || activeExam.area}
                    questions={activeExam.questions || []}
                    duration={activeExam.initialTime || 600}
                    initialAnswers={activeExam.initialAnswers}
                    initialIndex={activeExam.initialIndex}
                    examId={activeExam.id}
                    onComplete={(score, answers) => {
                        localStorage.removeItem(`mentor_exam_progress_${activeExam.id}`)
                        handleCompleteExam({ score, answers })
                    }}
                    onExit={handleCancelExam}
                    onExploreMap={() => onNavigate?.("diagnosis")}
                />
            </motion.div>
        )
    }

    return (
        <div ref={practiceContainerRef} id="practice-scroll-container" className="relative min-h-screen text-slate-900 dark:text-white overflow-y-auto overflow-x-hidden font-sans flex flex-col pt-6">
            <div ref={topAnchorRef} className="absolute top-0 left-0 w-0 h-0" aria-hidden />

            {/* TOP HEADER CON CORRECCIÓN DE VISIBILIDAD */}
            <div className="w-full max-w-7xl mx-auto px-6 mb-2 relative z-50 pl-20 md:pl-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 md:h-12 rounded-full bg-gradient-to-b from-[#82610d] to-[#4e6300] dark:from-[#d0b04d] dark:to-[#baef00] drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(213,174,87,0.5)]" />
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                        Mentoría
                    </h1>
                </div>
                <p className="text-[9px] md:text-xs font-black tracking-[0.3em] mt-2 uppercase ml-4 md:ml-5 text-[#82610d] dark:text-[#d0b04d]">
                    MÓDULO DE EVALUACIONES Y DIAGNÓSTICO
                </p>
            </div>

            <div className="w-full max-w-7xl mx-auto px-6 flex flex-col gap-6 flex-1">
                {/* BOTONES DE CATEGORÍA CON TEXTO VISIBLE EN MODO CLARO */}
                <div className="flex gap-2 p-1.5 bg-slate-200/90 dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 rounded-2xl w-fit">
                    {(["mentoria", "personal"] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeCategory === cat 
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" 
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            )}
                        >
                            {cat === "mentoria" ? "Mentoría" : "Personal"}
                        </button>
                    ))}
                </div>

                {activeCategory !== 'mentoria' && (
                    <div className="flex gap-4 overflow-x-auto px-4 w-full custom-scrollbar pb-2 flex-nowrap scroll-smooth bg-slate-200/50 dark:bg-white/[0.03] rounded-2xl border border-slate-300/80 dark:border-white/5 p-3">
                        {currentAreas.map(area => {
                            const isActive = selectedArea === area.id
                            const areaTheme = THEMES[area.id] || THEMES.ciencias
                            return (
                                <button
                                    key={area.id}
                                    onClick={() => setSelectedArea(area.id)}
                                    className={cn(
                                        "group flex flex-col items-center gap-2 min-w-[90px] p-2 rounded-xl transition-all duration-300 relative shrink-0",
                                        isActive 
                                            ? "bg-white dark:bg-white/5 shadow-md dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] scale-105" 
                                            : "hover:bg-slate-300/50 dark:hover:bg-white/5 opacity-80 dark:opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full transition-all duration-300",
                                        isActive ? "bg-slate-100 dark:bg-gradient-to-br dark:from-white/10 dark:to-transparent border border-slate-200 dark:border-white/20" : "bg-transparent"
                                    )}>
                                        <area.icon className={cn("w-6 h-6 transition-all duration-300",
                                            isActive ? areaTheme.textColor : "text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-widest uppercase transition-colors whitespace-nowrap",
                                        isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-gray-400"
                                    )}>
                                        {area.name}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabBottom"
                                            className={cn("absolute bottom-0 w-1/2 h-0.5 rounded-full bg-gradient-to-r", areaTheme.color)}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}

                {activeCategory !== 'mentoria' && (
                    <div className="flex gap-2 overflow-x-auto w-full px-1 py-1 custom-scrollbar md:justify-start md:gap-4 mb-4 flex-nowrap shrink-0 scroll-smooth">
                        {[
                            { id: 'examenes', name: 'Evaluaciones', icon: Award },
                            { id: 'practicas', name: 'Prácticas', icon: BookOpen },
                            { id: 'escenarios', name: 'Escenarios', icon: BrainCircuit }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id as 'examenes' | 'practicas' | 'escenarios')}
                                className={cn(
                                    "px-4 md:px-5 py-2.5 rounded-lg text-[10px] md:text-xs font-bold tracking-wider flex items-center gap-2 transition-all shrink-0 whitespace-nowrap",
                                    selectedTab === tab.id
                                        ? cn("text-white shadow-lg", theme.tab)
                                        : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span className="uppercase">{tab.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* SUBTÍTULO Y LISTADO CON TEXTO CORREGIDO PARA MODO CLARO */}
                {activeCategory === 'mentoria' && (
                    <div className="flex-1 overflow-y-auto pb-20 space-y-4 pr-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#82610d] to-[#4e6300] dark:from-[#d0b04d] dark:to-[#baef00]" />
                            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                Exámenes de Mentoría
                            </h2>
                        </div>
                        {loadingMentorExams ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600 dark:border-[#0d971f]"></div>
                            </div>
                        ) : mentorExams.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-slate-100/50 dark:bg-transparent">
                                <FileText className="w-10 h-10 mb-3 text-slate-500 dark:text-gray-400" />
                                <p className="font-bold text-slate-900 dark:text-gray-200">No tienes exámenes de mentoría asignados.</p>
                                <p className="text-sm mt-1 text-slate-600 dark:text-gray-400">Tu mentor te asignará evaluaciones cuando estén disponibles.</p>
                            </div>
                        ) : (
                            mentorExams.map((exam: any) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative h-full"
                                >
                                    {highlightedAreas.some(h => (currentArea?.id || '').includes(h) || exam.title.toLowerCase().includes(h)) && (
                                        <div className="absolute -inset-1 rounded-[2.2rem] border-2 border-cyan-500 dark:border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.3)] dark:shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse z-10 pointer-events-none" />
                                    )}
                                    <div className="h-full bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/80 dark:hover:bg-white/[0.05] hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                                        <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity", theme.via)} />

                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        exam.status === 'completed' 
                                                            ? "bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-400" 
                                                            : "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                    )}>
                                                        {exam.status === 'completed' ? 'Completado' : 'Pendiente'}
                                                    </span>
                                                    <span className="text-xs text-slate-700 dark:text-gray-400">Agente: {exam.agent_name}</span>
                                                </div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white">{exam.title}</h3>
                                                {exam.description && <p className="text-sm text-slate-800 dark:text-gray-300 mt-1">{exam.description}</p>}
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {(exam.competencies || []).map((c: string) => (
                                                        <span key={c} className="px-2 py-0.5 bg-slate-200/70 dark:bg-white/5 text-slate-800 dark:text-gray-300 border border-slate-300 dark:border-transparent rounded-full text-xs">{c}</span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-gray-400 mt-2">{exam.questions?.length || 0} preguntas</p>
                                            </div>
                                            {exam.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleStartMentorExam(exam)}
                                                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl font-bold text-sm shadow-md transition-all">
                                                    <Play className="w-4 h-4 fill-current" />
                                                    Iniciar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
                
                {activeCategory !== 'mentoria' && (
                    <div ref={modulesRef} data-practice-container className="flex-1 overflow-y-auto pb-20 custom-scrollbar pr-2">
                        {currentAreas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-transparent">
                                <FileText className="w-10 h-10 mb-3 text-slate-500 opacity-60" />
                                <p className="font-bold text-slate-900 dark:text-gray-300">Sección vacía</p>
                                <p className="text-sm mt-1 text-slate-600 dark:text-gray-400">No hay exámenes disponibles en esta sección.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {selectedTab === 'examenes' && (
                                    <motion.div
                                        key="examenes"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        {currentArea?.exams.map((exam: any, i: number) => (
                                            <motion.div
                                                key={exam.id}
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group relative h-full"
                                            >
                                                {highlightedAreas.some(h => currentArea.id.includes(h) || exam.title.toLowerCase().includes(h)) && (
                                                    <div className="absolute -inset-1 rounded-[2.2rem] border-2 border-cyan-500 dark:border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.3)] dark:shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-pulse z-10 pointer-events-none" />
                                                )}

                                                <div className="h-full bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 relative overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/80 dark:hover:bg-white/[0.05] hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] flex flex-col justify-between">
                                                    <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity", theme.via)} />

                                                    <div>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-[10px] uppercase font-black tracking-[0.2em] mb-1", theme.textColor)}>
                                                                    Módulo 0{i + 1}
                                                                </span>
                                                                <Badge variant="outline" className={cn("border-0 font-bold text-[10px] px-2 py-0.5 backdrop-blur-md rounded-md",
                                                                    (currentArea?.id === "psicometria" || exam.disabled)
                                                                        ? 'text-amber-900 bg-amber-200 dark:text-amber-300 dark:bg-amber-500/20 border border-amber-500/30'
                                                                        : exam.status === 'Disponible' 
                                                                            ? 'text-emerald-900 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-400/10' 
                                                                            : 'text-slate-700 bg-slate-200/80 dark:text-gray-500 dark:bg-black/40'
                                                                )}>
                                                                    {(currentArea?.id === "psicometria" || exam.disabled) ? '(Ingenieros trabajando)' : exam.status === 'Disponible' ? '● ONLINE' : '○ OFFLINE'}
                                                                </Badge>
                                                            </div>
                                                            <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
                                                                {currentArea?.icon && <currentArea.icon className={cn("w-5 h-5 transition-colors", theme.textColor)} />}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white leading-tight group-hover:opacity-80 transition-opacity line-clamp-2">
                                                            {exam.title}
                                                        </h3>
                                                        <div className="text-xs text-slate-700 dark:text-gray-400 mb-6 font-medium flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-slate-500 dark:bg-gray-500" />
                                                            {exam.professor || "Evaluación oficial"}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 mt-auto">
                                                        <div className="bg-slate-100 dark:bg-black/30 rounded-xl p-3 grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] border border-slate-200 dark:border-transparent">
                                                            <div>
                                                                <span className="text-slate-600 dark:text-gray-500 block mb-0.5 uppercase tracking-wider">Duración</span>
                                                                <span className="text-slate-900 dark:text-white font-mono flex items-center gap-1 font-bold">
                                                                    <Clock className={cn("w-3 h-3", theme.textColor)} /> {exam.duration || "10 min"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600 dark:text-gray-500 block mb-0.5 uppercase tracking-wider">Items</span>
                                                                <span className="text-slate-900 dark:text-white font-mono flex items-center gap-1 font-bold">
                                                                    <BrainCircuit className={cn("w-3 h-3", theme.textColor)} /> {exam.questions || 10}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-white/5 mt-1">
                                                                <div className="flex justify-between mb-1">
                                                                    <span className="text-slate-600 dark:text-gray-500 uppercase tracking-wider">Complejidad</span>
                                                                    <span className="text-slate-900 dark:text-white font-mono font-bold">{exam.difficulty || 50}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn("h-full bg-gradient-to-r", theme.color)}
                                                                        style={{ width: `${exam.difficulty || 50}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(currentArea?.id === "psicometria" || exam.disabled) ? (
                                                            <Button
                                                                disabled
                                                                className="w-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold tracking-wide py-5 rounded-xl cursor-not-allowed opacity-80"
                                                            >
                                                                (Ingenieros trabajando)
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleStartExam(exam)}
                                                                className={cn("w-full text-white font-bold tracking-wide border-0 py-5 rounded-xl shadow-lg transition-all group-hover:scale-[1.02] bg-gradient-to-r hover:brightness-110", theme.color)}
                                                            >
                                                                <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                                                                INICIAR
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {selectedTab === 'practicas' && (
                                    <motion.div
                                        key="practicas"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <JourneyVisualizer
                                            areaId={currentArea!.id}
                                            areaName={currentArea!.name}
                                            theme={theme}
                                        />
                                    </motion.div>
                                )}

                                {selectedTab === 'escenarios' && (
                                    <motion.div
                                        key="escenarios"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center h-[50vh]"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 relative">
                                            <div className={cn("absolute inset-0 border rounded-full animate-ping opacity-20", theme.textColor.replace('text-', 'border-'))} />
                                            <Info className={cn("w-10 h-10", theme.textColor)} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-wide uppercase">Sección {selectedTab}</h3>
                                        <p className="text-slate-600 dark:text-gray-400 text-center max-w-sm text-sm">
                                            Estamos calibrando los algoritmos de esta sección para ofrecerte el mejor entrenamiento personalizado.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                )}
            </div>

            {showNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl shadow-2xl font-bold z-[100]"
                >
                    ¡Acción registrada correctamente!
                </motion.div>
            )}
        </div>
    )
}