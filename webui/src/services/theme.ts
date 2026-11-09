import { deviceJson, deviceText } from "./http";
export interface ThemeSettings {
  theme: string;
  color: string;
  dark_variant: string;
}
export function applyTheme(settings: ThemeSettings) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(style);
  const dark =
    settings.theme === "dark" ||
    (settings.theme === "auto" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle(
    "amoled",
    settings.dark_variant === "amoled",
  );
  const color = /^#[\da-f]{6}$/i.test(settings.color)
    ? settings.color
    : settings.color === "rainbow"
      ? "#7c3aed"
      : "#2563eb";
  document.documentElement.style.setProperty("--el-color-primary", color);
  document.documentElement.style.setProperty("--recovery-primary", color);
  for (const level of [3, 5, 7, 8, 9]) {
    const parts = [1, 3, 5].map((index) =>
      parseInt(color.slice(index, index + 2), 16),
    );
    const target = dark ? 24 : 255;
    document.documentElement.style.setProperty(
      `--el-color-primary-light-${level}`,
      `rgb(${parts.map((part) => Math.round(part + ((target - part) * level) / 10)).join(" ")})`,
    );
  }
  try {
    localStorage.setItem("recovery-theme-settings", JSON.stringify(settings));
    localStorage.setItem("recovery-theme", dark ? "dark" : "light");
  } catch {
    /* Optional. */
  }
  void document.documentElement.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
  window.dispatchEvent(
    new CustomEvent("recovery-theme-change", { detail: dark }),
  );
}
export async function loadTheme() {
  return deviceJson<ThemeSettings>("/theme/get");
}
export async function saveTheme(settings: ThemeSettings) {
  if (
    settings.color &&
    settings.color !== "rainbow" &&
    !/^#[\da-f]{6}$/i.test(settings.color)
  )
    throw new Error("Use a six-digit hex color, e.g. #2563eb");
  await deviceText("/theme/set", { ...settings });
  applyTheme(settings);
}
