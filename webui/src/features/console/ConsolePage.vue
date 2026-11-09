<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  ElAlert,
  ElButton,
  ElCard,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTag,
} from "../../components/ui/element-plus";
import { useDevice } from "../../composables/useDevice";
import { useConsole } from "./useConsole";
import { demo } from "../../services/device";

const { t } = useI18n();
const { available, connected, locked } = useDevice();
const host = ref<HTMLDivElement>();
const command = ref("");
let terminal: Terminal | undefined;
let observer: ResizeObserver | undefined;
const consoleState = useConsole(
  (text) => {
    if (!terminal) return;
    const term = terminal;
    const row = term.buffer.active.viewportY;
    const atBottom = row >= term.buffer.active.baseY;
    term.write(text, () => {
      if (atBottom) term.scrollToBottom();
      else term.scrollToLine(row);
    });
  },
  () => terminal?.reset(),
);
const { token, busy, running, error, result, connect, abort, clear, previous } =
  consoleState;
watch(
  busy,
  (value) => {
    locked.value = value;
  },
  { flush: "sync" },
);
function beforeUnload(event: BeforeUnloadEvent) {
  if (busy.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
onMounted(() => window.addEventListener("beforeunload", beforeUnload));
function send() {
  if (!command.value.trim() || busy.value || !running.value) return;
  const line = command.value;
  command.value = "";
  void consoleState.execute(line);
}
function editTerminal(data: string) {
  if (data === "\u0003") {
    void abort();
    return;
  }
  if (busy.value) return;
  if (data === "\r") {
    send();
    return;
  }
  if (data === "\u007f") {
    command.value = command.value.slice(0, -1);
    return;
  }
  if (data === "\u001b[A") {
    command.value = previous(1);
    return;
  }
  if (data === "\u001b[B") {
    command.value = previous(-1);
    return;
  }
  if (/[\r\n]/.test(data)) {
    ElMessage.warning(t("请逐条执行命令，已阻止多行粘贴。"));
    return;
  }
  if (!/[\x00-\x1f\x7f]/.test(data)) command.value += data;
}
onMounted(async () => {
  await nextTick();
  if (!host.value) return;
  terminal = new Terminal({
    cursorBlink: false,
    convertEol: true,
    scrollback: 5000,
    fontSize: 14,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    allowProposedApi: false,
    allowTransparency: false,
    theme: { background: "#101827", foreground: "#dbe7f8", cursor: "#93b4ff" },
  });
  const fit = new FitAddon();
  terminal.loadAddon(fit);
  terminal.open(host.value);
  terminal.onData(editTerminal);
  observer = new ResizeObserver(() => {
    if (host.value?.clientWidth) fit.fit();
  });
  observer.observe(host.value);
  consoleState.restore();
  terminal.write("", () => {
    try {
      const position = sessionStorage.getItem("console-scroll-row");
      if (position !== null) terminal?.scrollToLine(Number(position));
    } catch {
      /* Optional. */
    }
  });
});
onUnmounted(() => {
  observer?.disconnect();
  try {
    if (terminal)
      sessionStorage.setItem(
        "console-scroll-row",
        String(terminal.buffer.active.viewportY),
      );
  } catch {
    /* Optional. */
  }
  terminal?.dispose();
  locked.value = false;
  window.removeEventListener("beforeunload", beforeUnload);
});
</script>
<template>
  <ElCard class="console-panel" shadow="never">
    <template #header
      ><div class="card-header">
        <h2>{{ t("U-Boot 终端") }}</h2>
        <ElTag :type="busy ? 'warning' : running ? 'success' : 'info'">{{
          t(busy ? "命令执行中" : running ? "已连接" : "未连接")
        }}</ElTag>
      </div></template
    >
    <ElEmpty
      v-if="!connected || !available.has('console')"
      :description="t(!connected ? '请先连接设备' : '当前固件未启用此功能。')"
    />
    <div v-show="connected && available.has('console')" class="stack">
      <ElAlert
        :title="t('终端命令可能修改设备，请仅在可信网络中使用。')"
        type="warning"
        :closable="false"
        show-icon
      />
      <ElForm label-position="top" @submit.prevent="connect">
        <ElFormItem label="Token" prop="token"
          ><div class="row console-token">
            <ElInput
              v-model="token"
              type="password"
              show-password
              autocomplete="off"
              :disabled="running || busy"
              :aria-label="t('终端访问令牌')"
            /><ElButton :disabled="busy || running || demo" @click="connect">{{
              t("连接终端")
            }}</ElButton>
          </div></ElFormItem
        >
      </ElForm>
      <ElAlert
        v-if="error"
        :title="t(error)"
        type="error"
        :closable="false"
        show-icon
      />
      <div ref="host" class="xterm-host" :aria-label="t('终端输出')" />
      <ElForm @submit.prevent="send"
        ><ElFormItem :label="t('命令')" label-position="top"
          ><ElInput
            v-model="command"
            name="command"
            autocomplete="off"
            :spellcheck="false"
            :disabled="busy || !running"
            :aria-label="t('命令')"
            @keydown.up.prevent="command = previous(1)"
            @keydown.down.prevent="command = previous(-1)"
            @keydown.ctrl.c.prevent="abort"
        /></ElFormItem>
        <div class="row flex-wrap">
          <ElButton
            type="primary"
            native-type="submit"
            :loading="busy"
            :disabled="!running || !command.trim()"
            >{{ t("执行命令") }}</ElButton
          ><ElButton :disabled="!busy" @click="abort">{{
            t("中止命令")
          }}</ElButton
          ><ElButton :disabled="busy || !running" @click="clear">{{
            t("清空终端")
          }}</ElButton
          ><span v-if="result !== undefined" role="status"
            >{{ t("返回码") }}: {{ result }}</span
          >
        </div></ElForm
      >
    </div>
  </ElCard>
</template>
