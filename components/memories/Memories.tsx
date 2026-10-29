"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  CalendarDays,
  Eye,
  Download,
  FileText,
  Images,
  Loader2,
  Play,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react"

import {
  fetchMemories,
  fetchMemoryFile,
  getVideoStreamUrl,
  uploadMemory,
  deleteMemory,
  type MemoryAsset,
  type MemoryMediaType,
  type UploadMemoryInput,
} from "@/lib/api/memories"

import { createPortal } from "react-dom"

type UserRole = "mentor" | "student"

type Notice = {
  kind: "success" | "error"
  text: string
}

type ActionsProps = {
  item: MemoryAsset
  role: UserRole
  downloadingId: number | null
  deletingId: number | null
  onDownload: (item: MemoryAsset) => Promise<void>
  onDelete: (item: MemoryAsset) => Promise<void>
}

const PAGE_SIZE = 24

const FILE_LIMITS: Record<MemoryMediaType, number> = {
  photo: 15 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  document: 30 * 1024 * 1024,
}

const ACCEPTED_EXTENSIONS: Record<MemoryMediaType, string> = {
  photo: ".jpg,.jpeg,.png,.webp",
  video: ".mp4,.webm,.mov",
  document: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
}

const CATEGORIES: {
  type: MemoryMediaType
  label: string
  icon: ReactNode
}[] = [
  { type: "photo", label: "Fotos", icon: <Images size={18} /> },
  { type: "video", label: "Videos", icon: <Video size={18} /> },
  { type: "document", label: "Documentos", icon: <FileText size={18} /> },
]

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-")

  return year && month && day
    ? `${day}/${month}/${year}`
    : isoDate
}

