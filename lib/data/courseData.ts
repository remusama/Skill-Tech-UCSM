import {
    Microscope, Calculator, BookMarked, Code, Stethoscope,
    Zap, Lightbulb, Scale, RefreshCw, User, Brain, ClipboardList
} from "lucide-react"

export const academicAreas = [
    {
        id: "ciencias",
        name: "Ciencias",
        icon: Microscope,
        disabled: true,
        color: "from-emerald-400 to-cyan-500",
        textColor: "text-emerald-400",
        exams: [
            { id: "fisica-1", title: "Física I: Mecánica Clásica", professor: "Dr. Ricardo Alonso", duration: "120 min", questions: 45, date: "Siempre", status: "No disponible", disabled: true, difficulty: 75 },
            { id: "quimica-organica", title: "Química Orgánica", professor: "Dra. María Fernández", duration: "90 min", questions: 30, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
            { id: "biologia-celular", title: "Biología Celular", professor: "Dr. Javier Martínez", duration: "100 min", questions: 40, date: "Siempre", status: "No disponible", disabled: true, difficulty: 65 },
        ],
    },
    {
        id: "matematicas",
        name: "Matemáticas",
        icon: Calculator,
        disabled: true,
        color: "from-blue-400 to-indigo-500",
        textColor: "text-blue-400",
        exams: [
            { id: "calculo-1", title: "Cálculo Diferencial", professor: "Dr. Pablo Sánchez", duration: "120 min", questions: 25, date: "Siempre", status: "No disponible", disabled: true, difficulty: 85 },
            { id: "algebra-lineal", title: "Álgebra Lineal", professor: "Dra. Laura Gómez", duration: "90 min", questions: 30, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
            { id: "estadistica", title: "Estadística y Probabilidad", professor: "Dr. Carlos Ruiz", duration: "100 min", questions: 35, date: "Siempre", status: "No disponible", disabled: true, difficulty: 70 },
        ],
    },
    {
        id: "humanidades",
        name: "Humanidades",
        icon: BookMarked,
        disabled: true,
        color: "from-amber-400 to-orange-500",
        textColor: "text-amber-400",
        exams: [
            { id: "historia-universal", title: "Historia Universal Contemporánea", professor: "Dra. Ana Rodríguez", duration: "90 min", questions: 40, date: "Siempre", status: "No disponible", disabled: true, difficulty: 60 },
            { id: "filosofia", title: "Filosofía Moderna", professor: "Dr. Eduardo Torres", duration: "80 min", questions: 25, date: "Siempre", status: "No disponible", disabled: true, difficulty: 65 },
            { id: "literatura", title: "Literatura Latinoamericana", professor: "Dra. Carmen Vega", duration: "100 min", questions: 30, date: "Siempre", status: "No disponible", disabled: true, difficulty: 55 },
        ],
    },
    {
        id: "ingenieria",
        name: "Ingeniería",
        icon: Code,
        disabled: true,
        color: "from-cyan-400 to-blue-600",
        textColor: "text-cyan-400",
        exams: [
            { id: "programacion", title: "Programación Orientada a Objetos", professor: "Dr. Miguel Ángel López", duration: "120 min", questions: 30, date: "Siempre", status: "No disponible", disabled: true, difficulty: 75 },
            { id: "estructuras", title: "Análisis de Estructuras", professor: "Dra. Sofía Mendoza", duration: "100 min", questions: 25, date: "Siempre", status: "No disponible", disabled: true, difficulty: 85 },
            { id: "circuitos", title: "Circuitos Eléctricos", professor: "Dr. Roberto Díaz", duration: "90 min", questions: 35, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
        ],
    },
    {
        id: "medicina",
        name: "Medicina",
        icon: Stethoscope,
        disabled: true,
        color: "from-rose-400 to-red-600",
        textColor: "text-rose-400",
        exams: [
            { id: "anatomia", title: "Anatomía Humana", professor: "Dr. Fernando Gutiérrez", duration: "120 min", questions: 50, date: "Siempre", status: "No disponible", disabled: true, difficulty: 90 },
            { id: "fisiologia", title: "Fisiología Médica", professor: "Dra. Patricia Herrera", duration: "110 min", questions: 45, date: "Siempre", status: "No disponible", disabled: true, difficulty: 85 },
            { id: "farmacologia", title: "Farmacología Básica", professor: "Dr. Alejandro Morales", duration: "100 min", questions: 40, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
        ],
    },
]

export const personalAreas = [
    {
        id: "psicometria",
        name: "Psicometría",
        icon: Brain,
        disabled: false,
        color: "from-violet-400 to-purple-600",
        textColor: "text-violet-400",
        exams: [
            { id: "lewin-33", title: "Test de Liderazgo — Kurt Lewin", professor: "Kurt Lewin (33 ítems A/D)", duration: "15 min", questions: 33, date: "Siempre", status: "Disponible", disabled: false, difficulty: 50 },
            { id: "neo-240", title: "NEO PI-R — Personalidad (240 ítems)", professor: "Costa & McCrae — requiere licencia TEA/PAR o IPIP-NEO", duration: "40 min", questions: 240, date: "Siempre", status: "Disponible", disabled: false, difficulty: 50 },
            { id: "ccl-36", title: "Cuestionario de Competencias de Liderazgo (CCL)", professor: "Marco de Goleman — instrumento de elaboración propia (36 ítems)", duration: "15 min", questions: 36, date: "Siempre", status: "Disponible", disabled: false, difficulty: 40 },
        ],
    },
    {
        id: "expectativas",
        name: "Expectativas",
        icon: ClipboardList,
        disabled: false,
        color: "from-cyan-400 to-teal-600",
        textColor: "text-cyan-400",
        exams: [
            { id: "cepv-20", title: "CEPV-20 — Expectativas de Programas Vivenciales", professor: "Noe & Schmitt / Martínez-Bocanegra (20 Likert + 3 abiertas)", duration: "10 min", questions: 23, date: "Siempre", status: "Disponible", disabled: false, difficulty: 30 },
        ],
    },
    {
        id: "razonamiento",
        name: "Razonamiento",
        icon: Zap,
        disabled: true,
        color: "from-yellow-400 to-orange-500",
        textColor: "text-yellow-400",
        exams: [
            { id: "raz-log", title: "Razonamiento Lógico", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 60 },
            { id: "raz-abs", title: "Abstracción de Patrones", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 70 },
            { id: "raz-amb", title: "Resolución de Ambigüedad", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
        ],
    },
    {
        id: "aprendizaje",
        name: "Aprendizaje",
        icon: Lightbulb,
        disabled: true,
        color: "from-green-400 to-emerald-600",
        textColor: "text-green-400",
        exams: [
            { id: "apr-met", title: "Metacognición y Control", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 50 },
            { id: "apr-est", title: "Estrategias de Aprendizaje", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 65 },
            { id: "apr-tra", title: "Transferencia de Conocimiento", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 75 },
        ],
    },
    {
        id: "criterio",
        name: "Criterio",
        icon: Scale,
        disabled: true,
        color: "from-blue-400 to-indigo-600",
        textColor: "text-blue-400",
        exams: [
            { id: "cri-eti", title: "Juicio Ético", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 60 },
            { id: "cri-ana", title: "Análisis Crítico", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 75 },
            { id: "cri-dec", title: "Criterio Decisional", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 85 },
        ],
    },
    {
        id: "adaptabilidad",
        name: "Adaptabilidad",
        icon: RefreshCw,
        disabled: true,
        color: "from-purple-400 to-pink-600",
        textColor: "text-purple-400",
        exams: [
            { id: "ada-fle", title: "Flexibilidad Cognitiva", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 65 },
            { id: "ada-cam", title: "Respuesta al Cambio", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 75 },
            { id: "ada-est", title: "Adaptación Estratégica", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 85 },
        ],
    },
    {
        id: "autonomia",
        name: "Autonomía",
        icon: User,
        disabled: true,
        color: "from-rose-400 to-red-600",
        textColor: "text-rose-400",
        exams: [
            { id: "aut-ges", title: "Autogestión del Aprendizaje", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 70 },
            { id: "aut-ini", title: "Iniciativa Operativa", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 80 },
            { id: "aut-dir", title: "Autodirección Personal", professor: "IA SkillTech", duration: "10 min", questions: 10, date: "Siempre", status: "No disponible", disabled: true, difficulty: 90 },
        ],
    },
]
