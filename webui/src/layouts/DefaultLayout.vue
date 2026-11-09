<script setup lang="ts">
import { computed, nextTick, onMounted, watch, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ElAlert,
  ElAside,
  ElButton,
  ElContainer,
  ElDrawer,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElFooter,
  ElHeader,
  ElMain,
} from "../components/ui/element-plus";
import { Menu, Moon, RefreshCw, Sun, X } from "../components/ui/icons";
import { i18nEnabled } from "../i18n";
import HelpDialog from "../components/navigation/HelpDialog.vue";
import AppNavigation from "../components/navigation/AppNavigation.vue";
import DeviceSummary from "../components/device/DeviceSummary.vue";
import { upgradeTargets, maintenanceTools } from "../app/navigation";
import { usePreferences } from "../composables/usePreferences";
import { provideDevice } from "../composables/useDevice";
import { demo } from "../services/device";

const { t } = useI18n();
const route = useRoute();
const { info, version, connected, loading, error, locked, available, refresh } =
  provideDevice();
const { locale, dark, toggleTheme } = usePreferences();
const mobileMenu = ref(false);
const title = computed(() => t(String(route.meta.title || "固件更新")));
function focusMain() {
  document.getElementById("main-content")?.focus();
}
watch(
  title,
  (value) => {
    document.title = value;
  },
  { immediate: true },
);
watch(
  () => route.path,
  async () => {
    mobileMenu.value = false;
    await nextTick();
    document.querySelector<HTMLElement>("#page-title")?.focus();
  },
);
function rememberSidebar(event: Event) {
  try {
    sessionStorage.setItem(
      "sidebar-scroll",
      String((event.target as HTMLElement).scrollTop),
    );
  } catch {}
}
onMounted(async () => {
  await refresh();
  await nextTick();
  try {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar)
      sidebar.scrollTop = Number(sessionStorage.getItem("sidebar-scroll") || 0);
  } catch {}
});
</script>
<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMain">{{
    t("跳到主要内容")
  }}</a>
  <ElContainer class="app-shell">
    <ElAside class="sidebar" width="224px" @scroll.passive="rememberSidebar"
      ><AppNavigation
        :targets="upgradeTargets"
        :tools="maintenanceTools"
        :available="available"
    /></ElAside>
    <ElDrawer
      v-model="mobileMenu"
      :title="t('设备维护')"
      direction="ltr"
      size="min(300px, 90%)"
      ><AppNavigation
        :targets="upgradeTargets"
        :tools="maintenanceTools"
        :available="available"
        @navigate="mobileMenu = false"
    /></ElDrawer>
    <ElContainer class="workspace" direction="vertical">
      <ElHeader class="topbar" height="64px">
        <div class="row min-w-0">
          <ElButton
            class="menu-button"
            text
            :aria-label="t('切换导航菜单')"
            :aria-expanded="mobileMenu"
            @click="mobileMenu = !mobileMenu"
            ><X v-if="mobileMenu" :size="20" /><Menu
              v-else
              :size="20" /></ElButton
          ><span>{{ title }}</span>
        </div>
        <div class="row header-controls">
          <HelpDialog />
          <span class="connection" :class="{ online: connected }"
            ><span />{{
              t(
                demo
                  ? "演示模式"
                  : connected
                    ? "设备已连接"
                    : loading
                      ? "连接中…"
                      : "未连接",
              )
            }}</span
          >
          <ElDropdown
            v-if="i18nEnabled"
            trigger="click"
            @command="locale = $event"
            ><ElButton text aria-label="Language / 语言"
              >{{ locale === "zh-CN" ? "简体中文" : "English"
              }}<span
                class="i-lucide-chevron-down"
                aria-hidden="true" /></ElButton
            ><template #dropdown
              ><ElDropdownMenu
                ><ElDropdownItem command="zh-CN" :disabled="locale === 'zh-CN'"
                  >简体中文</ElDropdownItem
                ><ElDropdownItem command="en" :disabled="locale === 'en'"
                  >English</ElDropdownItem
                ></ElDropdownMenu
              ></template
            ></ElDropdown
          >
          <ElButton
            text
            :aria-label="t(dark ? '切换浅色主题' : '切换深色主题')"
            @click="toggleTheme"
            ><Sun v-if="dark" :size="19" /><Moon v-else :size="19"
          /></ElButton>
        </div>
      </ElHeader>
      <ElMain id="main-content" class="main-content" tabindex="-1">
        <div class="page-heading">
          <h1 id="page-title" tabindex="-1">{{ title }}</h1>
          <ElButton :loading="loading" :disabled="locked" @click="refresh"
            ><RefreshCw v-if="!loading" :size="16" />{{ t("刷新") }}</ElButton
          >
        </div>
        <ElAlert
          v-if="demo"
          class="mb-5"
          :title="t('当前为界面演示，硬件信息与校验结果为示例；不会写入设备。')"
          type="info"
          :closable="false"
          show-icon
        />
        <div v-if="error" class="mb-5" role="alert">
          <ElAlert :title="t(error)" type="error" :closable="false" show-icon />
        </div>
        <DeviceSummary />
        <RouterView />
      </ElMain>
      <ElFooter class="footer" height="auto"
        ><span>{{
          version || "MT798x Recovery · U-Boot WebUI"
        }}</span></ElFooter
      >
    </ElContainer>
  </ElContainer>
</template>
