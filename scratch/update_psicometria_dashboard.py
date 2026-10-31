import re

target = 'components/mentor/PsicometriaDashboard.tsx'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports
old_imports = """    Calendar,
    Award
} from "lucide-react\""""

new_imports = """    Calendar,
    Award,
    RefreshCw,
    Radio,
    Clock,
    CheckCircle2
} from "lucide-react\""""

if old_imports in text:
    text = text.replace(old_imports, new_imports)
elif old_imports.replace('\n', '\r\n') in text:
    text = text.replace(old_imports.replace('\n', '\r\n'), new_imports.replace('\n', '\r\n'))
else:
    print("Could not replace imports")

# 2. Update states and fetchDashboard
old_fetch_block = """    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const currentAreaMeta = AREAS.find(a => a.key === selectedArea)!

    // Limpiar filtros al cambiar de área psicométrica
    useEffect(() => {
        setSelectedCategoryFilter(null)
        setExpandedStyle(null)
    }, [selectedArea])

    useEffect(() => {
        const fetchGroups = async () => {
            const token = localStorage.getItem("eleonor_token")
            try {
                const res = await fetch(`${API_BASE_URL}/api/mentor/groups`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setGroups(data)
                }
            } catch (e) {
                console.error("Error fetching groups:", e)
            }
        }
        fetchGroups()
    }, [])

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true)
            setError(null)
            const token = localStorage.getItem("eleonor_token")
            try {
                const params = new URLSearchParams({ area: selectedArea })
                if (selectedGroupId) params.set("group_id", String(selectedGroupId))
                const res = await fetch(`${API_BASE_URL}/api/mentor/dashboard/psicometria?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.detail || "No se pudo cargar el dashboard.")
                }
                const data = await res.json()
                setResult(data)
            } catch (e: any) {
                setError(e.message || "Error al cargar los datos.")
                setResult(null)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboard()
    }, [selectedArea, selectedGroupId])"""

new_fetch_block = """    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // ESTADOS PARA MONITOREO Y REVISIÓN CONTINUA EN VIVO
    const [isAutoSync, setIsAutoSync] = useState(true)
    const [isChecking, setIsChecking] = useState(false)
    const [lastChecked, setLastChecked] = useState<Date | null>(null)
    const [secondsAgo, setSecondsAgo] = useState(0)
    const [newDataNotice, setNewDataNotice] = useState<string | null>(null)

    const currentAreaMeta = AREAS.find(a => a.key === selectedArea)!

    // Limpiar filtros al cambiar de área psicométrica
    useEffect(() => {
        setSelectedCategoryFilter(null)
        setExpandedStyle(null)
    }, [selectedArea])

    useEffect(() => {
        const fetchGroups = async () => {
            const token = localStorage.getItem("eleonor_token")
            try {
                const res = await fetch(`${API_BASE_URL}/api/mentor/groups`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setGroups(data)
                }
            } catch (e) {
                console.error("Error fetching groups:", e)
            }
        }
        fetchGroups()
    }, [])

    // Función principal para cargar y comprobar datos (soporta modo silencioso en vivo)
    const fetchDashboard = async (isSilent = false) => {
        if (!isSilent) {
            setLoading(true)
            setError(null)
        }
        setIsChecking(true)
        const token = localStorage.getItem("eleonor_token")
        try {
            const params = new URLSearchParams({ area: selectedArea })
            if (selectedGroupId) params.set("group_id", String(selectedGroupId))
            params.set("_t", String(Date.now()))

            const res = await fetch(`${API_BASE_URL}/api/mentor/dashboard/psicometria?${params.toString()}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                },
                cache: "no-store"
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "No se pudo cargar el dashboard.")
            }
            const data: PsicometriaResponse = await res.json()

            // Detección proactiva de nuevas evaluaciones o variaciones de promedio
            setResult(prev => {
                if (prev) {
                    if (data.total !== prev.total) {
                        setNewDataNotice(`¡Nuevos datos detectados! Ahora hay ${data.total} estudiantes evaluados.`)
                        setTimeout(() => setNewDataNotice(null), 5000)
                    } else if (data.group_avg_score !== prev.group_avg_score) {
                        setNewDataNotice(`¡Promedio actualizado! Nuevo puntaje grupal: ${data.group_avg_score}/100`)
                        setTimeout(() => setNewDataNotice(null), 5000)
                    }
                }
                return data
            })

            setLastChecked(new Date())
            setSecondsAgo(0)
            if (!isSilent) setError(null)
        } catch (e: any) {
            if (!isSilent) {
                setError(e.message || "Error al cargar los datos.")
                setResult(null)
            } else {
                console.warn("Aviso en ciclo de revisión continua:", e)
            }
        } finally {
            if (!isSilent) setLoading(false)
            setIsChecking(false)
        }
    }

    // 1. Carga inicial y cambio de filtros manuales
    useEffect(() => {
        fetchDashboard(false)
    }, [selectedArea, selectedGroupId])

    // 2. CICLO CONSTANTE DE REVISIÓN EN TIEMPO REAL (Cada 4 segundos)
    useEffect(() => {
        if (!isAutoSync) return

        const interval = setInterval(() => {
            // No saturar si la pestaña está oculta
            if (typeof document !== "undefined" && document.hidden) return
            fetchDashboard(true)
        }, 4000)

        return () => clearInterval(interval)
    }, [isAutoSync, selectedArea, selectedGroupId])

    // 3. Contador de tiempo transcurrido desde la última revisión exitosa
    useEffect(() => {
        const timer = setInterval(() => {
            if (lastChecked) {
                const diff = Math.floor((Date.now() - lastChecked.getTime()) / 1000)
                setSecondsAgo(diff >= 0 ? diff : 0)
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [lastChecked])

    // 4. Re-evaluar de inmediato cuando el mentor regresa a la pestaña o ventana activa
    useEffect(() => {
        const onVisibilityOrFocus = () => {
            if (typeof document !== "undefined" && !document.hidden) {
                fetchDashboard(true)
            }
        }
        window.addEventListener("focus", onVisibilityOrFocus)
        document.addEventListener("visibilitychange", onVisibilityOrFocus)
        return () => {
            window.removeEventListener("focus", onVisibilityOrFocus)
            document.removeEventListener("visibilitychange", onVisibilityOrFocus)
        }
    }, [selectedArea, selectedGroupId])"""

