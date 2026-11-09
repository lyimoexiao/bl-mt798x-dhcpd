import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  safelist: [
    "i-lucide-arrow-right",
    "i-lucide-arrow-up-to-line",
    "i-lucide-cpu",
    "i-lucide-database",
    "i-lucide-file-archive",
    "i-lucide-file-check-2",
    "i-lucide-hard-drive",
    "i-lucide-layout-dashboard",
    "i-lucide-menu",
    "i-lucide-moon",
    "i-lucide-network",
    "i-lucide-refresh-cw",
    "i-lucide-settings-2",
    "i-lucide-shield-check",
    "i-lucide-sun",
    "i-lucide-terminal",
    "i-lucide-x",
    "i-lucide-chevron-down",
    "i-lucide-triangle-alert", "i-lucide-circle-help",
  ],
  presets: [
    presetWind3(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
        "flex-shrink": "0",
      },
    }),
  ],
  theme: { colors: { accent: "#2563eb", ink: "#17243b", muted: "#526177" } },
  shortcuts: {
    row: "flex items-center gap-3",
    stack: "flex flex-col gap-4",
    mono: "font-mono text-sm break-all",
  },
});
