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
    BarChart3
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
    const [isUpdatingPhase, setIsUpdatingPhase] = useState(false)

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

    const filteredStudents = (breakdownData?.students || []).filter((s: any) => {
        const matchesHouse = !selectedHouseFilter || s.house === selectedHouseFilter
        const q = studentSearch.toLowerCase().trim()
        const matchesSearch = !q || s.full_name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q)
        return matchesHouse && matchesSearch
    })

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

            {/* HEADER CONSOLA DEL GESTOR (BANCO CENTRAL) */}
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
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
                        Control Monetario & Auditoría MYL
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Supervisión de agregados monetarios, respeto de topes de emisión, libro mayor en enteros y liquidación de quema en Solana.
                    </p>
                </div>

                {/* BOTÓN REFRESCAR INMEDIATO */}
                <button
                    onClick={loadAll}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-all"
                >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Actualizar Datos</span>
                </button>
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
                    <span>Pestaña 1: Visión Global (Macro)</span>
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
                    <span>Pestaña 3: Mercado & Auditoría P2P</span>
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 4.1 PESTAÑA 1: VISIÓN GLOBAL (MACROECONOMÍA Y FLUJO MONETARIO) */}
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
                                     macroData?.alert_status === "yellow" ? "Alerta Amarilla (109%)" : "Alerta Roja (Bloqueo)"}
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                                Circulante: {macroData?.circulating_myl ?? 72} MYL
                            </span>
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
                                        className={`p-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${
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
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900/80 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-between">
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
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-right">
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
                    {/* SUBVISTA 2.1: NIVEL CASAS (GOBERNANZA GRUPAL) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            Subvista 2.1 — Gobernanza y Rendimiento de Casas (Ventana Móvil 2 Sesiones)
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(breakdownData?.houses || []).map((h: any) => {
                                const cInfo = CASAS_INFO[h.house as "APEX" | "IGNIS" | "NEXUS" | "VISIO"] || CASAS_INFO.APEX
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

                                        <div className="pt-2 border-t border-slate-800 text-xs flex items-center justify-between">
                                            <span className="text-slate-400">Orden Materiales:</span>
                                            <span className={`font-bold font-mono ${h.order_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                                                {h.order_collected_myl} / {h.order_total_cost_myl} MYL
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* SUBVISTA 2.2: NIVEL PARTICIPANTES (DIRECTORIO DE ALUMNOS) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    Subvista 2.2 — Directorio de Alumnos (Auditoría de Liquidez y Mérito)
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
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${!selectedHouseFilter ? "bg-white/20 text-white" : "text-slate-400"}`}
                                    >
                                        Todas
                                    </button>
                                    {(["APEX", "IGNIS", "NEXUS", "VISIO"] as const).map(hk => (
                                        <button
                                            key={hk}
                                            onClick={() => setSelectedHouseFilter(hk)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${selectedHouseFilter === hk ? "bg-[hsl(74,100%,47%)] text-slate-950" : "text-slate-400"}`}
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
                                        <th className="p-3">Billetera Solana</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((s: any) => (
                                        <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                                            <td className="p-3 font-bold text-white">{s.full_name}</td>
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
                                            <td className="p-3 font-mono text-[10px] text-slate-500">
                                                {s.solana_wallet ? `${s.solana_wallet.slice(0, 6)}...${s.solana_wallet.slice(-4)}` : "—"}
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
            {/* 4.3 PESTAÑA 3: MERCADO, INTERCAMBIOS Y COMPORTAMIENTO         */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "market" && (
                <div className="space-y-6">
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
                                                {feed.fee_burned_myl} MYL {feed.fee_burned_myl === 0 ? "(Exento)" : "🔥"}
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
        </div>
    )
}
