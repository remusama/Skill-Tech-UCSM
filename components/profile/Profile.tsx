"use client";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MagicCard } from "@/components/ui/magic-card"
import { BlurFade } from "@/components/ui/blur-fade"
import { fetchUserProfile, UserProfile } from "@/lib/api/user"
import { fetchStudentToken, regenerateStudentToken } from "@/lib/api/attendance"
import { QrCode, ScanLine, Tag, Wallet, Coins, RefreshCw } from "lucide-react"
import { QRScannerPaymentModal } from "@/components/myl/QRScannerPaymentModal"
import { GenerateP2PQRModal } from "@/components/myl/GenerateP2PQRModal"
import { API_BASE_URL } from "@/lib/config"

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [studentToken, setStudentToken] = useState("")
  const [loadingToken, setLoadingToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Saldo Digital MYL
  const [digitalBalance, setDigitalBalance] = useState<number | null>(null)

  // Modales de Pasarela QR y Cobro P2P
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  useEffect(() => {
    loadProfile()
    loadMylBalance()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const [userData, tokenData] = await Promise.all([
        fetchUserProfile(),
        fetchStudentToken()
      ])

      if (userData) {
        setProfile(userData)
      }
      if (tokenData) {
        setStudentToken(tokenData)
      }
    } catch (error) {
      console.error("Error loading profile data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMylBalance = async () => {
    const token = localStorage.getItem("eleonor_token") || localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/api/myl/me`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      })
      if (res.ok) {
        const data = await res.json()
        setDigitalBalance(data?.balances?.digital_myl ?? 0)
      }
    } catch (e) {
      console.error("Error loading MYL balance:", e)
    }
  }

  const handleRegenerateToken = async () => {
    setLoadingToken(true)
    try {
      const newToken = await regenerateStudentToken()
      setStudentToken(newToken)
    } catch (error) {
      console.error("Error regenerating token:", error)
    } finally {
      setLoadingToken(false)
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 md:p-8 bg-transparent relative overflow-hidden">
      {/* Fondos Ambientales */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0d971f]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d0b04d]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 mx-auto flex items-center justify-center">
        <BlurFade delay={0.1} inView className="w-full">
          <MagicCard className="w-full p-8 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0d971f]/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d0b04d]/5 rounded-full blur-[40px] pointer-events-none" />

            <div className="w-full flex flex-col items-center text-center">
              {/* Badge Centrado */}
              <div className="flex justify-center mb-6 w-full">
                <span className="inline-flex items-center justify-center text-[9px] font-black uppercase tracking-[0.2em] text-[#d0b04d] bg-[#d0b04d]/10 px-3.5 py-1 rounded-full border border-[#d0b04d]/20">
                  CREDENCIAL DIGITAL ACTIVA
                </span>
              </div>

              {/* Código QR Centrado */}
              <div className="relative mx-auto p-6 bg-white rounded-[2rem] border border-white/10 shadow-2xl mb-6 aspect-square w-56 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <div className="animate-pulse w-full h-full bg-gray-200 rounded-xl" />
                ) : studentToken ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${studentToken}`}
                    alt="QR Code"
                    className="w-full h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                    <QrCode size={40} className="animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Sin Token</span>
                  </div>
                )}
                {/* Scanline effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#0d971f] shadow-[0_0_8px_rgba(13,151,31,0.8)] animate-[scan_3s_infinite_linear] pointer-events-none" />
              </div>

              <h4 className="text-xl font-black text-white italic uppercase tracking-wide text-center w-full">
                {isLoading ? "Cargando..." : (profile?.full_name || profile?.username)}
              </h4>
              <p className="text-xs text-gray-400 font-bold tracking-wider mt-0.5 text-center w-full">
                {isLoading ? "" : `@${profile?.username}`}
              </p>

              {/* NFC Info */}
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left relative">
                <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider block">Identificador NFC</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs text-[#d0b04d] font-black tracking-widest truncate max-w-[150px]">
                    {isLoading ? "Cargando..." : (studentToken || "No asignado")}
                  </span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                    NFC ACTIVO
                  </span>
                </div>
              </div>

              {/* ── BOTONES DE PAGO Y COBRO QR DE SERVICIOS ── */}
              <div className="w-full mt-5 pt-5 border-t border-white/10 space-y-3">
                {/* Visualizador de Saldo Digital */}
                <div className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Saldo Digital MYL</span>
                      <span className="text-sm font-black font-mono text-white">
                        {digitalBalance !== null ? `${digitalBalance} MYL` : "Cargando..."}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-[hsl(74,100%,47%)]/10 text-[hsl(74,100%,47%)] rounded-lg border border-[hsl(74,100%,47%)]/20">
                    Enteros Estrictos
                  </span>
                </div>

                {/* Acciones Rápidas QR */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="p-3 rounded-2xl bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Escanear y Pagar</span>
                  </button>

                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Tag className="w-4 h-4 text-[#d0b04d]" />
                    <span>Cobrar con QR</span>
                  </button>
                </div>
              </div>
            </div>

          </MagicCard>
        </BlurFade>
      </div>

      {/* MODAL 1: ESCANEAR Y PAGAR QR */}
      <QRScannerPaymentModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSuccessPayment={(newBal) => {
          setDigitalBalance(newBal)
        }}
      />

      {/* MODAL 2: GENERAR TOKEN QR P2P */}
      <GenerateP2PQRModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        userName={profile?.full_name || profile?.username}
      />
    </div>
  )
}
