export interface CasaInfo {
    id: "APEX" | "IGNIS" | "NEXUS" | "VISIO"
    name: string
    logo: string
    color: string
    gradient: string
    borderColor: string
    glowColor: string
    badgeBg: string
    badgeText: string
    motto: string
    description: string
    element: string
}

export interface StudentHouseProfile {
    id: number
    username: string
    full_name: string
    email: string
    classroom: string
    house: "APEX" | "IGNIS" | "NEXUS" | "VISIO"
    top_skill: string
    audio_path?: string
}

export const CASAS_INFO: Record<"APEX" | "IGNIS" | "NEXUS" | "VISIO", CasaInfo> = {
    APEX: {
        id: "APEX",
        name: "APEX",
        logo: "/CASAS/APEX.png",
        color: "emerald",
        gradient: "from-emerald-600 via-teal-600 to-green-500",
        borderColor: "border-emerald-500/40",
        glowColor: "rgba(16,185,129,0.4)",
        badgeBg: "bg-emerald-500/20",
        badgeText: "text-emerald-400",
        motto: "Excelencia y Liderazgo Estratégico",
        description: "Líderes de alto rendimiento, orientados a resultados, analítica cuantitativa y visión directiva.",
        element: "Éter Cuántico"
    },
    IGNIS: {
        id: "IGNIS",
        name: "IGNIS",
        logo: "/CASAS/IGNIS.png",
        color: "orange",
        gradient: "from-orange-600 via-amber-600 to-red-500",
        borderColor: "border-orange-500/40",
        glowColor: "rgba(249,115,22,0.4)",
        badgeBg: "bg-orange-500/20",
        badgeText: "text-orange-400",
        motto: "Pasión, Acción y Transformación",
        description: "Espíritu emprendedor, resiliencia ante el cambio y fuerza motora de innovación acelerada.",
        element: "Fuego Emprendedor"
    },
    NEXUS: {
        id: "NEXUS",
        name: "NEXUS",
        logo: "/CASAS/NEXUS.png",
        color: "purple",
        gradient: "from-purple-600 via-fuchsia-600 to-pink-500",
        borderColor: "border-purple-500/40",
        glowColor: "rgba(168,85,247,0.4)",
        badgeBg: "bg-purple-500/20",
        badgeText: "text-purple-400",
        motto: "Conexión, Sinergia e Integración",
        description: "Maestros del trabajo colaborativo, empáticos, estructuradores de redes y puentes de equipo.",
        element: "Sinergia Social"
    },
    VISIO: {
        id: "VISIO",
        name: "VISIO",
        logo: "/CASAS/VISIO.png",
        color: "cyan",
        gradient: "from-cyan-600 via-blue-600 to-indigo-500",
        borderColor: "border-cyan-500/40",
        glowColor: "rgba(6,182,212,0.4)",
        badgeBg: "bg-cyan-500/20",
        badgeText: "text-cyan-400",
        motto: "Pensamiento Crítico y Visión de Futuro",
        description: "Analistas reflexivos, creatividad de diseño prospectivo y resolución de dilemas complejos.",
        element: "Pensamiento Prospectivo"
    }
}

