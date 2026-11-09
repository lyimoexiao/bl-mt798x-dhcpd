import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";

// Proxy only known device endpoints, never frontend modules or source files.
const endpoints = [
  "sysinfo",
  "version",
  "getmtdlayout",
  "upload",
  "result",
  "last-error",
  "backup",
  "env",
  "console",
  "flash",
  "ubi",
  "theme",
  "reboot",
  "reboot-failsafe",
  "boot",
];
const legacyAssets =
  "^/(?:(?:backup|flash|ubi|env|settings|reboot|fail|flashing|booting|gpt|simg|factory)\\.html|main\\.js|theme\\.js|i18n\\.js|[a-z]+_js\\.js|style\\.css|favicon\\.svg)(?:\\?|$)";
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  define: {
    "import.meta.env.VITE_WEBUI_I18N": JSON.stringify(
      process.env.WEBUI_I18N || "1",
    ),
  },
  server: {
    port: 5173,
    proxy: process.env.DEVICE_URL
      ? Object.fromEntries(
          [
            ...endpoints.map((path) => `^/${path}(?:/|$|\\?)`),
            legacyAssets,
          ].map((path) => [
            path,
            { target: process.env.DEVICE_URL, changeOrigin: true },
          ]),
        )
      : {},
  },
  build: {
    target: "es2020",
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        assetFileNames: "app.[ext]",
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
