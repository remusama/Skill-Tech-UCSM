import {
    Brain, ClipboardList
} from "lucide-react"

export const academicAreas: any[] = [];

export const personalAreas = [
    {
        id: "psicometria",
        name: "Psicometría",
        icon: Brain,
        color: "from-violet-400 to-purple-600",
        textColor: "text-violet-400",
        exams: [
            { id: "lewin-33", title: "Test de Liderazgo — Kurt Lewin", professor: "Kurt Lewin (33 ítems A/D)", duration: "15 min", questions: 33, date: "Siempre", status: "(Ingenieros trabajando)", disabled: true, difficulty: 50 },
            { id: "neo-240", title: "NEO PI-R — Personalidad (240 ítems)", professor: "Costa & McCrae — requiere licencia TEA/PAR o IPIP-NEO", duration: "40 min", questions: 240, date: "Siempre", status: "(Ingenieros trabajando)", disabled: true, difficulty: 50 },
        ],
    },
    {
        id: "expectativas",
        name: "Expectativas",
        icon: ClipboardList,
        color: "from-cyan-400 to-teal-600",
        textColor: "text-cyan-400",
        exams: [
            { id: "cepv-20", title: "CEPV-20 — Expectativas de Programas Vivenciales", professor: "Noe & Schmitt / Martínez-Bocanegra (20 Likert + 3 abiertas)", duration: "10 min", questions: 23, date: "Siempre", status: "Disponible", difficulty: 30 },
        ],
    },
]
