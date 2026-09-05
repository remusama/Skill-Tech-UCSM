"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Clock,
  Award,
  BarChart2,
  MessageSquare,
  User,
  LogOut,
  BookOpen,
  Search,
  Settings,
  Menu,
  Brain,
  FileText,
  Compass,
  Users,
  Folder,
  Archive,
  Calendar
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { MagicTitle } from "@/components/ui/magic-title"
import { Meteors } from "@/components/ui/meteors"
import { useEleonor } from "@/contexts/eleonor-context"
import { useTheme } from "@/contexts/theme-context"

const navItems = [
  { icon: BarChart, label: "SkillMap", page: "skillmap" },
  { icon: Clock, label: "Level up", page: "practice" },
  { icon: Brain, label: "Liderómetro", page: "diagnosis" },
  { icon: MessageSquare, label: "Moya", page: "assistant" },
  { icon: Settings, label: "Configuración", page: "settings" },
]

const teacherNavItems = [
  { icon: BarChart2, label: "Dashboard", page: "mentor-dashboard" },
  { icon: Calendar, label: "Asistencias", page: "mentor-attendance" },
  { icon: Users, label: "Mis estudiantes", page: "mentor-students" },
  { icon: Folder, label: "Grupos", page: "mentor-groups" },
  { icon: FileText, label: "Exámenes", page: "mentor-exams" },
  { icon: Settings, label: "Agentes IA", page: "mentor-agents" },
  { icon: Archive, label: "Archivos", page: "mentor-archives" },
]

interface SidebarNavigationProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  onLogout: () => void
  role?: string
}

