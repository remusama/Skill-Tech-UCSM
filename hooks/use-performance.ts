"use client"

import { useState, useEffect } from 'react'

export type PerformanceLevel = 'high' | 'medium' | 'low'

export function usePerformance() {
    const [level, setLevel] = useState<PerformanceLevel>('high')

    useEffect(() => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return

        const cores = navigator.hardwareConcurrency || 4
        const memory = (navigator as any).deviceMemory || 4 // GB

        console.log(`💻 Hardware check: ${cores} cores, ${memory}GB RAM`)

        if (cores <= 2 || memory <= 2) {
            setLevel('low')
        } else if (cores <= 4 || memory <= 4) {
            setLevel('medium')
        } else {
            setLevel('high')
        }
    }, [])

    return {
        level,
        isLowPower: level === 'low',
        isMediumPower: level === 'medium',
        isHighPower: level === 'high',
    }
}