// ── BASE DE DATOS COMPLETA DE 48 ESTUDIANTES Y SUS CASAS ────────────────────
export const ALL_48_STUDENTS: StudentHouseProfile[] = [
    // ── APEX (12 Estudiantes) ──
    {
        id: 1,
        username: "Alyce Nayeli Valdivia Sanz",
        full_name: "Alyce Nayeli Valdivia Sanz",
        email: "alyce.valdivia@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Liderazgo Directivo",
        audio_path: "/audio/Sombrero/Audios_APEX/Alyce_Nayeli_Valdivia_Sanz.mp3"
    },
    {
        id: 2,
        username: "Brescia Avril Oviedo Rodríguez",
        full_name: "Brescia Avril Oviedo Rodríguez",
        email: "brescia.oviedo@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Gestión Estratégica",
        audio_path: "/audio/Sombrero/Audios_APEX/Brescia_Avril_Oviedo_Rodriguez.mp3"
    },
    {
        id: 3,
        username: "César Alejandro Campos García",
        full_name: "César Alejandro Campos García",
        email: "cesar.campos@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "APEX",
        top_skill: "Análisis Operativo",
        audio_path: "/audio/Sombrero/Audios_APEX/Cesar_Alejandro_Campos_Garcia.mp3"
    },
    {
        id: 4,
        username: "Daniel Elias Zapana Daza",
        full_name: "Daniel Elias Zapana Daza",
        email: "daniel.zapana@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Resolución Compleja",
        audio_path: "/audio/Sombrero/Audios_APEX/Daniel_Elias_Zapana_Daza.mp3"
    },
    {
        id: 5,
        username: "Fernanda Josselyn Rodriguez Del Carpio",
        full_name: "Fernanda Josselyn Rodriguez Del Carpio",
        email: "fernanda.rodriguez@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Toma de Decisiones",
        audio_path: "/audio/Sombrero/Audios_APEX/Fernanda_Josselyn_Rodriguez_DelCarpio.mp3"
    },
    {
        id: 6,
        username: "Keith Vladimir Chura Diaz",
        full_name: "Keith Vladimir Chura Diaz",
        email: "keith.chura@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "APEX",
        top_skill: "Rendimiento Alto",
        audio_path: "/audio/Sombrero/Audios_APEX/Keith_Vladimir_Chura_Diaz.mp3"
    },
    {
        id: 7,
        username: "Lucas Adriel Bustamante Mena",
        full_name: "Lucas Adriel Bustamante Mena",
        email: "lucas.bustamante@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Gestión de Metas",
        audio_path: "/audio/Sombrero/Audios_APEX/Lucas_Adriel_Bustamante_Mena.mp3"
    },
    {
        id: 8,
        username: "Luciana Castillo Alvarez",
        full_name: "Luciana Castillo Alvarez",
        email: "luciana.castillo@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "APEX",
        top_skill: "Coordinación Ejecutiva",
        audio_path: "/audio/Sombrero/Audios_APEX/Luciana_Castillo_Alvarez.mp3"
    },
    {
        id: 9,
        username: "Maria Jose Limazca Quispe",
        full_name: "Maria Jose Limazca Quispe",
        email: "maria.limazca@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "APEX",
        top_skill: "Organización de Proyectos",
        audio_path: "/audio/Sombrero/Audios_APEX/Maria_Jose_Limazca_Quispe.mp3"
    },
    {
        id: 10,
        username: "Mariel Dayana Millio Mendoza",
        full_name: "Mariel Dayana Millio Mendoza",
        email: "mariel.millio@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "APEX",
        top_skill: "Planificación Cuántica",
        audio_path: "/audio/Sombrero/Audios_APEX/Mariel_Dayana_Millio_Mendoza.mp3"
    },
    {
        id: 11,
        username: "Ruth Evelyn Calli Choqque",
        full_name: "Ruth Evelyn Calli Choqque",
        email: "ruth.calli@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "APEX",
        top_skill: "Control de Calidad",
        audio_path: "/audio/Sombrero/Audios_APEX/Ruth_Evelyn_Calli_Choqque.mp3"
    },
    {
        id: 12,
        username: "Stephano Samuel Pinto Rivera",
        full_name: "Stephano Samuel Pinto Rivera",
        email: "stephano.pinto@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "APEX",
        top_skill: "Pensamiento Analítico",
        audio_path: "/audio/Sombrero/Audios_APEX/Stephano_Samuel_Pinto_Rivera.mp3"
    },

    // ── VISIO (12 Estudiantes) ──
    {
        id: 13,
        username: "Arjum Jhostim Sarayasi Huarilloclla",
        full_name: "Arjum Jhostim Sarayasi Huarilloclla",
        email: "arjum.sarayasi@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Pensamiento Crítico",
        audio_path: "/audio/Sombrero/Audios_VISIO/Arjum_Jhostim_Sarayasi_Huarilloclla.mp3"
    },
    {
        id: 14,
        username: "Claudia Velasco Quispe",
        full_name: "Claudia Velasco Quispe",
        email: "claudia.velasco@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "VISIO",
        top_skill: "Visión Prospectiva",
        audio_path: "/audio/Sombrero/Audios_VISIO/Claudia_Velasco_Quispe.mp3"
    },
    {
        id: 15,
        username: "Daniela Valeriano Ramos",
        full_name: "Daniela Valeriano Ramos",
        email: "daniela.valeriano@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Análisis Reflexivo",
        audio_path: "/audio/Sombrero/Audios_VISIO/Daniela_Valeriano_Ramos.mp3"
    },
    {
        id: 16,
        username: "Franco Cruz Abado",
        full_name: "Franco Cruz Abado",
        email: "franco.cruz@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "VISIO",
        top_skill: "Diseño Conceptual",
        audio_path: "/audio/Sombrero/Audios_VISIO/Franco_Cruz_Abado.mp3"
    },
    {
        id: 17,
        username: "Javier Zavaleta Gutierrez",
        full_name: "Javier Zavaleta Gutierrez",
        email: "javier.zavaleta@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "VISIO",
        top_skill: "Investigación Diagnóstica",
        audio_path: "/audio/Sombrero/Audios_VISIO/Javier_Zavaleta_Gutierrez.mp3"
    },
    {
        id: 18,
        username: "Karelia Axde Delgado Cornejo",
        full_name: "Karelia Axde Delgado Cornejo",
        email: "karelia.delgado@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "VISIO",
        top_skill: "Estrategia Visual",
        audio_path: "/audio/Sombrero/Audios_VISIO/Karelia_Axde_Delgado_Cornejo.mp3"
    },
    {
        id: 19,
        username: "Kiara Yasumy Zapata Pocco",
        full_name: "Kiara Yasumy Zapata Pocco",
        email: "kiara.zapata@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Evaluación Crítica",
        audio_path: "/audio/Sombrero/Audios_VISIO/Kiara_Yasumy_Zapata_Pocco.mp3"
    },
    {
        id: 20,
        username: "Matias Jose Arteaga Espinoza",
        full_name: "Matias Jose Arteaga Espinoza",
        email: "matias.arteaga@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "VISIO",
        top_skill: "Modelado Futuro",
        audio_path: "/audio/Sombrero/Audios_VISIO/Matias_Jose_Arteaga_Espinoza.mp3"
    },
    {
        id: 21,
        username: "Nurit Tatiana Castro Cuela",
        full_name: "Nurit Tatiana Castro Cuela",
        email: "nurit.castro@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "VISIO",
        top_skill: "Comprensión Avanzada",
        audio_path: "/audio/Sombrero/Audios_VISIO/Nurit_Tatiana_Castro_Cuela.mp3"
    },
    {
        id: 22,
        username: "Paolo Del Piero Hernani Delgado",
        full_name: "Paolo Del Piero Hernani Delgado",
        email: "paolo.hernani@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Síntesis Compleja",
        audio_path: "/audio/Sombrero/Audios_VISIO/Paolo_DelPiero_Hernani_Delgado.mp3"
    },
    {
        id: 23,
        username: "Piero Farith Vega Baca",
        full_name: "Piero Farith Vega Baca",
        email: "piero.vega@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Arquitectura Cognitiva",
        audio_path: "/audio/Sombrero/Audios_VISIO/Piero_Farith_Vega_Baca.mp3"
    },
    {
        id: 24,
        username: "Ricardo Enrique Rondón Pacheco",
        full_name: "Ricardo Enrique Rondón Pacheco",
        email: "ricardo.rondon@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "VISIO",
        top_skill: "Abstracción Lógica",
        audio_path: "/audio/Sombrero/Audios_VISIO/Ricardo_Enrique_Rondon_Pacheco.mp3"
    },

    // ── NEXUS (12 Estudiantes) ──
    {
        id: 25,
        username: "Camila Beltran Huanca",
        full_name: "Camila Yamileth Beltran Huanca",
        email: "camila.beltran@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "NEXUS",
        top_skill: "Trabajo en Equipo",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Camila_Yamileth_Beltran_Huanca.mp3"
    },
    {
        id: 26,
        username: "Cristel Umiyauri Huaylla",
        full_name: "Cristel Xiomara Umiyauri Huaylla",
        email: "cristel.umiyauri@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "NEXUS",
        top_skill: "Comunicación Asertiva",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Cristel_Xiomara_Umiyauri_Huaylla.mp3"
    },
    {
        id: 27,
        username: "Denis Arturo Yana Palazuelos",
        full_name: "Denis Arturo Yana Palazuelos",
        email: "denis.yana@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "NEXUS",
        top_skill: "Cohesión Grupal",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Denis_Arturo_Yana_Palazuelos.mp3"
    },
    {
        id: 28,
        username: "Edison Omar Amanqui Galarza",
        full_name: "Edison Omar Amanqui Galarza",
        email: "edison.amanqui@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "NEXUS",
        top_skill: "Sinergia Colaborativa",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Edison_Omar_Amanqui_Galarza.mp3"
    },
    {
        id: 29,
        username: "Ikerzon Herbeth Quispe Choquepuma",
        full_name: "Ikerzon Herbeth Quispe Choquepuma",
        email: "ikerzon.quispe@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "NEXUS",
        top_skill: "Gestión de Mediación",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Ikerzon_Herberth_Quispe_Choquepuma.mp3"
    },
    {
        id: 30,
        username: "Jimena Isabel Luque Berroa",
        full_name: "Jimena Isabel Luque Berroa",
        email: "jimena.luque@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "NEXUS",
        top_skill: "Empatía Interpersonal",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Jimena_Isabel_Luque_Berroa.mp3"
    },
    {
        id: 31,
        username: "José Manuel Flor Cruz",
        full_name: "José Manuel Flor Cruz",
        email: "jose.flor@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "NEXUS",
        top_skill: "Integración de Redes",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Jose_Manuel_Flor_Cruz.mp3"
    },
    {
        id: 32,
        username: "Julio Gabriel Rodriguez Valdivia",
        full_name: "Julio Gabriel Rodriguez Valdivia",
        email: "julio.rodriguez@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "NEXUS",
        top_skill: "Facilitador de Clima",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Julio_Gabriel_Rodriguez_Valdivia.mp3"
    },
    {
        id: 33,
        username: "Nadieshda Mariana Flores Barriga",
        full_name: "Nadieshda Mariana Flores Barriga",
        email: "nadieshda.flores@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "NEXUS",
        top_skill: "Soporte de Equipo",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Nadieshda_Mariana_Flores_Barriga.mp3"
    },
    {
        id: 34,
        username: "Rodrigo Jhonatan Agüero Condori",
        full_name: "Rodrigo Jhonatan Agüero Condori",
        email: "rodrigo.aguero@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "NEXUS",
        top_skill: "Negociación Armónica",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Rodrigo_Jhonatan_Aguero_Condori.mp3"
    },
    {
        id: 35,
        username: "Sheyla Saida Arqque Quispe",
        full_name: "Sheyla Saida Arqque Quispe",
        email: "sheyla.arqque@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "NEXUS",
        top_skill: "Escucha Activa",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Sheyla_Saida_Arqque_Quispe.mp3"
    },
    {
        id: 36,
        username: "Sonia Lazarte Arredondo",
        full_name: "Sonia Lazarte Arredondo",
        email: "sonia.lazarte@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "NEXUS",
        top_skill: "Conexión Comunitaria",
        audio_path: "/audio/Sombrero/Audios_NEXUS/Sonia_Lazarte_Arredondo.mp3"
    },

    // ── IGNIS (12 Estudiantes) ──
    {
        id: 37,
        username: "James Stephano Alejandro Cosi Rosello",
        full_name: "James Stephano Alejandro Cosi Rosello",
        email: "james.cosi@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "IGNIS",
        top_skill: "Emprendimiento Disruptivo",
        audio_path: "/audio/Sombrero/Audios_IGNIS/James_Stephano_Alejandro_Cosi_Rosello.mp3"
    },
    {
        id: 38,
        username: "Dalessandra Cuervo Quispe",
        full_name: "Dalessandra Cuervo Quispe",
        email: "dalessandra.cuervo@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "IGNIS",
        top_skill: "Agilidad y Acción",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Dalessandra_Cuervo_Quispe.mp3"
    },
    {
        id: 39,
        username: "Fabricio Andre Espinoza Santander",
        full_name: "Fabricio Andre Espinoza Santander",
        email: "fabricio.espinoza@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "IGNIS",
        top_skill: "Innovación Acelerada",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Fabricio_Andre_Espinoza_Santander.mp3"
    },
    {
        id: 40,
        username: "Mariajose Talavera Cardenas",
        full_name: "Mariajose Talavera Cardenas",
        email: "mariajose.talavera@liderazgo.ucsm.pe",
        classroom: "5º A",
        house: "IGNIS",
        top_skill: "Resiliencia Emprendedora",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Mariajose_Talavera_Cardenas.mp3"
    },
    {
        id: 41,
        username: "Juan Francisco Herrera Vargas",
        full_name: "Juan Francisco Herrera Vargas",
        email: "juan.herrera@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "IGNIS",
        top_skill: "Transformación Digital",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Juan_Francisco_Herrera_Vargas.mp3"
    },
    {
        id: 42,
        username: "Piero Alexander Silvestre Gutierrez",
        full_name: "Piero Alexander Silvestre Gutierrez",
        email: "piero.silvestre@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "IGNIS",
        top_skill: "Iniciativa y Empuje",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Piero_Alexander_Silvestre_Gutierrez.mp3"
    },
    {
        id: 43,
        username: "Stefano Lopez Flores",
        full_name: "Stefano Lopez Flores",
        email: "stefano.lopez@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "IGNIS",
        top_skill: "Liderazgo Adaptativo",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Stefano_Lopez_Flores.mp3"
    },
    {
        id: 44,
        username: "Rubí Alexandra Contreras Villarroel",
        full_name: "Rubí Alexandra Contreras Villarroel",
        email: "rubi.contreras@liderazgo.ucsm.pe",
        classroom: "5º B",
        house: "IGNIS",
        top_skill: "Creatividad Disruptiva",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Rubi_Alexandra_Contreras_Villarroel.mp3"
    },
    {
        id: 45,
        username: "Gloria Mia Isabel Callenova Caceres",
        full_name: "Gloria Mia Isabel Callenova Caceres",
        email: "gloria.callenova@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "IGNIS",
        top_skill: "Proactividad Dinámica",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Gloria_Mia_Isabel_Callenova_Caceres.mp3"
    },
    {
        id: 46,
        username: "Edgar Miranda Ccolqque",
        full_name: "Edgar Miranda Ccolqque",
        email: "edgar.miranda@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "IGNIS",
        top_skill: "Adaptabilidad Rápida",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Edgar_Miranda_Ccolqque.mp3"
    },
    {
        id: 47,
        username: "Diana Sophia Chichizola Bustamante",
        full_name: "Diana Sophia Chichizola Bustamante",
        email: "diana.chichizola@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "IGNIS",
        top_skill: "Gestión de Incertidumbre",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Diana_Sophia_Chichizola_Bustamante.mp3"
    },
    {
        id: 48,
        username: "Sashenka Sofie Bernedo Ccanccapa",
        full_name: "Sashenka Sofie Bernedo Ccanccapa",
        email: "sashenka.bernedo@liderazgo.ucsm.pe",
        classroom: "5º C",
        house: "IGNIS",
        top_skill: "Fuerza Ejecutora",
        audio_path: "/audio/Sombrero/Audios_IGNIS/Sashenka_Sofie_Bernedo_Ccanccapa.mp3"
    }
]

