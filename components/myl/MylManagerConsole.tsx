"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Landmark,
    TrendingUp,
    Flame,
    AlertTriangle,
    Shield,
    Users,
    ShoppingBag,
    ArrowLeftRight,
    Sparkles,
    CheckCircle2,
    Clock,
    Lock,
    Unlock,
    Activity,
    Layers,
    Search,
    RefreshCw,
    ShieldAlert,
    BarChart3,
    QrCode,
    Zap,
    Download,
    Send,
    Megaphone,
    UserCheck,
    Coins,
    X,
    Copy,
    Check
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { CASAS_INFO } from "@/lib/casasData"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"

type ManagerTab = "macro" | "breakdown" | "market"

export function MylManagerConsole() {
    const [activeTab, setActiveTab] = useState<ManagerTab>("macro")
    const [loading, setLoading] = useState(true)
    const [macroData, setMacroData] = useState<any>(null)
    const [breakdownData, setBreakdownData] = useState<any>(null)
    const [marketData, setMarketData] = useState<any>(null)
    const [selectedHouseFilter, setSelectedHouseFilter] = useState<string | null>(null)
    const [studentSearch, setStudentSearch] = useState("")
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Estados de operaciones en vivo
    const [isUpdatingPhase, setIsUpdatingPhase] = useState(false)
    const [isTogglingMarket, setIsTogglingMarket] = useState(false)
    const [showDisperseModal, setShowDisperseModal] = useState(false)
    const [isDispersingBonuses, setIsDispersingBonuses] = useState(false)

    // Acreditación de mérito
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
    const [meritAmount, setMeritAmount] = useState<number>(1)
    const [meritReason, setMeritReason] = useState<string>("Participación destacada en clase")
    const [isCreditingMerit, setIsCreditingMerit] = useState(false)

    // Emisor de Moya
    const [moyaMessage, setMoyaMessage] = useState<string>("")
    const [moyaType, setMoyaType] = useState<string>("rumor")
    const [isBroadcastingMoya, setIsBroadcastingMoya] = useState(false)

    // Terminal de Caja Registradora
    const [cashierHouse, setCashierHouse] = useState<string>("APEX")
    const [cashierAmount, setCashierAmount] = useState<number>(48)
    const [cashierConcept, setCashierConcept] = useState<string>("Kit Oficial de Materiales de Equipo")
    const [createdBillData, setCreatedBillData] = useState<any | null>(null)
    const [showBillModal, setShowBillModal] = useState(false)
    const [isCreatingBill, setIsCreatingBill] = useState(false)
    const [copiedBill, setCopiedBill] = useState(false)

    const showToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 4000)
    }

    const fetchMacro = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/macro`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) setMacroData(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const fetchBreakdown = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/breakdown`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) setBreakdownData(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const fetchMarket = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/market`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) setMarketData(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([fetchMacro(), fetchBreakdown(), fetchMarket()])
        setLoading(false)
    }

    useEffect(() => {
        loadAll()
        const timer = setInterval(() => {
            fetchMacro()
            if (activeTab === "breakdown") fetchBreakdown()
            if (activeTab === "market") fetchMarket()
        }, 5000)
        return () => clearInterval(timer)
    }, [activeTab])

    // Toggle de Mercado QR
    const handleToggleMarket = async () => {
        setIsTogglingMarket(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/toggle-market`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await fetchMacro()
            }
        } catch (e) {
            showToast("Error al alternar estado del mercado QR")
        } finally {
            setIsTogglingMarket(false)
        }
    }

    // Dispersión masiva de bonos iniciales (240 MYL)
    const handleDisperseBonuses = async () => {
        setIsDispersingBonuses(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/disperse-bonuses`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                setShowDisperseModal(false)
                await Promise.all([fetchMacro(), fetchBreakdown()])
            } else {
                showToast(result.detail || "Error al dispersar bonos")
            }
        } catch (e) {
            showToast("Error de conexión al dispersar bonos")
        } finally {
            setIsDispersingBonuses(false)
        }
    }

    // Acreditación rápida de mérito
    const handleCreditMerit = async (studentId?: number, amount: number = 1) => {
        const targetId = studentId || selectedStudentId
        if (!targetId) {
            showToast("Selecciona un estudiante")
            return
        }
        setIsCreditingMerit(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/credit-merit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    student_id: targetId,
                    myl_amount: amount,
                    reason: meritReason || "Participación destacada en clase"
                })
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await Promise.all([fetchMacro(), fetchBreakdown()])
            } else {
                showToast(result.detail || "Error al acreditar mérito")
            }
        } catch (e) {
            showToast("Error de conexión al acreditar mérito")
        } finally {
            setIsCreditingMerit(false)
        }
    }

    // Emisión de globos de Moya en vivo
    const handleBroadcastMoya = async () => {
        if (!moyaMessage.trim()) return
        setIsBroadcastingMoya(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/moya-broadcast`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: moyaMessage.trim(),
                    broadcast_type: moyaType
                })
            })
            const result = await res.json()
            if (res.ok) {
                showToast("¡Globo de Moya emitido en vivo a los alumnos!")
                setMoyaMessage("")
                await fetchMacro()
            }
        } catch (e) {
            showToast("Error al emitir globo de Moya")
        } finally {
            setIsBroadcastingMoya(false)
        }
    }

    // Generar orden oficial de caja
    const handleCreateCashierBill = async () => {
        setIsCreatingBill(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/cashier/create-bill`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    house: cashierHouse,
                    items: [{ name: cashierConcept, cost_myl: cashierAmount, quantity: 1 }],
                    total_cost_myl: cashierAmount,
                    notes: `Cobro en terminal de caja para Casa ${cashierHouse}`
                })
            })
            const result = await res.json()
            if (res.ok) {
                setCreatedBillData(result)
                setShowBillModal(true)
                showToast("¡Factura QR generada para proyección en aula!")
            } else {
                showToast(result.detail || "Error al crear factura")
            }
        } catch (e) {
            showToast("Error al conectar con la terminal de caja")
        } finally {
            setIsCreatingBill(false)
        }
    }

    const handlePhaseChange = async (newPhase: string) => {
        setIsUpdatingPhase(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/manager/phase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ new_phase: newPhase })
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await fetchMacro()
            }
        } catch (e) {
            showToast("Error al cambiar fase")
        } finally {
            setIsUpdatingPhase(false)
        }
    }

    // Exportar CSV
    const exportCSV = () => {
        if (!breakdownData?.students) return
        const headers = ["ID", "Estudiante", "Usuario", "Casa", "Efectivo QR", "Saldo Digital", "Total MYL", "Puntos Merito Sesion", "Billetera Solana"]
        const rows = breakdownData.students.map((s: any) => [
            s.id,
            `"${s.full_name || ''}"`,
            s.username || '',
            s.house || '',
            s.cash_myl || 0,
            s.digital_myl || 0,
            s.total_myl || 0,
            s.session_house_points || 0,
            s.solana_wallet || ''
        ])
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `auditoria_myl_sesion_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showToast("Reporte contable CSV exportado exitosamente")
    }

    const filteredStudents = (breakdownData?.students || []).filter((s: any) => {
        const matchesHouse = !selectedHouseFilter || s.house === selectedHouseFilter
        const q = studentSearch.toLowerCase().trim()
        const matchesSearch = !q || s.full_name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q)
        return matchesHouse && matchesSearch
    })

    const isMarketOpen = macroData?.qr_market_open ?? true

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-24 text-slate-100">
            {/* TOAST FLOTANTE */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 border-2 border-[hsl(74,100%,47%)] text-slate-100 shadow-[0_0_25px_rgba(186,239,0,0.3)] flex items-center gap-3 font-bold text-xs"
                    >
                        <Sparkles className="w-5 h-5 text-[hsl(74,100%,47%)]" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER CONSOLA DEL GESTOR (BANCO CENTRAL) CON INTERRUPTOR MAESTRO */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] px-2.5 py-0.5 rounded-full bg-[hsl(74,100%,47%)] text-slate-950 font-mono">
                            Consola del Gestor / Banco Central
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                            Programa de Liderazgo UCSM
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                        Control Monetario & Auditoría MYL
                    </h1>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Supervisión de agregados monetarios, respeto de topes de emisión (/500 MYL sesión, /7,000 MYL edición), libro mayor en enteros y liquidación de quema en Solana.
                    </p>
                </div>

                {/* BOTONERA TRANSVERSAL DEL HEADER */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* INTERRUPTOR MAESTRO DE MERCADO QR (ABIERTO / CERRADO) */}
                    <button
                        onClick={handleToggleMarket}
                        disabled={isTogglingMarket}
                        className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 border shadow-xl cursor-pointer ${
                            isMarketOpen
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                : "bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        }`}
                        title="Habilita o pausa el escaneo y cobro QR en todos los móviles de los alumnos"
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? "bg-emerald-400 animate-ping" : "bg-red-400"}`} />
                        {isMarketOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
                        <span>{isTogglingMarket ? "Actualizando..." : isMarketOpen ? "MERCADO QR: ABIERTO" : "MERCADO QR: CERRADO"}</span>
                    </button>

                    {/* BOTÓN REFRESCAR INMEDIATO */}
                    <button
                        onClick={loadAll}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4 text-emerald-400" />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* SWITCHER DE LAS 3 PESTAÑAS OPERATIVAS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <button
                    onClick={() => setActiveTab("macro")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "macro"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Pestaña 1: Visión Global (Macro & Operación)</span>
                </button>

                <button
                    onClick={() => setActiveTab("breakdown")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "breakdown"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Pestaña 2: Desglose (Casas & Alumnos)</span>
                </button>

                <button
                    onClick={() => setActiveTab("market")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "market"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pestaña 3: Caja Registradora & Auditoría</span>
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4.1 PESTAÑA 1: VISIÓN GLOBAL (MACRO, OPERACIÓN & MOYA)        */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "macro" && (
                <div className="space-y-6">
                    {/* KPIS MACROECONÓMICOS EN VIVO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Emisión Acumulada Edición
                            </span>
                            <div className="text-3xl font-black text-white tabular-nums">
                                {macroData?.edition_emitted_myl ?? 1840} <span className="text-sm font-normal text-slate-400">/ {macroData?.edition_total_cap_myl ?? 7000} MYL</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 mt-1 block">
                                Margen remanente: {macroData?.edition_remaining_myl ?? 5160} MYL
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Emisión de la Sesión Actual
                            </span>
                            <div className="text-3xl font-black text-white tabular-nums">
                                {macroData?.session_emitted_myl ?? 384} <span className="text-sm font-normal text-slate-400">/ {macroData?.session_cap_myl ?? 500} MYL</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Bono Fijo (240) + Mérito (~144)
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Tasa de Quema en Vivo (Burn Rate)
                            </span>
                            <div className="text-3xl font-black text-[hsl(74,100%,47%)] tabular-nums">
                                {macroData?.burn_rate_pct ?? 81.2}%
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Meta: 75% - 85% ({macroData?.session_burned_myl ?? 312} MYL quemados)
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Semáforo de Emisión
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-4 h-4 rounded-full ${
                                    macroData?.alert_status === "green" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" :
                                    macroData?.alert_status === "yellow" ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" :
                                    "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]"
                                }`} />
                                <span className="text-xl font-black text-white">
                                    {macroData?.alert_status === "green" ? "Normal (≤ 384 MYL)" :
                                     macroData?.alert_status === "yellow" ? "Alerta Amarilla" : "Alerta Roja"}
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                                Circulante: {macroData?.circulating_myl ?? 72} MYL
                            </span>
                        </div>
                    </div>

                    {/* BOTONERA OPERATIVA DE LA SESIÓN EN VIVO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* CARD 1: DISPERSIÓN DE BONO INICIAL 240 MYL */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 flex flex-col justify-between space-y-4 shadow-xl">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                        Operación 1: Apertura
                                    </span>
                                    <Coins className="w-5 h-5 text-[hsl(74,100%,47%)]" />
                                </div>
                                <h3 className="text-lg font-black text-white mt-1">Dispersión Bono Inicial</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Acredita 240 MYL entre los 48 alumnos en 1 solo clic según el puesto de su casa (6, 5, 5, 4 MYL).
                                </p>
                            </div>

                            <button
                                onClick={() => setShowDisperseModal(true)}
                                className="w-full py-3 px-4 rounded-xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                            >
                                <Zap className="w-4 h-4" />
                                <span>⚡ Dispersar Bono (240 MYL)</span>
                            </button>
                        </div>

                        {/* CARD 2: ACREDITACIÓN RÁPIDA DE MÉRITO (+1 PTO / +1-2 MYL) */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                        Operación 2: Mérito Rápido
                                    </span>
                                    <UserCheck className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-black text-white mt-1">Acreditar Mérito Individual</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Asigna +1 Punto de Casa y +1 o +2 MYL con tope máximo de 3 puntos por sesión.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <select
                                    value={selectedStudentId || ""}
                                    onChange={(e) => setSelectedStudentId(Number(e.target.value) || null)}
                                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
                                >
                                    <option value="">Seleccionar Alumno (48 oficiales)...</option>
                                    {(breakdownData?.students || []).map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} ({s.house}) - {s.session_house_points}/3 pts
                                        </option>
                                    ))}
                                </select>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleCreditMerit(undefined, 1)}
                                        disabled={!selectedStudentId || isCreditingMerit}
                                        className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold disabled:opacity-40 transition-all"
                                    >
                                        +1 Pto & +1 MYL
                                    </button>
                                    <button
                                        onClick={() => handleCreditMerit(undefined, 2)}
                                        disabled={!selectedStudentId || isCreditingMerit}
                                        className="py-2 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-[11px] font-black disabled:opacity-40 transition-all"
                                    >
                                        +1 Pto & +2 MYL ⭐
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: EMISOR DE GLOBOS DE MOYA EN VIVO */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                        Operación 3: Difusión Moya
                                    </span>
                                    <Megaphone className="w-5 h-5 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-black text-white mt-1">Globos de Texto en Vivo</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Envía rumores, consejos o alertas en tiempo real al widget de Moya en todos los móviles.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Ej. ¡Quedan 5 min para cerrar compras!"
                                    value={moyaMessage}
                                    onChange={(e) => setMoyaMessage(e.target.value)}
                                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                                />

                                <div className="flex items-center gap-2">
                                    <select
                                        value={moyaType}
                                        onChange={(e) => setMoyaType(e.target.value)}
                                        className="p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-bold"
                                    >
                                        <option value="rumor">Rumor</option>
                                        <option value="tip">Consejo</option>
                                        <option value="alert">Alerta 🚨</option>
                                    </select>

                                    <button
                                        onClick={handleBroadcastMoya}
                                        disabled={!moyaMessage.trim() || isBroadcastingMoya}
                                        className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Emitir</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INTERRUPTOR MAESTRO DE FASES DE SESIÓN */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    Interruptor Maestro de Fase Operativa de la Sesión
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Al activar "Actividad Grupal", el sistema bloquea inmediatamente la compra de Impulsos en la tienda de los alumnos.
                                </p>
                            </div>

                            <span className="px-3 py-1 bg-slate-950 border border-emerald-500/40 text-[hsl(74,100%,47%)] font-mono font-bold text-xs rounded-xl">
                                Fase Activa: {macroData?.active_phase}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                            {(macroData?.phases_available || []).map((phase: string) => {
                                const isCurrent = macroData?.active_phase === phase
                                return (
                                    <button
                                        key={phase}
                                        onClick={() => handlePhaseChange(phase)}
                                        disabled={isUpdatingPhase}
                                        className={`p-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                                            isCurrent
                                                ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                                                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                                        }`}
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span>{phase}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* TASA DE REFERENCIA & COMUNICADOS FORWARD GUIDANCE */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                                Tasa de Referencia de Forward Guidance
                            </span>
                            <div className="text-2xl font-black text-white font-mono mt-1">
                                {macroData?.reference_rate_text ?? "1 Punto de Casa = 2 MYL"}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Utilizada para fijar expectativas de liquidación y absorción de liquidez entre sesiones.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-left sm:text-right">
                            <span className="text-xs text-slate-400 block">Meta Absorción Insumos</span>
                            <span className="text-xl font-black text-[hsl(74,100%,47%)] font-mono">192 MYL</span>
                            <span className="text-[10px] text-slate-500 block">4 Casas × 48 MYL</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4.2 PESTAÑA 2: DESGLOSE (POR CASA Y POR PARTICIPANTE)         */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "breakdown" && (
                <div className="space-y-6">
                    {/* SUBVISTA 2.1: NIVEL CASAS & LIQUIDEZ AGREGADA (DATO EXCLUSIVO DEL GESTOR) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    Subvista 2.1 — Gobernanza y Liquidez Agregada de Casas (Ventana Móvil 2 Sesiones)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Muestra el rendimiento competitivo y la suma real de la liquidez de los 12 miembros por Casa vs los ~48 MYL de materiales.
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                                Dato Exclusivo del Facilitador
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(breakdownData?.houses || []).map((h: any) => {
                                const cInfo = CASAS_INFO[h.house as "APEX" | "IGNIS" | "NEXUS" | "VISIO"] || CASAS_INFO.APEX
                                const liquidity = h.total_house_liquidity_myl ?? 48
                                const reqCost = h.order_total_cost_myl ?? 48
                                const isSolvent = liquidity >= reqCost

                                return (
                                    <div key={h.house} className={`p-5 rounded-2xl border ${cInfo.borderColor} bg-slate-950/70 space-y-3`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${cInfo.badgeBg} ${cInfo.badgeText}`}>
                                                Casa {h.house}
                                            </span>
                                            <span className="text-base font-black text-white">{h.rank}.º Puesto</span>
                                        </div>

                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Puntos Ventana Móvil</span>
                                            <div className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono">{h.total_pts} pts</div>
                                            <span className="text-[10px] text-slate-400">St-1 ({h.st_prev}) + St ({h.st_curr})</span>
                                        </div>

                                        {/* LIQUIDEZ AGREGADA DE CASA */}
                                        <div className="pt-2 border-t border-slate-800 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Liquidez Agregada:</span>
                                                <span className={`font-black font-mono ${isSolvent ? "text-emerald-400" : "text-amber-400"}`}>
                                                    {liquidity} MYL
                                                </span>
                                            </div>

                                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${isSolvent ? "bg-emerald-400" : "bg-amber-400"}`}
                                                    style={{ width: `${Math.min(100, (liquidity / reqCost) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-slate-500 block">
                                                Meta Insumos: {reqCost} MYL (12 miembros)
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* SUBVISTA 2.2: NIVEL PARTICIPANTES (DIRECTORIO DE 48 ALUMNOS) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    Subvista 2.2 — Directorio de Alumnos ({breakdownData?.students_total ?? 48} Registrados)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Muestra saldo digital vs efectivo, índice de esfuerzo y tope de 3 puntos de mérito por sesión.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Filtro por Casa */}
                                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                        onClick={() => setSelectedHouseFilter(null)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${!selectedHouseFilter ? "bg-white/20 text-white" : "text-slate-400"}`}
                                    >
                                        Todas
                                    </button>
                                    {(["APEX", "IGNIS", "NEXUS", "VISIO"] as const).map(hk => (
                                        <button
                                            key={hk}
                                            onClick={() => setSelectedHouseFilter(hk)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${selectedHouseFilter === hk ? "bg-[hsl(74,100%,47%)] text-slate-950" : "text-slate-400"}`}
                                        >
                                            {hk}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    placeholder="Buscar alumno..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white w-48"
                                />

                                <button
                                    onClick={exportCSV}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                                    title="Descargar libro contable en CSV"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>CSV</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                        <th className="p-3">Estudiante</th>
                                        <th className="p-3">Casa</th>
                                        <th className="p-3">Efectivo QR</th>
                                        <th className="p-3">Saldo Digital</th>
                                        <th className="p-3">Total MYL</th>
                                        <th className="p-3">Puntos Mérito Sesión</th>
                                        <th className="p-3 text-right">Acción Rápida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((s: any) => (
                                        <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                                            <td className="p-3 font-bold text-white">
                                                <div>{s.full_name}</div>
                                                <span className="text-[10px] text-slate-500 font-mono">@{s.username}</span>
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                                    {s.house}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono font-bold text-amber-400">{s.cash_myl} MYL</td>
                                            <td className="p-3 font-mono font-bold text-cyan-400">{s.digital_myl} MYL</td>
                                            <td className="p-3 font-mono font-black text-sm text-[hsl(74,100%,47%)]">{s.total_myl} MYL</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${s.session_house_points >= 3 ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"}`}>
                                                    {s.session_house_points} / 3 pts
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => handleCreditMerit(s.id, 1)}
                                                    className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                                    title="Acreditar +1 Punto y +1 MYL"
                                                >
                                                    +1 Mérito
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4.3 PESTAÑA 3: TERMINAL DE CAJA REGISTRADORA & AUDITORÍA P2P  */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "market" && (
                <div className="space-y-6">
                    {/* TERMINAL DE CAJA REGISTRADORA (GENERACIÓN DE QR DE PAGO EN PANTALLA) */}
                    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-5 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                    Terminal Oficial de Facturación y Quema
                                </span>
                                <h3 className="text-xl font-black text-white mt-0.5">
                                    Caja Registradora Oficial (Proyección de QR en Pantalla)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Selecciona la Casa y genera la factura oficial con código QR gigante para que los alumnos escaneen y quemen los MYL al instante.
                                </p>
                            </div>

                            <button
                                onClick={exportCSV}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-emerald-400" />
                                <span>Exportar Auditoría CSV</span>
                            </button>
                        </div>

                        {/* FORMULARIO DE GENERACIÓN DE COBRO */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1.5">Casa Compradora</label>
                                <select
                                    value={cashierHouse}
                                    onChange={(e) => setCashierHouse(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white"
                                >
                                    <option value="APEX">Casa APEX</option>
                                    <option value="IGNIS">Casa IGNIS</option>
                                    <option value="NEXUS">Casa NEXUS</option>
                                    <option value="VISIO">Casa VISIO</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1.5">Concepto del Pedido</label>
                                <input
                                    type="text"
                                    value={cashierConcept}
                                    onChange={(e) => setCashierConcept(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1.5">Monto Total en Enteros (MYL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={cashierAmount}
                                        onChange={(e) => setCashierAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-[hsl(74,100%,47%)]"
                                    />
                                    <button
                                        onClick={handleCreateCashierBill}
                                        disabled={isCreatingBill}
                                        className="px-5 py-2.5 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-lg"
                                    >
                                        {isCreatingBill ? "Generando..." : "Generar QR"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MONITOR DE TIENDA Y PRECIOS DINÁMICOS */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            Monitor de Rotación de Tienda Oficial & Alzas Dinámicas
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(marketData?.store_rotation || []).map((it: any) => (
                                <div key={it.code} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">{it.title}</span>
                                        {it.high_demand && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                Alta Demanda
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline justify-between pt-2">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block font-bold">Precio Actual</span>
                                            <span className="text-xl font-black text-[hsl(74,100%,47%)] font-mono">{it.current_price_myl} MYL</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block font-bold">Ventas Sesión</span>
                                            <span className="text-sm font-black text-white font-mono">{it.units_sold} uds</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FEED P2P Y AUDITORÍA DE INTERCAMBIOS DESIGUALES */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                                    Feed del Mercado Secundario P2P & Cuotas Quemadas en Solana
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Registro en tiempo real de transacciones entre estudiantes con auditoría de alertas de intercambio desigual (&gt; ±30%).
                                </p>
                            </div>

                            <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
                                Alertas Desiguales Registradas: {marketData?.unequal_trade_audit_count ?? 0}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Activo</th>
                                        <th className="p-3">Vendedor</th>
                                        <th className="p-3">Comprador</th>
                                        <th className="p-3">Precio Acordado</th>
                                        <th className="p-3">Cuota Quemada Solana</th>
                                        <th className="p-3">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(marketData?.p2p_feed || []).map((feed: any) => (
                                        <tr key={feed.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                                            <td className="p-3 font-mono text-slate-400">{feed.date}</td>
                                            <td className="p-3 font-bold text-white">{feed.asset}</td>
                                            <td className="p-3 font-mono text-slate-300">Casa {feed.seller_house}</td>
                                            <td className="p-3 font-mono text-slate-300">{feed.buyer_house ? `Casa ${feed.buyer_house}` : "—"}</td>
                                            <td className="p-3 font-mono font-black text-sm text-[hsl(74,100%,47%)]">{feed.price_myl} MYL</td>
                                            <td className="p-3 font-mono font-bold text-emerald-400">
                                                {feed.fee_burned_myl} MYL {feed.fee_burned_myl === 0 ? "(Exento Intracasa)" : "🔥"}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${feed.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                                                    {feed.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!marketData?.p2p_feed || marketData.p2p_feed.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-slate-500">
                                                No hay intercambios P2P registrados aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN: DISPERSIÓN DE BONO INICIAL 240 MYL */}
            {showDisperseModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <Coins className="w-7 h-7" />
                                <h3 className="text-lg font-black text-white">Dispersar Bono Inicial</h3>
                            </div>
                            <button
                                onClick={() => setShowDisperseModal(false)}
                                className="p-1 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            Esta operación acreditará los bonos correspondientes en Solana para los <strong>48 estudiantes</strong> de acuerdo con el ranking actual:
                        </p>

                        <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
                            <div className="flex justify-between">
                                <span className="text-emerald-400">1.º Puesto (APEX):</span>
                                <strong>6 MYL × 12 = 72 MYL</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-amber-400">2.º Puesto (IGNIS):</span>
                                <strong>5 MYL × 12 = 60 MYL</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyan-400">3.º Puesto (NEXUS):</span>
                                <strong>5 MYL × 12 = 60 MYL</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">4.º Puesto (VISIO):</span>
                                <strong>4 MYL × 12 = 48 MYL</strong>
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-[hsl(74,100%,47%)] text-sm">
                                <span>Total a Dispersar:</span>
                                <span>240 MYL</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowDisperseModal(false)}
                                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDisperseBonuses}
                                disabled={isDispersingBonuses}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer transition-all"
                            >
                                {isDispersingBonuses ? "Dispersando..." : "Confirmar y Dispersar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GIGANTE DE PROYECCIÓN: FACTURA QR OFICIAL DE CAJA REGISTRADORA */}
            {showBillModal && createdBillData && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-950 border-2 border-[hsl(74,100%,47%)] shadow-[0_0_50px_rgba(186,239,0,0.3)] space-y-6 text-center">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[hsl(74,100%,47%)] text-slate-950 font-mono">
                                Factura Oficial de Tienda
                            </span>
                            <button
                                onClick={() => setShowBillModal(false)}
                                className="p-1 text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-white">Casa {createdBillData.details?.house}</h2>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{createdBillData.bill_id}</p>
                        </div>

                        {/* CÓDIGO QR GIGANTE PARA ESCANEAR EN PANTALLA */}
                        <div className="mx-auto p-6 bg-white rounded-3xl border-4 border-slate-800 shadow-2xl aspect-square w-64 flex items-center justify-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                    createdBillData.qr_payload
                                )}`}
                                alt="QR Factura Caja"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-400 font-bold">Total a Cobrar</span>
                            <div className="text-4xl font-black text-[hsl(74,100%,47%)] font-mono">
                                {createdBillData.details?.total_cost_myl} MYL
                            </div>
                            <span className="text-xs text-slate-300 font-bold block">
                                {createdBillData.details?.items?.[0]?.name}
                            </span>
                        </div>

                        <p className="text-xs text-slate-400">
                            Pide a los alumnos de Casa {createdBillData.details?.house} que abran su escáner en la pestaña Inicio y apunten a esta pantalla para confirmar y pagar.
                        </p>

                        <div className="pt-2">
                            <button
                                onClick={() => setShowBillModal(false)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase"
                            >
                                Cerrar Ventana de Proyección
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
