// Heartbeat service removido (era Manus-specific). Use o scheduler interno do servidor.
export type HeartbeatJob = { name: string; cron: string; path: string; method?: string; payload?: unknown; description?: string };
export type HeartbeatJobUpdate = Partial<Omit<HeartbeatJob, "name">> & { enable?: boolean };
export type HeartbeatJobInfo = { taskUid: string; name: string; cronExpression: string; isEnable: boolean };

export async function createHeartbeatJob(_job: HeartbeatJob, _session: string) { return { taskUid: "", nextExecutionAt: null }; }
export async function updateHeartbeatJob(_uid: string, _patch: HeartbeatJobUpdate, _session: string) { return { nextExecutionAt: null }; }
export async function deleteHeartbeatJob(_uid: string, _session: string) {}
export async function listHeartbeatJobs(_session: string) { return { total: 0, actorUserId: "", jobs: [] as HeartbeatJobInfo[] }; }
