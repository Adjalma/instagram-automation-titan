export type NotificationPayload = { title: string; content: string };

export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = payload.title?.trim();
  const content = payload.content?.trim();
  if (!title || !content) return false;
  console.log(`[Notify] ${title}\n${content}`);
  return true;
}
