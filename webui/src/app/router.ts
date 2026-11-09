import { createRouter, createWebHashHistory } from "vue-router";
import { maintenanceTools, upgradeTargets } from "./navigation";
import UpgradePage from "../features/upgrade/UpgradePage.vue";
import RebootPage from "../features/reboot/RebootPage.vue";
import EnvironmentPage from "../features/environment/EnvironmentPage.vue";
import SettingsPage from "../features/settings/SettingsPage.vue";
import BackupPage from "../features/backup/BackupPage.vue";
import FlashPage from "../features/flash/FlashPage.vue";
import UbiPage from "../features/ubi/UbiPage.vue";
import type { Component } from "vue";
const maintenancePages: Record<string, Component> = {
  reboot: RebootPage,
  env: EnvironmentPage,
  settings: SettingsPage,
  backup: BackupPage,
  flash: FlashPage,
  ubi: UbiPage,
};
import OverviewPage from "../pages/OverviewPage.vue";
import ConsolePage from "../features/console/ConsolePage.vue";

// Real route components, without history fallback requirements on U-Boot.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/firmware" },
    {
      path: "/overview",
      name: "overview",
      component: OverviewPage,
      meta: { title: "设备概览" },
    },
    ...upgradeTargets.map((item) => ({
      path: `/${item.id}`,
      name: item.id,
      component: UpgradePage,
      meta: { title: item.title },
    })),
    ...maintenanceTools.map((item) => ({
      path: `/${item.id}`,
      name: item.id,
      component:
        item.id === "console" ? ConsolePage : maintenancePages[item.id],
      meta: { title: item.title },
    })),
    { path: "/:pathMatch(.*)*", redirect: "/firmware" },
  ],
});
