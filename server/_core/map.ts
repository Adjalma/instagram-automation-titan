// Google Maps proxy removido (era Manus-specific). Use Google Maps JS API diretamente no cliente.
export async function makeRequest<T = unknown>(_endpoint: string, _params?: Record<string, unknown>): Promise<T> {
  throw new Error("Google Maps proxy não disponível — use a Google Maps API diretamente");
}
export type LatLng = { lat: number; lng: number };