export function SidebarNavigation({ currentPage, setCurrentPage, onLogout, role = "student" }: SidebarNavigationProps) {
  const currentItems = role === "teacher" ? teacherNavItems : navItems
  const { isGuideActive, guideHighlight, completeOnboarding } = useEleonor()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userName, setUserName] = useState("Estudiante")
  const [userSubtitle, setUserSubtitle] = useState("Fundador")
  const sidebarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eleonor_user")
      if (stored) {
        const u = JSON.parse(stored)
        if (u.full_name || u.username) {
          setUserName(u.full_name || u.username)
        }
        if (u.classroom) {
          setUserSubtitle(u.classroom)
        } else if (u.role) {
          setUserSubtitle(u.role === "teacher" ? "Docente" : u.role === "admin" ? "Administrador" : "Estudiante")
        }
      }
    } catch (e) {
      console.error("Error reading user from localStorage:", e)
    }
  }, [])

  const isSidebarHighlighted = guideHighlight === 'sidebar'
  const isProfileHighlighted = guideHighlight === 'profile'
  const isNavItemHighlighted = currentItems.some(item => item.page === guideHighlight)

  useEffect(() => {
    if (isGuideActive) {
      if (guideHighlight === 'sidebar' || isNavItemHighlighted) {
        setIsOpen(true)
      } else {
        if (isMobile) {
          setIsOpen(false)
        }
      }
    }
  }, [isGuideActive, guideHighlight, isMobile, isNavItemHighlighted])

  useEffect(() => {
    if (isMobile && currentPage && guideHighlight !== 'sidebar' && !isNavItemHighlighted) {
      setIsOpen(false)
    }
  }, [currentPage, isMobile, guideHighlight, isNavItemHighlighted])

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  useEffect(() => {
    if (!isOpen || isGuideActive) return

    function handleClickOutside(event: MouseEvent) {
      const clickedSidebar = sidebarRef.current && sidebarRef.current.contains(event.target as Node)
      const clickedButton = buttonRef.current && buttonRef.current.contains(event.target as Node)

      if (!clickedSidebar && !clickedButton) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, isGuideActive])

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={buttonRef}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsOpen(true)}
            style={theme !== 'dark' ? { backgroundColor: '#e8e8e6', color: '#b8860b' } : undefined}
            className={`fixed top-6 left-6 z-50 backdrop-blur-2xl p-3 rounded-2xl border border-[#b8860b]/30 text-[#b8860b] shadow-2xl transition-all active:scale-95 group md:hidden ${
              theme === 'dark' ? 'bg-[#032318]/80 hover:bg-[#3c5a21]/50' : 'bg-[#e8e8e6] border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Menu size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(isOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: -320, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              boxShadow: isSidebarHighlighted ? '0 0 50px rgba(184,134,11,0.3)' : '0 20px 60px rgba(0,0,0,0.6)'
            }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            style={theme !== 'dark' ? { backgroundColor: '#e8e8e6' } : undefined}
            className={`
              fixed md:sticky top-0 left-0 h-screen md:translate-x-0 md:opacity-100
              backdrop-blur-[60px] border-r z-40 w-72 md:w-72 flex-shrink-0
              overflow-y-auto overflow-x-hidden ${isSidebarHighlighted ? 'border-r-[#b8860b]/50' : ''}
              ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-[#e8e8e6] border-slate-300 text-[#063924]'}
            `}
          >
            <Meteors number={15} className="opacity-20" />
            <div className="flex flex-col h-full p-6 relative z-10">
              
              {/* Programa de Liderazgo */}
              <div className="flex items-center gap-3 mb-4 px-2 group cursor-pointer">
                <div className="relative w-16 h-16 flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(13,151,31,0.8)]">
                  <Image
                    src="/LogoChiquito.png"
                    alt="Logo Liderazgo"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(13,151,31,0.6)]"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-black tracking-tight leading-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-[#063924]'}`}>Programa de Liderazgo</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#b8860b] mt-1">UCSM 2026</span>
                </div>
              </div>

              {/* Línea divisoria */}
              <div className={`w-full h-px mb-5 mx-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-300'}`} />

              {/* Logo y título de SkillTech */}
              <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
                <div className="relative w-16 h-16 flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(184,134,11,0.8)] flex items-center justify-center">
                  <Image
                    src="/new-logo.png"
                    alt="SkillTech Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(184,134,11,0.7)]"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-2xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-[#063924]'}`}>SkillTech</span>
                  <span className="text-[9px] uppercase tracking-[0.4em] font-black text-[#b8860b] mt-1">Learning Ecosystem</span>
                </div>
              </div>

              {/* Perfil del usuario */}
              <div 
                onClick={() => {
                  if (role === "student") {
                    setCurrentPage("profile")
                    if (isMobile) setIsOpen(false)
                  }
                }}
                style={theme !== 'dark' ? { backgroundColor: '#f4f7f5' } : undefined}
                className={`p-4 mb-10 border rounded-[2.5rem] backdrop-blur-3xl relative group overflow-hidden flex-shrink-0 transition-all duration-500 ${
                  isProfileHighlighted
                    ? "border-[#B500D1] bg-[#B500D1]/20 shadow-[0_0_35px_rgba(181,0,209,0.5)] scale-105"
                    : theme === 'dark' ? 'bg-white/5 border-white/5' : 'border-slate-300 shadow-sm'
                } ${role === "student" ? "cursor-pointer hover:border-white/20 animate-pulse-subtle" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#b8860b]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                  <Avatar className="h-12 w-12 border-2 border-[#b8860b]/50">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-gradient-to-br from-[#0d971f] to-[#063924] text-[#b8860b] font-black text-sm">
                      {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#063924]'}`}>{userName}</p>
                    <p className="text-[9px] text-[#b8860b] truncate tracking-widest font-black uppercase mt-0.5">{userSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <nav className="flex-1 space-y-3">
                <div className="px-4 mb-6">
                  <span className={`text-[9px] uppercase tracking-[0.3em] font-black ${theme === 'dark' ? 'text-white/20' : 'text-slate-600'}`}>
                    {role === "teacher" ? "Módulos Docente" : "Módulos Core"}
                  </span>
                </div>
                {currentItems.map((item) => {
                  const isHighlighted = guideHighlight === item.page;
                  const isActive = currentPage === item.page;
                  return (
                    <motion.button
                      key={item.page}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      animate={isHighlighted ? {
                        scale: 1.02,
                        backgroundColor: "rgba(13, 151, 31, 0.3)",
                        boxShadow: "0 0 20px rgba(13, 151, 31, 0.4)",
                        borderColor: "#0d971f"
                      } : {
                        scale: 1,
                        backgroundColor: isActive 
                          ? (theme === 'dark' ? "rgba(13, 151, 31, 0.25)" : "rgba(13, 151, 31, 0.15)") 
                          : (theme === 'dark' ? "rgba(255, 255, 255, 0.02)" : "transparent"),
                        borderColor: isActive ? "#0d971f" : (theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "transparent")
                      }}
                      onClick={() => {
                        if (isGuideActive && guideHighlight === 'assistant' && item.page === 'assistant') {
                          completeOnboarding()
                          window.dispatchEvent(new CustomEvent('onboarding-completed-manually'))
                        }
                        setCurrentPage(item.page)
                        if (isMobile) setIsOpen(false)
                      }}
                      style={!isActive && theme !== 'dark' ? { backgroundColor: '#f4f7f5' } : undefined}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative border backdrop-blur-sm ${
                        isActive 
                          ? (theme === 'dark' ? "text-white border-[#0d971f]" : "text-[#063924] border-[#0d971f] font-bold shadow-sm") 
                          : (theme === 'dark' ? "text-white/40 hover:text-white border-white/5" : "text-slate-700 hover:text-[#063924] border-slate-200")
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-bg"
                          className={`absolute inset-0 bg-gradient-to-r from-[#0d971f]/30 to-transparent rounded-2xl -z-10`}
                        />
                      )}

                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive || isHighlighted 
                          ? "bg-[#0d971f] text-white shadow-[0_0_12px_rgba(13,151,31,0.6)]" 
                          : theme === 'dark' ? "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white" : "bg-white text-slate-700 shadow-xs group-hover:text-[#0d971f]"
                      }`}>
                        <item.icon size={18} className="transition-transform duration-300 group-hover:rotate-12" />
                      </div>

                      <span className={`text-xs font-black uppercase tracking-widest transition-all duration-500 ${isActive || isHighlighted ? 'translate-x-1' : ''}`}>
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Footer / Logout */}
              <div className={`mt-auto pt-8 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-300'}`}>
                <Button
                  variant="ghost"
                  style={theme !== 'dark' ? { backgroundColor: '#f4f7f5' } : undefined}
                  className={`w-full justify-start gap-4 h-14 rounded-2xl transition-all duration-500 border group ${
                    theme === 'dark' 
                      ? 'text-white/30 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20' 
                      : 'text-slate-700 hover:text-red-600 hover:bg-red-500/10 border-slate-300 hover:border-red-500/30'
                  }`}
                  onClick={onLogout}
                >
                  <div className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-white/5 group-hover:bg-red-500/20' : 'bg-white shadow-xs group-hover:bg-red-500/20'}`}>
                    <LogOut size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cerrar sesión</span>
                </Button>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              className={`absolute top-6 right-6 md:hidden p-2 ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-700 hover:text-[#063924]'}`}
              onClick={() => setIsOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}