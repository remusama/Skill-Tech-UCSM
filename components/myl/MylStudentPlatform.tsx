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
    ChevronRight,
    QrCode,
    Radio,
    DollarSign,
    Info,
    HelpCircle,
    Package,
    ArrowUpRight,
    ScanLine,
    Tag,
    Eye,
    EyeOff,
    Gamepad2,
    Copy,
    Check,
    Award,
    AlertCircle,
    MessageCircle,
    CheckCircle2
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { CASAS_INFO } from "@/lib/casasData"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"
import { QRScannerPaymentModal } from "@/components/myl/QRScannerPaymentModal"
import { GenerateP2PQRModal } from "@/components/myl/GenerateP2PQRModal"
import { MundoMoyaModal } from "@/components/myl/MundoMoyaModal"

type StudentTab = "dashboard" | "inventory" | "profile_hw"

export function MylStudentPlatform() {
    const [activeTab, setActiveTab] = useState<StudentTab>("dashboard")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [storeData, setStoreData] = useState<any>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Privacidad: Ocultar o mostrar saldo
    const [showBalance, setShowBalance] = useState(true)

    // Modales QR y Mundo Moya
    const [showQRScanModal, setShowQRScanModal] = useState(false)
    const [showGenerateQRModal, setShowGenerateQRModal] = useState(false)
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

            {/* BARRA DE NAVEGACIÓN EN 3 PESTAÑAS CANÓNICAS (PRD V3.0.0) */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
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

                <button
                    onClick={() => setActiveTab("profile_hw")}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "profile_hw"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <QrCode className="w-4 h-4" />
                    <span>3. Perfil & Hardware</span>
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

                    {/* BOTONES DUALES DE ACCIÓN QR RÁPIDA (CENTRO DE OPERACIONES) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* BOTÓN 1: ESCANEAR QR DE CAJA / COMPRA */}
                        <button
                            onClick={() => {
                                if (!isMarketOpen) {
                                    showToast("El mercado QR se encuentra cerrado por el facilitador.")
                                    return
                                }
                                setShowQRScanModal(true)
                            }}
                            className={`p-6 rounded-3xl border transition-all text-left flex items-center justify-between group shadow-xl ${
                                isMarketOpen
                                    ? "bg-slate-900/90 hover:bg-slate-900 border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] cursor-pointer"
                                    : "bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed"
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-lg">
                                    <ScanLine className="w-7 h-7" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                                        Pagar Insumos o Tienda
                                    </span>
                                    <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                                        Escanear QR de Caja
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Escanea la factura oficial o token P2P con confirmación
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* BOTÓN 2: COBRAR / P2P CON QR */}
                        <button
                            onClick={() => setShowGenerateQRModal(true)}
                            className="p-6 rounded-3xl bg-slate-900/90 hover:bg-slate-900 border border-[hsl(74,100%,47%)]/40 hover:border-[hsl(74,100%,47%)] hover:shadow-[0_0_25px_rgba(186,239,0,0.2)] transition-all text-left flex items-center justify-between group shadow-xl cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[hsl(74,100%,47%)]/20 border border-[hsl(74,100%,47%)]/50 flex items-center justify-center text-[hsl(74,100%,47%)] group-hover:scale-105 transition-transform shadow-lg">
                                    <Tag className="w-7 h-7" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)] block">
                                        Transferencia / Venta
                                    </span>
                                    <h3 className="text-lg font-black text-white group-hover:text-[hsl(74,100%,47%)] transition-colors">
                                        Cobrar / P2P con QR
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Genera tu código QR con tu nombre, precio y oferta
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                    {/* WIDGET INTERACTIVO DE MOYA & ACCESO AL MUNDO RETRO */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-amber-950/40 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                {/* AVATAR DE MOYA ANIMADO */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-amber-500/30 border-2 border-[hsl(74,100%,47%)]/60 flex items-center justify-center shadow-lg animate-pulse">
                                        <span className="text-3xl select-none">🐾</span>
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[hsl(74,100%,47%)] text-slate-950 font-black text-[9px] uppercase">
                                        Moya
                                    </span>
                                </div>

                                {/* GLOBO DE DIÁLOGO RPG EN VIVO */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(74,100%,47%)]">
                                            {data?.moya_broadcast?.type === "alert" ? "🚨 Alerta del Facilitador" : "💬 Mensaje de Moya en Vivo"}
                                        </span>
                                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                                            Fase: {data?.active_phase || "Apertura"}
                                        </span>
                                    </div>

                                    <div className="relative p-3.5 bg-slate-950/90 border border-slate-700/80 rounded-2xl text-xs text-slate-200 font-medium leading-relaxed shadow-inner">
                                        "{data?.moya_broadcast?.message || "¡Hola líder! Los acuerdos presenciales con respeto generan el mayor rendimiento para tu Casa."}"
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN VIBRANTE PARA ENTRAR AL MUNDO RETRO */}
                            <button
                                onClick={() => setShowMundoMoyaModal(true)}
                                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[hsl(74,100%,47%)] to-emerald-400 hover:from-[hsl(74,100%,42%)] hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(186,239,0,0.4)] flex items-center justify-center gap-2.5 transition-all cursor-pointer flex-shrink-0 active:scale-95"
                            >
                                <Gamepad2 className="w-5 h-5 text-slate-950" />
                                <span>Entrar al Mundo Moya (Pixel-Art)</span>
                            </button>
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

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300">
                            💡 <strong>Costo de oportunidad:</strong> Gastar tus MYL en consumibles o impulsos reduce tu margen para cooperar en proyectos de equipo y actividades grupales.
                        </div>
                    </div>

                    {/* SECCIÓN DE IMPULSOS ACTIVOS (MÁXIMO 2 - REGLA ANTIACAPARAMIENTO) */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-[hsl(74,100%,47%)]" />
                                    Impulsos Tácticos Activos
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Regla antiacaparamiento: máximo 2 unidades activas simultáneas.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                                Activos: {activeImpulses.length} / 2
                            </span>
                        </div>

                        {activeImpulses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {activeImpulses.map((imp: any) => (
                                    <div key={imp.id} className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-white text-sm">{imp.title || "Impulso Táctico"}</div>
                                            <span className="text-[10px] text-emerald-400 font-mono">Válido en la sesión</span>
                                        </div>
                                        <button
                                            onClick={() => showToast(`Impulso declarado para la actividad de Casa ${houseKey}`)}
                                            className="px-3 py-1.5 rounded-xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black text-xs uppercase"
                                        >
                                            Declarar / Usar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-500">
                                No tienes impulsos activos actualmente. Puedes adquirir hasta 2 en la tienda oficial cuando el mercado esté abierto.
                            </div>
                        )}
                    </div>

                    {/* TIENDA OFICIAL DE IMPULSOS TÁCTICOS */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                                Catálogo de Impulsos Oficiales (Mercado Primario)
                            </h3>
                            <span className="text-[11px] text-slate-400">Precios regulados por demanda</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(storeData?.items || []).map((item: any) => (
                                <div key={item.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                {item.target_scope}
                                            </span>
                                            {item.high_demand && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    🔥 Alta Demanda
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-black text-white mt-2">{item.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                                        <div className="text-xl font-black text-[hsl(74,100%,47%)] font-mono">
                                            {item.current_price_myl} MYL
                                        </div>

                                        <button
                                            onClick={() => handleBuyStoreItem(item.code)}
                                            disabled={!item.can_buy || buyingItemCode === item.code || !isMarketOpen}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                item.can_buy && isMarketOpen
                                                    ? "bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 shadow-md cursor-pointer"
                                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {buyingItemCode === item.code ? "Procesando..." : item.units_active_user >= 2 ? "Tope 2/2" : "Comprar"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VITRINA DE LOGROS & TROFEOS DE CASA */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            Vitrina de Logros & Trofeos
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                                <span className="text-2xl">🏆</span>
                                <div className="text-xs font-bold text-white">Casa {houseKey}</div>
                                <span className="text-[10px] text-emerald-400 font-mono">{data?.house_status?.total_pts ?? 52} pts</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                                <span className="text-2xl">🤝</span>
                                <div className="text-xs font-bold text-white">Trueque Justo</div>
                                <span className="text-[10px] text-slate-400 font-mono">Completado</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                                <span className="text-2xl">🛡️</span>
                                <div className="text-xs font-bold text-white">Cero Polizones</div>
                                <span className="text-[10px] text-slate-400 font-mono">En curso</span>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1">
                                <span className="text-2xl">🐾</span>
                                <div className="text-xs font-bold text-white">Amigo de Moya</div>
                                <span className="text-[10px] text-[hsl(74,100%,47%)] font-mono">Descubierto</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* PESTAÑA 3: PERFIL & HARDWARE (CREDENCIAL, NFC, SOLANA)         */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "profile_hw" && (
                <div className="space-y-6">
                    {/* CREDENCIAL DIGITAL & QR RECEPTOR PERSONAL ESTÁTICO */}
                    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl flex flex-col items-center text-center space-y-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d0b04d] bg-[#d0b04d]/10 px-3.5 py-1 rounded-full border border-[#d0b04d]/20">
                            CREDENCIAL DIGITAL ACTIVA · RECEPTOR
                        </span>

                        {/* CÓDIGO QR ESTÁTICO RECEPTOR */}
                        <div className="p-5 bg-white rounded-3xl border border-white/20 shadow-2xl aspect-square w-52 flex items-center justify-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                    data?.solana_wallet_address || data?.username || "STUDENT-MYL"
                                )}`}
                                alt="QR Personal Receptor"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div>
                            <h3 className="text-xl font-black text-white">{data?.full_name || "Estudiante"}</h3>
                            <p className="text-xs text-slate-400 font-mono">@{data?.username || "usuario"}</p>
                        </div>

                        <p className="text-xs text-slate-400 max-w-sm">
                            Este código QR es tu receptor estático para recibir MYL directamente de tus compañeros de clase o bonificaciones del facilitador.
                        </p>
                    </div>

                    {/* IDENTIFICADOR HARDWARE NFC */}
                    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Identificador de Tarjeta Física NFC
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                NFC ACTIVO
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                            <span className="font-mono text-sm text-[#d0b04d] font-black tracking-widest">
                                SKILL-DD1E14A6FB6E
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Banda 13.56 MHz</span>
                        </div>
                    </div>

                    {/* BILLETERA SOLANA TOKEN-2022 */}
                    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Dirección de Cuenta Solana Token-2022
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">
                                Mainnet Ready
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                            <span className="font-mono text-xs text-slate-300 truncate">
                                {data?.solana_wallet_address || "Cargando dirección..."}
                            </span>
                            <button
                                onClick={copySolanaAddress}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex-shrink-0"
                                title="Copiar dirección"
                            >
                                {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* MEDIDOR DE PUNTOS DE CASA DEL DÍA (TOPE 3/3 PTS) */}
                    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-white">Tope Individual de Mérito del Día</h4>
                                <p className="text-xs text-slate-400">
                                    Máximo 3 Puntos de Casa por sesión para evitar saturación y premiar la constancia.
                                </p>
                            </div>
                            <span className={`text-base font-black font-mono px-3 py-1 rounded-xl ${
                                housePointsToday >= 3 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-white"
                            }`}>
                                {housePointsToday} / {housePointsCap} pts
                            </span>
                        </div>

                        {/* BARRA VISUAL DE PROGRESO */}
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-[hsl(74,100%,47%)] transition-all duration-500"
                                style={{ width: `${Math.min(100, (housePointsToday / housePointsCap) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES QR GLOBALES */}
            <QRScannerPaymentModal
                isOpen={showQRScanModal}
                onClose={() => setShowQRScanModal(false)}
                onSuccessPayment={async () => {
                    await fetchWallet()
                    showToast("¡Pago procesado exitosamente!")
                }}
            />

            <GenerateP2PQRModal
                isOpen={showGenerateQRModal}
                onClose={() => setShowGenerateQRModal(false)}
                userName={data?.full_name || data?.username}
            />

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
