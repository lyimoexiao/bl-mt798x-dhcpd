export interface ConsoleReply {
  data?: string;
  busy?: boolean;
  overflow?: boolean;
  ret?: number;
}
export async function consoleRequest(
  action: "poll" | "exec" | "abort" | "clear",
  token: string,
  signal: AbortSignal,
  command?: string,
): Promise<ConsoleReply> {
  const data = new FormData();
  if (token) data.append("token", token);
  if (command !== undefined) data.append("cmd", command);
  // exec can stay pending for minutes. Polling carries live output meanwhile.
  const response = await fetch(`/console/${action}`, {
    method: "POST",
    body: data,
    signal,
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(
      `HTTP ${response.status}: ${text.startsWith("<") ? response.statusText : text}`,
    );
  if (!text.trim() || text.trim() === "ok") return {};
  return JSON.parse(text);
}
