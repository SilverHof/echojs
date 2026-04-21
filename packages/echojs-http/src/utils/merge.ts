import type { HttpHooks } from "../types/hooks.js";

function mergeHooks(parent: HttpHooks, child: Partial<HttpHooks> | undefined): HttpHooks {
  if (child === undefined) return parent;
  return {
    init: [...parent.init, ...(child.init ?? [])],
    beforeRequest: [...parent.beforeRequest, ...(child.beforeRequest ?? [])],
    beforeRedirect: [...parent.beforeRedirect, ...(child.beforeRedirect ?? [])],
    beforeRetry: [...parent.beforeRetry, ...(child.beforeRetry ?? [])],
    afterResponse: [...parent.afterResponse, ...(child.afterResponse ?? [])],
    beforeError: [...parent.beforeError, ...(child.beforeError ?? [])],
  };
}

export function mergeRecord(
  parent: Record<string, unknown>,
  child: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (child === undefined) return { ...parent };
  return { ...parent, ...child };
}

export { mergeHooks };
