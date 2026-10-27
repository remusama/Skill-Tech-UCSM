"use client"

import { useMemo, useRef, useState } from "react"
import {
    Image as ImageIcon,
    Video,
    FileText,
    Upload,
    Download,
    Trash2,
    Play,
    X,
    Plus,
    Calendar,
    File,
} from "lucide-react"

type UserRole = "mentor" | "student"
type MemoryType = "photo" | "video" | "document"

interface MemoryItem {
    id: number
    title: string
    description?: string
    type: MemoryType
    url: string
    thumbnail?: string
    fileName: string
    createdAt: string
}

interface MemoriesProps {
    role: UserRole
}

const initialMemories: MemoryItem[] = [
    {
        id: 1,
        title: "Encuentro Skill Tech",
        description: "Momentos destacados de la actividad.",
        type: "photo",
        url: "/memories/photo-1.jpg",
        thumbnail: "/memories/photo-1.jpg",
        fileName: "encuentro-skill-tech.jpg",
        createdAt: "2026-10-10",
    },
    {
        id: 2,
        title: "Actividad de liderazgo",
        description: "Dinámica realizada durante la sesión.",
        type: "photo",
        url: "/memories/photo-2.jpg",
        thumbnail: "/memories/photo-2.jpg",
        fileName: "actividad-liderazgo.jpg",
        createdAt: "2026-10-11",
    },
    {
        id: 3,
        title: "Resumen del evento",
        description: "Video con los principales momentos del encuentro.",
        type: "video",
        url: "/memories/evento.mp4",
        thumbnail: "/memories/video-cover.jpg",
        fileName: "resumen-evento.mp4",
        createdAt: "2026-10-12",
    },
    {
        id: 4,
        title: "Guía de liderazgo",
        description: "Material complementario de la sesión.",
        type: "document",
        url: "/memories/guia-liderazgo.pdf",
        fileName: "guia-liderazgo.pdf",
        createdAt: "2026-10-12",
    },
]

