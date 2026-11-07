"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    QrCode,
    Camera,
    CheckCircle2,
    AlertTriangle,
    X,
    Wallet,
    ArrowRight,
    Coins,
    Shield,
    RefreshCw,
    Send,
    UserCheck,
    Calendar,
    Clock,
    Upload,
    ArrowLeft
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface QRScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccessPayment?: (newBalance: number) => void
}

const HOUSE_THEMES: Record<string, { bg: string, text: string, border: string, badge: string }> = {
    APEX: {
        bg: "bg-purple-950/40",
        text: "text-purple-300",
        border: "border-purple-500/30",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/40"
    },
    IGNIS: {
        bg: "bg-amber-950/40",
        text: "text-amber-300",
        border: "border-amber-500/30",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40"
    },
    NEXUS: {
        bg: "bg-cyan-950/40",
        text: "text-cyan-300",
        border: "border-cyan-500/30",
        badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    },
    VISIO: {
        bg: "bg-emerald-950/40",
        text: "text-emerald-300",
        border: "border-emerald-500/30",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    }
}

export function QRScannerPaymentModal({ isOpen, onClose, onSuccessPayment }: QRScannerModalProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    // Estado del artículo / orden inspeccionada
    const [inspectData, setInspectData] = useState<any | null>(null)
    const [isInspecting, setIsInspecting] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [paymentResult, setPaymentResult] = useState<any | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Monto seleccionado para transferencia P2P
    const [transferAmount, setTransferAmount] = useState<number>(1)

    const scannerRef = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const containerId = "profile-qr-reader-container"

    useEffect(() => {
        if (!isOpen) {
            stopScanner()
            resetStates()
            return
        }

        if (!inspectData && !paymentResult) {
            initScanner()
        }

        return () => {
            stopScanner()
        }
    }, [isOpen, inspectData, paymentResult])

    const resetStates = () => {
        setInspectData(null)
        setPaymentResult(null)
        setErrorMessage(null)
        setCameraError(null)
        setTransferAmount(1)
    }

    const initScanner = async () => {
        setCameraError(null)
        setIsScanning(true)
        try {
            // @ts-ignore
            const { Html5Qrcode } = await import("html5-qrcode")
            await stopScanner()

            const element = document.getElementById(containerId)
            if (!element) return

            const html5Qr = new Html5Qrcode(containerId)
            scannerRef.current = html5Qr

            await html5Qr.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (w: number, h: number) => {
                        const s = Math.min(w, h) * 0.75
                        return { width: s, height: s }
                    }
                },
                (decodedText: string) => {
                    handlePayloadScanned(decodedText)
                },
                () => {} // Ignorar ruidos continuos de frames
            )
        } catch (err: any) {
            console.warn("Camera init error:", err)
            setCameraError("Cámara no disponible o permisos bloqueados en este dispositivo. Puedes subir una captura del código QR.")
        } finally {
            setIsScanning(false)
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop()
                }
                await scannerRef.current.clear()
            } catch (e) {
                // Ignore cleanup errors
            }
            scannerRef.current = null
        }
    }

    const handlePayloadScanned = async (payload: string) => {
        await stopScanner()
        inspectPayload(payload)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            // @ts-ignore
            const { Html5Qrcode } = await import("html5-qrcode")
            const html5Qr = new Html5Qrcode("hidden-file-reader")
            const decoded = await html5Qr.scanFile(file, true)
            if (decoded) {
                await stopScanner()
                inspectPayload(decoded)
            }
        } catch (err) {
            setErrorMessage("No se pudo leer ningún código QR en la imagen seleccionada.")
        }
    }

    const inspectPayload = async (payload: string) => {
        if (!payload || !payload.trim()) return
        setIsInspecting(true)
        setErrorMessage(null)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")

        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/qr/inspect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ qr_payload: payload.trim() })
            })

            const json = await res.json()
            if (res.ok && json.valid) {
                setInspectData({ ...json, raw_payload: payload.trim() })
                if (json.fixed_price && json.fixed_price > 0) {
                    setTransferAmount(json.fixed_price)
                } else if (json.suggested_amount && json.suggested_amount > 0) {
                    setTransferAmount(json.suggested_amount)
                } else {
                    setTransferAmount(1)
                }
            } else {
                setErrorMessage(json.detail || "Código QR no válido para servicios ni transferencias.")
            }
        } catch (e) {
            setErrorMessage("Error de conexión al inspeccionar el código QR.")
        } finally {
            setIsInspecting(false)
        }
    }

    const handleConfirmPayment = async () => {
        if (!inspectData) return
        setIsPaying(true)
        setErrorMessage(null)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")

        try {
            const isP2P = inspectData.type === "p2p_user"
            const bodyPayload: any = isP2P
                ? {
                    recipient_id: inspectData.recipient_id,
                    amount_myl: Math.round(Number(transferAmount))
                }
                : {
                    qr_payload: inspectData.raw_payload
                }

            const res = await fetch(`${API_BASE_URL}/api/myl/qr/pay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(bodyPayload)
            })

            const json = await res.json()
            if (res.ok && json.status === "success") {
                setPaymentResult(json)
                if (onSuccessPayment) {
                    onSuccessPayment(json.new_balance_digital)
                }
            } else {
                setErrorMessage(json.detail || "No se pudo procesar la transferencia. Revisa tu saldo.")
            }
        } catch (e) {
            setErrorMessage("Error de red al procesar la transferencia.")
        } finally {
            setIsPaying(false)
        }
    }

    if (!isOpen) return null

    // Validaciones de transferencia P2P
    const isP2P = inspectData?.type === "p2p_user"
    const userBalance = Number(inspectData?.user_balance_digital ?? 0)
    const amountNum = Math.round(Number(transferAmount))
    const isSelf = Boolean(inspectData?.is_self)
    const isMarketOpen = inspectData?.market_open !== false

    const hasBalance = userBalance >= amountNum
    const isValidAmount = !isNaN(amountNum) && amountNum >= 1 && (isP2P ? amountNum <= userBalance : true)
    const canSubmit = isP2P
        ? (isValidAmount && hasBalance && !isSelf && isMarketOpen && !isPaying)
        : (inspectData?.can_afford && isMarketOpen && !isPaying)

    const houseConfig = inspectData?.recipient_house ? HOUSE_THEMES[inspectData.recipient_house] || HOUSE_THEMES.APEX : HOUSE_THEMES.APEX

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div id="hidden-file-reader" className="hidden" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Cabecera Principal */}
                <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(74,100%,47%)]/10 border border-[hsl(74,100%,47%)]/30 flex items-center justify-center text-[hsl(74,100%,47%)]">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                Pasarela de Transferencias QR
                            </h3>
                            <p className="text-xs text-slate-400">Envío directo de Moyoles entre estudiantes</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Contenido Principal */}
                <div className="p-5 overflow-y-auto space-y-4">
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* CASO 1: CUPÓN OFICIAL ESTILO YAPE (TRANSFERENCIA P2P EXITOSA)     */}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {paymentResult && paymentResult.type === "p2p_voucher" ? (
                        <div className="py-2 space-y-4">
                            {/* Tarjeta Visual Estilo Yape */}
                            <div className="rounded-[2rem] bg-gradient-to-b from-[#74119c] to-[#4c0968] p-5 shadow-2xl space-y-4 text-white">
                                <div className="flex items-center justify-between pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-xs">
                                            S/
                                        </div>
                                        <span className="font-black text-sm tracking-widest uppercase text-white/90">
                                            UCSM · MYL
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white/90">
                                        Oficial
                                    </span>
                                </div>

                                {/* Tarjeta Blanca Interna con detalles */}
                                <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-xl space-y-3.5">
                                    <div>
                                        <h4 className="text-xl font-black text-[#74119c] tracking-tight">
                                            ¡Transferiste!
                                        </h4>
                                        <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">
                                            {paymentResult.amount_myl} MYL
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-base font-black text-slate-900 leading-snug">
                                            {paymentResult.recipient_name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{paymentResult.formatted_datetime || "07 nov. 2026 | 01:30 a. m."}</span>
                                        </div>
                                    </div>

                                    {/* Recuadro Destacado con Borde Rojo: CÓDIGO DE SEGURIDAD [ 9 ] [ 0 ] [ 5 ] */}
                                    <div className="p-3 rounded-2xl border-2 border-red-500 bg-white flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                                            Código de Seguridad
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {(paymentResult.security_digits || [
                                                (paymentResult.security_code || "905")[0] || "9",
                                                (paymentResult.security_code || "905")[1] || "0",
                                                (paymentResult.security_code || "905")[2] || "5"
                                            ]).map((digit: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 font-mono font-black text-base text-slate-900 flex items-center justify-center shadow-inner"
                                                >
                                                    {digit}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Datos de la Transacción */}
                                    <div className="pt-2 border-t border-slate-100 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                            Datos de la Transacción
                                        </span>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Destino:</span>
                                            <span className="font-bold text-slate-800">
                                                Casa {paymentResult.recipient_house}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Destinatario:</span>
                                            <span className="font-mono text-slate-700">
                                                @{paymentResult.recipient_username}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Nro. de operación:</span>
                                            <span className="font-mono font-black text-slate-900 tracking-wide">
                                                {paymentResult.op_number}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                                            <span className="text-slate-500">Saldo actualizado:</span>
                                            <span className="font-mono font-black text-emerald-600">
                                                {paymentResult.new_balance_digital} MYL
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                            >
                                Listo
                            </button>
                        </div>
                    ) : paymentResult ? (
                        /* Caso de Orden de Tienda / Despacho */
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-black text-white">Pago Confirmado</h4>
                            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                                {paymentResult.message}
                            </p>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Nuevo Saldo Digital</span>
                                <span className="text-2xl font-black text-[hsl(74,100%,47%)]">
                                    {paymentResult.new_balance_digital} MYL
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-[hsl(74,100%,47%)] text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-[hsl(74,100%,42%)] transition-all cursor-pointer"
                            >
                                Finalizar
                            </button>
                        </div>
                    ) : inspectData ? (
                        /* ════════════════════════════════════════════════════════════════ */
                        /* CASO 2: COMPAÑERO O SERVICIO DETECTADO - CONFIGURAR Y PAGAR       */
                        /* ════════════════════════════════════════════════════════════════ */
                        <div className="space-y-4">
                            {isP2P ? (
                                /* TARJETA DE TRANSFERENCIA P2P A COMPAÑERO */
                                <div className="space-y-4">
                                    {/* Ficha del Destinatario */}
                                    <div className={`p-5 rounded-3xl ${houseConfig.bg} border ${houseConfig.border} space-y-3`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-black text-base">
                                                    {inspectData.recipient_name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${houseConfig.badge}`}>
                                                        Casa {inspectData.recipient_house}
                                                    </span>
                                                    <h4 className="text-base font-black text-white mt-1">
                                                        {inspectData.recipient_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        @{inspectData.recipient_username}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 truncate">
                                            Solana: {inspectData.recipient_wallet}
                                        </div>
                                    </div>

                                    {/* Saldo Disponible del Emisor */}
                                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs text-slate-300">Tu saldo digital disponible:</span>
                                        </div>
                                        <span className="text-sm font-black font-mono text-emerald-400">
                                            {userBalance} MYL
                                        </span>
                                    </div>

                                    {/* Selector Interactivo de Monto a Enviar */}
                                    <div className="p-4 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-300">
                                                Cantidad de Moyoles a transferir:
                                            </label>
                                            <span className="text-[10px] font-mono text-slate-400">Enteros estrictos</span>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="number"
                                                min={1}
                                                max={userBalance}
                                                step={1}
                                                value={transferAmount || ""}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10)
                                                    setTransferAmount(isNaN(val) ? 0 : val)
                                                }}
                                                className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-xl font-mono font-black text-white focus:outline-none focus:border-[hsl(74,100%,47%)] pr-16"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-[hsl(74,100%,47%)]">
                                                MYL
                                            </span>
                                        </div>

                                        {/* Botones de selección rápida */}
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 4].map((amt) => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    disabled={userBalance < amt}
                                                    onClick={() => setTransferAmount(amt)}
                                                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                                                        transferAmount === amt
                                                            ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] font-black"
                                                            : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                                                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                                                >
                                                    {amt} MYL
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                disabled={userBalance <= 0}
                                                onClick={() => setTransferAmount(userBalance)}
                                                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                                                    transferAmount === userBalance && userBalance > 0
                                                        ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] font-black"
                                                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                                            >
                                                Máx ({userBalance})
                                            </button>
                                        </div>
                                    </div>

                                    {/* Avisos de Validación */}
                                    {isSelf && (
                                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span>No puedes transferirte fondos a ti mismo.</span>
                                        </div>
                                    )}

                                    {!isSelf && userBalance <= 0 && (
                                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span>No tienes saldo digital disponible en tu cuenta para transferir.</span>
                                        </div>
                                    )}

                                    {!isSelf && userBalance > 0 && amountNum > userBalance && (
                                        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span>Saldo insuficiente. Máximo transferible: {userBalance} MYL.</span>
                                        </div>
                                    )}

                                    {!isSelf && userBalance > 0 && amountNum <= 0 && (
                                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span>El monto mínimo a transferir es 1 MYL.</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ARTÍCULO O SERVICIO DE TIENDA OFICIAL */
                                <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-[hsl(74,100%,47%)] border border-slate-700">
                                                Servicio Oficial
                                            </span>
                                            <h4 className="text-base font-black text-white mt-1">
                                                {inspectData.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {inspectData.seller_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Costo</span>
                                            <span className="text-xl font-black text-[hsl(74,100%,47%)] font-mono">
                                                {inspectData.price_myl} MYL
                                            </span>
                                        </div>
                                    </div>
                                    {inspectData.description && (
                                        <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                                            {inspectData.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    onClick={() => {
                                        setInspectData(null)
                                        setErrorMessage(null)
                                    }}
                                    className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Volver</span>
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!canSubmit}
                                    className="flex-1 py-3 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    {isPaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    <span>
                                        {isPaying
                                            ? "Procesando..."
                                            : isP2P
                                                ? `Confirmar y Transferir ${amountNum} MYL`
                                                : `Confirmar y Pagar (${inspectData.price_myl} MYL)`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ════════════════════════════════════════════════════════════════ */
                        /* CASO 3: ESCÁNER EN VIVO CON CÁMARA (SIN SECCIÓN DE TOKENS)        */
                        /* ════════════════════════════════════════════════════════════════ */
                        <div className="space-y-4">
                            <div className="relative rounded-3xl overflow-hidden bg-black border border-slate-800 aspect-square max-h-[290px] mx-auto flex items-center justify-center shadow-inner">
                                <div id={containerId} className="w-full h-full object-cover" />

                                {/* Guía visual de escaneo */}
                                <div className="absolute inset-8 border-2 border-dashed border-[hsl(74,100%,47%)]/60 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-full h-[2px] bg-[hsl(74,100%,47%)] shadow-[0_0_12px_rgba(186,239,0,0.8)] animate-[scan_2.5s_infinite_linear]" />
                                </div>

                                {cameraError && (
                                    <div className="absolute inset-0 bg-slate-950/95 p-5 flex flex-col items-center justify-center text-center text-xs text-slate-300 space-y-3">
                                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                                        <p className="leading-relaxed">{cameraError}</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Subir Captura de QR</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-center text-slate-400">
                                Apunta la cámara al código QR de la credencial o billetera Solana de tu compañero.
                            </p>

                            {/* Botón alternativo para subir imagen QR si la cámara falla o en PC */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Escanear desde imagen o captura</span>
                                </button>
                            </div>

                            {errorMessage && (
                                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {isInspecting && (
                                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-[hsl(74,100%,47%)]" />
                                    <span>Identificando cuenta y credenciales...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
