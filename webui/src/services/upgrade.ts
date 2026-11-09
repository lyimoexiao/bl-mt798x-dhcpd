import { deviceJson } from "./http";
export async function lastUpgradeError() {
  try {
    const report = await deviceJson<{ code: number; error: string }>(
      "/last-error",
    );
    if (report.error || report.code) return `[${report.code}] ${report.error}`;
  } catch {
    /* Keep the original error if the device is unreachable. */
  }
  return "";
}
