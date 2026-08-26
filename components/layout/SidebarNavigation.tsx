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
  Archive
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { MagicTitle } from "@/components/ui/magic-title"
import { Meteors } from "@/components/ui/meteors"

const navItems = [
  { icon: BarChart, label: "SkillMap", page: "skillmap" },
  { icon: Clock, label: "Examenes", page: "practice" },
  { icon: Brain, label: "Diagnostico", page: "diagnosis" },
  // { icon: Award, label: "Logros", page: "achievements" },
  { icon: MessageSquare, label: "Eleonor AI", page: "assistant" },
  { icon: Settings, label: "Configuración", page: "settings" },
]

const teacherNavItems = [
  { icon: BarChart2, label: "Dashboard", page: "mentor-dashboard" },
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

  // Sidebar fluid border based on guideHighlight
  const isSidebarHighlighted = guideHighlight === 'sidebar'
  // Si el guideHighlight es un page de nav, también abrimos el sidebar para mostrarlo
  const isNavItemHighlighted = currentItems.some(item => item.page === guideHighlight)

  // Forzar apertura si la guía está activa Y destaca el sidebar o un item de nav
  useEffect(() => {
    if (isGuideActive) {
      if (guideHighlight === 'sidebar' || isNavItemHighlighted) {
        setIsOpen(true)
      } else {
        // Cuando el guía pasa a otro paso, cerrar el sidebar en móvil
        if (isMobile) {
          setIsOpen(false)
        }
      }
    }
  }, [isGuideActive, guideHighlight, isMobile, isNavItemHighlighted])

  // Cerrar sidebar al cambiar de página en móvil (por navegación de guía o manual)
  useEffect(() => {
    if (isMobile && currentPage && guideHighlight !== 'sidebar' && !isNavItemHighlighted) {
      setIsOpen(false)
    }
  }, [currentPage, isMobile, guideHighlight, isNavItemHighlighted])

  // Detectar si es dispositivo móvil
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
            className="fixed top-6 left-6 z-50 bg-black/60 backdrop-blur-2xl p-3 rounded-2xl border border-white/10 text-white shadow-2xl hover:bg-white/20 transition-all active:scale-95 group md:hidden"
          >
            <Menu size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* En desktop siempre se renderiza (isMobile check), en mobile depende de isOpen */}
        {(isOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: -320, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              boxShadow: isSidebarHighlighted ? '0 0 50px rgba(181,0,209,0.3)' : '0 20px 60px rgba(0,0,0,0.6)'
            }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            // En desktop: relative/h-full (el grid controla posición). En mobile: fixed overlay.
            className={`
              fixed md:relative md:translate-x-0 md:opacity-100 top-0 left-0 h-full 
              bg-white/5 backdrop-blur-[60px] border-r border-white/5 z-40 w-72 md:w-full
              overflow-y-auto overflow-x-hidden ${isSidebarHighlighted ? 'border-r-[#B500D1]/50' : ''}
            `}
          >
            <Meteors number={15} className="opacity-20" />

            <div className="flex flex-col h-full p-6 relative z-10">
              {/* Logo y título */}
              <div className="flex items-center gap-4 mb-12 px-2 group cursor-pointer">
                <div className="relative w-14 h-14 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(181,0,209,0.8)]">
                  <Image
                    src="/new-logo.png"
                    alt="SkillTech Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(181,0,209,0.6)]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-white leading-none">SkillTech</span>
                  <span className="text-[9px] uppercase tracking-[0.4em] font-black text-[#B500D1] mt-1">Learning Ecosystem</span>
                </div>
              </div>

              {/* Perfil del usuario */}
              <div className="p-4 mb-10 bg-white/5 border border-white/5 rounded-[2rem] backdrop-blur-3xl relative group overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#B500D1]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                  <Avatar className="h-12 w-12 border-2 border-[#B500D1]/30">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-gradient-to-br from-[#B500D1] to-[#D100B5] text-white font-black text-sm">AD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tighter">Usuario Demo</p>
                    <p className="text-[9px] text-white/40 truncate tracking-widest font-bold uppercase mt-0.5">Fundador</p>
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
                        scale: 1.05,
                        backgroundColor: "rgba(181,0,209,0.2)",
                        boxShadow: "0 0 30px rgba(181,0,209,0.3)",
                        borderColor: "rgba(181,0,209,0.5)"
                      } : {
                        scale: 1,
                        backgroundColor: isActive ? "rgba(181,0,209,0.15)" : "rgba(181,0,209,0)",
                        borderColor: isActive ? "rgba(181,0,209,0.2)" : "rgba(181,0,209,0)"
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
                          className="absolute inset-0 bg-gradient-to-r from-[#B500D1]/20 to-transparent rounded-2xl -z-10"
                        />
                      )}

                      <div className={`p-2 rounded-xl transition-all duration-500 ${isActive || isHighlighted ? "bg-[#B500D1] text-white shadow-[0_0_15px_rgba(181,0,209,0.5)]" : "bg-white/5 text-white/30 group-hover:bg-white/10 group-hover:text-white"}`}>
                        <item.icon size={18} className="transition-transform duration-500 group-hover:rotate-12" />
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
