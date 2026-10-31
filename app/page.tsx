"use client"

import { useState, useEffect } from "react"
import { SidebarNavigation } from "@/components/layout/SidebarNavigation"
import dynamic from 'next/dynamic'
import { Profile } from "@/components/profile/Profile"
import { Practice } from "@/components/dashboard/Practice"
import { LoginPage } from "@/components/auth/LoginPage"
import { Settings } from "@/components/profile/Settings"
import { Onboarding } from "@/components/onboarding/Onboarding"

// Componentes Pesados - Carga Diferida (Lazy Load) para optimizar el JS inicial
const VirtualAssistant = dynamic(() => import("@/components/avatar/VirtualAssistant").then(mod => mod.VirtualAssistant), { ssr: false })
const SkillMap = dynamic(() => import("@/components/dashboard/SkillMap").then(mod => mod.SkillMap), { ssr: false })
const Achievements = dynamic(() => import("@/components/dashboard/Achievements").then(mod => mod.Achievements), { ssr: false })
const ResultsPage = dynamic(() => import("@/components/quiz/ResultsPage").then(mod => mod.ResultsPage), { ssr: false })
const MentorDashboard = dynamic(() => import("@/components/mentor/MentorDashboard").then(mod => mod.MentorDashboard), { ssr: false })
const AgentCreator = dynamic(() => import("@/components/mentor/AgentCreator").then(mod => mod.AgentCreator), { ssr: false })
const ExamCreator = dynamic(() => import("@/components/mentor/ExamCreator").then(mod => mod.ExamCreator), { ssr: false })
const MentorAttendance = dynamic(() => import("@/components/mentor/MentorAttendance").then(mod => mod.MentorAttendance), { ssr: false })
const PsicometriaDashboard = dynamic(() => import("@/components/mentor/PsicometriaDashboard").then(mod => mod.PsicometriaDashboard), { ssr: false })
const AvatarDisplay = dynamic(() => import("@/components/avatar/AvatarDisplay"), { ssr: false })
const PonenciasPanel = dynamic(() => import("@/components/quiz/PonenciasPanel").then(mod => mod.PonenciasPanel), { ssr: false })
const PonenciasManagerPanel = dynamic(() => import("@/components/mentor/PonenciasManagerPanel").then(mod => mod.PonenciasManagerPanel), { ssr: false })

import { useEleonor } from "@/contexts/eleonor-context"
import { API_BASE_URL } from "@/lib/config"
import Image from "next/image"
import { Menu } from "lucide-react"

const PAGE_TITLE_MAP: Record<string, string> = {
  "skillmap": "SkillMap",
  "practice": "Level Up",
  "diagnosis": "Liderómetro",
  "assistant": "Tororo IA",
  "ponencias": "Ponencias",
  "settings": "Configuración",
  "achievements": "Logros",
  "profile": "Mi Perfil",
  "mentor-dashboard": "Dashboard",
  "mentor-attendance": "Asistencias",
  "mentor-psicometria": "Psicometría",
  "mentor-students": "Mis Estudiantes",
  "mentor-groups": "Equipos de Mentoría",
  "mentor-ponencias": "Gestión Ponencias",
  "mentor-archives": "Archivos",
  "mentor-agents": "Agentes",
}

