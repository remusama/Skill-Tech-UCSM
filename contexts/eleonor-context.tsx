"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

// FASE 1: Máquina de Estados de Presencia
export type EleonorPresence =
    | 'INTRO_ACTIVE'    // Onboarding en curso, Eleonor visible y hablando
    | 'INTRO_DONE'      // Onboarding terminado, llave de salida
    | 'INTRO_HIDDEN'    // Onboarding terminado, Eleonor oculta temporalmente
    | 'GUIDE_ACTIVE'    // Guía del sistema activa
    | 'IDLE_VISIBLE'    // Disponible en su zona del Grid
    | 'IDLE_HIDDEN'     // Oculta pero lista
    | 'INTERVENTION'    // Intervención activa (chat, asistente)
    | 'DIAGNOSIS'       // Diagnosis overlay activo

// PRIORIDADES DE PRESENCIA (Higher = harder to interrupt)
export interface CognitiveState {
    valence: string;
    tension: number;
    engagement: number;
}

const PRESENCE_PRIORITY: Record<EleonorPresence, number> = {
    'INTRO_ACTIVE': 10,  // EL BLOQUEO TOTAL
    'INTRO_DONE': 0,     // EL DESBLOQUEO (permite cualquier transición)
    'GUIDE_ACTIVE': 5,   // Prioridad alta para el tour
    'IDLE_VISIBLE': 1,
    'IDLE_HIDDEN': 1,
    'INTERVENTION': 1,
    'DIAGNOSIS': 2,      // Prioridad superior a intervención normal
    'INTRO_HIDDEN': 0,
}

interface EleonorContextType {
    // Nueva API de Presencia
    presence: EleonorPresence
    enterPresence: (mode: EleonorPresence) => void

    // API Legacy (mantenida para compatibilidad)
    isVisible: boolean
    status: 'idle' | 'speaking' | 'listening' | 'onboarding'
    position: 'center' | 'side' | 'background'
    initialContext: string[]
    baselineProfile: Record<string, any> | null
    currentPage: string
    isAuthorized: boolean
    isPreloading: boolean
    isGuideActive: boolean
    guideHighlight: string | null
    show: () => void
    hide: () => void
    setPosition: (pos: 'center' | 'side' | 'background') => void
    setStatus: (status: 'idle' | 'speaking' | 'listening' | 'onboarding') => void
    setPage: (page: string) => void
    preload: () => void
    startGuide: () => void
    stopGuide: () => void
    setGuideHighlight: (id: string | null) => void
    saveResponse: (index: number, response: string) => void
    completeOnboarding: () => void
    cognitiveState: CognitiveState
    updateCognitiveState: (newState: Partial<CognitiveState>) => void
    isHistoryOpen: boolean
    setHistoryOpen: (open: boolean) => void
}

const EleonorContext = createContext<EleonorContextType | undefined>(undefined)

