"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { QrCode, X, Copy, Check, Sparkles, Send, Tag, Coins } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface GenerateP2PQRModalProps {
    isOpen: boolean
    onClose: () => void
    userName?: string
}

export function GenerateP2PQRModal({ isOpen, onClose, userName }: GenerateP2PQRModalProps) {
    const [assetName, setAssetName] = useState("")
    const [priceMyl, setPriceMyl] = useState<number>(3)
    const [generatedToken, setGeneratedToken] = useState<string | null>(null)
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assetName.trim() || priceMyl <= 0) return

        setIsGenerating(true)
        const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")

        try {
            const res = await fetch(`${API_BASE_URL}/api/myl/qr/generate-p2p`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    asset_name: assetName.trim(),
                    price_myl: Math.round(priceMyl)
                })
            })

            const data = await res.json()
            if (res.ok && data.qr_payload) {
                setGeneratedToken(data.qr_payload)
                const encoded = encodeURIComponent(data.qr_payload)
                setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encoded}`)
            }
        } catch (err) {
            console.error("Error generating QR token:", err)
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = () => {
        if (!generatedToken) return
        navigator.clipboard.writeText(generatedToken)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-[#021811]/95 border border-emerald-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(3,35,24,0.8),0_0_25px_rgba(186,239,0,0.15)] overflow-hidden flex flex-col relative"
            >
                {/* Luces Ambientales de Fondo */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0d971f]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#d0b04d]/15 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40 relative z-10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#032318] border border-[hsl(74,100%,47%)]/40 flex items-center justify-center text-[hsl(74,100%,47%)] shadow-[0_0_15px_rgba(186,239,0,0.25)]">
                            <Tag className="w-5 h-5 text-[#d0b04d]" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d0b04d] bg-[#d0b04d]/10 px-2 py-0.5 rounded-full border border-[#d0b04d]/25">
                                COBRO P2P · SKILL-TECH UCSM
                            </span>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
                                Generar QR de Cobro P2P
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

                <div className="p-5 space-y-4 relative z-10">
                    {generatedToken && qrImageUrl ? (
                        <div className="text-center space-y-4">
                            {/* Visualización del QR Institucional */}
                            <div className="relative mx-auto p-5 bg-white rounded-3xl border-4 border-[#032318] shadow-[0_0_30px_rgba(186,239,0,0.2)] aspect-square w-60 flex items-center justify-center">
                                <img
                                    src={qrImageUrl}
                                    alt="QR Transferencia P2P"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#0d971f] shadow-[0_0_8px_rgba(13,151,31,0.8)] animate-[scan_3s_infinite_linear] pointer-events-none rounded-t-3xl" />
                            </div>

                            <div className="bg-black/50 border border-white/10 p-4 rounded-2xl">
                                <h4 className="text-base font-black text-white">{assetName}</h4>
                                <div className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono mt-0.5">
                                    {priceMyl} MYL
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Vendedor: <strong className="text-[#d0b04d]">{userName || "Tú"}</strong>
                                </p>
                            </div>

                            <p className="text-[11px] text-slate-400 bg-black/40 p-3 rounded-2xl border border-white/5 leading-relaxed">
                                Muestra este código para que tu compañero lo escanee con su pasarela QR desde su perfil o plataforma.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                >
                                    {copied ? <Check className="w-4 h-4 text-[hsl(74,100%,47%)]" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                    <span>{copied ? "Copiado al portapapeles" : "Copiar Token QR"}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setGeneratedToken(null)
                                        setQrImageUrl(null)
                                    }}
                                    className="px-4 py-3 rounded-2xl bg-black/60 hover:bg-black/80 border border-emerald-500/30 text-[hsl(74,100%,47%)] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                    Crear Otro
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-slate-200 block mb-1.5">
                                    ¿Qué artículo, insumo o servicio ofreces?
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Módulo Actuador, Pliego MDF, Asesoría..."
                                    value={assetName}
                                    onChange={(e) => setAssetName(e.target.value)}
                                    className="w-full p-3.5 bg-black/60 border border-emerald-500/30 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[hsl(74,100%,47%)] focus:ring-1 focus:ring-[hsl(74,100%,47%)] shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-slate-200 block mb-1.5">
                                    Precio en Números Enteros (MYL)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={priceMyl}
                                        onChange={(e) => setPriceMyl(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full p-3.5 bg-black/60 border border-emerald-500/30 rounded-2xl text-xl font-black font-mono text-[hsl(74,100%,47%)] focus:outline-none focus:border-[hsl(74,100%,47%)] focus:ring-1 focus:ring-[hsl(74,100%,47%)] pr-16 shadow-inner"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-sm text-[hsl(74,100%,47%)]">
                                        MYL
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Contabilidad estricta: 0 decimales. Sin centavos.
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating || !assetName.trim()}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[hsl(74,100%,47%)] to-emerald-400 hover:from-[hsl(74,100%,43%)] hover:to-emerald-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(186,239,0,0.35)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.98]"
                            >
                                <QrCode className="w-4 h-4" />
                                <span>{isGenerating ? "Generando..." : "Generar Código QR de Cobro"}</span>
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
