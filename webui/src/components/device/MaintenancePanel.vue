<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ElAlert, ElCard, ElEmpty, vLoading } from "../ui/element-plus";
defineProps<{
  title: string;
  enabled: boolean;
  busy: boolean;
  error: string;
  loading?: boolean;
}>();
const { t } = useI18n();
</script>
<template>
  <ElCard v-loading="loading" class="maintenance-panel" shadow="never">
    <template #header
      ><h2>{{ title }}</h2></template
    >
    <ElEmpty
      v-if="!enabled && !loading"
      :description="t('连接真实设备后使用')"
    />
    <div v-else :aria-busy="busy" class="stack">
      <ElAlert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
      <slot />
    </div>
  </ElCard>
</template>
