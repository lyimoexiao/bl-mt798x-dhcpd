<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import type { UploadFile } from "element-plus";
import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElPagination,
  ElProgress,
  ElUpload,
} from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { useLeaveConfirmation } from "../../composables/useLeaveConfirmation";
import LeaveDialog from "../../components/navigation/LeaveDialog.vue";
import { deviceJson } from "../../services/http";
import {
  storageTargets,
  parseLength,
  type StorageTarget,
} from "../../services/storage";
import { saveBlob } from "../../utils/download";
import {
  backupName,
  parseBackupName,
  rangeFilename,
} from "../../utils/backup-name";
import { useDevice } from "../../composables/useDevice";
import HexSelection from "./HexSelection.vue";
import { restorePlan } from "./restore-plan";
import { uploadWithProgress } from "../../services/transfer";
const { t, enabled, loading, busy, error, run, confirm } = useMaintenance();
const { info } = useDevice();
const readRaw = ref(false);
const restoreDetected = ref("");
const targets = shallowRef<StorageTarget[]>([]),
  selected = ref(""),
  start = ref("0x0"),
  end = ref("0x200"),
  page = ref(1),
  jump = ref(""),
  progress = ref(0);
const bytes = shallowRef<Uint8Array>(new Uint8Array()),
  original = shallowRef<Uint8Array>(new Uint8Array());
const edit = ref(""),
  readTarget = ref(""),
  readBase = ref(0),
  restoreFile = shallowRef<File>();
