export class TTSService {
  private synth!: SpeechSynthesis
  private voice: SpeechSynthesisVoice | null = null
  private isInitialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis
      this.initializeVoice()
    }
  }

  private initializeVoice() {
    const setVoice = () => {
      const voices = this.synth.getVoices()
      // Prefer Spanish female voices
      this.voice =
        voices.find((voice) => voice.lang.startsWith("es") && voice.name.toLowerCase().includes("female")) ||
        voices.find((voice) => voice.lang.startsWith("es")) ||
        voices[0]
      this.isInitialized = true
    }

    if (this.synth.getVoices().length > 0) {
      setVoice()
    } else {
      this.synth.addEventListener("voiceschanged", setVoice)
    }
  }

  async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }) {
    if (!this.isInitialized || !this.voice) {
      console.warn("TTS not initialized yet")
      return
    }

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = this.voice
    utterance.rate = options?.rate || 0.9
    utterance.pitch = options?.pitch || 1.0
    utterance.volume = options?.volume || 0.8

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve()
      utterance.onerror = (error) => reject(error)
      this.synth.speak(utterance)
    })
  }

  stop() {
    this.synth.cancel()
  }

  getAvailableVoices() {
    return this.synth.getVoices().filter((voice) => voice.lang.startsWith("es"))
  }
}

export const ttsService = new TTSService()
