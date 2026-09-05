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

const navItems = [
  { icon: BarChart, label: "SkillMap", page: "skillmap" },
  { icon: Clock, label: "Level up", page: "practice" },
  { icon: Brain, label: "Liderometro", page: "diagnosis" },
  { icon: User, label: "Perfil / Credencial", page: "profile" },
  { icon: MessageSquare, label: "Eleonor AI", page: "assistant" },
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

import { useEleonor } from "@/contexts/eleonor-context"

interface SidebarNavigationProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  onLogout: () => void
  role?: string
}

export function SidebarNavigation({ currentPage, setCurrentPage, onLogout, role = "student" }: SidebarNavigationProps) {
  const currentItems = role === "teacher" ? teacherNavItems : navItems;
  const { isGuideActive, guideHighlight, completeOnboarding } = useEleonor()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isSidebarHighlighted = guideHighlight === 'sidebar'
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
            className="fixed top-6 left-6 z-50 bg-[#032318]/80 backdrop-blur-2xl p-3 rounded-2xl border border-[#d0b04d]/20 text-[#d0b04d] shadow-2xl hover:bg-[#3c5a21]/50 transition-all active:scale-95 group md:hidden"
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
              boxShadow: isSidebarHighlighted ? '0 0 50px rgba(208,176,77,0.3)' : '0 20px 60px rgba(0,0,0,0.6)'
            }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`
            fixed md:sticky top-0 left-0 h-screen md:translate-x-0 md:opacity-100
            bg-white/5 backdrop-blur-[60px] border-r border-white/5 z-40 w-72 md:w-72 flex-shrink-0
            overflow-y-auto overflow-x-hidden ${isSidebarHighlighted ? 'border-r-[#d0b04d]/50' : ''}
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
                  <span className="text-sm font-black tracking-tight text-white leading-tight uppercase">Programa de Liderazgo</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[#d0b04d] mt-1">UCSM 2026</span>
                </div>
              </div>

              {/* Línea divisoria */}
              <div className="w-full h-px bg-white/10 mb-5 mx-2" />

              {/* Logo y título de SkillTech */}
              <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
                <div className="relative w-16 h-16 flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(208,176,77,0.8)] flex items-center justify-center">
                  <Image
                    src="/new-logo.png"
                    alt="SkillTech Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(208,176,77,0.7)]"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-2xl font-black tracking-tighter text-white leading-none">SkillTech</span>
                  <span className="text-[9px] uppercase tracking-[0.4em] font-black text-[#d0b04d] mt-1">Learning Ecosystem</span>
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
                className={`p-4 mb-10 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-3xl relative group overflow-hidden flex-shrink-0 ${role === "student" ? "cursor-pointer hover:border-[#d0b04d]/40 transition-all duration-300" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#d0b04d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                  <Avatar className="h-12 w-12 border-2 border-[#d0b04d]/40">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-gradient-to-br from-[#0d971f] to-[#063924] text-[#d0b04d] font-black text-sm">AD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tighter">Usuario Demo</p>
                    <p className="text-[9px] text-[#d0b04d]/70 truncate tracking-widest font-bold uppercase mt-0.5">Fundador</p>
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <nav className="flex-1 space-y-3">
                <div className="px-4 mb-6">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/20">
                    {role === "teacher" ? "Módulos Docente" : "Módulos Core"}
                  </span>
                </div>
                {currentItems.map((item, index) => {
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
                      backgroundColor: isActive ? "rgba(13, 151, 31, 0.25)" : "rgba(255, 255, 255, 0.02)",
                      borderColor: isActive ? "#0d971f" : "rgba(255, 255, 255, 0.05)"
                      }}
                      onClick={() => {
                        if (isGuideActive && guideHighlight === 'assistant' && item.page === 'assistant') {
                          completeOnboarding()
                          window.dispatchEvent(new CustomEvent('onboarding-completed-manually'))
                        }
                        setCurrentPage(item.page)
                        if (isMobile) setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative border backdrop-blur-sm ${isActive ? "text-white" : "text-white/40 hover:text-white"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-gradient-to-r from-[#0d971f]/30 to-transparent rounded-2xl -z-10"
                        />
                      )}

                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive || isHighlighted 
                          ? "bg-[#0d971f] text-white shadow-[0_0_12px_rgba(13,151,31,0.6)]" 
                          : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
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
              <div className="mt-auto pt-8 border-t border-white/5">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-4 h-14 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-500 border border-transparent hover:border-red-500/20 group"
                  onClick={onLogout}
                >
                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-red-500/20 transition-colors">
                    <LogOut size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cerrar sesión</span>
                </Button>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              className="absolute top-6 right-6 md:hidden text-white/40 hover:text-white p-2"
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