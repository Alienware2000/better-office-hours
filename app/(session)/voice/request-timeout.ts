/** Keep a stalled service from owning the conversation indefinitely. */
export async function withRequestTimeout<T>(
  parent: AbortSignal | undefined,
  milliseconds: number,
  message: string,
  request: (signal: AbortSignal, progress: () => void) => Promise<T>,
  streaming?: { idleMilliseconds: number; totalMilliseconds: number },
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(parent?.reason);
  parent?.addEventListener('abort', cancel, { once: true });
  if (parent?.aborted) cancel();
  const expire = () => controller.abort(new Error(message));
  let timer = setTimeout(expire, milliseconds);
  const totalTimer = streaming ? setTimeout(expire, streaming.totalMilliseconds) : undefined;
  let settled = false;
  const progress = () => {
    if (!streaming || settled || controller.signal.aborted) return;
    clearTimeout(timer);
    timer = setTimeout(expire, streaming.idleMilliseconds);
  };
  let rejectCancelled: (() => void) | undefined;
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancelled = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectCancelled, { once: true });
    if (controller.signal.aborted) rejectCancelled();
  });
  try {
    return await Promise.race([request(controller.signal, progress), cancellation]);
  } catch (error) {
    if (controller.signal.aborted && !parent?.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    settled = true;
    clearTimeout(timer);
    if (totalTimer) clearTimeout(totalTimer);
    if (rejectCancelled) controller.signal.removeEventListener("abort", rejectCancelled);
    parent?.removeEventListener('abort', cancel);
  }
}
