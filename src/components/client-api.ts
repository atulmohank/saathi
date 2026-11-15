"use client";

export async function post<T = Record<string, unknown>>(
  url: string,
  body: unknown,
  method: "POST" | "DELETE" = "POST",
): Promise<{ ok: boolean; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Network problem. Please try again." } as T & { error?: string } };
  }
}
