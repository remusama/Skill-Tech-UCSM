"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/contexts/theme-context"
import { usePerformance } from "@/hooks/use-performance"

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const { level } = usePerformance()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    const mouse = {
      x: null as number | null,
      y: null as number | null,
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
    }
    const handleMouseOut = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseout", handleMouseOut)

    const particlesArray: Particle[] = []
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

    // Optimización basada en hardware
    const numberOfParticles = level === 'low' ? 10 : (level === 'medium' ? 30 : (isMobile ? 25 : 80))
    const enableConnections = level !== 'low' && !isMobile

    // Colores adaptados a las nuevas paletas
    // Tema oscuro: particulas con tonos de verde oscuro (#063924 / #0a6b17)
    // Tema claro: particulas con tonos de acento (#d0b04d / #cae13c)
    const particleColor = theme === "dark" ? "#0a6b17" : "#d0b04d"

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth)
        this.y = Math.random() * (canvas?.height || window.innerHeight)
        this.size = Math.random() * 2 + 1.2
        this.speedX = Math.random() * 0.4 - 0.2
        this.speedY = Math.random() * 0.4 - 0.2
        this.color = particleColor
      }

      update() {
        if (!canvas) return
        this.x += this.speedX
        this.y += this.speedY

        // Wrap particles
        if (this.size > 0.2) {
          if (this.x > canvas.width) this.x = 0
          if (this.x < 0) this.x = canvas.width
          if (this.y > canvas.height) this.y = 0
          if (this.y < 0) this.y = canvas.height
        }
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const init = () => {
      particlesArray.length = 0
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle())
      }
    }

    const connect = () => {
      if (!ctx || !enableConnections) return
      let opacityValue = 1
      
      // Color de las líneas de conexión según el tema
      // Oscuro: Usamos tonos verdosos/cian sutiles (#214f3c)
      // Claro: Usamos grises/dorados suaves (#c0c0ba)
      const strokeColorRgb = theme === 'light' ? '192, 192, 186' : '33, 79, 60'

      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            opacityValue = 1 - distance / 100
            ctx.strokeStyle = `rgba(${strokeColorRgb}, ${opacityValue * 0.6})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y)
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y)
            ctx.stroke()
          }
        }
      }

      // Conectar con el ratón
      if (mouse.x !== null && mouse.y !== null) {
        for (let i = 0; i < particlesArray.length; i++) {
          const dx = particlesArray[i].x - mouse.x
          const dy = particlesArray[i].y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 150) {
            opacityValue = 1 - distance / 150
            ctx.strokeStyle = `rgba(${strokeColorRgb}, ${opacityValue * 0.8})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particlesArray[i].x, particlesArray[i].y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      if (!ctx || !canvas) return
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particlesArray) {
        particle.update()
        particle.draw()
      }

      if (!isMobile && enableConnections) {
        connect()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseout", handleMouseOut)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme, level])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10" 
      style={{ 
        willChange: "transform",
        // Color de fondo base estricto para el canvas según el tema
        backgroundColor: theme === "dark" ? "#01130d" : "#f5f5f0" 
      }} 
    />
  )
}