"use client"

import React from 'react'
import { useEleonor } from "@/contexts/eleonor-context"
import { PageTransition } from "@/components/layout/PageTransition"
import { usePerformance } from "@/hooks/use-performance"
import dynamic from 'next/dynamic'

const BackgroundAnimation = dynamic(() => import("@/components/shared/BackgroundAnimation").then(mod => mod.BackgroundAnimation), {
    ssr: false
})

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { status, isAuthorized, isGuideActive } = useEleonor()
    const { isLowPower } = usePerformance()

    // --- SERVICE WORKER REGISTRATION (TRUE PWA) ---
    React.useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            const registerSW = () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('✅ PWA SW Registered:', registration.scope);
                        // Diagnostic log suggested by user
                        console.log('🧪 PWA Status:', {
                            standalone: window.matchMedia("(display-mode: standalone)").matches,
                            controlled: navigator.serviceWorker?.controller !== null,
                            referrer: document.referrer
                        });
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

    // Determinamos el Z-Index de Eleonor basado en si estamos en Onboarding o Guía
    const avatarZIndex = (status === 'onboarding' || isGuideActive) ? 'z-[250]' : 'z-[150]'

    return (
        <div className={`min-h-screen bg-[#000008] text-white ${isLowPower ? 'performance-low' : ''}`}>
            {/* CAPA 0: Fondo base */}
            <div className="fixed inset-0 bg-[#000008] z-0" />

            {/* CAPA 0.5: Animación de Fondo (Z-10) */}
            <div className="fixed inset-0 z-[10] pointer-events-none">
                <BackgroundAnimation />
            </div>


            {/* CAPA 2: Contenido Principal (Z-200) */}
            <div className="relative z-[200] min-h-screen font-sans">
                {children}
            </div>
        </div>
    )
}
