<script setup lang="ts">
import type { Component } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMenu, ElMenuItem, ElMenuItemGroup } from "../ui/element-plus";
import { LayoutDashboard, Network } from "../ui/icons";

defineProps<{
  targets: { id: string; title: string; icon: Component }[];
  tools: { id: string; title: string; icon: Component }[];
  available: Set<string>;
}>();
const emit = defineEmits<{ navigate: [] }>();
const route = useRoute();
const { t } = useI18n();
</script>
<template>
  <nav :aria-label="t('主导航')">
    <RouterLink to="/firmware" class="brand" @click="emit('navigate')"
      ><span class="brand-mark"><Network :size="22" /></span
      ><span>MT798x</span></RouterLink
    >
    <ElMenu
      :default-active="route.path"
      router
      class="nav-menu"
      @select="emit('navigate')"
    >
      <ElMenuItem index="/overview"
        ><LayoutDashboard :size="18" /><span>{{
          t("设备概览")
        }}</span></ElMenuItem
      >
      <ElMenuItemGroup :title="t('固件与引导')"
        ><template v-for="item in targets" :key="item.id"
          ><ElMenuItem v-if="available.has(item.id)" :index="`/${item.id}`"
            ><component :is="item.icon" :size="18" /><span>{{
              t(item.title)
            }}</span></ElMenuItem
          ></template
        ></ElMenuItemGroup
      >
      <ElMenuItemGroup :title="t('高级维护')"
        ><template v-for="item in tools" :key="item.id"
          ><ElMenuItem v-if="available.has(item.id)" :index="`/${item.id}`"
            ><component :is="item.icon" :size="18" /><span>{{
              t(item.title)
            }}</span></ElMenuItem
          ></template
        ></ElMenuItemGroup
      >
    </ElMenu>
  </nav>
</template>
