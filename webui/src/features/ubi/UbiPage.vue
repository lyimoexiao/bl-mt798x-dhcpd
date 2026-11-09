<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import type { UploadFile } from "element-plus";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElUpload,
  ElDialog,
  ElCheckbox,
  ElAlert,
  ElProgress,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElMessage,
} from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { deviceJson } from "../../services/http";
import {
  downloadBackup,
  uploadWithProgress,
  type TransferProgress,
} from "../../services/transfer";
import { useDevice } from "../../composables/useDevice";
import { parseLength } from "../../services/storage";
import { formatBytes } from "../../utils/upgrade-protocol.mjs";
interface Volume {
  name: string;
  size: number;
  used_bytes: number;
  type: string;
  skip_check: boolean;
  corrupted: boolean;
  upd_marker?: boolean;
  id?: number;
}
const { t, enabled, loading, busy, error, run, confirm } = useMaintenance();
const { info } = useDevice();
const transfer = ref<TransferProgress>({ loaded: 0, total: 0, percent: 0 });
const transferActive = ref(false);
const checkResult = ref<{ name: string; exists: boolean }>();
const deviceInfo = shallowRef<Record<string, string | number | boolean>>();
const attached = ref(false),
  partitions = shallowRef<{ name: string; size: number }[]>([]),
  volumes = shallowRef<Volume[]>([]);
const partition = ref(""),
  name = ref(""),
  size = ref(""),
  type = ref("dynamic"),
  skip = ref(false);
const writeOpen = ref(false),
  writeName = ref(""),
  offset = ref(""),
  fullSize = ref(""),
  renameOpen = ref(false),
  oldName = ref(""),
  newName = ref("");