// Normalizar texto para coincidencia fonética y flexible
function normalizeText(str: string): string {
    if (!str) return ""
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
}

// Buscar perfil de casa por nombre de estudiante
export function getStudentHouseProfile(nameOrUsername: string): StudentHouseProfile | null {
    if (!nameOrUsername) return null
    const norm = normalizeText(nameOrUsername)

    // Coincidencia exacta o parcial por tokens
    const found = ALL_48_STUDENTS.find(s => {
        const normFull = normalizeText(s.full_name)
        const normUser = normalizeText(s.username)
        return normFull.includes(norm) || norm.includes(normFull) || normUser.includes(norm) || norm.includes(normUser)
    })

    return found || null
}

// Reproducir audio del Sombrero Seleccionador para un integrante
export async function playStudentHouseAudio(
    student: StudentHouseProfile,
    onEnded?: () => void,
    onError?: () => void
): Promise<HTMLAudioElement | null> {
    if (!student) return null

    // 1. Intentar cargar el archivo MP3 del Sombrero Seleccionador
    if (student.audio_path) {
        try {
            const audio = new Audio(student.audio_path)
            if (onEnded) audio.onended = onEnded
            audio.onerror = () => {
                console.warn(`Audio no encontrado en ${student.audio_path}, fallback a sintetizador de voz.`)
                if (onError) onError()
            }
            await audio.play()
            return audio
        } catch (e) {
            console.warn("Error reproduciento audio personalizado del Sombrero:", e)
            if (onError) onError()
        }
    } else {
        if (onError) onError()
    }
    return null
}
