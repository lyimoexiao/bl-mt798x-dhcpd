<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ElButton, ElDialog } from "../ui/element-plus";
defineProps<{ open: boolean }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const { t } = useI18n();
</script>
<template>
  <ElDialog
    :model-value="open"
    :title="t('离开当前页面？')"
    width="min(440px, calc(100% - 32px))"
    modal-class="leave-confirm-overlay"
    :close-on-click-modal="false"
    append-to-body
    align-center
    @close="emit('cancel')"
  >
    <template #header="{ titleId, titleClass }"
      ><div class="row">
        <span
          class="i-lucide-triangle-alert text-xl leave-warning-icon"
          aria-hidden="true"
        />
        <h2 :id="titleId" :class="titleClass">{{ t("离开当前页面？") }}</h2>
      </div></template
    >
    <p>{{ t("离开后将丢弃未保存的修改。") }}</p>
    <template #footer
      ><ElButton @click="emit('cancel')">{{ t("留在此页") }}</ElButton
      ><ElButton type="primary" @click="emit('confirm')">{{
        t("离开页面")
      }}</ElButton></template
    >
  </ElDialog>
</template>
