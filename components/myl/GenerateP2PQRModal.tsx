"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { QrCode, X, Copy, Check, Sparkles, Send, Tag } from "lucide-react"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[hsl(74,100%,47%)]/10 border border-[hsl(74,100%,47%)]/30 flex items-center justify-center text-[hsl(74,100%,47%)]">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-wider">
                                Generar QR de Cobro P2P
                            </h3>
                            <p className="text-xs text-slate-400">Token con tu nombre, precio y lo que ofreces</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {generatedToken && qrImageUrl ? (
                        <div className="text-center space-y-4">
                            {/* Visualización del QR */}
                            <div className="relative mx-auto p-5 bg-white rounded-3xl border-4 border-[hsl(74,100%,47%)] shadow-2xl aspect-square w-60 flex items-center justify-center">
                                <img
                                    src={qrImageUrl}
                                    alt="QR Transferencia P2P"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div>
                                <h4 className="text-lg font-black text-white">{assetName}</h4>
                                <div className="text-2xl font-black text-[hsl(74,100%,47%)] font-mono mt-0.5">
                                    {priceMyl} MYL
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Vendedor: <strong className="text-white">{userName || "Tú"}</strong>
                                </p>
                            </div>

                            <p className="text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 leading-relaxed">
                                Muestra este código para que tu compañero lo escanee con su pasarela QR desde su perfil o plataforma.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                    <span>{copied ? "Copiado al portapapeles" : "Copiar Token QR"}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setGeneratedToken(null)
                                        setQrImageUrl(null)
                                    }}
                                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                                >
                                    Crear Otro
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    ¿Qué artículo, insumo o servicio ofreces?
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Módulo Actuador, Pliego MDF, Asesoría..."
                                    value={assetName}
                                    onChange={(e) => setAssetName(e.target.value)}
                                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[hsl(74,100%,47%)]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">
                                    Precio en Números Enteros (MYL)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={priceMyl}
                                    onChange={(e) => setPriceMyl(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-lg font-black font-mono text-[hsl(74,100%,47%)] focus:outline-none focus:border-[hsl(74,100%,47%)]"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                    Contabilidad estricta: 0 decimales. Sin centavos.
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating || !assetName.trim()}
                                className="w-full py-3.5 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
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

