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
    ArrowLeft,
    Copy,
    Check,
    Sparkles,
    Flame,
    Lock
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { CASAS_INFO } from "@/lib/casasData"
import { StudentHouseAvatar } from "@/components/avatar/StudentHouseAvatar"

interface QRScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccessPayment?: (newBalance: number) => void
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
    const [copiedOp, setCopiedOp] = useState(false)

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
        setCopiedOp(false)
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
                () => { } // Ignorar ruidos continuos de frames
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
        } finally {
            if (e.target) {
                e.target.value = ""
            }
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

    const copyOpNumber = (num: string) => {
        if (!num) return
        navigator.clipboard.writeText(num)
        setCopiedOp(true)
        setTimeout(() => setCopiedOp(false), 2000)
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

    // Casa del destinatario para temas
    const rawHouse = inspectData?.recipient_house as "APEX" | "IGNIS" | "NEXUS" | "VISIO" | undefined
    const recipientCasa = rawHouse && CASAS_INFO[rawHouse] ? CASAS_INFO[rawHouse] : CASAS_INFO.APEX

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
            <div id="hidden-file-reader" className="hidden" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-[#021811]/95 border border-emerald-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(3,35,24,0.8),0_0_25px_rgba(186,239,0,0.15)] overflow-hidden flex flex-col max-h-[92vh] relative"
            >
                {/* Luces Ambientales de Fondo */}
                <div className="absolute -top-20 -right-20 w-52 h-52 bg-[#0d971f]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-[#d0b04d]/15 rounded-full blur-3xl pointer-events-none" />

                {/* ── CABECERA PRINCIPAL ESTILO SKILL-TECH UCSM ── */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40 relative z-10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#032318] border border-[hsl(74,100%,47%)]/40 flex items-center justify-center text-[hsl(74,100%,47%)] shadow-[0_0_15px_rgba(186,239,0,0.25)]">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d0b04d] bg-[#d0b04d]/10 px-2 py-0.5 rounded-full border border-[#d0b04d]/25">
                                    PASARELA DIGITAL UCSM
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
                                Pagos & Transferencias MYL
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── CONTENIDO PRINCIPAL SCROLLABLE ── */}
                <div className="p-5 overflow-y-auto space-y-4 relative z-10">
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {/* CASO 1: VOUCHER OFICIAL SKILL-TECH UCSM (TRANSFERENCIA P2P EXITOSA)*/}
                    {/* ════════════════════════════════════════════════════════════════ */}
                    {paymentResult && paymentResult.type === "p2p_voucher" ? (
                        <div className="py-1 space-y-4">
                            {/* Comprobante Oficial UCSM */}
                            <div className="rounded-[2.2rem] bg-gradient-to-b from-[#03291c] via-[#021d14] to-[#01140e] border border-[#d0b04d]/30 p-5 shadow-2xl space-y-4 relative overflow-hidden">
                                {/* Decoraciones de esquina */}
                                <div className="absolute top-0 right-0 w-28 h-28 bg-[#d0b04d]/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-28 h-28 bg-[hsl(74,100%,47%)]/10 rounded-full blur-2xl pointer-events-none" />

                                {/* Encabezado Institucional */}
                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-[#032318] border border-[#d0b04d]/40 flex items-center justify-center text-[#d0b04d] font-black text-xs shadow-inner">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="font-black text-xs tracking-wider uppercase text-white block">
                                                Skill-Tech UCSM
                                            </span>
                                            <span className="text-[9px] font-mono font-bold text-[#d0b04d] tracking-widest block uppercase">
                                                Economía de Casas
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[hsl(74,100%,47%)] flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(74,100%,47%)] animate-pulse" />
                                        Confirmado
                                    </span>
                                </div>

                                {/* Monto Transferido */}
                                <div className="text-center py-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                                        Transferencia Exitosa
                                    </span>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-4xl font-black text-white font-mono tracking-tight">
                                            {paymentResult.amount_myl}
                                        </span>
                                        <span className="text-lg font-black text-[hsl(74,100%,47%)] font-mono">
                                            MYL
                                        </span>
                                    </div>
                                </div>

                                {/* Tarjeta Interna de Destinatario */}
                                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                        <StudentHouseAvatar
                                            studentName={paymentResult.recipient_name}
                                            username={paymentResult.recipient_username}
                                            size="sm"
                                            className="border border-[#d0b04d]/30"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-black text-white truncate">
                                                {paymentResult.recipient_name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[10px] font-bold text-[#d0b04d]">
                                                    @{paymentResult.recipient_username}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                                    Casa {paymentResult.recipient_house}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                                        <Calendar className="w-3.5 h-3.5 text-[#d0b04d]" />
                                        <span>{paymentResult.formatted_datetime || "Fecha y hora confirmada"}</span>
                                    </div>
                                </div>

                                {/* Código de Validación Criptográfica UCSM */}
                                <div className="p-3.5 rounded-2xl border border-[hsl(74,100%,47%)]/30 bg-[#032318]/70 flex items-center justify-between shadow-inner">
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#d0b04d] block">
                                            Código de Validación
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Seguridad Criptográfica
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {(paymentResult.security_digits || [
                                            (paymentResult.security_code || "905")[0] || "9",
                                            (paymentResult.security_code || "905")[1] || "0",
                                            (paymentResult.security_code || "905")[2] || "5"
                                        ]).map((digit: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="w-8 h-8 rounded-xl bg-black/80 border border-[hsl(74,100%,47%)]/50 font-mono font-black text-base text-[hsl(74,100%,47%)] flex items-center justify-center shadow-[0_0_8px_rgba(186,239,0,0.2)]"
                                            >
                                                {digit}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Detalle Técnico y Libro Mayor */}
                                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Nro. de Operación:</span>
                                        <button
                                            onClick={() => copyOpNumber(paymentResult.op_number)}
                                            className="flex items-center gap-1 font-mono font-black text-white hover:text-[hsl(74,100%,47%)] transition-colors cursor-pointer"
                                            title="Copiar Nro de Operación"
                                        >
                                            <span>{paymentResult.op_number}</span>
                                            {copiedOp ? <Check className="w-3 h-3 text-[hsl(74,100%,47%)]" /> : <Copy className="w-3 h-3 text-slate-500" />}
                                        </button>
                                    </div>

                                    {paymentResult.fee_burned_myl !== undefined && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-orange-400" />
                                                Cuota quemada en Solana:
                                            </span>
                                            <span className="font-mono font-bold text-orange-300">
                                                {paymentResult.fee_burned_myl} MYL
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                                        <span className="text-slate-400">Tu nuevo saldo digital:</span>
                                        <span className="font-mono font-black text-[hsl(74,100%,47%)] text-sm">
                                            {paymentResult.new_balance_digital} MYL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[hsl(74,100%,47%)] to-emerald-400 hover:from-[hsl(74,100%,43%)] hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(186,239,0,0.35)] transition-all cursor-pointer active:scale-[0.98]"
                            >
                                Listo / Finalizar
                            </button>
                        </div>
                    ) : paymentResult ? (
                        /* Caso de Orden de Tienda / Despacho */
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[hsl(74,100%,47%)]/15 border border-[hsl(74,100%,47%)]/50 text-[hsl(74,100%,47%)] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(186,239,0,0.3)]">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase tracking-wider">Pago Confirmado</h4>
                            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                                {paymentResult.message}
                            </p>
                            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 font-mono text-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Nuevo Saldo Digital</span>
                                <span className="text-2xl font-black text-[hsl(74,100%,47%)]">
                                    {paymentResult.new_balance_digital} MYL
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[hsl(74,100%,47%)] to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(186,239,0,0.3)] transition-all cursor-pointer"
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
                                    {/* Ficha del Destinatario con Avatar de Casa */}
                                    <div className={`p-5 rounded-3xl ${recipientCasa.badgeBg} border ${recipientCasa.borderColor} space-y-3 relative overflow-hidden backdrop-blur-md shadow-xl`}>
                                        <div
                                            className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none"
                                            style={{ backgroundColor: recipientCasa.glowColor }}
                                        />

                                        <div className="flex items-center gap-3.5 relative z-10">
                                            <StudentHouseAvatar
                                                studentName={inspectData.recipient_name}
                                                username={inspectData.recipient_username}
                                                size="lg"
                                                className="border-2 border-white/20 shadow-xl"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${recipientCasa.badgeBg} ${recipientCasa.badgeText} ${recipientCasa.borderColor}`}>
                                                        Casa {recipientCasa.name} · {recipientCasa.element}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-black text-white mt-1 leading-snug">
                                                    {inspectData.recipient_name}
                                                </h4>
                                                <p className="text-xs text-[#d0b04d] font-bold">
                                                    @{inspectData.recipient_username}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-[10px] font-mono text-slate-300 bg-black/60 p-2.5 rounded-xl border border-white/10 truncate flex items-center justify-between gap-2">
                                            <span className="truncate">Solana: {inspectData.recipient_wallet}</span>
                                            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        </div>
                                    </div>

                                    {/* Saldo Disponible del Emisor */}
                                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-[#d0b04d]/10 border border-[#d0b04d]/30 flex items-center justify-center text-[#d0b04d]">
                                                <Coins className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs text-slate-300 font-medium">Tu saldo digital disponible:</span>
                                        </div>
                                        <span className="text-sm font-black font-mono text-[hsl(74,100%,47%)]">
                                            {userBalance} MYL
                                        </span>
                                    </div>

                                    {/* Selector Interactivo de Monto a Enviar */}
                                    <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-200">
                                                Monto a Transferir
                                            </label>
                                            <span className="text-[10px] font-mono text-[#d0b04d]">Enteros estrictos</span>
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
                                                className="w-full p-3.5 bg-black/70 border border-emerald-500/30 rounded-2xl text-2xl font-mono font-black text-white focus:outline-none focus:border-[hsl(74,100%,47%)] focus:ring-1 focus:ring-[hsl(74,100%,47%)] pr-16 shadow-inner"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-[hsl(74,100%,47%)]">
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
                                                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${transferAmount === amt
                                                        ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] font-black shadow-[0_0_12px_rgba(186,239,0,0.35)]"
                                                        : "bg-black/60 text-slate-300 border-white/10 hover:border-emerald-500/40"
                                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                                >
                                                    {amt} MYL
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                disabled={userBalance <= 0}
                                                onClick={() => setTransferAmount(userBalance)}
                                                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${transferAmount === userBalance && userBalance > 0
                                                    ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] font-black shadow-[0_0_12px_rgba(186,239,0,0.35)]"
                                                    : "bg-black/60 text-slate-300 border-white/10 hover:border-emerald-500/40"
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
                                <div className="p-5 rounded-3xl bg-black/50 border border-emerald-500/30 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[hsl(74,100%,47%)] border border-emerald-500/30">
                                                Servicio Oficial
                                            </span>
                                            <h4 className="text-base font-black text-white mt-1">
                                                {inspectData.title}
                                            </h4>
                                            <p className="text-xs text-[#d0b04d] mt-0.5">
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
                                        <p className="text-xs text-slate-300 bg-black/60 p-3 rounded-2xl border border-white/5">
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
                                    className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Volver</span>
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!canSubmit}
                                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[hsl(74,100%,47%)] to-emerald-400 hover:from-[hsl(74,100%,43%)] hover:to-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(186,239,0,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    {isPaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    <span>
                                        {isPaying
                                            ? "Procesando en Solana..."
                                            : isP2P
                                                ? `Confirmar y Transferir ${amountNum} MYL`
                                                : `Confirmar y Pagar (${inspectData.price_myl} MYL)`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ════════════════════════════════════════════════════════════════ */
                        /* CASO 3: ESCÁNER EN VIVO CON CÁMARA (O SUBIDA DE IMAGEN)           */
                        /* ════════════════════════════════════════════════════════════════ */
                        <div className="space-y-4">
                            <div className="relative rounded-3xl overflow-hidden bg-black border border-emerald-500/30 aspect-square max-h-[290px] mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(3,35,24,0.6)]">
                                <div id={containerId} className="w-full h-full object-cover" />

                                {/* Guía visual de escaneo con diseño futurista */}
                                <div className="absolute inset-8 border-2 border-dashed border-[hsl(74,100%,47%)]/50 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-full h-[2px] bg-[hsl(74,100%,47%)] shadow-[0_0_12px_rgba(186,239,0,0.8)] animate-[scan_2.5s_infinite_linear]" />
                                </div>

                                {cameraError && (
                                    <div className="absolute inset-0 bg-[#021811]/95 p-5 flex flex-col items-center justify-center text-center text-xs text-slate-300 space-y-3">
                                        <AlertTriangle className="w-8 h-8 text-[#d0b04d]" />
                                        <p className="leading-relaxed text-slate-300">{cameraError}</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[hsl(74,100%,47%)] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Subir Captura de QR</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-center text-slate-400 font-medium">
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

                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 rounded-2xl bg-black/60 hover:bg-emerald-950/60 border border-emerald-500/30 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95 group"
                                >
                                    <Upload className="w-4 h-4 text-[#d0b04d] group-hover:text-[hsl(74,100%,47%)] transition-colors" />
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
                                <div className="p-3 rounded-2xl bg-black/60 border border-emerald-500/30 text-xs text-slate-300 font-medium flex items-center justify-center gap-2">
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