if old_fetch_block in text:
    text = text.replace(old_fetch_block, new_fetch_block)
elif old_fetch_block.replace('\n', '\r\n') in text:
    text = text.replace(old_fetch_block.replace('\n', '\r\n'), new_fetch_block.replace('\n', '\r\n'))
else:
    print("Could not replace fetch_block")

# 3. Update the Header to include the Live Monitoring Bar
old_header_end = """            {/* Barra de filtros de grupo (Deduplicada limpiamente) */}"""

new_live_bar = """            {/* BARRA DE MONITOREO CONTINUO & ESTADO EN TIEMPO REAL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/90 border border-emerald-500/20 rounded-2xl backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Indicador Radar / Faro en Vivo */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                        isAutoSync
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            : "bg-slate-800/80 border-slate-700 text-slate-400"
                    }`}>
                        <span className="relative flex h-2.5 w-2.5">
                            {isAutoSync && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAutoSync ? "bg-emerald-500" : "bg-slate-500"}`}></span>
                        </span>
                        <span>{isAutoSync ? "Monitoreo Continuo Activo" : "Monitoreo Pausado"}</span>
                    </div>

                    {/* Estado dinámico de comprobación */}
                    <div className="flex items-center gap-2 text-xs">
                        {isChecking ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold animate-pulse">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                Comprobando diagnósticos en PostgreSQL...
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                Última comprobación: <strong className="text-slate-200">{lastChecked ? (secondsAgo < 3 ? "hace un instante" : `hace ${secondsAgo}s`) : "iniciando..."}</strong>
                            </span>
                        )}
                        <span className="text-slate-700 hidden md:inline">•</span>
                        <span className="text-[11px] text-slate-400 hidden md:inline">
                            Ciclo de revisión: <strong className="text-[hsl(74,100%,47%)]">cada 4 seg</strong>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Botón para alternar auto-sync */}
                    <button
                        onClick={() => setIsAutoSync(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isAutoSync
                                ? "bg-slate-950/80 hover:bg-slate-900 border-emerald-500/30 text-emerald-400"
                                : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
                        }`}
                        title={isAutoSync ? "Pausar revisión automática" : "Activar revisión automática cada 4s"}
                    >
                        <Radio className={`w-3.5 h-3.5 ${isAutoSync ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                        <span>{isAutoSync ? "Pausar Auto-Sync" : "Reanudar Auto-Sync"}</span>
                    </button>

                    {/* Botón para forzar revisión inmediata */}
                    <button
                        onClick={() => fetchDashboard(true)}
                        disabled={isChecking}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[hsl(74,100%,47%)] hover:bg-[hsl(74,100%,42%)] text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-[hsl(74,100%,47%)]/15 transition-all disabled:opacity-50 active:scale-95"
                        title="Revisar y actualizar datos de la base de datos de inmediato"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-slate-950" : ""}`} />
                        <span>{isChecking ? "Revisando..." : "Revisar Ahora"}</span>
                    </button>
                </div>
            </div>

            {/* Pulso sutil de progreso cuando se realiza la comprobación */}
            {isChecking && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-[hsl(74,100%,47%)] to-emerald-500 rounded-full shadow-[0_0_12px_rgba(186,239,0,0.5)]"
                />
            )}

            {/* Notificación de nuevos datos detectados */}
            <AnimatePresence>
                {newDataNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-between text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-md"
                    >
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-[hsl(74,100%,47%)] animate-bounce" />
                            <span>{newDataNotice}</span>
                        </div>
                        <button
                            onClick={() => setNewDataNotice(null)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Barra de filtros de grupo (Deduplicada limpiamente) */}"""

if old_header_end in text:
    text = text.replace(old_header_end, new_live_bar)
elif old_header_end.replace('\n', '\r\n') in text:
    text = text.replace(old_header_end.replace('\n', '\r\n'), new_live_bar.replace('\n', '\r\n'))
else:
    print("Could not replace header_end")

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated PsicometriaDashboard.tsx successfully!")

