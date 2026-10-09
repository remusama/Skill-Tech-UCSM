"use client"

import React from "react"
import { getStudentHouseProfile, CASAS_INFO } from "@/lib/casasData"

export interface StudentHouseAvatarProps {
    studentName?: string
    username?: string
    email?: string
    photoUrl?: string
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    showHouseBadge?: boolean
    className?: string
    onClick?: () => void
}

export const StudentHouseAvatar: React.FC<StudentHouseAvatarProps> = ({
    studentName,
    username,
    email,
    photoUrl,
    size = "md",
    showHouseBadge = true,
    className = "",
    onClick
}) => {
    // 1. Resolver el perfil de casa mediante nombre, username o email
    const profile = getStudentHouseProfile(studentName || username || email || "")
    const houseInfo = profile ? CASAS_INFO[profile.house] : null

    // 2. Mapeo de dimensiones
    const sizeConfig = {
        xs: {
            container: "w-7 h-7 text-xs rounded-lg",
            badge: "w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-[1.5px]",
            imgSize: "w-2.5 h-2.5"
        },
        sm: {
            container: "w-9 h-9 text-xs rounded-xl",
            badge: "w-4 h-4 -bottom-1 -right-1 border-[1.5px]",
            imgSize: "w-3 h-3"
        },
        md: {
            container: "w-11 h-11 text-base rounded-2xl",
            badge: "w-5 h-5 -bottom-1 -right-1 border-2",
            imgSize: "w-3.5 h-3.5"
        },
        lg: {
            container: "w-14 h-14 text-xl rounded-2xl",
            badge: "w-6 h-6 -bottom-1.5 -right-1.5 border-2",
            imgSize: "w-4.5 h-4.5"
        },
        xl: {
            container: "w-20 h-20 text-3xl rounded-3xl",
            badge: "w-8 h-8 -bottom-2 -right-2 border-2",
            imgSize: "w-6 h-6"
        }
    }[size]

    const initial = (studentName || username || "?").trim().charAt(0).toUpperCase() || "?"

    // 3. Estilos temáticos de la casa
    const borderClass = houseInfo
        ? `${houseInfo.borderColor} ring-1 ring-white/10`
        : "border-emerald-500/20"

    const bgGradient = houseInfo
        ? `bg-gradient-to-br ${houseInfo.gradient}`
        : "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400"

    return (
        <div
            onClick={onClick}
            className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className} ${onClick ? 'cursor-pointer' : ''}`}
            title={houseInfo ? `${studentName || username} · Casa ${houseInfo.name} (${houseInfo.motto})` : studentName || username}
        >
            {/* Foto o Avatar principal */}
            <div
                className={`${sizeConfig.container} flex items-center justify-center font-black text-white shadow-lg border ${borderClass} ${photoUrl ? 'bg-slate-900 overflow-hidden' : bgGradient} transition-transform`}
            >
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={studentName || username || "Avatar"}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span>{initial}</span>
                )}
            </div>

            {/* Logo de su Casa superpuesto en la foto */}
            {showHouseBadge && houseInfo && (
                <div
                    className={`absolute ${sizeConfig.badge} rounded-full bg-slate-950 border-slate-900 shadow-xl flex items-center justify-center overflow-hidden z-20 pointer-events-none`}
                    style={{
                        boxShadow: `0 0 10px ${houseInfo.glowColor}, 0 2px 4px rgba(0,0,0,0.6)`
                    }}
                >
                    <img
                        src={houseInfo.logo}
                        alt={`Logo Casa ${houseInfo.name}`}
                        className={`${sizeConfig.imgSize} object-contain`}
                    />
                </div>
            )}
        </div>
    )
}

export default StudentHouseAvatar
