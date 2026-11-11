export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; fields?: Record<string, string> };

export async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, code: "network" };
  }
  const data = await response.json().catch(() => null);
  if (response.ok) return { ok: true, data: data as T };
  return { ok: false, code: data?.error ?? "server", fields: data?.fields };
}