function isPdfDocument(item: MemoryAsset): boolean {
  return (
    item.media_type === "document" &&
    (item.content_type?.toLowerCase() === "application/pdf" ||
      item.original_filename.toLowerCase().endsWith(".pdf"))
  )
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${Math.ceil(bytes / 1024)} KB`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado."
}

export function Memories({ role }: { role: UserRole }) {
  const [activeTab, setActiveTab] = useState<MemoryMediaType>("photo")
  const [items, setItems] = useState<MemoryAsset[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<MemoryAsset | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [revision, setRevision] = useState(0)

  const requestVersion = useRef(0)

  useEffect(() => {
    const version = ++requestVersion.current

    setLoading(true)
    setLoadingMore(false)
    setLoadError(null)
    setItems([])
    setTotal(0)

    fetchMemories(activeTab, PAGE_SIZE, 0)
      .then((result) => {
        if (version !== requestVersion.current) return

        setItems(result.items)
        setTotal(result.total)
      })
      .catch((error: unknown) => {
        if (version !== requestVersion.current) return

        setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (version === requestVersion.current) {
          setLoading(false)
        }
      })

    return () => {
      requestVersion.current += 1
    }
  }, [activeTab, revision])

  async function loadMore(): Promise<void> {
    if (loading || loadingMore || items.length >= total) return

    const version = requestVersion.current
    setLoadingMore(true)
    setLoadError(null)

    try {
      const result = await fetchMemories(activeTab, PAGE_SIZE, items.length)
      if (version !== requestVersion.current) return

      setItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id))
        const newItems = result.items.filter(
          (item) => !existingIds.has(item.id),
        )

        return [...previous, ...newItems]
      })
      setTotal(result.total)
    } catch (error) {
      if (version === requestVersion.current) {
        setLoadError(getErrorMessage(error))
      }
    } finally {
      if (version === requestVersion.current) {
        setLoadingMore(false)
      }
    }
  }

  async function handleUpload(input: UploadMemoryInput): Promise<void> {
    const saved = await uploadMemory(input)

    setUploadOpen(false)
    setNotice({
      kind: "success",
      text: `«${saved.title}» se publicó correctamente.`,
    })
    setActiveTab(saved.media_type)
    setRevision((value) => value + 1)
  }

  async function handleDownload(item: MemoryAsset): Promise<void> {
    if (downloadingId !== null) return

    setDownloadingId(item.id)
    setNotice(null)

    try {
      // El endpoint requiere JWT; una URL directa no enviaría Authorization.
      const blob = await fetchMemoryFile(item.id)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = objectUrl
      link.download = item.original_filename || `recuerdo-${item.id}`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 60_000)
    } catch (error) {
      setNotice({
        kind: "error",
        text: `No se pudo descargar: ${getErrorMessage(error)}`,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(item: MemoryAsset): Promise<void> {
    if (role !== "mentor" || deletingId !== null) return

    const confirmed = window.confirm(
      `¿Eliminar permanentemente «${item.title}»? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) return

    setDeletingId(item.id)
    setNotice(null)

    try {
      await deleteMemory(item.id)

      setPreview((current) =>
        current?.id === item.id ? null : current,
      )
      setItems((previous) =>
        previous.filter((memory) => memory.id !== item.id),
      )
      setTotal((previous) => Math.max(0, previous - 1))
      setNotice({
        kind: "success",
        text: `«${item.title}» se eliminó correctamente.`,
      })
      setRevision((previous) => previous + 1)
    } catch (error) {
      setNotice({
        kind: "error",
        text: `No se pudo eliminar: ${getErrorMessage(error)}`,
      })
    } finally {
      setDeletingId(null)
    }
  }

  function changeTab(nextTab: MemoryMediaType): void {
    setActiveTab(nextTab)
    setPreview(null)
    setNotice(null)
  }

  const actionProps = {
    role,
    downloadingId,
    deletingId,
    onDownload: handleDownload,
    onDelete: handleDelete,
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-7 p-4 md:p-8">
        <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-950/30 p-5 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10">
                <Images className="text-emerald-400" />
              </div>

              <div>
                <h1 className="text-2xl font-black uppercase tracking-wide md:text-3xl">
                  Mis recuerdos
                </h1>
                <p className="mt-1 text-sm text-white/55">
                  {role === "mentor"
                    ? "Comparte fotos, videos y materiales de tus actividades."
                    : "Revive los mejores momentos y descarga el material compartido."}
                </p>
              </div>
            </div>

            {role === "mentor" && (
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                <Plus size={18} />
                Subir archivo
              </button>
            )}
          </div>
        </section>

        <div
          role="tablist"
          aria-label="Tipos de recuerdos"
          className="grid max-w-2xl grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1.5"
        >
          {CATEGORIES.map((category) => (
            <CategoryTab
              key={category.type}
              selected={activeTab === category.type}
              onClick={() => changeTab(category.type)}
              icon={category.icon}
              label={category.label}
            />
          ))}
        </div>

        {notice && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm ${
              notice.kind === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {notice.text}
          </div>
        )}

        {loading && (
          <p
            role="status"
            className="rounded-xl bg-white/5 p-7 text-center text-white/60"
          >
            Cargando recuerdos...
          </p>
        )}

        {loadError && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200"
          >
            No se pudieron cargar los recuerdos: {loadError}
            <button
              type="button"
              onClick={() => setRevision((value) => value + 1)}
              className="ml-3 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <FileText size={42} className="text-white/25" />
            <p className="font-semibold text-white/75">
              No hay archivos en esta categoría todavía.
            </p>
            <p className="text-sm text-white/45">
              {role === "mentor"
                ? "Puedes subir el primero desde el botón superior."
                : "Cuando el docente publique material, aparecerá aquí."}
            </p>
          </div>
        )}

        {!loading && activeTab === "photo" && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <PhotoCard
                key={item.id}
                item={item}
                onOpen={setPreview}
                {...actionProps}
              />
            ))}
          </div>
        )}

        {!loading && activeTab === "video" && items.length > 0 && (
          <div className="space-y-5">
            {items.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                onOpen={setPreview}
                {...actionProps}
              />
            ))}
          </div>
        )}

        {!loading && activeTab === "document" && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <DocumentCard
                key={item.id}
                item={item}
                onOpen={setPreview}
                {...actionProps}
              />
            ))}
          </div>
        )}

        {!loading && !loadError && items.length < total && (
          <div className="flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadMore()}
              className="min-h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 text-sm font-bold text-emerald-200 disabled:opacity-50"
            >
              {loadingMore
                ? "Cargando..."
                : `Cargar más (${items.length} de ${total})`}
            </button>
          </div>
        )}
      </div>

      {role === "mentor" && uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}

      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onDownload={handleDownload}
          downloading={downloadingId === preview.id}
        />
      )}
    </div>
  )
}

