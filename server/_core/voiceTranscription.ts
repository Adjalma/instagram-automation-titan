// Voice transcription removido (era Manus-specific).
export async function transcribeAudio(_audioUrl: string): Promise<{ text: string }> {
  throw new Error("Transcrição de áudio não disponível — integre OpenAI Whisper ou Google Speech-to-Text diretamente");
}