// Importar AvatarDisplay lazy para usarlo en el grid ya definido arriba

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState("skillmap")
  const [isLoaded, setIsLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userRole, setUserRole] = useState("student")
  const [isNavVisible, setIsNavVisible] = useState(true)

  const { hide: hideEleonor, setPage, preload, presence, isGuideActive, enterPresence } = useEleonor()
  const showEleonorColumn = currentPage === "assistant" || isGuideActive || presence === "GUIDE_ACTIVE"

  // Control de scroll para auto-hide y auto-insert de la barra móvil flotante
  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          const delta = currentY - lastY

          // Si está cerca del tope (< 45px), siempre visible
          if (currentY < 45) {
            setIsNavVisible(true)
          }
          // Si hace scroll hacia abajo más de 8px y pasó el inicio, ocultar fuera de pantalla
          else if (delta > 8 && currentY > 60) {
            setIsNavVisible(false)
          }
          // Si hace scroll hacia arriba (más de 6px), reinsertar con animación
          else if (delta < -6) {
            setIsNavVisible(true)
          }

          lastY = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Al cambiar de página, asegurar que la barra esté visible
  useEffect(() => {
    setIsNavVisible(true)
  }, [currentPage])

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const token = localStorage.getItem("eleonor_token")
    if (token) {
      setIsLoggedIn(true)
      preload()

      // Verificar si ya completó el onboarding
      const userStr = localStorage.getItem("eleonor_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setUserRole(user.role || "student")
          if (user.has_onboarded || user.role === "teacher") {
            setShowOnboarding(false)
          } else {
            setShowOnboarding(true)
          }
        } catch (e) {
          console.error("Error parsing user profile:", e)
        }
      }
    }
  }, [preload])

  // Sincronizamos la página actual con el contexto de Eleonor
  useEffect(() => {
    setPage(currentPage)
  }, [currentPage, setPage])

  // Aseguramos que los componentes están cargados
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("eleonor_token")
    localStorage.removeItem("eleonor_user")
    setIsLoggedIn(false)
    setShowOnboarding(false)
    hideEleonor()
  }

  // Escuchar evento para re-activar el onboarding desde cualquier componente
  useEffect(() => {
    const handleRestartOnboarding = () => {
      // Resetear flag en localStorage para que el onboarding fluya completamente
      const userStr = localStorage.getItem("eleonor_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          user.has_onboarded = false
          localStorage.setItem("eleonor_user", JSON.stringify(user))
        } catch (e) {
          console.error("Error restarting onboarding:", e)
        }
      }
      setShowOnboarding(true)
    }

    window.addEventListener('restart-onboarding', handleRestartOnboarding)
    return () => window.removeEventListener('restart-onboarding', handleRestartOnboarding)
  }, [])

  // Al finalizar el onboarding, abrir el chat de Eleonor AI automáticamente
  useEffect(() => {
    const handleOpenEleonor = () => {
      setCurrentPage('assistant')
    }
    window.addEventListener('toggle-eleonor-history', handleOpenEleonor)
    return () => window.removeEventListener('toggle-eleonor-history', handleOpenEleonor)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
    preload()

    // Verificar si el usuario ya hizo el onboarding antes de mostrarlo
    const userStr = localStorage.getItem("eleonor_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role || "student")
        if (!user.has_onboarded && user.role !== "teacher") {
          setShowOnboarding(true)
        } else {
          setShowOnboarding(false)
        }
      } catch (e) {
        console.error("Error parsing user role on login:", e)
        setShowOnboarding(true)
      }
    } else {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)
    setCurrentPage("assistant")
    setPage("assistant")
    enterPresence("INTRO_DONE")
    enterPresence("INTERVENTION")

    // Persistir estado en backend y localStorage
    const token = localStorage.getItem("eleonor_token")
    const userStr = localStorage.getItem("eleonor_user")

    try {
      const baseUrl = API_BASE_URL
      await fetch(`${baseUrl}/api/auth/onboarding_complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      // Actualizar localStorage localmente para evitar re-triggers en esta sesión
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          user.has_onboarded = true
          localStorage.setItem("eleonor_user", JSON.stringify(user))
        } catch (e) {
          console.error("Error parsing user role on onboarding complete:", e)
        }
      }
    } catch (err) {
      console.error("Error al marcar onboarding como completo:", err)
    }
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className={`min-h-screen bg-transparent text-white relative overflow-hidden app-grid ${!showEleonorColumn ? "without-eleonor" : ""}`}>
      <div className="zone-sidebar">
        <SidebarNavigation
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onLogout={handleLogout}
          role={userRole}
        />
      </div>

      <main className="zone-content relative z-10 w-full min-h-screen flex flex-col">
        {/* Barra Superior Móvil Flotante & Sutil con Auto-Hide al Scroll y Auto-Inserción */}
        {currentPage !== "assistant" && (
          <>
            {/* Zona de proximidad táctil en el borde superior para invocar la barra al acercarse */}
            <div
              className="fixed top-0 inset-x-0 h-4 z-40 md:hidden pointer-events-auto"
              onTouchStart={() => setIsNavVisible(true)}
              onMouseEnter={() => setIsNavVisible(true)}
            />

            <header
              className={`md:hidden fixed top-2.5 inset-x-3.5 z-40 max-w-sm mx-auto h-10 px-2.5 py-1 rounded-full bg-[hsl(161,65%,7%)]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isNavVisible
                  ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
                  : "-translate-y-16 opacity-0 scale-95 pointer-events-none"
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-sidebar"))}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[hsl(74,100%,47%)] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
                  title="Abrir menú lateral"
                >
                  <Menu size={14} className="stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-4 h-4 relative flex-shrink-0 opacity-90">
                    <Image src="/LogoChiquito.png" alt="Skill Tech" fill className="object-contain" />
                  </div>
                  <span className="text-xs font-semibold text-white/90 tracking-wide truncate">
                    {PAGE_TITLE_MAP[currentPage] || "Skill Tech"}
                  </span>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest hidden xs:inline">
                    • UCSM
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                  {userRole === "teacher" ? "Docente" : "Estudiante"}
                </span>
              </div>
            </header>
          </>
        )}

        <div className={`flex-1 ${currentPage === "assistant" ? "p-0" : "pt-14 px-4 pb-6 md:p-8"}`}>
          {userRole === "teacher" ? (
            <>
              {(
                currentPage === "mentor-dashboard" ||
                currentPage === "skillmap" ||
                currentPage === "mentor-students" ||
                currentPage === "mentor-groups" ||
                currentPage === "mentor-archives" ||
                currentPage === "mentor-agents"
              ) && (
                  <MentorDashboard
                    view={
                      (currentPage === "mentor-archives" || currentPage === "mentor-agents")
                        ? "archives"
                        : (currentPage === "mentor-students" || currentPage === "mentor-groups")
                          ? "students"
                          : "dashboard"
                    }
                    initialSubTab="groups"
                    initialArchiveTab={currentPage === "mentor-agents" ? "agents" : "presentations"}
                  />
                )}
              {currentPage === "mentor-attendance" && <MentorAttendance />}
              {currentPage === "mentor-psicometria" && <PsicometriaDashboard />}
              {currentPage === "mentor-ponencias" && <PonenciasManagerPanel />}
            </>
          ) : (
            <>
              {currentPage === "skillmap" && <SkillMap />}
              {currentPage === "achievements" && <Achievements />}
              {currentPage === "profile" && <Profile />}
              {currentPage === "assistant" && <VirtualAssistant />}
              {currentPage === "practice" && <Practice onNavigate={setCurrentPage} />}
              {currentPage === "diagnosis" && <ResultsPage />}
              {currentPage === "settings" && <Settings />}
              {currentPage === "ponencias" && <PonenciasPanel />}
            </>
          )}
        </div>
      </main>

      {/* Eleonor Zone: Solo renderizar aquí cuando está en modo 'side' */}
      <div className={`zone-eleonor pointer-events-none md:pointer-events-auto ${!showEleonorColumn ? "hidden" : ""}`}>
        {/* Renderizamos AvatarDisplay aquí. El componente interno decidirá su visualización 
             pero ahora está anclado al grid en desktop */}
        <AvatarDisplay />
      </div>

      {/* Onboarding Overlay (Fixed sobre todo) */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} onNavigate={setCurrentPage} />}
    </div>
  )
}