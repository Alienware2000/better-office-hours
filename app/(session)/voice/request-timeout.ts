/** Keep a stalled service from owning the conversation indefinitely. */
export async function withRequestTimeout<T>(
  parent: AbortSignal | undefined,
  milliseconds: number,
  message: string,
  request: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(parent?.reason);
  parent?.addEventListener('abort', cancel, { once: true });
  if (parent?.aborted) cancel();
  const timer = setTimeout(() => controller.abort(new Error(message)), milliseconds);
  let rejectCancelled: (() => void) | undefined;
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancelled = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectCancelled, { once: true });
    if (controller.signal.aborted) rejectCancelled();
  });
  try {
    return await Promise.race([request(controller.signal), cancellation]);
  } catch (error) {
    if (controller.signal.aborted && !parent?.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    if (rejectCancelled) controller.signal.removeEventListener("abort", rejectCancelled);
    parent?.removeEventListener('abort', cancel);
  }
}