function CategoryTab({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wide transition ${
        selected
          ? "bg-emerald-500 text-white"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  )
}

function MemoryActions({
  item,
  role,
  downloadingId,
  deletingId,
  onDownload,
  onDelete,
}: ActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => void onDownload(item)}
        disabled={downloadingId !== null}
        title="Descargar archivo"
        aria-label={`Descargar ${item.title}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/65 transition hover:text-emerald-300 disabled:opacity-40"
      >
        {downloadingId === item.id ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}
      </button>

      {role === "mentor" && (
        <button
          type="button"
          onClick={() => void onDelete(item)}
          disabled={deletingId !== null}
          title="Eliminar recuerdo permanentemente"
          aria-label={`Eliminar ${item.title}`}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deletingId === item.id ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      )}
    </div>
  )
}

function PhotoCard({
  item,
  onOpen,
  ...actions
}: ActionsProps & {
  onOpen: (item: MemoryAsset) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = containerRef.current

    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "250px" },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [item.id])

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    let objectUrl: string | null = null

    setSrc(null)
    setFailed(false)

    fetchMemoryFile(item.id)
      .then((blob) => {
        if (!blob.type.startsWith("image/")) {
          if (!cancelled) setFailed(true)
          return
        }

        const nextUrl = URL.createObjectURL(blob)

        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }

        objectUrl = nextUrl
        setSrc(nextUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [item.id, visible])

  return (
    <article
      ref={containerRef}
      className="overflow-hidden rounded-[1.8rem] border border-emerald-500/20 bg-emerald-950/20"
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        disabled={!src || failed}
        aria-label={`Ver fotografía ${item.title}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-black text-left disabled:cursor-default"
      >
        {src && !failed ? (
          <img
            src={src}
            alt={item.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-emerald-950/50 text-emerald-300/60">
            <Images size={43} />
            <span className="text-xs">
              {failed
                ? "No se pudo mostrar la imagen"
                : "Cargando fotografía..."}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 border-[3px] border-emerald-400/50" />
        <span className="absolute bottom-3 left-3 rounded-lg border border-emerald-400/30 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">
          Skill Tech
        </span>
      </button>

      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-bold">{item.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/45">
            <CalendarDays size={13} />
            {formatDate(item.created_at)}
          </p>
        </div>

        <MemoryActions item={item} {...actions} />
      </div>
    </article>
  )
}

function VideoCard({
  item,
  onOpen,
  ...actions
}: ActionsProps & {
  onOpen: (item: MemoryAsset) => void
}) {
  
  const cardRef = useRef<HTMLElement>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [frameReady, setFrameReady] = useState(false)

  useEffect(() => {
    const element = cardRef.current
    if (!element) return

    let cancelled = false
    let observer: IntersectionObserver | null = null

    const loadThumbnail = () => {
      void getVideoStreamUrl(item.id)
        .then((url) => {
          if (!cancelled) {
            setThumbnailUrl(url)
          }
        })
        .catch(() => {
          // Si falla la miniatura, se mantiene el icono original.
        })
    }

    if (typeof IntersectionObserver === "undefined") {
      loadThumbnail()
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer?.disconnect()
            loadThumbnail()
          }
        },
        { rootMargin: "200px" },
      )

      observer.observe(element)
    }

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [item.id])

  return (
    <article
      ref={cardRef}
      className="grid overflow-hidden rounded-[1.8rem] border border-emerald-500/20 bg-emerald-950/20 md:grid-cols-[minmax(220px,340px)_1fr]"
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Ver video ${item.title}`}
        className="group relative flex min-h-48 items-center justify-center overflow-hidden bg-black"
      >
        {!frameReady && (
          <Video size={65} className="text-emerald-300/40" />
        )}

        {thumbnailUrl && (
          <video
            src={thumbnailUrl}
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              frameReady ? "opacity-100" : "opacity-0"
            }`}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget

              // Intentar mostrar un fotograma cercano al segundo 1.
              if (
                Number.isFinite(video.duration) &&
                video.duration > 0.5
              ) {
                video.currentTime = Math.min(
                  1,
                  video.duration / 2
                )
              }
            }}
            onLoadedData={(event) => {
              if (!event.currentTarget.seeking) {
                setFrameReady(true)
              }
            }}
            onSeeked={() => setFrameReady(true)}
            onError={() => {
              setThumbnailUrl(null)
              setFrameReady(false)
            }}
          />
        )}

        <span className="pointer-events-none absolute flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/60 transition-transform duration-300 group-hover:scale-110">
          <Play size={23} fill="white" className="ml-1" />
        </span>
      </button>

      <div className="flex min-w-0 flex-col justify-between gap-5 p-5 sm:p-6">
        <div>
          <h3 className="text-xl font-black">{item.title}</h3>
          <p className="mt-2 text-sm text-white/55">
            {item.description || "Video compartido por el docente."}
          </p>
          <p className="mt-2 text-xs text-white/40">
            {formatSize(item.size_bytes)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <span className="flex items-center gap-1 text-xs text-white/40">
            <CalendarDays size={13} />
            {formatDate(item.created_at)}
          </span>
          <MemoryActions item={item} {...actions} />
        </div>
      </div>
    </article>
  )
}

