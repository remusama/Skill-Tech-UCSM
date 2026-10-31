import { API_URL } from "@/lib/config";

export type MemoryMediaType = "photo" | "video" | "document";

export interface MemoryAsset {
  id: number;
  title: string;
  description: string | null;
  media_type: MemoryMediaType;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}

export interface MemoriesResponse {
  total: number;
  items: MemoryAsset[];
}

export interface UploadMemoryInput {
  title: string;
  description?: string;
  media_type: MemoryMediaType;
  file: File;
}

const MEMORIES_API = `${API_URL}/memories`;

// Obtener el token JWT de la sesión activa
function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    throw new Error("Esta operación requiere una sesión del navegador.");
  }

  const token = localStorage.getItem("eleonor_token");

  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión nuevamente.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// Manejar errores sin ocultar los 401 o 403
async function validateResponse(response: Response): Promise<void> {
  if (response.ok) return;

  let message = `Error HTTP ${response.status}`;

  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      message = data.detail;
    }
  } catch {
    // Mantener mensaje HTTP si no hay respuesta JSON.
  }

  if (response.status === 401) {
    throw new Error(`Sesión inválida o expirada: ${message}`);
  }

  if (response.status === 403) {
    throw new Error(`No tienes permiso: ${message}`);
  }

  throw new Error(message);
}

// GET /api/memories
// Disponible para estudiantes y docentes autenticados.
export async function fetchMemories(
  mediaType?: MemoryMediaType,
  limit = 50,
  offset = 0
): Promise<MemoriesResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (mediaType) {
    params.set("media_type", mediaType);
  }

  const response = await fetch(
    `${MEMORIES_API}?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  await validateResponse(response);

  return response.json();
}

// POST /api/memories
// Solo para docentes/mentores autorizados.
export async function uploadMemory(
  input: UploadMemoryInput
): Promise<MemoryAsset> {
  const formData = new FormData();

  formData.append("title", input.title.trim());
  formData.append("description", input.description?.trim() ?? "");
  formData.append("media_type", input.media_type);
  formData.append("file", input.file);

  const response = await fetch(MEMORIES_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  await validateResponse(response);

  return response.json();
}

// GET /api/memories/{id}/file
// Obtiene el archivo usando el JWT.
// Para imágenes y descargas de archivos de tamaño moderado.
export async function fetchMemoryFile(
  memoryId: number
): Promise<Blob> {
  const response = await fetch(
    `${MEMORIES_API}/${memoryId}/file`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  await validateResponse(response);

  return response.blob();
}


export async function deleteMemory(memoryId: number): Promise<void> {
  const response = await fetch(`${MEMORIES_API}/${memoryId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  await validateResponse(response)
}


export async function getVideoStreamUrl(
  memoryId: number,
): Promise<string> {
  const response = await fetch(
    `${MEMORIES_API}/${memoryId}/stream-access`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    },
  )

  await validateResponse(response)

  return `${MEMORIES_API}/${memoryId}/stream`
}