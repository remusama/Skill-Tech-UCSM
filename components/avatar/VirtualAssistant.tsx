import { Card, CardContent } from "@/components/ui/card"
import { EleonorAIChat } from "@/components/chat/EleonorAIChat"
import { useEleonor } from "@/contexts/eleonor-context"
import { useEffect } from "react"

// FASE 2: VirtualAssistant usa nueva API de presencia
export function VirtualAssistant() {
  const { enterPresence } = useEleonor()

  useEffect(() => {
    enterPresence('INTERVENTION')

    // Bloquear scroll en la pantalla de Asistente
    document.body.style.overflow = 'hidden'

    return () => {
      // Al salir del asistente, volver a idle visible y restaurar scroll
      enterPresence('IDLE_VISIBLE')
      document.body.style.overflow = 'unset'
    }
  }, [enterPresence])

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-xl bg-black/20">
      {/* Capa de Fondo Ficticia para mantener la estructura, Eleonor real está en el root */}
      <div className="absolute inset-0 z-0 transition-transform duration-700 lg:-translate-x-[15%] flex items-end justify-center pointer-events-none">
        {/* Espacio vacío, Eleonor se renderiza desde el layout */}
      </div>

      {/* Capa Superior: Chat con Eleonor AI */}
      <div className="absolute inset-0 z-10 pointer-events-none flex justify-center">
        <div className="w-full h-full pointer-events-auto">
          <EleonorAIChat />
        </div>
      </div>
    </div>
  )
}
