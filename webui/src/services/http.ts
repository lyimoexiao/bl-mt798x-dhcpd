export function formData(
  values: Record<string, string | Blob | number | boolean>,
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values))
    form.append(key, value instanceof Blob ? value : String(value));
  return form;
}
export async function deviceFetch(
  path: string,
  values?: Record<string, string | Blob | number | boolean>,
  signal?: AbortSignal,
) {
  const response = await fetch(path, {
    method: values ? "POST" : "GET",
    body: values ? formData(values) : undefined,
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text.startsWith("<")
        ? `HTTP ${response.status}`
        : text || `HTTP ${response.status}`,
    );
  }
  return response;
}
export async function deviceText(
  path: string,
  values?: Record<string, string | Blob | number | boolean>,
) {
  return (await deviceFetch(path, values)).text();
}
export async function deviceJson<T>(
  path: string,
  values?: Record<string, string | Blob | number | boolean>,
): Promise<T> {
  const payload = await (await deviceFetch(path, values)).json();
  if (payload?.ok === false)
    throw new Error(payload.error || "Device operation failed");
  return payload;
}
