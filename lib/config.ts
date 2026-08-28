export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000";

export const API_URL = `${API_BASE_URL}/api`;

// Audio is disabled by default. Enable it explicitly only when voice playback is wanted.
export const VOICE_PLAYBACK_ENABLED = process.env.NEXT_PUBLIC_TTS_ENABLED === "true";
