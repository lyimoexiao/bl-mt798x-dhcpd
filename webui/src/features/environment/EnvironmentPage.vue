<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import type { UploadFile } from "element-plus";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElUpload,
} from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { deviceText } from "../../services/http";
import { saveBlob } from "../../utils/download";
const { t, enabled, loading, busy, error, run, confirm } = useMaintenance();
const text = ref(""),
  capacity = ref(""),
  name = ref(""),
  value = ref(""),
  search = ref("");
const restoreFile = shallowRef<File>();
const rows = computed(() =>
  text.value
    .split("\n")
    .filter((line) => line.indexOf("=") > 0)
    .map((line) => ({
      name: line.slice(0, line.indexOf("=")),
      value: line.slice(line.indexOf("=") + 1),
    }))
    .filter((row) =>
      `${row.name} ${row.value}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
    ),
);
async function load() {
  text.value = await deviceText("/env/list");
  capacity.value = await deviceText("/env/size");
}
watch(
  enabled,
  (value) => {
    if (value) void run(load);
  },
  { immediate: true },
);
async function mutate(
  action: string,
  values: Record<string, string | Blob> = {},
) {
  if (!(await confirm(t("该操作将修改设备环境变量，确认继续？")))) return;
  await run(async () => {
    await deviceText(`/env/${action}`, values);
    await load();
  }, true);
}
function exportEnvironment() {
  saveBlob(new Blob([text.value]), "uboot-env.txt");
}
function choose(file: UploadFile) {
  restoreFile.value = file.raw;
}
</script>
<template>
  <MaintenancePanel
    :title="t('环境变量')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <div class="row flex-wrap">
      <ElButton :loading="busy" @click="run(load)">{{ t("刷新") }}</ElButton
      ><ElButton :disabled="busy" @click="exportEnvironment">{{
        t("导出环境变量")
      }}</ElButton
      ><ElButton
        type="danger"
        plain
        :disabled="busy"
        @click="mutate('reset')"
        >{{ t("恢复默认") }}</ElButton
      ><span>{{ capacity }}</span>
    </div>
    <ElInput
      v-model="search"
      :aria-label="t('搜索变量')"
      :placeholder="t('搜索变量')"
      clearable
    />
    <ElTable
      :data="rows"
      height="360"
      @row-click="
        (row) => {
          name = row.name;
          value = row.value;
        }
      "
      ><ElTableColumn
        prop="name"
        :label="t('变量名')"
        min-width="160" /><ElTableColumn
        prop="value"
        :label="t('变量值')"
        min-width="220"
        show-overflow-tooltip
    /></ElTable>
    <ElForm
      label-position="top"
      @submit.prevent="mutate('set', { name, value })"
      ><ElFormItem :label="t('变量名')"
        ><ElInput
          v-model="name"
          name="env-name"
          autocomplete="off"
          :spellcheck="false" /></ElFormItem
      ><ElFormItem :label="t('变量值')"
        ><ElInput
          v-model="value"
          name="env-value"
          autocomplete="off"
          :spellcheck="false"
      /></ElFormItem>
      <div class="row flex-wrap">
        <ElButton
          native-type="submit"
          type="primary"
          :disabled="busy || !name || /[=\s]/.test(name)"
          >{{ t("保存变量") }}</ElButton
        ><ElButton
          type="danger"
          plain
          :disabled="busy || !name"
          @click="mutate('unset', { name })"
          >{{ t("删除变量") }}</ElButton
        >
      </div></ElForm
    >
    <div class="row flex-wrap">
      <ElUpload
        :auto-upload="false"
        :limit="1"
        :on-change="choose"
        :disabled="busy"
        ><ElButton>{{ t("选择环境文件") }}</ElButton></ElUpload
      ><ElButton
        :disabled="busy || !restoreFile"
        @click="restoreFile && mutate('restore', { envfile: restoreFile })"
        >{{ t("导入环境变量") }}</ElButton
      >
    </div>
  </MaintenancePanel>
</template>
