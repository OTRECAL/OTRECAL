export type MediaTask = {
  fileId: string;
  expiresAt: Date;
  timeoutId: NodeJS.Timeout;
};

export class MediaScheduler {
  private tasks = new Map<string, MediaTask>();

  scheduleDeletion(fileId: string, ttlSeconds: number, onExpire: (fileId: string) => void) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const timeoutId = setTimeout(() => {
      this.tasks.delete(fileId);
      onExpire(fileId);
    }, ttlSeconds * 1000);

    const task: MediaTask = { fileId, expiresAt, timeoutId };
    this.tasks.set(fileId, task);
    return task;
  }

  cancel(fileId: string) {
    const task = this.tasks.get(fileId);
    if (!task) return;
    clearTimeout(task.timeoutId);
    this.tasks.delete(fileId);
  }
}
