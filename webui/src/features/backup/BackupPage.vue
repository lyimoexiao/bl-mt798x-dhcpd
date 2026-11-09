<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElProgress,
  ElMessage,
} from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { downloadBackup, type TransferProgress } from "../../services/transfer";
import { useDevice } from "../../composables/useDevice";
import { rangeFilename } from "../../utils/backup-name";
import {
  storageTargets,
  parseLength,
  type StorageTarget,
} from "../../services/storage";

import { formatBytes } from "../../utils/upgrade-protocol.mjs";
const { t, enabled, loading, busy, error, run } = useMaintenance();
const { info } = useDevice();
const transferred = ref<TransferProgress>({ loaded: 0, total: 0, percent: 0 });
const targets = shallowRef<StorageTarget[]>([]),
  selected = ref(""),
  range = ref(false),
  start = ref("0x0"),
  end = ref(""),
  progress = ref(0);
const target = computed(() =>
  targets.value.find((item) => item.id === selected.value),
);
watch(
  enabled,
  (value) => {
    if (value)
      void run(async () => {
        targets.value = await storageTargets();
        selected.value = targets.value[0]?.id || "";
      });
  },
  { immediate: true },
);
watch(target, (value) => {
  if (value?.raw) range.value = false;
});
async function backup() {
  await run(async () => {
    if (!target.value) throw new Error(t("请选择存储目标"));
    if (
      range.value &&
      (parseLength(end.value) <= parseLength(start.value) || target.value.raw)
    )
      throw new Error(t("地址范围无效"));
    progress.value = 0;
    const values: Record<string, string> = {
      mode: range.value ? "range" : "part",
      storage: "auto",
      target: target.value.target,
    };
    if (target.value.raw) values.raw = "1";
    if (range.value)
      Object.assign(values, { start: start.value, end: end.value });
    const base = range.value ? parseLength(start.value) : 0;
    const limit = range.value ? parseLength(end.value) : target.value.size;
    if (target.value.size && limit > target.value.size)
      throw new Error(t("文件超过目标范围"));
    const completed = await downloadBackup({
      path: "/backup/main",
      values,
      fallback: rangeFilename(
        target.value.target,
        base,
        limit,
        target.value.raw,
      ),
      board: info.value?.board?.model || "",
      expected: limit - base,
      progress: (value) => {
        transferred.value = value;
        progress.value = value.percent;
      },
    });
    if (completed) ElMessage.success(t("操作完成"));
  });
}
</script>
<template>
  <MaintenancePanel
    :title="t('备份与恢复')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <ElForm label-position="top" :disabled="busy" @submit.prevent="backup"
      ><ElFormItem :label="t('存储目标')"
        ><ElSelect v-model="selected"
          ><ElOption
            v-for="item in targets"
            :key="item.id"
            :value="item.id"
            :label="`${item.label} · ${formatBytes(item.size)}`" /></ElSelect></ElFormItem
      ><ElFormItem :label="t('备份模式')"
        ><ElSelect v-model="range"
          ><ElOption :label="t('完整目标')" :value="false" /><ElOption
            :label="t('地址范围')"
            :value="true"
            :disabled="target?.raw" /></ElSelect
      ></ElFormItem>
      <div v-if="range" class="settings-fields">
        <ElFormItem :label="t('起始地址')"
          ><ElInput v-model="start" /></ElFormItem
        ><ElFormItem :label="t('结束地址（不含）')"
          ><ElInput v-model="end"
        /></ElFormItem>
      </div>
      <ElButton
        type="primary"
        native-type="submit"
        :loading="busy"
        :disabled="!target"
        >{{ t("下载备份") }}</ElButton
      ></ElForm
    >
    <ElProgress v-if="busy || progress" :percentage="progress" />
    <p v-if="busy || progress" role="status" aria-live="polite">
      {{ formatBytes(transferred.loaded) }} /
      {{ formatBytes(transferred.total) }}
    </p>
    <RouterLink to="/flash">{{ t("使用 Flash 工具恢复备份") }}</RouterLink>
  </MaintenancePanel>
</template>
