"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MagicCard } from "@/components/ui/magic-card"
import { BlurFade } from "@/components/ui/blur-fade"
import { fetchUserProfile, UserProfile } from "@/lib/api/user"
import { fetchStudentToken, regenerateStudentToken } from "@/lib/api/attendance"
import { QrCode } from "lucide-react"

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [studentToken, setStudentToken] = useState("")
  const [loadingToken, setLoadingToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
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
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B500D1]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 mx-auto flex items-center justify-center">
        <BlurFade delay={0.1} inView className="w-full">
          <MagicCard className="w-full p-8 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#B500D1]/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none" />

            <div className="w-full flex flex-col items-center text-center">
              {/* Badge Centrado */}
              <div className="flex justify-center mb-6 w-full">
                <span className="inline-flex items-center justify-center text-[9px] font-black uppercase tracking-[0.2em] text-[#B500D1] bg-[#B500D1]/10 px-3.5 py-1 rounded-full border border-[#B500D1]/20">
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
                <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-[scan_3s_infinite_linear] pointer-events-none" />
              </div>

              <h4 className="text-xl font-black text-white italic uppercase tracking-wide text-center w-full">
                {isLoading ? "Cargando..." : (profile?.full_name || profile?.username)}
              </h4>
              <p className="text-xs text-gray-500 font-bold tracking-wider mt-0.5 text-center w-full">
                {isLoading ? "" : `@${profile?.username}`}
              </p>

              {/* NFC Info */}
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left relative">
                <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block">Identificador NFC</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs text-cyan-400 font-black tracking-widest truncate max-w-[150px]">
                    {isLoading ? "Cargando..." : (studentToken || "No asignado")}
                  </span>
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                    NFC ACTIVO
                  </span>
                </div>
              </div>
            </div>

          </MagicCard>
        </BlurFade>
      </div>
    </div>
  )
}
