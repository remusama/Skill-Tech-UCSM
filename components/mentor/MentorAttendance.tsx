"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calendar, Users, Clock, QrCode, Rss, Plus, Check, X,
    ChevronRight, ArrowLeft, BarChart3, AlertTriangle, Play,
    Volume2, VolumeX, Search, RefreshCw, Smartphone
} from "lucide-react"
import { API_URL } from "@/lib/config"
import { MagicCard } from "@/components/ui/magic-card"
import { MagicTitle } from "@/components/ui/magic-title"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    fetchMentorClasses, fetchClassDetails, createClass, scanAttendance,
    fetchStudentAttendanceStats, AttendanceClass, AttendanceRecord
} from "@/lib/api/attendance"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function MentorAttendance() {
    const [activeTab, setActiveTab] = useState<"classes" | "scanner" | "benchmarking">("classes")
    const [classes, setClasses] = useState<AttendanceClass[]>([])
    const [groups, setGroups] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    // Form states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [className, setClassName] = useState("")
    const [selectedGroupId, setSelectedGroupId] = useState<string>("")
    const [classDate, setClassDate] = useState(new Date().toISOString().split("T")[0])
    const [startTime, setStartTime] = useState("08:00")
    const [lateTime, setLateTime] = useState("08:15")
    const [submitting, setSubmitting] = useState(false)

    // Detail states
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
    const [classDetail, setClassDetail] = useState<AttendanceClass | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    // Scanner states
    const [scanMethod, setScanMethod] = useState<"qr" | "nfc">("qr")
    const [scannedClassCode, setScannedClassCode] = useState("")
    const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "success" | "error">("idle")
    const [scanFeedback, setScanFeedback] = useState({ message: "", student: "", status: "" })
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [scanHistory, setScanHistory] = useState<any[]>([])
    const [simulatedStudentId, setSimulatedStudentId] = useState("")
    const [nfcInput, setNfcInput] = useState("")

    // Benchmarking states
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
    const [studentStats, setStudentStats] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(false)
    const [statsSearchTerm, setStatsSearchTerm] = useState("")

    // Refs
    const nfcInputRef = useRef<HTMLInputElement>(null)
    const audioSuccessRef = useRef<HTMLAudioElement | null>(null)
    const audioErrorRef = useRef<HTMLAudioElement | null>(null)

    // QR scanner instance and status tracker refs
    const qrScannerRef = useRef<any>(null)
    const scannerStatusRef = useRef(scannerStatus)
    const [cameraError, setCameraError] = useState<string | null>(null)

    useEffect(() => {
        scannerStatusRef.current = scannerStatus
    }, [scannerStatus])

    // Manage QR Scanner Lifecycle
    useEffect(() => {
        let isMounted = true;
        let scannerInstance: any = null;

        const startScanner = async () => {
            if (activeTab !== "scanner" || scanMethod !== "qr") {
                return;
            }

            setCameraError(null);

            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                
                if (!isMounted) return;

                const container = document.getElementById("qr-reader-container");
                if (!container) return;

                const scanner = new Html5Qrcode("qr-reader-container");
                scannerInstance = scanner;
                qrScannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (width, height) => {
                            const size = Math.min(width, height) * 0.7;
                            return { width: size, height: size };
                        }
                    },
                    (decodedText) => {
                        if (scannerStatusRef.current === "scanning" || scannerStatusRef.current === "idle") {
                            handleScanToken(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // Silent scanning noise
                    }
                );
                
                if (isMounted) {
                    setScannerStatus("scanning");
                }
            } catch (err: any) {
                console.error("Failed to start QR scanner:", err);
                if (isMounted) {
                    const isSecure = typeof window !== "undefined" && (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
                    if (!isSecure) {
                        setCameraError("La cámara requiere HTTPS o localhost en navegadores modernos. Si accedes por IP local, debes usar HTTPS o configurar tu navegador (chrome://flags/#unsafely-treat-insecure-origin-as-secure) para esta IP.");
                    } else {
                        setCameraError("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.");
                    }
                    setScannerStatus("error");
                }
            }
        };

        // Give a tiny timeout for DOM layout to stabilize
        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (scannerInstance) {
                try {
                    if (scannerInstance.isScanning) {
                        scannerInstance.stop().then(() => {
                            qrScannerRef.current = null;
                        }).catch((err: any) => {
                            console.error("Failed to stop QR scanner:", err);
                        });
                    }
                } catch (e) {
                    console.error("Error stopping QR scanner:", e);
                }
            }
        };
    }, [activeTab, scanMethod, scannedClassCode]);

    // Load Initial Data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            const token = localStorage.getItem("eleonor_token")
            try {
                const classesData = await fetchMentorClasses()
                setClasses(classesData)

                // Fetch groups for class creation dropdown
                const groupsRes = await fetch(`${API_URL}/mentor/groups`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (groupsRes.ok) {
                    setGroups(await groupsRes.json())
                }

                // Fetch all students for simulator dropdown
                const studentsRes = await fetch(`${API_URL}/mentor/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (studentsRes.ok) {
                    setStudents(await studentsRes.json())
                }
            } catch (err) {
                console.error("Error loading initial data:", err)
            } finally {
                setLoading(false)
            }
        }
        loadInitialData()
    }, [refreshKey])

    // Load Class Details when selected
    useEffect(() => {
        if (!selectedClassId) return
        const loadDetails = async () => {
            setLoadingDetail(true)
            const details = await fetchClassDetails(selectedClassId)
            setClassDetail(details)
            setLoadingDetail(false)
        }
        loadDetails()
    }, [selectedClassId])

    // Load Student Attendance Stats for Benchmarking
    useEffect(() => {
        if (!selectedStudentId) return
        const loadStats = async () => {
            setLoadingStats(true)
            const stats = await fetchStudentAttendanceStats(selectedStudentId)
            setStudentStats(stats)
            setLoadingStats(false)
        }
        loadStats()
    }, [selectedStudentId])

    // Automatically focus NFC invisible input when NFC tab is selected
    useEffect(() => {
        if (activeTab === "scanner" && scanMethod === "nfc") {
            const timer = setTimeout(() => {
                nfcInputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [activeTab, scanMethod])

    // Global click listener to re-focus NFC input
    const handleScannerContainerClick = () => {
        if (scanMethod === "nfc") {
            nfcInputRef.current?.focus()
        }
    }

    // Play feedback sound helper
    const playFeedbackSound = (type: "success" | "error") => {
        if (!soundEnabled) return
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)

            if (type === "success") {
                // Happy double beep
                osc.type = "sine"
                osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
                gain.gain.setValueAtTime(0.1, ctx.currentTime)
                osc.start()
                osc.stop(ctx.currentTime + 0.08)
                
                setTimeout(() => {
                    const osc2 = ctx.createOscillator()
                    const gain2 = ctx.createGain()
                    osc2.connect(gain2)
                    gain2.connect(ctx.destination)
                    osc2.type = "sine"
                    osc2.frequency.setValueAtTime(1320, ctx.currentTime) // E6
                    gain2.gain.setValueAtTime(0.1, ctx.currentTime)
                    osc2.start()
                    osc2.stop(ctx.currentTime + 0.12)
                }, 100)
            } else {
                // Sad buzzer
                osc.type = "sawtooth"
                osc.frequency.setValueAtTime(220, ctx.currentTime) // A3
                gain.gain.setValueAtTime(0.1, ctx.currentTime)
                osc.start()
                osc.stop(ctx.currentTime + 0.3)
            }
        } catch (e) {
            console.error("Audio feedback error:", e)
        }
    }

    // Handle class creation
    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!className) return
        setSubmitting(true)
        try {
            await createClass({
                name: className,
                group_id: selectedGroupId ? parseInt(selectedGroupId) : null,
                date: classDate,
                start_time: startTime,
                late_time: lateTime
            })
            setShowCreateModal(false)
            setClassName("")
            setSelectedGroupId("")
            setRefreshKey(prev => prev + 1)
        } catch (err) {
            alert("Error al crear clase: " + (err as Error).message)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle Scan Submission
    const handleScanToken = async (tokenToScan: string) => {
        if (!scannedClassCode) {
            setScannerStatus("error")
            setScanFeedback({
                message: "Por favor, selecciona una clase activa para registrar la asistencia.",
                student: "",
                status: "error"
            })
            playFeedbackSound("error")
            return
        }

        setScannerStatus("scanning")
        try {
            const res = await scanAttendance({
                class_code: scannedClassCode,
                secure_token: tokenToScan,
                scan_type: scanMethod
            })

            setScannerStatus("success")
            setScanFeedback({
                message: res.message,
                student: res.student_name,
                status: res.status
            })
            playFeedbackSound("success")

            // Add to scan log
            setScanHistory(prev => [
                {
                    time: new Date().toLocaleTimeString(),
                    student: res.student_name,
                    status: res.status,
                    method: scanMethod,
                    success: true
                },
                ...prev.slice(0, 19)
            ])

            // If we are currently viewing this class detail, reload details
            if (selectedClassId) {
                const details = await fetchClassDetails(selectedClassId)
                setClassDetail(details)
            }
        } catch (err) {
            setScannerStatus("error")
            setScanFeedback({
                message: (err as Error).message,
                student: "",
                status: "error"
            })
            playFeedbackSound("error")

            setScanHistory(prev => [
                {
                    time: new Date().toLocaleTimeString(),
                    student: "Desconocido",
                    status: "error",
                    method: scanMethod,
                    success: false,
                    errorMsg: (err as Error).message
                },
                ...prev.slice(0, 19)
            ])
        }

        // Reset status to idle after 4 seconds
        setTimeout(() => {
            setScannerStatus(prev => prev === "scanning" ? prev : "idle")
        }, 4000)
    }

    // NFC Keyboard emulation listener handler
    const handleNfcSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const token = nfcInput.trim()
        if (!token) return
        setNfcInput("")
        handleScanToken(token)
    }

    // Simulator triggers
    const triggerSimulatedScan = async () => {
        if (!simulatedStudentId) return
        try {
            const tokRes = await fetch(`${API_URL}/attendance/student/${simulatedStudentId}/token`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("eleonor_token")}` }
            })
            if (tokRes.ok) {
                const data = await tokRes.json()
                handleScanToken(data.token)
            } else {
                // Fallback to username-based token if endpoint not fully ready
                const selectedStudent = students.find(s => s.id === parseInt(simulatedStudentId))
                if (selectedStudent) {
                    handleScanToken(`SKILL-${selectedStudent.username.toUpperCase()}`)
                }
            }
        } catch (err) {
            console.error("Simulation token error:", err)
        }
    }

    // Filter students for benchmarking lookup
    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(statsSearchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(statsSearchTerm.toLowerCase())
    )

    // Recharts benchmarking theme styles
    const colors = {
        grid: "rgba(255, 255, 255, 0.05)",
        text: "rgba(255, 255, 255, 0.4)",
    }

    const benchmarkingChartData = studentStats ? [
        {
            name: "Asistencia",
            "Estudiante": studentStats.stats.rate,
            "Media Grupal": studentStats.stats.group_average
        }
    ] : []

    const statusColors: Record<string, string> = {
        presente: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        tardanza: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        falta: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    }

    return (
        <div className="min-h-screen p-4 md:p-12 bg-transparent relative overflow-hidden text-white">
            {/* Ambient background glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B500D1]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-12 pb-20">
                {/* Header */}
                <BlurFade delay={0.1} inView>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-20 md:pl-0">
                        <div>
                            <MagicTitle variant="sparkles" className="text-4xl md:text-6xl tracking-[0.2em] font-black uppercase">
                                ASISTENCIAS
                            </MagicTitle>
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start backdrop-blur-xl mt-2 w-fit">
                                <Calendar size={14} className="text-[#B500D1]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Registro QR & NFC - Módulo Docente</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setRefreshKey(prev => prev + 1)}
                                variant="outline"
                                className="h-12 w-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl p-0 flex items-center justify-center transition-all"
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </Button>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[#B500D1] hover:bg-[#B500D1]/80 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(181,0,209,0.3)] transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Nueva Clase
                            </Button>
                        </div>
                    </div>
                </BlurFade>

                {/* Tabs */}
                <div className="w-full">
                    <div className="mb-12 bg-white/5 border border-white/5 p-1.5 rounded-[2.5rem] flex flex-wrap h-auto gap-2 backdrop-blur-3xl inline-flex w-auto max-w-full">
                        <button
                            onClick={() => { setActiveTab("classes"); setSelectedClassId(null); setClassDetail(null) }}
                            className={`flex items-center gap-2.5 rounded-[2rem] px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-transparent ${activeTab === "classes" ? "bg-[#B500D1] text-white shadow-[0_0_20px_rgba(181,0,209,0.4)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            <Calendar size={16} />
                            Clases y Sesiones
                        </button>
                        <button
                            onClick={() => setActiveTab("scanner")}
                            className={`flex items-center gap-2.5 rounded-[2rem] px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-transparent ${activeTab === "scanner" ? "bg-[#B500D1] text-white shadow-[0_0_20px_rgba(181,0,209,0.4)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            <QrCode size={16} />
                            Escanear Entrada
                        </button>
                        <button
                            onClick={() => { setActiveTab("benchmarking"); setSelectedStudentId(null); setStudentStats(null) }}
                            className={`flex items-center gap-2.5 rounded-[2rem] px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-500 border border-transparent ${activeTab === "benchmarking" ? "bg-[#B500D1] text-white shadow-[0_0_20px_rgba(181,0,209,0.4)]" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                        >
                            <BarChart3 size={16} />
                            Análisis / Benchmarking
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* TAB 1: CLASSES */}
                            {activeTab === "classes" && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left pane: Classes List */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">Clases Recientes</h3>
                                        {loading ? (
                                            <div className="flex items-center justify-center py-20">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                                            </div>
                                        ) : classes.length === 0 ? (
                                            <div className="text-center py-20 bg-white/5 border border-white/5 rounded-[2rem] text-gray-500 text-sm">
                                                No hay clases registradas aún.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {classes.map(c => {
                                                    const isSelected = selectedClassId === c.id
                                                    return (
                                                        <motion.div
                                                            key={c.id}
                                                            whileHover={{ x: 4 }}
                                                            onClick={() => setSelectedClassId(c.id)}
                                                            className={`p-5 rounded-[2rem] border transition-all duration-300 cursor-pointer ${isSelected ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border-purple-500/35 shadow-lg" : "bg-white/[0.03] border-white/5 hover:border-white/15"}`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">${c.code}</span>
                                                                    <h4 className="font-black text-white text-base tracking-wide italic mt-1.5 uppercase">${c.name}</h4>
                                                                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase">${c.group_name}</p>
                                                                </div>
                                                                {c.is_active ? (
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,229,74,0.5)]" />
                                                                ) : (
                                                                    <span className="w-2 h-2 rounded-full bg-white/10" />
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={11} className="text-gray-500" />
                                                                    <span>${c.start_time} (Lim: ${c.late_time})</span>
                                                                </div>
                                                                {c.stats && (
                                                                    <span className="text-[#B500D1]">${c.stats.rate}% Asistencia</span>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right pane: Class Detail with Benchmarking Stats */}
                                    <div className="lg:col-span-2">
                                        {loadingDetail ? (
                                            <MagicCard className="bg-white/5 border-white/5 p-12 rounded-[2.5rem] flex items-center justify-center min-h-[400px]">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando detalles de sesión...</p>
                                                </div>
                                            </MagicCard>
                                        ) : classDetail ? (
                                            <MagicCard className="bg-white/5 border-white/5 p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden">
                                                {/* Header Stats */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-purple-400 tracking-[0.2em]">${classDetail.code}</span>
                                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mt-1">${classDetail.name}</h2>
                                                        <p className="text-xs text-gray-500 font-bold mt-1 uppercase">Clase para: ${classDetail.group_name} (${classDetail.date})</p>
                                                    </div>

                                                    <Button
                                                        onClick={() => {
                                                            setScannedClassCode(classDetail.code)
                                                            setActiveTab("scanner")
                                                        }}
                                                        className="bg-cyan-500 hover:bg-cyan-500/80 text-black font-black uppercase tracking-widest rounded-2xl h-12 px-6 flex items-center gap-2 self-start md:self-auto"
                                                    >
                                                        <QrCode size={16} />
                                                        Escanear esta clase
                                                    </Button>
                                                </div>

                                                {/* Stats Cards grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block">Registrados</span>
                                                        <span className="text-2xl font-black text-white tracking-tighter mt-1 block">
                                                            ${classDetail.records?.length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider block">Presentes</span>
                                                        <span className="text-2xl font-black text-emerald-400 tracking-tighter mt-1 block">
                                                            ${classDetail.records?.filter(r => r.status === "presente").length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider block">Tardanzas</span>
                                                        <span className="text-2xl font-black text-amber-400 tracking-tighter mt-1 block">
                                                            ${classDetail.records?.filter(r => r.status === "tardanza").length || 0}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                                        <span className="text-[9px] text-rose-400 font-black uppercase tracking-wider block">Inasistencias</span>
                                                        <span className="text-2xl font-black text-rose-400 tracking-tighter mt-1 block">
                                                            ${classDetail.records?.filter(r => r.status === "falta").length || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Attendance table */}
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Hoja de Asistencia</h3>
                                                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                                        {classDetail.records && classDetail.records.length > 0 ? (
                                                            classDetail.records.map(r => (
                                                                <div
                                                                    key={r.id}
                                                                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-[#B500D1]/10 border border-[#B500D1]/20 flex items-center justify-center text-[#B500D1] font-black text-sm uppercase">
                                                                            ${r.student_name.substring(0, 1)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-sm tracking-wide">${r.student_name}</h4>
                                                                            <p className="text-[10px] text-gray-500 font-medium">@${r.student_username}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        {r.registered_at && (
                                                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                                                                                {r.scan_type === "qr" ? <QrCode size={9} /> : <Smartphone size={9} />}
                                                                                {new Date(r.registered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        )}
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusColors[r.status]}`}>
                                                                            ${r.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-center py-10 opacity-30 italic text-xs">
                                                                No hay estudiantes registrados en esta clase.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </MagicCard>
                                        ) : (
                                            <MagicCard className="bg-white/5 border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] text-center">
                                                <Calendar className="w-16 h-16 text-white/10 mb-4" />
                                                <h3 className="font-black text-white/50 text-xl italic uppercase">Ninguna clase seleccionada</h3>
                                                <p className="text-gray-500 text-xs mt-2 max-w-sm font-medium">Selecciona una clase del listado lateral para visualizar la hoja de asistencia en tiempo real, estadísticas y control de alumnos.</p>
                                            </MagicCard>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: SCANNER */}
                            {activeTab === "scanner" && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" onClick={handleScannerContainerClick}>
                                    {/* Left pane: Scanner interface */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <MagicCard className="bg-white/5 border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
                                            {/* Selector de clase */}
                                            <div className="space-y-2 mb-6">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Seleccionar Clase de Destino</label>
                                                <select
                                                    value={scannedClassCode}
                                                    onChange={(e) => setScannedClassCode(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#B500D1] text-sm text-white font-bold h-12"
                                                >
                                                    <option value="" className="bg-[#110826] text-white">Selecciona una clase activa...</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.code} className="bg-[#110826] text-white">
                                                            ${c.name} (${c.code}) - ${c.group_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Selector de metodo QR/NFC */}
                                            <div className="flex gap-3 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5">
                                                <button
                                                    onClick={() => setScanMethod("qr")}
                                                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${scanMethod === "qr" ? "bg-[#B500D1] text-white" : "text-white/40 hover:text-white"}`}
                                                >
                                                    <QrCode size={14} />
                                                    Escáner QR
                                                </button>
                                                <button
                                                    onClick={() => setScanMethod("nfc")}
                                                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${scanMethod === "nfc" ? "bg-[#B500D1] text-white" : "text-white/40 hover:text-white"}`}
                                                >
                                                    <Rss size={14} />
                                                    Lector NFC
                                                </button>
                                            </div>

                                            {/* SCAN VIEWPORT CONTAINER */}
                                            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 flex flex-col items-center justify-center group shadow-2xl">
                                                {/* Styles injection for the QR video stream */}
                                                <style dangerouslySetInnerHTML={{__html: `
                                                    #qr-reader-container video {
                                                        width: 100% !important;
                                                        height: 100% !important;
                                                        object-fit: cover !important;
                                                    }
                                                `}} />

                                                {/* Hidden NFC receiver input */}
                                                {scanMethod === "nfc" && (
                                                    <form onSubmit={handleNfcSubmit} className="absolute opacity-0 pointer-events-none">
                                                        <input
                                                            ref={nfcInputRef}
                                                            type="text"
                                                            value={nfcInput}
                                                            onChange={(e) => setNfcInput(e.target.value)}
                                                            className="w-1 h-1"
                                                        />
                                                    </form>
                                                )}

                                                {/* REAL QR CAMERA CONTAINER */}
                                                <div 
                                                    id="qr-reader-container" 
                                                    className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                                                        scanMethod === "qr" && scannerStatus === "scanning" ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
                                                    }`} 
                                                />

                                                {/* Viewport styling for QR vs NFC */}
                                                <AnimatePresence mode="wait">
                                                    {scanMethod === "qr" ? (
                                                        <motion.div
                                                            key="qr-viewport"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                                                        >
                                                            {/* Simulated webcam viewer with tech HUD overlay */}
                                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none" />
                                                            <div className="absolute inset-0 bg-cyan-500/[0.03] animate-pulse pointer-events-none" />
                                                            
                                                            {/* Hologram scan lines */}
                                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-[scan_3s_infinite_linear] z-10 pointer-events-none" />

                                                            {/* Tech HUD frames */}
                                                            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg pointer-events-none z-10" />
                                                            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg pointer-events-none z-10" />
                                                            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg pointer-events-none z-10" />
                                                            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg pointer-events-none z-10" />

                                                            {cameraError ? (
                                                                <div className="flex flex-col items-center justify-center p-6 text-center z-20 max-w-xs relative bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
                                                                    <AlertTriangle className="text-rose-500 mb-3 animate-bounce" size={40} />
                                                                    <p className="text-xs text-rose-400 font-black uppercase tracking-widest mb-2">Error de Cámara</p>
                                                                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider leading-relaxed">
                                                                        {cameraError}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <QrCode size={70} className="text-cyan-400/20 mb-4 animate-pulse relative z-10" />
                                                                    <p className="text-[10px] font-black text-cyan-400/50 uppercase tracking-[0.3em] z-10 text-center max-w-xs">
                                                                        Apunta la cámara al código QR de la credencial
                                                                    </p>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="nfc-viewport"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 flex flex-col items-center justify-center p-6"
                                                        >
                                                            {/* Simulated NFC receiver viewport */}
                                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)] z-10" />
                                                            <div className="absolute inset-0 bg-[#B500D1]/[0.03] animate-pulse pointer-events-none" />

                                                            {/* Tech HUD frames */}
                                                            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#B500D1] rounded-tl-lg pointer-events-none z-10" />
                                                            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#B500D1] rounded-tr-lg pointer-events-none z-10" />
                                                            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#B500D1] rounded-bl-lg pointer-events-none z-10" />
                                                            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#B500D1] rounded-br-lg pointer-events-none z-10" />

                                                            <div className="relative mb-6 z-10">
                                                                <Rss size={70} className="text-[#B500D1]/30 animate-[ping_2s_infinite_linear]" />
                                                                <Smartphone size={32} className="text-white absolute inset-0 m-auto" />
                                                            </div>
                                                            <p className="text-[10px] font-black text-[#B500D1] uppercase tracking-[0.3em] z-10 text-center max-w-xs">
                                                                Lector NFC USB Activo
                                                            </p>
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 z-10 text-center max-w-xs">
                                                                (Aproxima la tarjeta NFC al dispositivo lector físico)
                                                            </p>
                                                            {nfcInput && (
                                                                <span className="text-[9px] px-2 py-0.5 bg-purple-500/20 text-[#B500D1] border border-purple-500/20 rounded font-mono mt-3 z-10 uppercase animate-pulse">
                                                                    Leyendo tarjeta...
                                                                </span>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* FEEDBACK STATUS OVERLAYS (Sensorial flashing) */}
                                                <AnimatePresence>
                                                    {scannerStatus === "success" && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${scanFeedback.status === "tardanza" ? "bg-amber-500/90" : "bg-emerald-500/90"} text-black p-8 text-center`}
                                                        >
                                                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                                                                <Check size={36} className="text-white" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">ASISTENCIA REGISTRADA</span>
                                                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white mt-1">${scanFeedback.student}</h3>
                                                            <p className="text-sm text-white font-bold uppercase mt-2 tracking-wide">${scanFeedback.message}</p>
                                                            <span className="text-[10px] font-black uppercase px-4 py-1.5 bg-black/20 text-white rounded-full mt-4 border border-white/10 tracking-widest">
                                                                ${scanFeedback.status.toUpperCase()}
                                                            </span>
                                                        </motion.div>
                                                    )}

                                                    {scannerStatus === "error" && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute inset-0 bg-rose-500/90 flex flex-col items-center justify-center z-20 text-white p-8 text-center"
                                                        >
                                                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                                                                <X size={36} className="text-white" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">ERROR DE VALIDACIÓN</span>
                                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-2">DENEGADO</h3>
                                                            <p className="text-xs text-white/90 font-bold uppercase mt-2 max-w-md leading-relaxed">${scanFeedback.message}</p>
                                                            <Button
                                                                onClick={() => setScannerStatus("idle")}
                                                                variant="outline"
                                                                className="mt-6 h-10 px-6 bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                                                            >
                                                                Reintentar
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Audio toggle */}
                                            <div className="flex justify-between items-center mt-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${scannerStatus === "scanning" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"} animate-pulse shadow-md`} />
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        Lector en espera...
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{soundEnabled ? "Audio ON" : "Mute"}</span>
                                                </button>
                                            </div>
                                        </MagicCard>
                                    </div>

                                    {/* Right pane: Quick Simulator Panel & Scan logs */}
                                    <div className="lg:col-span-5 space-y-6">
                                        {/* Simulator panel */}
                                        <MagicCard className="bg-[#B500D1]/5 border-[#B500D1]/15 p-6 rounded-[2.5rem] relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <Play className="w-16 h-16 text-[#B500D1]" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Play className="w-4 h-4 text-[#B500D1]" />
                                                <span className="text-[10px] font-black text-[#B500D1] uppercase tracking-[0.2em]">PANEL DE SIMULACIÓN</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-4 leading-normal">
                                                Utiliza este panel para simular el escaneo de credenciales de alumnos rápidamente sin lector NFC ni cámara.
                                            </p>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Seleccionar Alumno</label>
                                                    <select
                                                        value={simulatedStudentId}
                                                        onChange={(e) => setSimulatedStudentId(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#B500D1] text-xs text-white font-bold h-12"
                                                    >
                                                        <option value="" className="bg-[#110826] text-white">Elige un alumno a simular...</option>
                                                        {students.map(s => (
                                                            <option key={s.id} value={s.id} className="bg-[#110826] text-white">
                                                                ${s.full_name} (@${s.username})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <Button
                                                    onClick={triggerSimulatedScan}
                                                    disabled={!simulatedStudentId || !scannedClassCode}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-[#B500D1] text-white font-black uppercase tracking-widest rounded-2xl h-12 transition-all active:scale-95 disabled:opacity-40"
                                                >
                                                    Simular Escaneo Completo
                                                </Button>
                                            </div>
                                        </MagicCard>

                                        {/* Scan History logs */}
                                        <MagicCard className="bg-white/5 border-white/5 p-6 rounded-[2.5rem]">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 px-1">Historial del Escáner (Sesión)</h3>
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                                {scanHistory.length === 0 ? (
                                                    <div className="text-center py-10 opacity-30 italic text-xs">
                                                        Esperando lecturas de QR o NFC...
                                                    </div>
                                                ) : (
                                                    scanHistory.map((log, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs"
                                                        >
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${log.success ? (log.status === "tardanza" ? "bg-amber-400" : "bg-emerald-400") : "bg-rose-500"}`} />
                                                                    <span className="font-bold text-white uppercase">${log.student}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase">
                                                                    ${log.time} - ${log.method === "qr" ? "Código QR" : "Tarjeta NFC"}
                                                                </p>
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border ${log.success ? statusColors[log.status] : "text-rose-400 bg-rose-500/10 border-rose-500/20"}`}>
                                                                ${log.success ? log.status : "ERROR"}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </MagicCard>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: BENCHMARKING */}
                            {activeTab === "benchmarking" && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left pane: Students List */}
                                    <div className="lg:col-span-1 space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <Input
                                                type="text"
                                                placeholder="Buscar estudiante..."
                                                value={statsSearchTerm}
                                                onChange={(e) => setStatsSearchTerm(e.target.value)}
                                                className="bg-white/5 border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:ring-1 focus:ring-[#B500D1] text-white w-full h-12 font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                            {filteredStudents.length === 0 ? (
                                                <div className="text-center py-20 bg-white/5 border border-white/5 rounded-[2rem] text-gray-500 text-sm">
                                                    No se encontraron estudiantes.
                                                </div>
                                            ) : (
                                                filteredStudents.map(s => {
                                                    const isSelected = selectedStudentId === s.id
                                                    return (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => setSelectedStudentId(s.id)}
                                                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between ${isSelected ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border-purple-500/35" : "bg-white/[0.02] border-white/5 hover:border-white/12"}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                                                                    ${s.full_name.substring(0, 1)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm tracking-wide">${s.full_name}</h4>
                                                                    <p className="text-[10px] text-gray-500 font-medium">@${s.username}</p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={14} className={isSelected ? "text-purple-400" : "text-gray-600"} />
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Right pane: Attendance Benchmarking Charts */}
                                    <div className="lg:col-span-2">
                                        {loadingStats ? (
                                            <MagicCard className="bg-white/5 border-white/5 p-12 rounded-[2.5rem] flex items-center justify-center min-h-[400px]">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
                                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando métricas de asistencia...</p>
                                                </div>
                                            </MagicCard>
                                        ) : studentStats ? (
                                            <div className="space-y-6">
                                                {/* Comparative Benchmarking Chart Card */}
                                                <MagicCard className="bg-white/5 border-white/5 p-8 md:p-10 rounded-[2.5rem]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <BarChart3 className="text-[#B500D1]" size={22} />
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase text-purple-400 tracking-[0.2em]">ANÁLISIS COMPARATIVO</span>
                                                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mt-0.5">Benchmarking de Asistencia</h3>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-8 leading-normal">
                                                        Rendimiento relativo de asistencia de <span className="text-white">${studentStats.student_name}</span> frente a la media del grupo o sistema de SkillTech.
                                                    </p>

                                                    <div className="h-[250px] w-full mt-4">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={benchmarkingChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barGap={24}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fill: colors.text, fontSize: 10, fontWeight: 'bold' }}
                                                                />
                                                                <YAxis
                                                                    domain={[0, 100]}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    tick={{ fill: colors.text, fontSize: 11, fontWeight: '900' }}
                                                                    unit="%"
                                                                />
                                                                <Tooltip />
                                                                <Legend wrapperStyle={{ paddingTop: 30, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }} />
                                                                <Bar
                                                                    dataKey="Estudiante"
                                                                    fill="#B500D1"
                                                                    radius={[12, 12, 0, 0]}
                                                                    barSize={60}
                                                                />
                                                                <Bar
                                                                    dataKey="Media Grupal"
                                                                    fill="rgba(255,255,255,0.08)"
                                                                    radius={[12, 12, 0, 0]}
                                                                    barSize={60}
                                                                />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </MagicCard>

                                                {/* Stats Cards and logs */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <MagicCard className="bg-white/5 border-white/5 p-6 rounded-[2rem]">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 px-1">Métricas Individuales</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Porcentaje</span>
                                                                <span className="text-2xl font-black text-white tracking-tighter mt-1 block">
                                                                    ${studentStats.stats.rate}%
                                                                </span>
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Presentes</span>
                                                                <span className="text-2xl font-black text-emerald-400 tracking-tighter mt-1 block">
                                                                    ${studentStats.stats.present}
                                                                </span>
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Tardanzas</span>
                                                                <span className="text-2xl font-black text-amber-400 tracking-tighter mt-1 block">
                                                                    ${studentStats.stats.tardy}
                                                                </span>
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Faltas</span>
                                                                <span className="text-2xl font-black text-rose-400 tracking-tighter mt-1 block">
                                                                    ${studentStats.stats.absent}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </MagicCard>

                                                    <MagicCard className="bg-white/5 border-white/5 p-6 rounded-[2rem]">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4 px-1">Historial del Estudiante</h3>
                                                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                                            {studentStats.history && studentStats.history.length > 0 ? (
                                                                studentStats.history.map((h: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                                                                        <div>
                                                                            <h4 className="font-bold text-white uppercase">${h.class_name}</h4>
                                                                            <p className="text-[9px] text-gray-500 font-medium mt-0.5">${h.date}</p>
                                                                        </div>
                                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusColors[h.status]}`}>
                                                                            ${h.status}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-10 opacity-30 italic text-xs">
                                                                    No hay historial de asistencia para este alumno.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </MagicCard>
                                                </div>
                                            </div>
                                        ) : (
                                            <MagicCard className="bg-white/5 border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] text-center">
                                                <BarChart3 className="w-16 h-16 text-white/10 mb-4" />
                                                <h3 className="font-black text-white/50 text-xl italic uppercase">Selecciona un Estudiante</h3>
                                                <p className="text-gray-500 text-xs mt-2 max-w-sm font-medium">Elige un alumno del listado lateral para generar el análisis comparativo, ratios de asistencia y desglose de puntualidad.</p>
                                            </MagicCard>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* CREATE CLASS MODAL OVERLAY */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-[#110826] border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#B500D1]/10 rounded-full blur-[60px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-2xl font-black italic uppercase tracking-wide">Programar Clase</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-5 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Nombre de la Clase</label>
                                    <Input
                                        value={className}
                                        onChange={e => setClassName(e.target.value)}
                                        placeholder="Ej: Clase de Algoritmos Avanzados"
                                        className="h-12 rounded-2xl bg-white/5 border-white/10 focus:border-[#B500D1]/50 focus:ring-1 focus:ring-[#B500D1]/50 text-white font-bold"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Asignar Grupo</label>
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#B500D1]/50 text-sm text-white font-bold h-12"
                                        required
                                    >
                                        <option value="" className="bg-[#110826] text-white">Selecciona el grupo de alumnos...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id} className="bg-[#110826] text-white">
                                                ${g.name} (${g.student_count} alumnos)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Fecha</label>
                                        <Input
                                            type="date"
                                            value={classDate}
                                            onChange={e => setClassDate(e.target.value)}
                                            className="h-12 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Hora de Inicio</label>
                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="h-12 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Límite de Tardanza</label>
                                        <Input
                                            type="time"
                                            value={lateTime}
                                            onChange={e => setLateTime(e.target.value)}
                                            className="h-12 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-end pt-4">
                                    <Button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 font-bold text-xs uppercase tracking-wider"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="h-12 px-8 bg-[#B500D1] hover:bg-[#B500D1]/80 text-white font-black uppercase tracking-widest rounded-2xl text-xs transition-all active:scale-95"
                                    >
                                        {submitting ? "Creando..." : "Crear Clase"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(280px); }
                    100% { transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
