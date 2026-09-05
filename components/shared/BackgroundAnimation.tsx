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

    window.addEventListener("mousemove", (event) => {
      mouse.x = event.x
      mouse.y = event.y
    })
    window.addEventListener("mouseout", () => {
      mouse.x = null
      mouse.y = null
    })

    const particlesArray: Particle[] = []
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

    // Optimización basada en hardware
    const numberOfParticles = level === 'low' ? 10 : (level === 'medium' ? 30 : (isMobile ? 25 : 80))
    const enableConnections = level !== 'low' && !isMobile

    const particleColor = theme === "dark" ? "#032318" : "#032318"

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
        this.size = Math.random() * 2 + 1
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
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            opacityValue = 1 - distance / 100
            ctx.strokeStyle = `rgba(${theme === 'light' ? '192,192,192' : '42,42,106'}, ${opacityValue})`
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
            ctx.strokeStyle = `rgba(${theme === 'light' ? '192,192,192' : '42,42,106'}, ${opacityValue})`
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
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme, level])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-transparent" style={{ willChange: "transform" }} />
}