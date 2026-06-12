/** Stubs para compatibilidade com vercel.ts */
export async function ensureImageJobsTable(): Promise<void> {}
export async function processImageJob(_jobId: number): Promise<void> {}
export function verifyInternalAuth(_req: any, _res: any, _next: any): void { _next(); }
