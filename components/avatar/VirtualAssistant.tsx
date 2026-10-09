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
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-2xl overflow-hidden">
      {/* Capa Superior: Chat con Eleonor AI situado firmemente por encima del avatar */}
      <div className="absolute inset-0 z-50 flex justify-center pointer-events-auto">
        <div className="w-full h-full">
          <EleonorAIChat />
        </div>
      </div>
    </div>
  )
}
