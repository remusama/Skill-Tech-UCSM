"use client"

import React, { useEffect } from 'react'
import { useEleonor } from "@/contexts/eleonor-context"
import { PageTransition } from "@/components/layout/PageTransition"
import { usePerformance } from "@/hooks/use-performance"
import { useTheme } from "@/contexts/theme-context"
import dynamic from 'next/dynamic'

const BackgroundAnimation = dynamic(() => import("@/components/shared/BackgroundAnimation").then(mod => mod.BackgroundAnimation), {
    ssr: false
})

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { status, isAuthorized, isGuideActive } = useEleonor()
    const { isLowPower } = usePerformance()
    const { theme } = useTheme() 
    const darkMode = theme === 'dark'

    // --- SERVICE WORKER REGISTRATION (TRUE PWA) ---
    React.useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const registerSW = () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('✅ PWA SW Registered:', registration.scope);
                    })
                    .catch((err) => {
                        console.error('❌ PWA SW Registration Failed:', err);
                    });
            };

            if (document.readyState === 'complete') {
                registerSW();
            } else {
                window.addEventListener('load', registerSW);
                return () => window.removeEventListener('load', registerSW);
            }
        }
    }, []);

    return (
        <div
            className={`min-h-screen transition-colors duration-500 ${
                darkMode
                    ? "bg-[#000008] text-white"
                    : "bg-[#f7f5ed] text-[#063924]"
            } ${isLowPower ? 'performance-low' : ''}`}
        >
            {/* CAPA 0: Fondo base dinámico */}
            <div
                className={`fixed inset-0 z-0 transition-colors duration-500 ${
                    darkMode ? "bg-[#000008]" : "bg-[#f7f5ed]"
                }`}
            />

            {/* CAPA 0.5: Animación de Fondo (Z-10) */}
            <div className="fixed inset-0 z-[10] pointer-events-none">
                <BackgroundAnimation />
            </div>

            {/* CAPA 2: Contenido Principal */}
            <div className="relative z-[200] min-h-screen font-sans">
                {children}
            </div>
        </div>
    )
}