const file = shallowRef<File>();
async function load() {
  deviceInfo.value =
    await deviceJson<Record<string, string | number | boolean>>("/ubi/info");
  attached.value = !!deviceInfo.value.attached;
  partitions.value =
    (
      await deviceJson<{ partitions: { name: string; size: number }[] }>(
        "/ubi/mtd_list",
      )
    ).partitions || [];
  volumes.value = attached.value
    ? (await deviceJson<{ volumes: Volume[] }>("/ubi/volumes")).volumes || []
    : [];
}
watch(
  enabled,
  (value) => {
    if (value) void run(load);
  },
  { immediate: true },
);
async function action(
  endpoint: string,
  values: Record<string, string | Blob> = {},
  destructive = true,
) {
  if (
    destructive &&
    !(await confirm(
      `${t("确认执行 UBI 操作？")} ${endpoint}: ${values.name || values.mtd_name || values.old_name || ""}`,
    ))
  )
    return;
  let completed = false;
  await run(async () => {
    if (endpoint === "create" && !values.size) delete values.size;
    const result = await deviceJson<{ exists?: boolean }>(
      `/ubi/${endpoint}`,
      values,
    );
    if (endpoint === "check")
      checkResult.value = {
        name: String(values.name),
        exists: !!result.exists,
      };
    await load();
    completed = true;
  }, endpoint !== "check");
  return completed;
}
async function backup(name: string) {
  await run(async () => {
    transferActive.value = true;
    transfer.value = { loaded: 0, total: 0, percent: 0 };
    const completed = await downloadBackup({
      path: "/ubi/backup",
      values: { name },
      fallback: `ubi_${name}.bin`,
      board: info.value?.board?.model || "",
      expected: volumes.value.find((volume) => volume.name === name)
        ?.used_bytes,
      progress: (value) => {
        transfer.value = value;
      },
    });
    if (completed) ElMessage.success(t("操作完成"));
    else transferActive.value = false;
  });
}
async function write() {
  if (!file.value || !writeName.value) return;
  if (
    !(await confirm(
      `${t("确认执行 UBI 操作？")} ${writeName.value} · ${file.value.size} B`,
    ))
  )
    return;
  await run(async () => {
    if (offset.value) parseLength(offset.value);
    if (fullSize.value) parseLength(fullSize.value);
    transferActive.value = true;
    transfer.value = { loaded: 0, total: file.value!.size, percent: 0 };
    await uploadWithProgress(
      "/ubi/write",
      {
        name: writeName.value,
        data: file.value!,
        ...(offset.value ? { offset: offset.value } : {}),
        ...(fullSize.value ? { full_size: fullSize.value } : {}),
      },
      (value) => {
        transfer.value = value;
      },
    );
    await load();
    writeOpen.value = false;
  }, true);
}
</script>
<template>
  <MaintenancePanel
    :title="t('UBI 卷管理')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <ElDescriptions v-if="deviceInfo" :column="1" border
      ><ElDescriptionsItem
        v-for="(value, key) in deviceInfo"
        :key="key"
        :label="String(key)"
        >{{ value }}</ElDescriptionsItem
      ></ElDescriptions
    >
    <ElAlert
      v-if="checkResult"
      :title="`${checkResult.name}: ${t(checkResult.exists ? '卷存在' : '卷不存在')}`"
      :type="checkResult.exists ? 'success' : 'warning'"
      :closable="false"
      show-icon
    />
    <div v-if="transferActive" class="stack" role="status" aria-live="polite">
      <ElProgress :percentage="transfer.percent" />
      <p>
        {{ formatBytes(transfer.loaded) }} / {{ formatBytes(transfer.total) }}
      </p>
    </div>
    <div class="row flex-wrap">
      <ElButton :loading="busy" @click="run(load)">{{ t("刷新") }}</ElButton
      ><ElSelect
        v-model="partition"
        :disabled="busy || attached"
        :aria-label="t('MTD 分区')"
        ><ElOption
          v-for="item in partitions"
          :key="item.name"
          :value="item.name"
          :label="`${item.name} · ${formatBytes(item.size)}`" /></ElSelect
      ><ElButton
        :disabled="busy || attached || !partition"
        @click="action('attach', { mtd_name: partition })"
        >{{ t("挂载") }}</ElButton
      ><ElButton :disabled="busy || !attached" @click="action('detach')">{{
        t("卸载")
      }}</ElButton>
    </div>
    <ElTable :data="volumes"
      ><ElTableColumn
        prop="name"
        :label="t('卷名')"
        min-width="140"
      /><ElTableColumn :label="t('大小')" min-width="120"
        ><template #default="{ row }">{{
          formatBytes(row.size)
        }}</template></ElTableColumn
      ><ElTableColumn :label="t('已使用')" min-width="120"
        ><template #default="{ row }">{{
          formatBytes(row.used_bytes)
        }}</template></ElTableColumn
      >
      <ElTableColumn :label="t('状态')" min-width="130"
        ><template #default="{ row }"
          ><ElTag
            :type="
              row.corrupted ? 'danger' : row.upd_marker ? 'warning' : 'success'
            "
            >{{
              t(row.corrupted ? "卷损坏" : row.upd_marker ? "更新中" : "正常")
            }}</ElTag
          ></template
        ></ElTableColumn
      >
      <ElTableColumn prop="type" :label="t('类型')" /><ElTableColumn
        :label="t('操作')"
        min-width="360"
        ><template #default="{ row }"
          ><div class="row flex-wrap">
            <ElButton
              size="small"
              :disabled="busy"
              @click="action('check', { name: row.name }, false)"
              >{{ t("检查") }}</ElButton
            ><ElButton
              size="small"
              :disabled="busy"
              @click="backup(row.name)"
              >{{ t("备份") }}</ElButton
            ><ElButton
              size="small"
              :disabled="busy"
              @click="
                writeName = row.name;
                file = undefined;
                writeOpen = true;
              "
              >{{ t("写入") }}</ElButton
            ><ElButton
              size="small"
              :disabled="busy"
              @click="
                oldName = row.name;
                newName = row.name;
                renameOpen = true;
              "
              >{{ t("重命名") }}</ElButton
            ><ElButton
              size="small"
              :disabled="busy"
              @click="
                action('skipcheck', {
                  name: row.name,
                  mode: row.skip_check ? '0' : '1',
                })
              "
              >{{ t(row.skip_check ? "启用 CRC" : "跳过 CRC") }}</ElButton
            ><ElButton
              size="small"
              type="danger"
              plain
              :disabled="busy"
              @click="action('remove', { name: row.name })"
              >{{ t("删除") }}</ElButton
            >
          </div></template
        ></ElTableColumn
      ></ElTable
    >
    <ElForm
      label-position="top"
      :disabled="busy || !attached"
      @submit.prevent="
        action('create', { name, size, type, skipcheck: skip ? '1' : '0' })
      "
      ><div class="settings-fields">
        <ElFormItem :label="t('卷名')"><ElInput v-model="name" /></ElFormItem
        ><ElFormItem :label="t('大小')"><ElInput v-model="size" /></ElFormItem
        ><ElFormItem :label="t('类型')"
          ><ElSelect v-model="type"
            ><ElOption label="dynamic" value="dynamic" /><ElOption
              label="static"
              value="static" /></ElSelect
        ></ElFormItem>
      </div>
      <ElCheckbox v-model="skip">{{ t("跳过 CRC") }}</ElCheckbox
      ><ElButton
        native-type="submit"
        type="primary"
        :disabled="!name || busy || !attached"
        >{{ t("创建卷") }}</ElButton
      ></ElForm
    >
  </MaintenancePanel>
  <ElDialog
    v-model="writeOpen"
    :title="`${t('写入')} · ${writeName}`"
    width="min(520px, calc(100% - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    ><ElForm label-position="top" :disabled="busy"
      ><ElFormItem :label="t('偏移')"><ElInput v-model="offset" /></ElFormItem
      ><ElFormItem label="full_size"><ElInput v-model="fullSize" /></ElFormItem
      ><ElUpload
        :auto-upload="false"
        :on-change="(value: UploadFile) => (file = value.raw)"
        ><ElButton>{{ t("选择文件") }}</ElButton></ElUpload
      ></ElForm
    ><ElProgress v-if="transferActive" :percentage="transfer.percent" />
    <template #footer
      ><ElButton :disabled="busy" @click="writeOpen = false">{{
        t("取消")
      }}</ElButton
      ><ElButton
        type="primary"
        :loading="busy"
        :disabled="!file"
        @click="write"
        >{{ t("写入") }}</ElButton
      ></template
    ></ElDialog
  >
  <ElDialog
    v-model="renameOpen"
    :title="t('重命名')"
    width="min(440px, calc(100% - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
    ><ElInput v-model="newName" :aria-label="t('新卷名')" /><template #footer
      ><ElButton :disabled="busy" @click="renameOpen = false">{{
        t("取消")
      }}</ElButton
      ><ElButton
        type="primary"
        :disabled="!newName || busy"
        @click="
          async () => {
            const completed = await action('rename', {
              old_name: oldName,
              new_name: newName,
            });
            if (completed) renameOpen = false;
          }
        "
        >{{ t("确认") }}</ElButton
      ></template
    ></ElDialog
  >
</template>
