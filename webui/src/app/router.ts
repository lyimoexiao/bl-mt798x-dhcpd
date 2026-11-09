import { createRouter, createWebHashHistory } from 'vue-router'
import { maintenanceTools, upgradeTargets } from './navigation'
import UpgradePage from '../features/upgrade/UpgradePage.vue'

// Only the recovery workflow is eager. Maintenance tools (especially xterm)
// must not block firmware upload on a small bootloader HTTP/TCP server.
const maintenancePages = {
  reboot: () => import('../features/reboot/RebootPage.vue'),
  env: () => import('../features/environment/EnvironmentPage.vue'),
  settings: () => import('../features/settings/SettingsPage.vue'),
  backup: () => import('../features/backup/BackupPage.vue'),
  flash: () => import('../features/flash/FlashPage.vue'),
  ubi: () => import('../features/ubi/UbiPage.vue'),
  console: () => import('../features/console/ConsolePage.vue'),
}
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/firmware' },
    { path: '/overview', name: 'overview', component: () => import('../pages/OverviewPage.vue'), meta: { title: '设备概览' } },
    ...upgradeTargets.map(item => ({ path: `/${item.id}`, name: item.id, component: UpgradePage, meta: { title: item.title } })),
    ...maintenanceTools.map(item => ({ path: `/${item.id}`, name: item.id, component: maintenancePages[item.id as keyof typeof maintenancePages], meta: { title: item.title } })),
    { path: '/:pathMatch(.*)*', redirect: '/firmware' },
  ],
})
