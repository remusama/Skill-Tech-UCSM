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
const AvatarDisplay = dynamic(() => import("@/components/avatar/AvatarDisplay"), { ssr: false })

import { useEleonor } from "@/contexts/eleonor-context"
import { API_BASE_URL } from "@/lib/config"

// Importar AvatarDisplay lazy para usarlo en el grid ya definido arriba

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false) 
  const [currentPage, setCurrentPage] = useState("skillmap")
  const [isLoaded, setIsLoaded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userRole, setUserRole] = useState("student")

  const { hide: hideEleonor, setPage, preload, presence, isGuideActive, enterPresence } = useEleonor()
  const showEleonorColumn = currentPage === "assistant" || isGuideActive || presence === "GUIDE_ACTIVE"

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

      <main className="zone-content p-4 md:p-8 relative z-10 w-full">
        {userRole === "teacher" ? (
        <>
            {(currentPage === "mentor-dashboard" || currentPage === "skillmap") && <MentorDashboard view="dashboard" />}
            {currentPage === "mentor-attendance" && <MentorAttendance />}
            {currentPage === "mentor-students" && <MentorDashboard view="students" />}
            {currentPage === "mentor-groups" && <MentorDashboard view="groups" />}
            {currentPage === "mentor-agents" && <AgentCreator />}
            {currentPage === "mentor-exams" && <ExamCreator />}
            {currentPage === "mentor-archives" && <MentorDashboard view="archives" />}

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
          </>
        )}
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