const target = computed(() =>
  targets.value.find((item) => item.id === selected.value),
);
const dirty = computed(() =>
  bytes.value.some((value, index) => value !== original.value[index]),
);
const leave = useLeaveConfirmation(
  busy,
  computed(
    () =>
      dirty.value ||
      (bytes.value.length > 0 &&
        edit.value.replace(/\s/g, "").toLowerCase() !==
          [...bytes.value.slice((page.value - 1) * 512, page.value * 512)]
            .map((value) => value.toString(16).padStart(2, "0"))
            .join("")),
  ),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(bytes.value.length / 512)),
);
const ascii = computed(() =>
  [...bytes.value.slice((page.value - 1) * 512, page.value * 512)]
    .map((value) =>
      value >= 32 && value <= 126 ? String.fromCharCode(value) : ".",
    )
    .join(""),
);
function showPage() {
  edit.value = [...bytes.value.slice((page.value - 1) * 512, page.value * 512)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join(" ")
    .replace(/((?:[\da-f]{2} ){15}[\da-f]{2}) /g, "$1\n");
}
function commitPage() {
  const hex = edit.value.replace(/\s/g, "");
  const count = bytes.value.slice(
    (page.value - 1) * 512,
    page.value * 512,
  ).length;
  if (!/^[\da-f]*$/i.test(hex) || hex.length !== count * 2)
    throw new Error(t("十六进制数据长度或格式无效"));
  const next = bytes.value.slice();
  for (let index = 0; index < count; index++)
    next[(page.value - 1) * 512 + index] = parseInt(
      hex.slice(index * 2, index * 2 + 2),
      16,
    );
  bytes.value = next;
}
function changePage(next: number) {
  try {
    commitPage();
    page.value = next;
    showPage();
  } catch (reason) {
    error.value = String(reason);
  }
}
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
function exportRead() {
  try {
    commitPage();
    saveBlob(
      new Blob([bytes.value.slice().buffer]),
      backupName(
        rangeFilename(
          readTarget.value,
          readBase.value,
          readBase.value + bytes.value.length,
          readRaw.value,
        ),
        info.value?.board?.model || "",
      ),
    );
  } catch (reason) {
    error.value = String(reason);
  }
}
async function read() {
  if (
    (dirty.value || edit.value) &&
    !(await confirm(t("重新读取会丢弃编辑内容，确认继续？")))
  )
    return;
  await run(async () => {
    if (!target.value) throw new Error(t("请选择存储目标"));
    const base = parseLength(start.value),
      length = parseLength(end.value) - base;
    if (length <= 0 || (target.value.size && base + length > target.value.size))
      throw new Error(t("地址范围无效"));
    if (
      length > 1024 ** 2 &&
      !(await confirm(
        `${t("读取较大范围将占用浏览器内存，确认继续？")} ${length} B`,
      ))
    )
      return;
    if (
      target.value.raw &&
      (!target.value.pageSize ||
        base % target.value.pageSize ||
        length % target.value.pageSize)
    )
      throw new Error(t("RAW 范围必须按页对齐"));
    const readSize = target.value.raw
      ? Math.floor(262144 / target.value.pageSize!) * target.value.pageSize!
      : 262144;
    const result = new Uint8Array(length);
    progress.value = 0;
    for (let chunk = 0; chunk < Math.ceil(length / readSize); chunk++) {
      const reply = await deviceJson<{ ok: boolean; data: string }>(
        "/flash/read",
        {
          op: "read",
          storage: "auto",
          target: target.value.target,
          start: `0x${(base + chunk * readSize).toString(16)}`,
          end: `0x${(base + Math.min(length, (chunk + 1) * readSize)).toString(16)}`,
          ...(target.value.raw ? { raw: "1" } : {}),
        },
      );
      const hex = reply.data || "";
      if (hex.length !== Math.min(readSize, length - chunk * readSize) * 2)
        throw new Error("Incomplete device read");
      if (!/^(?:[\da-f]{2})*$/i.test(hex))
        throw new Error("Invalid device hex payload");
      for (let index = 0; index < hex.length / 2; index++)
        result[chunk * readSize + index] = parseInt(
          hex.slice(index * 2, index * 2 + 2),
          16,
        );
      progress.value = Math.min(
        100,
        Math.ceil((((chunk + 1) * readSize) / length) * 100),
      );
    }
    bytes.value = result;
    original.value = result.slice();
    readRaw.value = target.value.raw;
    readBase.value = base;
    readTarget.value = target.value.target;
    page.value = 1;
    showPage();
  });
}
async function write() {
  try {
    commitPage();
  } catch (reason) {
    error.value = String(reason);
    return;
  }
  if (
    !dirty.value ||
    !(await confirm(
      `${t("确认写入修改的字节？")} ${readTarget.value} @ 0x${readBase.value.toString(16)}`,
    ))
  )
    return;
  await run(async () => {
    if (readRaw.value) {
      const destination = targets.value.find(
        (item) => item.target === readTarget.value && item.raw,
      );
      if (!destination) throw new Error(t("请选择存储目标"));
      const chunks = restorePlan(
        destination,
        readBase.value,
        readBase.value + bytes.value.length,
        bytes.value.length,
      );
      for (const chunk of chunks) {
        await uploadWithProgress(
          "/flash/restore",
          {
            op: "restore",
            storage: "auto",
            target: readTarget.value,
            raw: "1",
            start: `0x${chunk.start.toString(16)}`,
            end: `0x${chunk.limit.toString(16)}`,
            backup: new Blob([
              bytes.value.slice(chunk.offset, chunk.end).buffer,
            ]),
          },
          (value) => {
            progress.value = value.percent;
          },
        );
      }
      original.value = bytes.value.slice();
      return;
    }
    for (let index = 0; index < bytes.value.length;) {
      if (bytes.value[index] === original.value[index]) {
        index++;
        continue;
      }
      const begin = index;
      while (
        index < bytes.value.length &&
        bytes.value[index] !== original.value[index] &&
        index - begin < 1024
      )
        index++;
      const data = [...bytes.value.slice(begin, index)]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
      await deviceJson("/flash/write", {
        op: "write",
        storage: "auto",
        target: readTarget.value,
        start: `0x${(readBase.value + begin).toString(16)}`,
        data,
      });
      const next = original.value.slice();
      next.set(bytes.value.slice(begin, index), begin);
      original.value = next;
    }
  }, true);
}
async function erase() {
  if (
    !target.value ||
    !(await confirm(
      `${t("擦除不可撤销，确认目标及范围：")} ${target.value.target} [${start.value}, ${end.value})`,
    ))
  )
    return;
  await run(async () => {
    if (parseLength(end.value) <= parseLength(start.value))
      throw new Error(t("地址范围无效"));
    const destination = target.value!;
    let begin = parseLength(start.value),
      limit = parseLength(end.value);
    if (destination.raw) {
      const block = destination.rawBlockSize;
      if (!block || !destination.eraseSize || begin % block || limit % block)
        throw new Error(t("RAW 范围必须按擦除块对齐"));
      begin = (begin / block) * destination.eraseSize;
      limit = (limit / block) * destination.eraseSize;
    }
    await deviceJson("/flash/erase", {
      op: "erase",
      storage: "auto",
      target: destination.target,
      start: `0x${begin.toString(16)}`,
      end: `0x${limit.toString(16)}`,
    });
    bytes.value = new Uint8Array();
    original.value = new Uint8Array();
    edit.value = "";
  }, true);
}
function fillSelection(first: number, last: number, value: number) {
  try {
    commitPage();
    const next = bytes.value.slice();
    next.fill(value, first, last + 1);
    bytes.value = next;
    showPage();
  } catch (reason) {
    error.value = String(reason);
  }
}
function chooseRestore(value: UploadFile) {
  restoreFile.value = value.raw;
  const detected = parseBackupName(
    value.name,
    targets.value.map((item) => item.target),
  );
  if (!detected) {
    restoreDetected.value = t("未识别备份信息，请手动核对目标和范围");
    return;
  }
  const match = targets.value.find(
    (item) =>
      item.target === `${detected.storage}:${detected.target}` &&
      item.raw === detected.raw,
  );
  if (!match) {
    restoreDetected.value = t("备份目标在当前设备不可用");
    error.value = restoreDetected.value;
    restoreFile.value = undefined;
    return;
  }
  selected.value = match.id;
  start.value = `0x${detected.start.toString(16)}`;
  end.value = `0x${detected.end.toString(16)}`;
  restoreDetected.value = `${match.label} · ${start.value}–${end.value} · ${value.size} B`;
}
async function restore() {
  if (
    !target.value ||
    !restoreFile.value ||
    !(await confirm(
      `${t("恢复备份将覆盖目标数据，确认继续？")} ${target.value.target}`,
    ))
  )
    return;
  await run(async () => {
    const base = parseLength(start.value),
      file = restoreFile.value!;
    if (parseLength(end.value) - base !== file.size)
      throw new Error(t("文件大小必须等于恢复地址范围"));
    if (target.value!.size && base + file.size > target.value!.size)
      throw new Error(t("文件超过目标范围"));
    const chunks = restorePlan(
      target.value!,
      base,
      parseLength(end.value),
      file.size,
    );
    for (const chunk of chunks) {
      await uploadWithProgress(
        "/flash/restore",
        {
          op: "restore",
          storage: "auto",
          target: target.value!.target,
          ...(target.value!.raw ? { raw: "1" } : {}),
          start: `0x${chunk.start.toString(16)}`,
          end: `0x${chunk.limit.toString(16)}`,
          backup: file.slice(chunk.offset, chunk.end),
        },
        (value) => {
          progress.value = Math.floor(
            ((chunk.offset +
              ((chunk.end - chunk.offset) * value.percent) / 100) /
              file.size) *
              100,
          );
        },
      );
    }
  }, true);
}
</script>
<template>
  <MaintenancePanel
    :title="t('Flash 工具')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <ElAlert
      :title="t('写入和擦除可导致设备无法启动，请先备份。')"
      type="warning"
      :closable="false"
      show-icon
    />
    <ElForm label-position="top" :disabled="busy"
      ><ElFormItem :label="t('存储目标')"
        ><ElSelect v-model="selected"
          ><ElOption
            v-for="item in targets"
            :key="item.id"
            :value="item.id"
            :label="item.label" /></ElSelect
      ></ElFormItem>
      <div class="settings-fields">
        <ElFormItem :label="t('起始地址')"
          ><ElInput v-model="start" /></ElFormItem
        ><ElFormItem :label="t('结束地址（不含）')"
          ><ElInput v-model="end"
        /></ElFormItem>
      </div>
      <div class="row flex-wrap">
        <ElButton
          type="primary"
          :loading="busy"
          :disabled="!target"
          @click="read"
          >{{ t("读取") }}</ElButton
        ><ElButton
          type="danger"
          plain
          :disabled="busy || !target"
          @click="erase"
          >{{ t("擦除范围") }}</ElButton
        >
      </div></ElForm
    >
    <template v-if="bytes.length"
      ><div class="row flex-wrap">
        <span class="mono"
          >{{ readTarget }} · 0x{{
            (readBase + (page - 1) * 512).toString(16)
          }}</span
        ><ElInput
          v-model="jump"
          class="offset-input"
          :aria-label="t('跳转偏移')"
        /><ElButton
          :disabled="busy"
          @click="
            () => {
              try {
                changePage(
                  Math.min(pageCount, Math.floor(parseLength(jump) / 512) + 1),
                );
              } catch (reason) {
                error = String(reason);
              }
            }
          "
          >{{ t("跳转") }}</ElButton
        >
      </div>
      <HexSelection
        :key="`${readTarget}-${page}-${bytes.length}`"
        :bytes="bytes.slice((page - 1) * 512, page * 512)"
        :base="(page - 1) * 512"
        :address-base="readBase"
        :disabled="busy"
        @fill="fillSelection"
      />
      <ElInput
        v-model="edit"
        class="hex-editor"
        type="textarea"
        :rows="16"
        :disabled="busy"
        :spellcheck="false"
        :aria-label="t('十六进制编辑器')"
      />
      <pre class="ascii-preview">{{ ascii }}</pre>
      <ElPagination
        :current-page="page"
        :page-count="pageCount"
        layout="prev, pager, next"
        :disabled="busy"
        @update:current-page="changePage"
      />
      <div class="row flex-wrap">
        <ElButton type="primary" :disabled="busy" @click="write">{{
          t("写入修改")
        }}</ElButton
        ><ElButton :disabled="busy" @click="exportRead">{{
          t("导出读取数据")
        }}</ElButton>
      </div></template
    >
    <div class="row flex-wrap">
      <ElUpload :auto-upload="false" :disabled="busy" :on-change="chooseRestore"
        ><ElButton>{{ t("选择备份文件") }}</ElButton></ElUpload
      ><ElButton :disabled="busy || !restoreFile || !target" @click="restore">{{
        t("恢复备份")
      }}</ElButton>
    </div>
    <p v-if="restoreDetected" role="status">{{ restoreDetected }}</p>
    <ElProgress v-if="busy || progress" :percentage="progress" />
  </MaintenancePanel>
  <LeaveDialog
    :open="leave.leaveOpen.value"
    @confirm="leave.confirmLeave"
    @cancel="leave.cancelLeave"
  />
</template>
