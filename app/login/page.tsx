"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"

export default function LoginRoute() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState("Iniciando sesión con Google...")

    useEffect(() => {
        if (typeof window === 'undefined') return

        const hash = window.location.hash
        if (!hash) {
            router.push("/")
            return
        }

        const params = new URLSearchParams(hash.substring(1))
        const idToken = params.get("id_token")
        if (!idToken) {
            router.push("/")
            return
        }

        const handleGoogleLogin = async () => {
            try {
                const savedRole = localStorage.getItem("google_oauth_role") || "student"
                localStorage.removeItem("google_oauth_role")

                const resp = await fetch(`${API_BASE_URL}/api/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: idToken, role: savedRole })
                })

                const data = await resp.json()
                if (!resp.ok) {
                    throw new Error(data.detail || "Error en la autenticación con Google")
                }

                localStorage.setItem("eleonor_token", data.token)
                localStorage.setItem("eleonor_user", JSON.stringify(data.user))
                
                setStatus("¡Autenticación exitosa! Redirigiendo...")
                router.push("/")
            } catch (err: any) {
                setError(err.message || "Error al iniciar sesión con Google")
            }
        }

        handleGoogleLogin()
    }, [router])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0121] text-white p-4">
                <div className="bg-red-950/40 border border-red-500/30 p-6 rounded-xl max-w-md text-center">
                    <p className="text-red-400 font-semibold mb-4 text-lg">Error de Autenticación</p>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button 
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0121] text-white gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-gray-300 font-medium">{status}</p>
        </div>
    )
}