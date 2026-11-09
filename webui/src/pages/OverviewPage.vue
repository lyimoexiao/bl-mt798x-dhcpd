<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from "../components/ui/element-plus";
import { useDevice } from "../composables/useDevice";
import { formatBytes } from "../utils/upgrade-protocol.mjs";
const { t } = useI18n();
const { info, connected, version } = useDevice();
</script>
<template>
  <ElCard class="overview-panel" shadow="never">
    <template #header
      ><div class="card-header">
        <h2>{{ t("恢复环境信息") }}</h2>
        <ElTag :type="connected ? 'success' : 'info'">{{
          t(connected ? "已连接" : "离线")
        }}</ElTag>
      </div></template
    >
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem :label="t('设备型号')">{{
        info?.board?.model || "—"
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('兼容标识')"
        ><span class="mono">{{
          info?.board?.compatible || "—"
        }}</span></ElDescriptionsItem
      >
      <ElDescriptionsItem :label="t('构建变体')">{{
        info?.build_variant || "—"
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('版本')">{{
        version || "—"
      }}</ElDescriptionsItem>
      <ElDescriptionsItem :label="t('分区布局')">{{
        info?.storage?.mtd_layout?.current || "—"
      }}</ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="info?.storage?.mtd_layout?.current_parts"
        :label="t('分区定义')"
        ><span class="mono">{{
          info.storage.mtd_layout.current_parts
        }}</span></ElDescriptionsItem
      >
      <ElDescriptionsItem v-if="info?.storage?.mmc?.present" label="MMC"
        >{{ formatBytes(info.storage.mmc.size) }}
        <ul>
          <li v-for="partition in info.storage.mmc.parts" :key="partition.name">
            {{ partition.name }} · {{ formatBytes(partition.size) }}
          </li>
        </ul></ElDescriptionsItem
      >
      <ElDescriptionsItem
        v-for="layout in info?.storage?.mtd_layout?.layouts"
        :key="layout.label"
        :label="layout.label"
        ><span class="mono">{{ layout.parts || "—" }}</span></ElDescriptionsItem
      >
    </ElDescriptions>
  </ElCard>
</template>
