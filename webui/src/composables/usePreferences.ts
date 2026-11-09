import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { applyTheme, loadTheme, type ThemeSettings } from "../services/theme";
import { demo } from "../services/device";
export function usePreferences() {
  const { locale } = useI18n();
  const dark = ref(false);
  watch(
    locale,
    (value) => {
      document.documentElement.lang = value;
      try {
        localStorage.setItem("recovery-locale", value);
        // Keep the retained legacy tools in the same language.
        localStorage.setItem("lang", value === "zh-CN" ? "zh-cn" : value);
      } catch {
        /* Storage optional. */
      }
    },
    { immediate: true },
  );
  function toggleTheme() {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.append(style);
    dark.value = !dark.value;
    document.documentElement.classList.toggle("dark", dark.value);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark.value ? "#101827" : "#f5f7fb");
    try {
      localStorage.setItem("recovery-theme", dark.value ? "dark" : "light");
      localStorage.setItem("theme", dark.value ? "dark" : "light");
      const settings = JSON.parse(
        localStorage.getItem("recovery-theme-settings") || "{}",
      );
      settings.theme = dark.value ? "dark" : "light";
      localStorage.setItem("recovery-theme-settings", JSON.stringify(settings));
    } catch {
      /* Storage optional. */
    }
    void document.documentElement.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
  }
  const media = matchMedia("(prefers-color-scheme: dark)");
  function systemChanged() {
    try {
      const settings = JSON.parse(
        localStorage.getItem("recovery-theme-settings") || "{}",
      );
      if (settings.theme === "auto") applyTheme(settings);
    } catch {}
  }
  function themeChanged(event: Event) {
    dark.value = (event as CustomEvent<boolean>).detail;
  }
  onMounted(async () => {
    media.addEventListener("change", systemChanged);
    window.addEventListener("recovery-theme-change", themeChanged);
    try {
      dark.value = localStorage.getItem("recovery-theme") === "dark";
    } catch {
      /* Light default. */
    }
    document.documentElement.classList.toggle("dark", dark.value);
    try {
      const cached = localStorage.getItem("recovery-theme-settings");
      if (cached) applyTheme(JSON.parse(cached) as ThemeSettings);
      if (!demo) {
        const settings = await loadTheme();
        if (settings.theme) applyTheme(settings);
      }
    } catch {
      /* Offline or older device: use local preference. */
    }
  });
  onUnmounted(() => {
    media.removeEventListener("change", systemChanged);
    window.removeEventListener("recovery-theme-change", themeChanged);
  });
  return { locale, dark, toggleTheme };
}