export const EleonorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // FASE 1: Estado único de presencia
    const [presence, setPresence] = useState<EleonorPresence>('IDLE_HIDDEN')

    // Estados Legacy (mantenidos para compatibilidad)
    const [status, setStatusState] = useState<'idle' | 'speaking' | 'listening' | 'onboarding'>('idle')
    const [position, setPositionState] = useState<'center' | 'side' | 'background'>('center')
    const [initialContext, setInitialContext] = useState<string[]>(['', '', ''])
    const [baselineProfile, setBaselineProfile] = useState<Record<string, any> | null>(null)
    const [currentPage, setCurrentPage] = useState<string>('dashboard')
    const [isPreloading, setIsPreloading] = useState(false)
    const [isGuideActive, setIsGuideActive] = useState(false)
    const [guideHighlight, setGuideHighlightState] = useState<string | null>(null)
    const [cognitiveState, setCognitiveState] = useState<CognitiveState>({
        valence: 'neutra',
        tension: 0.5,
        engagement: 0.5
    })
    const [isHistoryOpen, setHistoryOpen] = useState(false)

    // FASE 1: API pública de presencia
    const enterPresence = useCallback((mode: EleonorPresence) => {
        setPresence(current => {
            // 1. REGLA DE ORO: Idempotencia estricta
            if (current === mode) return current;

            // 2. REGLA DEL CANDADO ABSOLUTO (Lock): 
            // Si estamos en INTRO_ACTIVE, ignoramos TODO excepto INTRO_DONE
            if (current === 'INTRO_ACTIVE') {
                if (mode === 'INTRO_DONE') {
                    console.info("🔓 INTRO Lock released. Master Key used.");
                    return mode;
                }
                return current;
            }

            // 3. BYPASS DE LIMPIEZA: IDLE_HIDDEN y INTRO_DONE siempre permitidos (excepto en candado)
            // Esto evita que estados de alta prioridad (como GUIDE) bloqueen la salida.
            if ((mode as string) === 'IDLE_HIDDEN' || (mode as string) === 'INTRO_DONE') {
                console.log(`🧹 Cleanup transition authorized: ${current} -> ${mode}`);
                return mode;
            }

            // 4. RECUPERACIÓN DE INTRO_DONE: 
            // Si ya estamos en INTRO_DONE o IDLE, no permitimos volver a "TERMINAR" la intro
            if (current === 'INTRO_DONE' && mode === 'INTRO_DONE') return current;

            // 5. REGLA DE PRIORIDAD
            const currentPriority = PRESENCE_PRIORITY[current] ?? 0;
            const nextPriority = PRESENCE_PRIORITY[mode] ?? 0;

            if (currentPriority > nextPriority) {
                console.warn(`⚠️ Blocked transition: ${current} (prio:${currentPriority}) -> ${mode} (prio:${nextPriority}). Priority too low.`);
                return current;
            }

            // Diagnostic logging for transition tracing
            console.group(`🎭 Eleonor transition: ${current} -> ${mode}`);
            console.log("Priority:", { current: currentPriority, next: nextPriority });
            if (typeof window !== 'undefined') console.trace("Trace context:");
            console.groupEnd();

            return mode;
        })
    }, [])

    // Sincronización de efectos secundarios (Efectos de estado legacy)
    React.useEffect(() => {
        switch (presence) {
            case 'INTRO_ACTIVE':
                setStatusState('onboarding')
                setPositionState('center')
                break
            case 'INTRO_DONE':
                // No hace nada por sí mismo, es un puente
                break
            case 'INTRO_HIDDEN':
                setStatusState('idle')
                setPositionState('side')
                break
            case 'GUIDE_ACTIVE':
                setStatusState('idle')
                setPositionState('side')
                setIsGuideActive(true)
                break
            case 'IDLE_VISIBLE':
                setStatusState('idle')
                setPositionState('side')
                setIsGuideActive(false)
                break
            case 'IDLE_HIDDEN':
                setStatusState('idle')
                setPositionState('side')
                setIsGuideActive(false)
                break
            case 'INTERVENTION':
                setStatusState('speaking')
                setPositionState('center')
                break
            case 'DIAGNOSIS':
                setStatusState('speaking')
                setPositionState('center')
                break
        }
    }, [presence])

    // Derivar isVisible del estado de presencia
    const isVisible = presence !== 'IDLE_HIDDEN' && presence !== 'INTRO_HIDDEN' && presence !== 'INTRO_DONE'

    // API Legacy (mantenida para compatibilidad)
    const show = useCallback(() => {
        if (presence === 'IDLE_HIDDEN') enterPresence('IDLE_VISIBLE')
    }, [presence, enterPresence])

    const hide = useCallback(() => {
        if (presence === 'IDLE_VISIBLE') enterPresence('IDLE_HIDDEN')
    }, [presence, enterPresence])

    const setPosition = useCallback((pos: 'center' | 'side' | 'background') => setPositionState(pos), [])
    const setStatus = useCallback((s: 'idle' | 'speaking' | 'listening' | 'onboarding') => setStatusState(s), [])
    const preload = useCallback(() => setIsPreloading(true), [])
    const startGuide = useCallback(() => enterPresence('GUIDE_ACTIVE'), [enterPresence])
    const stopGuide = useCallback(() => enterPresence('IDLE_HIDDEN'), [enterPresence])
    const setGuideHighlight = useCallback((id: string | null) => setGuideHighlightState(id), [])

    const isAuthorized = isPreloading || isGuideActive || status === 'onboarding' || currentPage === 'assistant' || presence !== 'IDLE_HIDDEN'

    const saveResponse = useCallback((index: number, response: string) => {
        setInitialContext((prev) => {
            const next = [...prev]
            next[index] = response
            return next
        })
    }, [])

    const completeOnboarding = useCallback(() => {
        // Transform initialContext into baselineProfile
        setBaselineProfile({
            motivacion: initialContext[0],
            objetivo: initialContext[1],
            experiencia: initialContext[2],
            timestamp: new Date().toISOString()
        })
        setStatusState('idle')
        setPositionState('side')
        setIsPreloading(false)

        // AL terminar onboarding, LIBERAR EL CANDADO primero
        enterPresence('INTRO_DONE')

        // Ahora sí, transicionar al estado real
        enterPresence(currentPage === 'assistant' ? 'INTERVENTION' : 'IDLE_VISIBLE')
    }, [initialContext, currentPage, enterPresence])

    const setPage = useCallback((page: string) => {
        // REGLA DE ORO: Durante la Intro, el sistema técnico NO tiene el volante.
        if (presence === 'INTRO_ACTIVE') return;

        if (currentPage === page) return;

        setCurrentPage(page)

        // Sincronización automática de presencia por página
        if (page === 'assistant') {
            enterPresence('INTERVENTION')
        } else {
            // Solo intentamos ocultar si la guía del onboarding no está activa
            const isGuide = presence === 'GUIDE_ACTIVE' || isGuideActive;
            if (!isGuide) {
                enterPresence('IDLE_HIDDEN')
            }
        }
    }, [enterPresence, currentPage, presence, isGuideActive])

    const updateCognitiveState = useCallback((newState: Partial<CognitiveState>) => {
        setCognitiveState(current => ({
            ...current,
            ...newState
        }))
    }, [])

    return (
        <EleonorContext.Provider
            value={{
                // Nueva API
                presence,
                enterPresence,

                // API Legacy
                isVisible,
                status,
                position,
                initialContext,
                baselineProfile,
                currentPage,
                isAuthorized,
                isPreloading,
                isGuideActive,
                guideHighlight,
                show,
                hide,
                setPosition,
                setStatus,
                setPage,
                preload,
                startGuide,
                stopGuide,
                setGuideHighlight,
                saveResponse,
                completeOnboarding,
                cognitiveState,
                updateCognitiveState,
                isHistoryOpen,
                setHistoryOpen
            }}
        >
            {children}
        </EleonorContext.Provider>
    )
}

export const useEleonor = () => {
    const context = useContext(EleonorContext)
    if (context === undefined) {
        throw new Error('useEleonor must be used within an EleonorProvider')
    }
    return context
}
