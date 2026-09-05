"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowRight, Brain, Sparkles, RefreshCw, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchUserSkills, fetchStudentSkills } from "@/lib/api/skills"
import Link from "next/link"
import { NaturalWorkflow } from "./NaturalWorkflow"
import { EleonorAIChat } from "../chat/EleonorAIChat"
import { API_BASE_URL } from "@/lib/config"

export function ResultsPage({ studentId }: { studentId?: number }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [skills, setSkills] = useState<any[]>([])
    const [mentorSkills, setMentorSkills] = useState<any[]>([])
    const [activeFeedbackNode, setActiveFeedbackNode] = useState<string | null>(null)

    const loadData = async () => {
        try {
            setLoading(true)
            const data = studentId
                ? await fetchStudentSkills(studentId)
                : await fetchUserSkills()
            console.log("Skills loaded for ResultsPage:", data)
            setSkills(data)

            // Load completed mentor exams to generate extra nodes
            if (!studentId) {
                const token = localStorage.getItem('eleonor_token')
                const base = API_BASE_URL
                const mResp = await fetch(`${base}/api/student/mentor-exams`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (mResp.ok) {
                    const exams = await mResp.json()
                    // Build synthetic skill nodes for completed exams
                    const mentorNodes = (Array.isArray(exams) ? exams : [])
                        .filter((e: any) => e.status === 'completed' || e.status === 'pending')
                        .map((e: any) => ({
                            id: `mentor_${e.id}`,
                            area: e.agent_name || e.title,
                            level: e.status === 'completed' ? (e.score ?? 90) : 40,
                            skill_xp: 0,
                            isMentorExam: true,
                            examTitle: e.title,
                            competencies: e.competencies || [],
                            last_updated: e.assigned_at || new Date().toISOString()
                        }))
                    setMentorSkills(mentorNodes)
                }
            }
        } catch (error) {
            console.error("Failed to load skills:", error)
            setError("No se pudieron cargar los resultados.")
        } finally {
            setLoading(false)
        }
    }

    // Initial load and refresh listener
    useEffect(() => {
        loadData()

        const handleRefresh = () => {
            console.log("🔄 Skills refresh event received");
            loadData();
        };

        window.addEventListener('refresh-skills', handleRefresh);
        return () => window.removeEventListener('refresh-skills', handleRefresh);
    }, [studentId])

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Cargando diagnóstico...</p>
            </div>
        )
    }

    if (skills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 min-h-[600px] text-center p-8">
                <AlertCircle className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-xl text-white font-bold mb-2">Sin datos de diagnóstico</h3>
                <p className="text-gray-400 mb-8 max-w-md text-sm">
                    No se han encontrado registros de evaluaciones recientes. Completa un diagnóstico para visualizar tu grafo de competencias.
                </p>
                <div className="flex gap-4">
                    <Button
                        onClick={loadData}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full"
        >
            <div className="flex justify-between items-center mb-6 px-4 md:px-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">
                        Resultados de Diagnóstico
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                            Sistema Sincronizado
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={loadData}
                    className="text-white/40 hover:text-white"
                >
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 min-h-[600px] relative">
                <NaturalWorkflow
                    skills={skills}
                    mentorSkills={mentorSkills}
                    onFeedbackRequest={(node) => setActiveFeedbackNode(node)}
                />
            </div>

            {/* Overlay de Eleonor Interaction */}
            <AnimatePresence>
                {activeFeedbackNode && (
                    <div className="fixed inset-0 z-[200] pointer-events-none">
                        <EleonorAIChat
                            variant="overlay"
                            initialMessage={{ type: 'analyze_node', node: activeFeedbackNode }}
                            onClose={() => setActiveFeedbackNode(null)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}