export function Memories({ role }: MemoriesProps) {
    const [activeTab, setActiveTab] = useState<MemoryType>("photo")
    const [memories, setMemories] = useState<MemoryItem[]>(initialMemories)

    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(
        null
    )

    const filteredMemories = useMemo(
        () => memories.filter((memory) => memory.type === activeTab),
        [memories, activeTab]
    )

    const handleDelete = (id: number) => {
        const confirmed = window.confirm(
            "¿Deseas eliminar este archivo de Mis Recuerdos?"
        )

        if (!confirmed) return

        setMemories((prev) => prev.filter((item) => item.id !== id))
    }

    return (
        <div className="min-h-screen text-white">
            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">

                {/* HEADER */}
                <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-950/30 p-6 backdrop-blur-xl">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10">
                                <ImageIcon className="text-emerald-400" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-wide md:text-3xl">
                                    Mis Recuerdos
                                </h1>

                                <p className="mt-1 text-sm text-white/55">
                                    {role === "mentor"
                                        ? "Administra y comparte los recuerdos y materiales de tus actividades."
                                        : "Revive los mejores momentos y descarga el material compartido."}
                                </p>
                            </div>
                        </div>

                        {role === "mentor" && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black uppercase tracking-wider text-white transition hover:bg-emerald-600"
                            >
                                <Plus size={17} />
                                Subir archivo
                            </button>
                        )}
                    </div>
                </section>

                {/* TABS */}
                <div className="grid max-w-2xl grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1.5">
                    <TabButton
                        active={activeTab === "photo"}
                        onClick={() => setActiveTab("photo")}
                        icon={<ImageIcon size={18} />}
                        text="Fotos"
                    />

                    <TabButton
                        active={activeTab === "video"}
                        onClick={() => setActiveTab("video")}
                        icon={<Video size={18} />}
                        text="Videos"
                    />

                    <TabButton
                        active={activeTab === "document"}
                        onClick={() => setActiveTab("document")}
                        icon={<FileText size={18} />}
                        text="Documentos"
                    />
                </div>

                {/* EMPTY */}
                {filteredMemories.length === 0 && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] text-center">
                        <File className="mb-4 h-12 w-12 text-white/15" />

                        <h3 className="font-bold text-white/70">
                            No hay archivos todavía
                        </h3>

                        <p className="mt-1 text-sm text-white/35">
                            {role === "mentor"
                                ? "Sube contenido para compartirlo con los estudiantes."
                                : "El mentor aún no ha publicado contenido en esta sección."}
                        </p>
                    </div>
                )}

                {/* PHOTOS */}
                {activeTab === "photo" && filteredMemories.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredMemories.map((memory) => (
                            <PhotoCard
                                key={memory.id}
                                memory={memory}
                                role={role}
                                onDelete={handleDelete}
                                onOpen={() => setSelectedMemory(memory)}
                            />
                        ))}
                    </div>
                )}

                {/* VIDEOS */}
                {activeTab === "video" && filteredMemories.length > 0 && (
                    <div className="space-y-5">
                        {filteredMemories.map((memory) => (
                            <VideoCard
                                key={memory.id}
                                memory={memory}
                                role={role}
                                onDelete={handleDelete}
                                onOpen={() => setSelectedMemory(memory)}
                            />
                        ))}
                    </div>
                )}

                {/* DOCUMENTS */}
                {activeTab === "document" &&
                    filteredMemories.length > 0 && (
                        <div className="space-y-3">
                            {filteredMemories.map((memory) => (
                                <DocumentCard
                                    key={memory.id}
                                    memory={memory}
                                    role={role}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
            </div>

            {/* MENTOR UPLOAD */}
            {role === "mentor" && showUploadModal && (
                <UploadModal
                    onClose={() => setShowUploadModal(false)}
                    onUpload={(memory) => {
                        setMemories((prev) => [memory, ...prev])
                        setActiveTab(memory.type)
                        setShowUploadModal(false)
                    }}
                />
            )}

            {/* PREVIEW */}
            {selectedMemory && (
                <PreviewModal
                    memory={selectedMemory}
                    role={role}
                    onClose={() => setSelectedMemory(null)}
                />
            )}
        </div>
    )
}

function TabButton({
    active,
    onClick,
    icon,
    text,
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    text: string
}) {
    return (
        <button
            onClick={onClick}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                active
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "text-white/45 hover:bg-white/5 hover:text-white"
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </button>
    )
}

function PhotoCard({
    memory,
    role,
    onDelete,
    onOpen,
}: {
    memory: MemoryItem
    role: UserRole
    onDelete: (id: number) => void
    onOpen: () => void
}) {
    return (
        <article className="group overflow-hidden rounded-[1.8rem] border border-emerald-500/20 bg-emerald-950/20">
            <button
                onClick={onOpen}
                className="relative block aspect-[4/3] w-full overflow-hidden"
            >
                <img
                    src={memory.thumbnail || memory.url}
                    alt={memory.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />

                <div className="pointer-events-none absolute inset-0 border-[3px] border-emerald-400/60" />

                <div className="absolute bottom-4 left-4 rounded-xl border border-emerald-400/30 bg-black/50 px-3 py-1.5 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                        Skill Tech
                    </span>
                </div>
            </button>

            <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                    <h3 className="truncate font-bold">{memory.title}</h3>

                    <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
                        <Calendar size={12} />
                        {memory.createdAt}
                    </p>
                </div>

                <MemoryActions
                    memory={memory}
                    role={role}
                    onDelete={onDelete}
                />
            </div>
        </article>
    )
}

function VideoCard({
    memory,
    role,
    onDelete,
    onOpen,
}: {
    memory: MemoryItem
    role: UserRole
    onDelete: (id: number) => void
    onOpen: () => void
}) {
    return (
        <article className="grid overflow-hidden rounded-[1.8rem] border border-emerald-500/20 bg-emerald-950/20 md:grid-cols-[360px_1fr]">
            <button
                onClick={onOpen}
                className="group relative aspect-video overflow-hidden md:aspect-auto"
            >
                <img
                    src={memory.thumbnail}
                    alt={memory.title}
                    className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-black/50 backdrop-blur">
                        <Play className="ml-1 text-white" fill="white" />
                    </div>
                </div>
            </button>

            <div className="flex min-w-0 flex-col justify-between gap-5 p-6">
                <div>
                    <h3 className="text-xl font-black">{memory.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                        {memory.description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar size={14} />
                        {memory.createdAt}
                    </span>

                    <MemoryActions
                        memory={memory}
                        role={role}
                        onDelete={onDelete}
                    />
                </div>
            </div>
        </article>
    )
}

function DocumentCard({
    memory,
    role,
    onDelete,
}: {
    memory: MemoryItem
    role: UserRole
    onDelete: (id: number) => void
}) {
    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-emerald-500/10">
                    <FileText className="text-emerald-400" />
                </div>

                <div className="min-w-0">
                    <h3 className="truncate font-bold">{memory.title}</h3>

                    <p className="mt-1 truncate text-xs text-white/40">
                        {memory.fileName}
                    </p>
                </div>
            </div>

            <MemoryActions
                memory={memory}
                role={role}
                onDelete={onDelete}
            />
        </article>
    )
}

function MemoryActions({
    memory,
    role,
    onDelete,
}: {
    memory: MemoryItem
    role: UserRole
    onDelete: (id: number) => void
}) {
    return (
        <div className="flex items-center gap-2">
            <a
                href={memory.url}
                download={memory.fileName}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                title="Descargar"
            >
                <Download size={16} />
            </a>

            {role === "mentor" && (
                <button
                    onClick={() => onDelete(memory.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 transition hover:bg-rose-500/15"
                    title="Eliminar"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    )
}

function UploadModal({
    onClose,
    onUpload,
}: {
    onClose: () => void
    onUpload: (memory: MemoryItem) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    const [type, setType] = useState<MemoryType>("photo")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile || !title.trim()) return

        const localUrl = URL.createObjectURL(selectedFile)

        onUpload({
            id: Date.now(),
            title: title.trim(),
            description: description.trim(),
            type,
            url: localUrl,
            thumbnail:
                type === "photo"
                    ? localUrl
                    : type === "video"
                      ? localUrl
                      : undefined,
            fileName: selectedFile.name,
            createdAt: new Date().toLocaleDateString("en-CA"),
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl rounded-[2rem] border border-emerald-500/20 bg-[#051c14] p-6 md:p-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase">
                            Subir recuerdo
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                            Comparte material con los estudiantes.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                    <UploadTypeButton
                        active={type === "photo"}
                        onClick={() => setType("photo")}
                        text="Foto"
                    />

                    <UploadTypeButton
                        active={type === "video"}
                        onClick={() => setType("video")}
                        text="Video"
                    />

                    <UploadTypeButton
                        active={type === "document"}
                        onClick={() => setType("document")}
                        text="Documento"
                    />
                </div>

                <div className="mt-6 space-y-4">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 outline-none focus:border-emerald-500/50"
                        required
                    />

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción opcional"
                        className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 outline-none focus:border-emerald-500/50"
                    />

                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept={
                            type === "photo"
                                ? "image/*"
                                : type === "video"
                                  ? "video/*"
                                  : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                        }
                        onChange={(e) =>
                            setSelectedFile(e.target.files?.[0] || null)
                        }
                    />

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] text-center transition hover:bg-emerald-500/[0.08]"
                    >
                        <Upload className="mb-2 text-emerald-400" />

                        <span className="text-sm font-bold">
                            {selectedFile
                                ? selectedFile.name
                                : "Seleccionar archivo"}
                        </span>

                        {!selectedFile && (
                            <span className="mt-1 text-xs text-white/35">
                                Foto, video o documento según la categoría
                            </span>
                        )}
                    </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl bg-white/5 px-5 text-xs font-bold uppercase"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={!selectedFile || !title.trim()}
                        className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Upload size={15} />
                        Publicar
                    </button>
                </div>
            </form>
        </div>
    )
}

function UploadTypeButton({
    active,
    onClick,
    text,
}: {
    active: boolean
    onClick: () => void
    text: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-11 rounded-xl text-xs font-black uppercase transition ${
                active
                    ? "bg-emerald-500 text-white"
                    : "bg-white/5 text-white/40 hover:text-white"
            }`}
        >
            {text}
        </button>
    )
}

function PreviewModal({
    memory,
    role,
    onClose,
}: {
    memory: MemoryItem
    role: UserRole
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-5xl">
                <div className="mb-3 flex justify-end gap-2">
                    {role === "student" && (
                        <a
                            href={memory.url}
                            download={memory.fileName}
                            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-black uppercase"
                        >
                            <Download size={15} />
                            Descargar
                        </a>
                    )}

                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
                    {memory.type === "photo" && (
                        <img
                            src={memory.url}
                            alt={memory.title}
                            className="max-h-[75vh] w-full object-contain"
                        />
                    )}

                    {memory.type === "video" && (
                        <video
                            src={memory.url}
                            controls
                            className="max-h-[75vh] w-full"
                        />
                    )}
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-black">{memory.title}</h3>

                    {memory.description && (
                        <p className="mt-1 text-sm text-white/45">
                            {memory.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}