function DocumentCard({
  item,
  onOpen,
  ...actions
}: ActionsProps & {
  onOpen: (item: MemoryAsset) => void
}) {
  const canPreview = isPdfDocument(item)
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <FileText className="text-emerald-400" />
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-bold">{item.title}</h3>
          <p className="mt-1 truncate text-xs text-white/45">
            {item.original_filename} · {formatSize(item.size_bytes)} ·{" "}
            {formatDate(item.created_at)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canPreview && (
          <button
            type="button"
            onClick={() => onOpen(item)}
            aria-label={`Vista previa de ${item.title}`}
            title="Ver PDF"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white/75 transition hover:text-emerald-300"
          >
            <Eye size={17} />
            Ver PDF
          </button>
        )}

        <MemoryActions item={item} {...actions} />
      </div>
    </article>
  )
}

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void
  onUpload: (input: UploadMemoryInput) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<MemoryMediaType>("photo")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function changeType(nextType: MemoryMediaType): void {
    if (uploading) return

    setType(nextType)
    setFile(null)
    setError(null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (uploading) return

    if (!title.trim() || !file) {
      setError("Ingresa un título y selecciona un archivo.")
      return
    }

    if (title.trim().length > 150) {
      setError("El título no debe superar 150 caracteres.")
      return
    }

    if (file.size === 0) {
      setError("El archivo está vacío.")
      return
    }

    if (file.size > FILE_LIMITS[type]) {
      setError(
        `El tamaño máximo para esta categoría es ${formatSize(FILE_LIMITS[type])}.`,
      )
      return
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`
    if (!ACCEPTED_EXTENSIONS[type].split(",").includes(extension)) {
      setError("La extensión no corresponde a la categoría seleccionada.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      await onUpload({
        title: title.trim(),
        description: description.trim(),
        media_type: type,
        file,
      })
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-memory-title"
        onSubmit={(event) => void submit(event)}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-emerald-500/20 bg-[#051c14] p-5 text-white sm:p-8"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="upload-memory-title"
              className="text-xl font-black uppercase"
            >
              Subir recuerdo
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Comparte material con los estudiantes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {(["photo", "video", "document"] as const).map((category) => (
            <button
              key={category}
              type="button"
              disabled={uploading}
              onClick={() => changeType(category)}
              className={`min-h-11 rounded-xl text-xs font-bold uppercase disabled:opacity-40 ${
                type === category
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/55"
              }`}
            >
              {category === "photo"
                ? "Foto"
                : category === "video"
                  ? "Video"
                  : "Documento"}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm text-white/70">
            Título
            <input
              required
              maxLength={150}
              disabled={uploading}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 block min-h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-white outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-sm text-white/70">
            Descripción (opcional)
            <textarea
              disabled={uploading}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 block w-full resize-y rounded-xl border border-white/15 bg-white/5 p-4 text-white outline-none focus:border-emerald-500"
            />
          </label>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS[type]}
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError(null)
            }}
            aria-label="Seleccionar archivo"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-4 text-center disabled:opacity-40"
          >
            <Upload className="text-emerald-400" />
            <span className="break-all text-sm font-bold">
              {file ? file.name : "Seleccionar archivo"}
            </span>
            <span className="text-xs text-white/45">
              Máximo {formatSize(FILE_LIMITS[type])}
            </span>
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="min-h-11 rounded-xl bg-white/10 px-5 text-sm font-semibold disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}
            {uploading ? "Subiendo..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  )
}

function PreviewModal({
  item,
  onClose,
  onDownload,
  downloading,
}: {
  item: MemoryAsset
  onClose: () => void
  onDownload: (item: MemoryAsset) => Promise<void>
  downloading: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    setUrl(null)
    setError(null)
    setLoading(true)

    async function loadPreview(): Promise<void> {
      try {
        // Los videos usan streaming autenticado.
        if (item.media_type === "video") {
          const streamUrl = await getVideoStreamUrl(item.id)

          if (!cancelled) {
            setUrl(streamUrl)
          }

          return
        }

        // Las fotos y PDF siguen usando Blob con JWT.
        const blob = await fetchMemoryFile(item.id)

        if (cancelled) return

        const previewBlob = isPdfDocument(item)
          ? new Blob([blob], { type: "application/pdf" })
          : blob

        objectUrl = URL.createObjectURL(previewBlob)

        setUrl(objectUrl)
      } catch (fetchError) {
        if (!cancelled) {
          setError(getErrorMessage(fetchError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [
    item.id,
    item.media_type,
    item.content_type,
    item.original_filename,
  ])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleEscape)

    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${item.title}`}
        className="flex max-h-[94dvh] w-full max-w-5xl flex-col gap-3"
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={() => void onDownload(item)}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Descargar
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-40 flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
          {loading && (
            <p className="p-8 text-sm text-white/65">Cargando archivo...</p>
          )}

          {error && (
            <p role="alert" className="p-8 text-sm text-red-300">
              No se pudo abrir: {error}
            </p>
          )}

          {url && item.media_type === "photo" && (
            <img
              src={url}
              alt={item.title}
              className="max-h-[70dvh] w-full object-contain"
            />
          )}

          {url && item.media_type === "video" && (
            <video
              key={item.id}
              src={url}
              controls
              playsInline
              preload="metadata"
              onError={() => {
                setError(
                  "No se pudo reproducir el video. " +
                  "Comprueba su formato o vuelve a abrirlo."
                )
              }}
              className="max-h-[70dvh] w-full"
            >
              Tu navegador no admite la reproducción de este video.
            </video>
          )}

          {url && isPdfDocument(item) && (
            <iframe
              src={url}
              title={`Vista previa de ${item.title}`}
              className="h-[70dvh] w-full border-0 bg-white"
            />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="break-words text-xl font-black">{item.title}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-white/55">{item.description}</p>
          )}
        </div>
      </section>
    </div>,
    document.body
  )
}