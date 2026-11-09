export const demo = new URLSearchParams(location.search).get("demo") === "1";
export interface SystemInfo {
  board?: { model?: string; compatible?: string };
  ram?: { size?: number };
  build_variant?: string;
  storage?: {
    mtd_layout?: {
      current?: string;
      current_parts?: string;
      layouts?: { label: string; parts: string }[];
    };
    mmc?: {
      present?: boolean;
      size?: number;
      parts?: { name: string; size: number }[];
    };
  };
}
export const demoSystem: SystemInfo = {
  board: {
    model: "MediaTek MT7981 Reference Board",
    compatible: "mediatek,mt7981",
  },
  ram: { size: 256 * 1024 ** 2 },
  build_variant: "advanced",
  storage: {
    mtd_layout: {
      current: "default",
      layouts: [{ label: "default", parts: "Default partition layout" }],
    },
  },
};
export async function request(path: string, body?: FormData) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(
      text.startsWith("<")
        ? `设备请求失败（${response.status}）。请检查连接后重试。`
        : text,
    );
  return text;
}
export async function systemInfo(): Promise<SystemInfo> {
  if (demo) return demoSystem;
  return JSON.parse(await request("/sysinfo"));
}
