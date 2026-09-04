"use client";

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
    <div className="min-h-[85vh] flex items-center justify-center p-4 md:p-8 bg-transparent relative overflow-hidden">
      {/* Fondos Ambientales */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0d971f]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d0b04d]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
      <BlurFade delay={0.1} inView>
        <MagicCard className="p-8 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border-white/5 shadow-2xl flex flex-col items-center text-center relative overflow-hidden pt-12">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0d971f]/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d0b04d]/5 rounded-full blur-[40px] pointer-events-none" />

          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d0b04d] bg-[#d0b04d]/10 px-4 py-1.5 rounded-full border border-[#d0b04d]/20 mb-2">
            CREDENCIAL DIGITAL ACTIVA
          </span>

          {/* Código QR */}
          <div className="relative mt-4 p-6 bg-white rounded-[2rem] border border-white/10 shadow-2xl mb-6 aspect-square w-60 flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <div className="animate-pulse w-full h-full bg-gray-200 rounded-xl" />
            ) : studentToken ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${studentToken}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                <QrCode size={44} className="animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Sin Token</span>
              </div>
            )}
          </div>

          <h4 className="text-xl font-black text-white italic uppercase tracking-wide leading-tight">
            {isLoading ? "Cargando..." : (profile?.full_name || profile?.username || "Usuario")}
          </h4>
          <p className="text-xs text-gray-400 font-bold tracking-wider mt-1">
            {isLoading ? "" : `@${profile?.username || "sin_usuario"}`}
          </p>

          {/* NFC Info */}
          <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 mt-6 text-left relative">
            <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Identificador NFC</span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="font-mono text-xs text-[#d0b04d] font-black tracking-widest truncate max-w-[180px]">
                {isLoading ? "Cargando..." : (studentToken || "No asignado")}
              </span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded">
                NFC ACTIVO
              </span>
            </div>
          </div>

        </MagicCard>
      </BlurFade>
      </div>
    </div>
  )
}