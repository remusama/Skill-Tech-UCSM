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
    ShoppingBag,
    Coins,
    Shield,
    Sparkles,
    RefreshCw,
    Send
} from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface QRScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccessPayment?: (newBalance: number) => void
}

export function QRScannerPaymentModal({ isOpen, onClose, onSuccessPayment }: QRScannerModalProps) {
    const [scannerMode, setScannerMode] = useState<"camera" | "manual">("camera")
    const [manualCode, setManualCode] = useState("")
    const [isScanning, setIsScanning] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    // Estado del artículo / orden inspeccionada
    const [inspectData, setInspectData] = useState<any | null>(null)
    const [isInspecting, setIsInspecting] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [paymentResult, setPaymentResult] = useState<any | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const scannerRef = useRef<any>(null)
    const containerId = "profile-qr-reader-container"

    useEffect(() => {
        if (!isOpen) {
            stopScanner()
            resetStates()
            return
        }

        if (scannerMode === "camera" && !inspectData && !paymentResult) {
            initScanner()
        }

        return () => {
            stopScanner()
        }
    }, [isOpen, scannerMode, inspectData, paymentResult])

    const resetStates = () => {
        setInspectData(null)
        setPaymentResult(null)
        setErrorMessage(null)
        setCameraError(null)
        setManualCode("")
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
            console.error("Camera error:", err)
            setCameraError("No se pudo iniciar la cámara o permisos denegados. Puedes pegar el token manualmente abajo.")
            setScannerMode("manual")
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
            } else {
                setErrorMessage(json.detail || "Código QR no válido para servicios ni compras de la plataforma.")
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
            const res = await fetch(`${API_BASE_URL}/api/myl/qr/pay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ qr_payload: inspectData.raw_payload })
            })

            const json = await res.json()
            if (res.ok && json.status === "success") {
                setPaymentResult(json)
                if (onSuccessPayment) {
                    onSuccessPayment(json.new_balance_digital)
                }
            } else {
                setErrorMessage(json.detail || "No se pudo procesar el pago. Revisa tu saldo.")
            }
        } catch (e) {
            setErrorMessage("Error de red al procesar el pago.")
        } finally {
            setIsPaying(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Cabecera */}
                <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(74,100%,47%)]/10 border border-[hsl(74,100%,47%)]/30 flex items-center justify-center text-[hsl(74,100%,47%)]">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-wider">
                                Pasarela QR de Servicios & Pagos
                            </h3>
                            <p className="text-xs text-slate-400">Escanea o ingresa el token para pagar con MYL</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Contenido Principal */}
                <div className="p-6 overflow-y-auto space-y-5">
                    {/* Caso 1: PAGO EXITOSO */}
                    {paymentResult ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-black text-white">¡Pago Confirmado!</h4>
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
                                className="w-full py-3.5 rounded-2xl bg-[hsl(74,100%,47%)] text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-[hsl(74,100%,42%)] transition-all"
                            >
                                Finalizar
                            </button>
                        </div>
                    ) : inspectData ? (
                        /* Caso 2: ARTÍCULO INSPECCIONADO - CONFIRMAR PAGO */
                        <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-xl space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-[hsl(74,100%,47%)] border border-slate-700">
                                            {inspectData.type === "p2p_transfer" ? "Intercambio P2P" : "Servicio Oficial"}
                                        </span>
                                        <h4 className="text-lg font-black text-white mt-1.5">
                                            {inspectData.title}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Ofrecido por: <strong className="text-white">{inspectData.seller_name}</strong>
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Costo</span>
                                        <span className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono">
                                            {inspectData.price_myl} MYL
                                        </span>
                                    </div>
                                </div>

                                {inspectData.description && (
                                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                                        {inspectData.description}
                                    </p>
                                )}

                                {/* Comprobación de saldo */}
                                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Wallet className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-300">Tu Saldo Digital Disponible:</span>
                                    </div>
                                    <span className={`text-sm font-black font-mono ${inspectData.can_afford ? "text-emerald-400" : "text-red-400"}`}>
                                        {inspectData.user_balance_digital} MYL
                                    </span>
                                </div>

                                {!inspectData.can_afford && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <span>No tienes suficiente saldo digital para completar este pago.</span>
                                    </div>
                                )}
                            </div>

                            {errorMessage && (
                                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Botones de Confirmación */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setInspectData(null)
                                        setScannerMode("camera")
                                    }}
                                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                                >
                                    Escanear Otro
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!inspectData.can_afford || isPaying}
                                    className="flex-1 py-3 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isPaying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                    <span>{isPaying ? "Procesando..." : `Confirmar y Pagar (${inspectData.price_myl} MYL)`}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Caso 3: MODO ESCÁNER / CÁMARA O INGRESO MANUAL */
                        <div className="space-y-4">
                            {/* Pestañas de Modo */}
                            <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
                                <button
                                    onClick={() => {
                                        setScannerMode("camera")
                                        setErrorMessage(null)
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        scannerMode === "camera"
                                            ? "bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>Cámara en Vivo</span>
                                </button>
                                <button
                                    onClick={() => {
                                        stopScanner()
                                        setScannerMode("manual")
                                        setErrorMessage(null)
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        scannerMode === "manual"
                                            ? "bg-[hsl(74,100%,47%)] text-slate-950 font-black shadow"
                                            : "text-slate-400 hover:text-white"
                                    }`}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Pegar Token / Código</span>
                                </button>
                            </div>

                            {/* Visor de Cámara */}
                            {scannerMode === "camera" && (
                                <div className="relative rounded-3xl overflow-hidden bg-black border border-slate-800 aspect-square max-h-[280px] mx-auto flex items-center justify-center shadow-inner">
                                    <div id={containerId} className="w-full h-full object-cover" />
                                    
                                    {/* Guía visual de escaneo */}
                                    <div className="absolute inset-8 border-2 border-dashed border-[hsl(74,100%,47%)]/60 rounded-2xl pointer-events-none flex items-center justify-center">
                                        <div className="w-full h-[2px] bg-[hsl(74,100%,47%)] shadow-[0_0_12px_rgba(186,239,0,0.8)] animate-[scan_2.5s_infinite_linear]" />
                                    </div>

                                    {cameraError && (
                                        <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center text-xs text-amber-300">
                                            <AlertTriangle className="w-8 h-8 mb-2" />
                                            <span>{cameraError}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Entrada Manual de Token / Código */}
                            {scannerMode === "manual" && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-300 block">
                                        Token QR o Código de Servicio / Transferencia:
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder='Pega aquí el código QR, JSON de transferencia o código de artículo (ej: {"type":"p2p_transfer", "asset_name":"Insumo A", "price":4...} o IMPULSO_BONO)'
                                        className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-[hsl(74,100%,47%)]"
                                    />
                                    <button
                                        onClick={() => inspectPayload(manualCode)}
                                        disabled={!manualCode.trim() || isInspecting}
                                        className="w-full py-3 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        {isInspecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        <span>{isInspecting ? "Inspeccionando..." : "Cargar y Ver Precio"}</span>
                                    </button>
                                </div>
                            )}

                            {/* Atajos Rápidos de Servicios Oficiales */}
                            <div className="pt-2 border-t border-slate-800/80">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                    O prueba pagar servicios rápidos de la tienda:
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => inspectPayload("IMPULSO_FICHAS")}
                                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                                    >
                                        <div className="text-xs font-bold text-white truncate">Impulso Fichas</div>
                                        <div className="text-[10px] text-[hsl(74,100%,47%)] font-mono font-bold">2 MYL</div>
                                    </button>
                                    <button
                                        onClick={() => inspectPayload("INSIGNIA_NFT_LIDER")}
                                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                                    >
                                        <div className="text-xs font-bold text-white truncate">Insignia Digital NFT</div>
                                        <div className="text-[10px] text-[hsl(74,100%,47%)] font-mono font-bold">5 MYL</div>
                                    </button>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

