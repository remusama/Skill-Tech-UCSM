"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Wallet,
    Coins,
    Shield,
    ShoppingBag,
    Sparkles,
    Clock,
    Lock,
    Unlock,
    Zap,
    Trophy,
    TrendingUp,
    QrCode,
    Radio,
    DollarSign,
    Info,
    HelpCircle,
    Package,
    ArrowUpRight,
    Eye,
    EyeOff,
    Gamepad2,
    Copy,
    Check,
    Award,
    AlertCircle,
    MessageCircle,
    CheckCircle2,
    Flame
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { CASAS_INFO } from "@/lib/casasData"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"
import { MundoMoyaModal } from "@/components/myl/MundoMoyaModal"

type StudentTab = "dashboard" | "inventory"

export function MylStudentPlatform() {
    const [activeTab, setActiveTab] = useState<StudentTab>("dashboard")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [storeData, setStoreData] = useState<any>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Privacidad: Ocultar o mostrar saldo
    const [showBalance, setShowBalance] = useState(true)

    // Modal Mundo Moya
    const [showMundoMoyaModal, setShowMundoMoyaModal] = useState(false)

    // Tienda & Acciones
    const [buyingItemCode, setBuyingItemCode] = useState<string | null>(null)
    const [copiedAddress, setCopiedAddress] = useState(false)

    const showToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 4000)
    }

    const fetchWallet = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/me`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (e) {
            console.error("Error cargando billetera MYL:", e)
        }
    }

    const fetchStore = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/store`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) {
                const json = await res.json()
                setStoreData(json)
            }
        } catch (e) {
            console.error("Error cargando tienda:", e)
        }
    }

    const loadAll = async () => {
        setLoading(true)
        await Promise.all([fetchWallet(), fetchStore()])
        setLoading(false)
    }

    useEffect(() => {
        loadAll()

        // Refresco en vivo cada 5 segundos
        const timer = setInterval(() => {
            fetchWallet()
            if (activeTab === "inventory") fetchStore()
        }, 5000)

        return () => clearInterval(timer)
    }, [activeTab])

    const handleBuyStoreItem = async (itemCode: string) => {
        if (!data?.qr_market_open) {
            showToast("El mercado QR se encuentra en pausa por el Facilitador")
            return
        }

        setBuyingItemCode(itemCode)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/store/buy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ item_code: itemCode })
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await Promise.all([fetchWallet(), fetchStore()])
            } else {
                showToast(result.detail || "Error al comprar artículo")
            }
        } catch (e) {
            showToast("Error de conexión con la tienda")
        } finally {
            setBuyingItemCode(null)
        }
    }

    const copySolanaAddress = () => {
        if (!data?.solana_wallet_address) return
        navigator.clipboard.writeText(data.solana_wallet_address)
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2500)
        showToast("Dirección Solana copiada al portapapeles")
    }

    const houseKey = (data?.house as "APEX" | "IGNIS" | "NEXUS" | "VISIO") || "APEX"
    const houseInfo = CASAS_INFO[houseKey] || CASAS_INFO.APEX
    const isMarketOpen = data?.qr_market_open ?? true

    // Puntos de mérito y topes
    const housePointsToday = data?.session_metrics?.house_points_earned ?? 0
    const housePointsCap = data?.session_metrics?.house_points_cap ?? 3

    // Impulsos activos del usuario
    const activeImpulses = data?.active_impulses || []

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24 text-slate-100">
            {/* TOAST FLOTANTE */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-slate-900 border-2 border-[hsl(74,100%,47%)] text-slate-100 shadow-[0_0_25px_rgba(186,239,0,0.3)] flex items-center gap-3 font-bold text-xs"
                    >
                        <Sparkles className="w-5 h-5 text-[hsl(74,100%,47%)] animate-spin" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER COMPACTO Y ELEGANTE DEL ESTUDIANTE */}
            <div className={`relative overflow-hidden rounded-3xl border ${houseInfo.borderColor} bg-slate-950/80 p-5 md:p-6 backdrop-blur-xl shadow-2xl`}>
                <div
                    className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: houseInfo.glowColor }}
                />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <StudentHouseAvatar
                            studentName={data?.full_name || "Estudiante"}
                            size="md"
                            className="border-2 border-white/20 shadow-xl"
                        />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${houseInfo.badgeBg} ${houseInfo.badgeText} ${houseInfo.borderColor}`}>
                                    Casa {houseInfo.name} · {houseInfo.element}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                                    {data?.house_status?.rank ?? 1}.º Puesto ({data?.house_status?.total_pts ?? 52} pts)
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                                {data?.full_name || "Billetera del Estudiante"}
                            </h1>
                        </div>
                    </div>

                    {/* ESTADO DEL MERCADO QR (ABIERTO / PAUSADO) */}
                    <div className="flex items-center gap-2">
                        {isMarketOpen ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Mercado QR Abierto</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Mercado QR Pausado</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRA DE NAVEGACIÓN EN 2 PESTAÑAS (PRD V3.0.0) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "dashboard"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>1. Inicio (Dashboard)</span>
                </button>

                <button
                    onClick={() => setActiveTab("inventory")}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "inventory"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>2. Inventario & Vitrina</span>
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* PESTAÑA 1: INICIO (DASHBOARD QR & CENTRO DE ACCIÓN)           */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* VISOR DE SALDO EN ENTEROS (0 DECIMALES) CON TOGGLE OJO */}
                    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Saldo Total Disponible
                                    </span>
                                    <button
                                        onClick={() => setShowBalance(!showBalance)}
                                        className="p-1 text-slate-400 hover:text-white transition-colors"
                                        title={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                                    >
                                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl md:text-5xl font-black text-[hsl(74,100%,47%)] tracking-tight tabular-nums">
                                        {showBalance ? (data?.balances?.total_myl ?? 8) : "••••"}
                                    </span>
                                    <span className="text-sm font-black text-emerald-400 font-mono">MYL</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 block mt-1">
                                    Contabilidad estricta en números enteros (0 decimales)
                                </span>
                            </div>

                            {/* DESGLOSE EFECTIVO QR VS SALDO DIGITAL */}
                            <div className="flex sm:flex-col gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Efectivo QR / Fichas:</span>
                                    </div>
                                    <div className="text-lg font-black text-white font-mono">
                                        {showBalance ? `${data?.balances?.cash_myl ?? 4} MYL` : "••••"}
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Saldo Digital Conciliado:</span>
                                    </div>
                                    <div className="text-lg font-black text-white font-mono">
                                        {showBalance ? `${data?.balances?.digital_myl ?? 4} MYL` : "••••"}
                                    </div>
                                </div>
                            </div>

                            {/* PROYECCIÓN DE BONO SESIÓN SIGUIENTE */}
                            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left sm:text-right">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                                    Proyección Bono Próxima Sesión
                                </span>
                                <div className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono mt-0.5">
                                    +{data?.house_status?.bonus_projection?.payout_myl ?? 6} MYL
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400">
                                    {data?.house_status?.bonus_projection?.label ?? "1.º Puesto (+20%)"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ÚLTIMOS 3 MOVIMIENTOS DEL LIBRO MAYOR (RESUMEN COMPACTO) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                Últimos Movimientos Contables
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">Valores en enteros</span>
                        </div>

                        <div className="space-y-2.5">
                            {(data?.recent_ledger || []).slice(0, 3).map((entry: any) => (
                                <div
                                    key={entry.id}
                                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                            entry.amount >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                        }`}>
                                            {entry.amount >= 0 ? "+" : "−"}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{entry.description}</div>
                                            <span className="text-[10px] text-slate-400 font-mono">{entry.date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-black font-mono ${
                                            entry.amount >= 0 ? "text-emerald-400" : "text-amber-400"
                                        }`}>
                                            {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} MYL
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">
                                            {entry.status}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {(!data?.recent_ledger || data.recent_ledger.length === 0) && (
                                <div className="p-8 text-center text-slate-500 text-xs italic">
                                    No hay movimientos registrados en el libro mayor aún.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* PESTAÑA 2: INVENTARIO, PATRIMONIO & VITRINA                    */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "inventory" && (
                <div className="space-y-6">
                    {/* DESGLOSE % BONO VS % MÉRITO */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-amber-400" />
                                    Patrimonio & Razón de Esfuerzo
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Equilibrio entre el bono otorgado a tu Casa y tus puntos individuales de mérito.
                                </p>
                            </div>
                            <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-950 border border-slate-700 text-emerald-400 rounded-xl">
                                Ratio de Esfuerzo: 50% Bono / 50% Mérito
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">Bono de Casa (Gobernanza)</span>
                                <div className="text-2xl font-black text-amber-400 font-mono">
                                    {data?.house_status?.bonus_projection?.payout_myl ?? 5} MYL
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Determinado por el desempeño colectivo de Casa {houseKey} en la ventana móvil.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">Mérito Individual</span>
                                <div className="text-2xl font-black text-emerald-400 font-mono">
                                    {housePointsToday} / {housePointsCap} pts
                                </div>
                                <p className="text-[11px] text-slate-400">
                                    Tope máximo de 3 puntos de casa por sesión por respuestas acertadas y participación.
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 flex items-start gap-2">
                            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Costo de oportunidad:</strong> Gastar tus MYL en consumibles o impulsos reduce tu margen para cooperar en proyectos de equipo y actividades grupales.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MUNDO MOYA RETRO PIXEL-ART */}
            <MundoMoyaModal
                isOpen={showMundoMoyaModal}
                onClose={() => setShowMundoMoyaModal(false)}
                userHouse={houseKey}
                userName={data?.full_name || "Líder"}
                userBalance={data?.balances?.total_myl ?? 8}
                onRewardClaimed={() => fetchWallet()}
            />
        </div>
    )
}
