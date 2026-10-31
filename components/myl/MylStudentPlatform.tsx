"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Wallet,
    Coins,
    Shield,
    Users,
    ShoppingBag,
    ArrowLeftRight,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Lock,
    Unlock,
    Flame,
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
    ShieldAlert,
    ScanLine,
    Tag
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { CASAS_INFO, getStudentHouseProfile } from "@/lib/casasData"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"
import { QRScannerPaymentModal } from "@/components/myl/QRScannerPaymentModal"
import { GenerateP2PQRModal } from "@/components/myl/GenerateP2PQRModal"

type TabType = "wallet" | "desk" | "store" | "p2p"

export function MylStudentPlatform() {
    const [activeTab, setActiveTab] = useState<TabType>("wallet")
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [deskData, setDeskData] = useState<any>(null)
    const [storeData, setStoreData] = useState<any>(null)
    const [p2pData, setP2PData] = useState<any>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Modales y formularios
    const [contributionAmount, setContributionAmount] = useState<number>(4)
    const [isContributing, setIsContributing] = useState(false)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [buyingItemCode, setBuyingItemCode] = useState<string | null>(null)

    // Formulario P2P & QR Modales
    const [showCreateP2PModal, setShowCreateP2PModal] = useState(false)
    const [p2pAssetName, setP2PAssetName] = useState("Impulso Fichas (+4 MYL)")
    const [p2pPrice, setP2PPrice] = useState<number>(4)
    const [p2pWarningModal, setP2PWarningModal] = useState<any>(null)
    const [showQRScanModal, setShowQRScanModal] = useState(false)
    const [showGenerateQRModal, setShowGenerateQRModal] = useState(false)

    const showToast = (msg: string) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(null), 4500)
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

    const fetchDesk = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/house-desk`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) {
                const json = await res.json()
                setDeskData(json)
            }
        } catch (e) {
            console.error("Error cargando mesa de casa:", e)
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

    const fetchP2P = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/p2p`, {
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            if (res.ok) {
                const json = await res.json()
                setP2PData(json)
            }
        } catch (e) {
            console.error("Error cargando P2P:", e)
        }
    }

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true)
            await Promise.all([fetchWallet(), fetchDesk(), fetchStore(), fetchP2P()])
            setLoading(false)
        }
        loadAll()

        // Ciclo de refresco en vivo cada 5 segundos
        const timer = setInterval(() => {
            fetchWallet()
            if (activeTab === "desk") fetchDesk()
            if (activeTab === "store") fetchStore()
            if (activeTab === "p2p") fetchP2P()
        }, 5000)

        return () => clearInterval(timer)
    }, [activeTab])

    const handleContribute = async () => {
        if (contributionAmount <= 0) return
        setIsContributing(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/house-desk/contribute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ amount_myl: Math.round(contributionAmount) })
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await Promise.all([fetchWallet(), fetchDesk()])
            } else {
                showToast(result.detail || "Error al realizar aporte")
            }
        } catch (e) {
            showToast("Error de conexión al aportar")
        } finally {
            setIsContributing(false)
        }
    }

    const handleCheckout = async () => {
        setIsCheckingOut(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/house-desk/checkout`, {
                method: "POST",
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                await fetchDesk()
            } else {
                showToast(result.detail || "Error al confirmar orden")
            }
        } catch (e) {
            showToast("Error de conexión al confirmar orden")
        } finally {
            setIsCheckingOut(false)
        }
    }

    const handleBuyStoreItem = async (itemCode: string) => {
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

    const handleCreateP2P = async () => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/p2p/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ asset_name: p2pAssetName, price_myl: Math.round(p2pPrice) })
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                setShowCreateP2PModal(false)
                await fetchP2P()
            } else {
                showToast(result.detail || "Error al publicar orden")
            }
        } catch (e) {
            showToast("Error de conexión al publicar en P2P")
        }
    }

    const handleBuyP2P = async (order: any) => {
        // Alerta obligatoria si es intercambio desigual (> 30% de desviación)
        if (order.is_unequal_trade) {
            setP2PWarningModal(order)
            return
        }
        executeP2PBuy(order.id)
    }

    const executeP2PBuy = async (orderId: number) => {
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/p2p/buy/${orderId}`, {
                method: "POST",
                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
            })
            const result = await res.json()
            if (res.ok) {
                showToast(result.message)
                setP2PWarningModal(null)
                await Promise.all([fetchWallet(), fetchP2P()])
            } else {
                showToast(result.detail || "Error al comprar en P2P")
            }
        } catch (e) {
            showToast("Error de conexión en mercado P2P")
        }
    }

    const houseKey = (data?.house as "APEX" | "IGNIS" | "NEXUS" | "VISIO") || "APEX"
    const houseInfo = CASAS_INFO[houseKey] || CASAS_INFO.APEX

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-24 text-slate-100">
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

            {/* HEADER DE BIENVENIDA & IDENTIDAD DE CASA */}
            <div className={`relative overflow-hidden rounded-3xl border ${houseInfo.borderColor} bg-slate-950/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl`}>
                <div
                    className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: houseInfo.glowColor }}
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <StudentHouseAvatar
                            studentName={data?.full_name || "Estudiante"}
                            size="lg"
                            className="border-2 border-white/20 shadow-xl"
                        />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] px-2.5 py-0.5 rounded-full bg-[hsl(74,100%,47%)] text-slate-950 font-mono">
                                    Tokenomía Solana Token-2022
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full border ${houseInfo.badgeBg} ${houseInfo.badgeText} ${houseInfo.borderColor}`}>
                                    Casa {houseInfo.name} · {houseInfo.element}
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                                <span>{data?.full_name || "Billetera del Estudiante"}</span>
                            </h1>
                            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                                Dirección Solana: <span className="text-slate-300 font-bold">{data?.solana_wallet_address ? `${data.solana_wallet_address.slice(0, 8)}...${data.solana_wallet_address.slice(-6)}` : "Aprovisionando..."}</span>
                            </p>
                        </div>
                    </div>

                    {/* WIDGET DE BALANCE EN ENTEROS (0 DECIMALES ESTRICTO) */}
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center gap-6 shadow-xl">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Saldo Total Disponible</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-4xl font-black text-[hsl(74,100%,47%)] tracking-tight tabular-nums">
                                    {data?.balances?.total_myl ?? 8}
                                </span>
                                <span className="text-xs font-black text-emerald-400 font-mono">MYL (Enteros)</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">0 decimales en toda la plataforma</span>
                        </div>

                        <div className="border-l border-slate-800 pl-4 space-y-1 text-xs">
                            <div className="flex items-center gap-2" title="Fichas físicas en MDF retiradas en caja o cobradas en clase">
                                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-slate-400">Efectivo QR:</span>
                                <strong className="text-white font-mono">{data?.balances?.cash_myl ?? 4} MYL</strong>
                            </div>
                            <div className="flex items-center gap-2" title="Fondos conciliados en cuenta digital">
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-slate-400">Saldo Digital:</span>
                                <strong className="text-white font-mono">{data?.balances?.digital_myl ?? 4} MYL</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE NAVEGACIÓN INFERIOR / SUB-TABS DE LOS 4 MÓDULOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <button
                    onClick={() => setActiveTab("wallet")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "wallet"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>Módulo A: Billetera</span>
                </button>

                <button
                    onClick={() => setActiveTab("desk")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "desk"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Módulo B: Mesa Casa</span>
                </button>

                <button
                    onClick={() => setActiveTab("store")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "store"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Módulo C: Tienda</span>
                </button>

                <button
                    onClick={() => setActiveTab("p2p")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === "p2p"
                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_15px_rgba(186,239,0,0.35)]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Módulo D: P2P</span>
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3.1 MÓDULO A: DASHBOARD Y BILLETERA PERSONAL                  */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "wallet" && (
                <div className="space-y-6">
                    {/* PANEL DE ESTADO COMPETITIVO DE CASA & BONO PROYECTADO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Puesto en Tiempo Real
                            </span>
                            <div className="flex items-center gap-3">
                                <Trophy className="w-8 h-8 text-amber-400" />
                                <div>
                                    <div className="text-3xl font-black text-white">
                                        {data?.house_status?.rank ?? 1}.º Puesto
                                    </div>
                                    <span className="text-xs text-emerald-400 font-bold">Casa {houseKey}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                Ventana Móvil (2 Sesiones)
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white tabular-nums">
                                    {data?.house_status?.total_pts ?? 52} pts
                                </span>
                                <span className="text-xs text-slate-400">
                                    (St-1: {data?.house_status?.st_prev ?? 28} + St: {data?.house_status?.st_curr ?? 24})
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Dif. con casa inferior: <strong className="text-emerald-400">+{data?.house_status?.diff_down ?? 4} pts</strong>
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                                Proyección de Bono Siguiente Sesión
                            </span>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-black text-[hsl(74,100%,47%)] tabular-nums">
                                        {data?.house_status?.bonus_projection?.payout_myl ?? 6} MYL
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Multiplicador: {data?.house_status?.bonus_projection?.multiplier ?? 1.2}×
                                    </span>
                                </div>
                                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    {data?.house_status?.bonus_projection?.label ?? "1.º Puesto (+20%)"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MITIGACIÓN DE LA ABSTRACCIÓN MONETARIA (FICHA TANGIBLE) */}
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-emerald-500/10 border border-amber-500/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-xl">
                                    <Coins className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Equivalencia en Esfuerzo Individual</h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Cada <strong>1 MYL</strong> equivale a 1 respuesta acertada en el bloque individual de mérito.
                                    </p>
                                    <span className="text-[11px] text-amber-300/80 mt-1 block">
                                        💡 Advertencia de costo de oportunidad: Gastar fondos en tienda reduce tu margen de aporte para insumos de equipo.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                                    Tope Individual de Mérito: {data?.session_metrics?.house_points_earned ?? 0} / 3 pts
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* LIBRO MAYOR CONTABLE (RECENT LEDGER) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                Libro Mayor Contable (Últimos Movimientos)
                            </h3>
                            <span className="text-xs text-slate-500">Transacciones estrictas en enteros</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Concepto</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Monto</th>
                                        <th className="p-3">Estado Solana</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.recent_ledger || []).map((entry: any) => (
                                        <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="p-3 font-mono text-slate-400">{entry.date}</td>
                                            <td className="p-3 font-bold text-slate-200">{entry.description}</td>
                                            <td className="p-3 font-mono text-slate-400">{entry.entry_type}</td>
                                            <td className={`p-3 font-black font-mono text-sm ${entry.amount >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                                                {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} MYL
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {entry.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.recent_ledger || data.recent_ledger.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-500">
                                                No hay movimientos registrados en el libro mayor aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3.2 MÓDULO B: MESA DE CONTROL DE LA CASA (MATERIALES)         */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "desk" && (
                <div className="space-y-6">
                    {/* ESTADO DEL CARRITO GRUPAL & TECHO PRESUPUESTARIO */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[hsl(74,100%,47%)] text-slate-950">
                                        Hoja de Pedido Grupal
                                    </span>
                                    <span className="text-xs text-slate-400">Casa {deskData?.house} · Sesión {deskData?.session_number}</span>
                                </div>
                                <h2 className="text-2xl font-black text-white mt-1">Presupuesto y Materiales de Equipo</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Gasto de referencia estimado: <strong>48 MYL</strong> · Techo presupuestario (60%): <strong>~50 MYL</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recaudado / Requerido</span>
                                    <div className="text-2xl font-black text-white font-mono mt-0.5">
                                        <span className="text-[hsl(74,100%,47%)]">{deskData?.order?.total_collected_myl ?? 0}</span> / {deskData?.order?.total_cost_myl ?? 48} MYL
                                    </div>
                                    <div className="w-48 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-[hsl(74,100%,47%)] transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((deskData?.order?.total_collected_myl ?? 0) / (deskData?.order?.total_cost_myl ?? 48)) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={!deskData?.order?.can_checkout || isCheckingOut}
                                    className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                        deskData?.order?.can_checkout
                                            ? "bg-[hsl(74,100%,47%)] text-slate-950 shadow-[0_0_20px_rgba(186,239,0,0.4)] hover:bg-[hsl(74,100%,42%)] cursor-pointer"
                                            : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                                    }`}
                                >
                                    {deskData?.order?.is_covered ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    <span>{isCheckingOut ? "Confirmando..." : "Confirmar y Pagar Pedido"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MATRIZ DE COHESIÓN Y APORTES EN VIVO (12 MIEMBROS) */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    Matriz de Cohesión de los 12 Miembros (Aportes en Vivo)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Cuota equitativa sugerida: <strong>4 MYL por persona</strong>. Los aportes de 0 MYL quedan destacados.
                                </p>
                            </div>

                            {/* PASARELA DE APORTE INDIVIDUAL */}
                            <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-700">
                                <span className="text-xs font-bold text-slate-300 ml-2">Mi Aporte:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={data?.balances?.digital_myl ?? 8}
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono font-black text-sm text-[hsl(74,100%,47%)]"
                                />
                                <span className="text-xs text-slate-400">MYL</span>
                                <button
                                    onClick={handleContribute}
                                    disabled={isContributing || (data?.balances?.digital_myl ?? 0) <= 0}
                                    className="px-4 py-2 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black rounded-xl text-xs transition-all disabled:opacity-40"
                                >
                                    {isContributing ? "Aportando..." : "Transferir"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                            {(deskData?.members_contributions || []).map((m: any) => (
                                <div
                                    key={m.user_id}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        m.is_free_rider
                                            ? "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20"
                                            : "bg-slate-950/60 border-slate-800"
                                    } ${m.is_me ? "ring-2 ring-[hsl(74,100%,47%)]/50" : ""}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <StudentHouseAvatar studentName={m.full_name} size="sm" />
                                            <div>
                                                <div className="text-xs font-bold text-white truncate max-w-[120px]">{m.full_name}</div>
                                                <span className="text-[10px] text-slate-400">Saldo: {m.digital_balance} MYL</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className={`text-sm font-black font-mono ${m.is_free_rider ? "text-red-400" : "text-emerald-400"}`}>
                                                {m.amount_myl} MYL
                                            </span>
                                            {m.is_free_rider && (
                                                <span className="block text-[9px] font-black uppercase tracking-wider text-red-400 mt-0.5">
                                                    Sin Aporte
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CATÁLOGO DE MATERIALES A LA CARTA */}
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Package className="w-4 h-4 text-[hsl(74,100%,47%)]" />
                            Catálogo de Insumos «a la Carta»
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(deskData?.materials_catalog || []).map((mat: any) => (
                                <div key={mat.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white">{mat.name}</span>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                                {mat.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{mat.description}</p>
                                    </div>
                                    <div className="text-right pl-4">
                                        <span className="text-lg font-black text-[hsl(74,100%,47%)] font-mono">{mat.cost_myl} MYL</span>
                                        <span className="text-[10px] text-slate-500 block">Stock: {mat.stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3.3 MÓDULO C: TIENDA OFICIAL E IMPULSOS (MERCADO PRIMARIO)     */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "store" && (
                <div className="space-y-6">
                    {/* BANNER DE ESTADO Y TEMPORIZADOR DE BLOQUEO */}
                    <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                Mercado Primario Oficial
                            </span>
                            <h2 className="text-xl font-black text-white mt-0.5">Tienda de Impulsos Tácticos & Consumibles</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Fase actual: <strong className="text-emerald-400">{storeData?.active_phase}</strong>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {storeData?.is_market_locked ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold">
                                    <Lock className="w-4 h-4" />
                                    <span>Mercado Bloqueado (Actividad Grupal en Curso)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                                    <Clock className="w-4 h-4" />
                                    <span>Ventana de Compra Abierta</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ARTÍCULOS E IMPULSOS CON PRECIOS DINÁMICOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(storeData?.items || []).map((item: any) => (
                            <div key={item.id} className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                            {item.target_scope}
                                        </span>
                                        {item.high_demand && (
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                                🔥 Alta Demanda / Escasez
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-black text-white mt-2">{item.title}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Precio Dinámico</span>
                                        <div className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono">
                                            {item.current_price_myl} MYL
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            Activos: <strong>{item.units_active_user}/2</strong>
                                        </span>
                                        <button
                                            onClick={() => handleBuyStoreItem(item.code)}
                                            disabled={!item.can_buy || buyingItemCode === item.code}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                item.can_buy
                                                    ? "bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 shadow-lg cursor-pointer"
                                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {buyingItemCode === item.code ? "Activando..." : item.units_active_user >= 2 ? "Tope Máximo" : "Comprar"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 3.4 MÓDULO D: MERCADO SECUNDARIO P2P                          */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeTab === "p2p" && (
                <div className="space-y-6">
                    {/* HEADER & BOTÓN PARA PUBLICAR */}
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(74,100%,47%)]">
                                Transferencia P2P compatible con QR
                            </span>
                            <h2 className="text-2xl font-black text-white mt-0.5">Mercado & Cobros QR P2P</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Genera tu token QR de cobro con tu nombre, precio y oferta o escanea directamente.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={() => setShowQRScanModal(true)}
                                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-all shadow"
                            >
                                <ScanLine className="w-4 h-4 text-[hsl(74,100%,47%)]" />
                                <span>Escanear y Pagar QR</span>
                            </button>

                            <button
                                onClick={() => setShowGenerateQRModal(true)}
                                className="px-5 py-2.5 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl flex items-center gap-2 transition-all"
                            >
                                <Tag className="w-4 h-4" />
                                <span>+ Crear Token / QR de Venta</span>
                            </button>
                        </div>
                    </div>

                    {/* MODAL DE PUBLICAR ORDEN */}
                    {showCreateP2PModal && (
                        <div className="p-6 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-4 shadow-2xl">
                            <h3 className="text-base font-bold text-white">Publicar Activo en Mercado P2P</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Activo / Impulso</label>
                                    <input
                                        type="text"
                                        value={p2pAssetName}
                                        onChange={(e) => setP2PAssetName(e.target.value)}
                                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1">Precio en Enteros (MYL)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={p2pPrice}
                                        onChange={(e) => setP2PPrice(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold font-mono text-[hsl(74,100%,47%)]"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateP2PModal(false)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateP2P}
                                    className="px-5 py-2 bg-[hsl(74,100%,47%)] text-slate-950 font-black rounded-xl text-xs"
                                >
                                    Confirmar y Publicar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODAL OBLIGATORIO DE ALERTA POR INTERCAMBIO DESIGUAL (> 30%) */}
                    {p2pWarningModal && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-amber-500 shadow-2xl space-y-4">
                                <div className="flex items-center gap-3 text-amber-400">
                                    <ShieldAlert className="w-8 h-8" />
                                    <h3 className="text-lg font-black text-white">Alerta de Intercambio Desigual</h3>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    El valor acordado para <strong>{p2pWarningModal.asset_name}</strong> ({p2pWarningModal.price_myl} MYL) difiere sustancialmente (más de un ±30%) del promedio histórico del mercado ({p2pData?.market_median_price} MYL).
                                </p>
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 font-mono">
                                    ⚠️ Esta operación quedará registrada en el historial de auditoría de la consola del facilitador para detectar posible colusión.
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setP2PWarningModal(null)}
                                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => executeP2PBuy(p2pWarningModal.id)}
                                        className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs"
                                    >
                                        Aceptar y Continuar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LISTA DE ÓRDENES ABIERTAS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(p2pData?.open_orders || []).map((ord: any) => (
                            <div key={ord.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{ord.asset_name}</span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                            Casa {ord.seller_house}
                                        </span>
                                        {ord.is_unequal_trade && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                                Alerta ±30%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Cuota quemada en Solana: <strong className="text-emerald-400 font-mono">{ord.burn_fee_myl} MYL</strong> {ord.is_my_house ? "(Exención Intracasa)" : ""}
                                    </p>
                                </div>

                                <div className="text-right pl-4">
                                    <div className="text-xl font-black text-[hsl(74,100%,47%)] font-mono">{ord.price_myl} MYL</div>
                                    {!ord.is_my_order ? (
                                        <button
                                            onClick={() => handleBuyP2P(ord)}
                                            className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider"
                                        >
                                            Comprar
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-slate-500 font-bold block mt-1">Tu orden</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(!p2pData?.open_orders || p2pData.open_orders.length === 0) && (
                            <div className="col-span-2 p-12 text-center text-slate-500 text-xs italic bg-slate-900/30 rounded-3xl border border-slate-800">
                                No hay órdenes P2P abiertas en este momento. ¡Sé el primero en publicar una oferta!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALES QR GLOBALES DE LA PLATAFORMA */}
            <QRScannerPaymentModal
                isOpen={showQRScanModal}
                onClose={() => setShowQRScanModal(false)}
                onSuccessPayment={(newBal) => {
                    fetchWallet()
                    fetchP2P()
                }}
            />

            <GenerateP2PQRModal
                isOpen={showGenerateQRModal}
                onClose={() => setShowGenerateQRModal(false)}
                userName={data?.full_name || data?.username}
            />
        </div>
    )
}

