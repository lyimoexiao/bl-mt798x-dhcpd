import { onScopeDispose, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { consoleRequest } from "../../services/console";
import { demo } from "../../services/device";

export function useConsole(write: (text: string) => void, reset: () => void) {
  const token = ref("");
  const busy = ref(false);
  const running = ref(false);
  const error = ref("");
  const result = ref<number>();
  const history: string[] = [];
  let historyIndex = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller = new AbortController();
  let executing = false;
  let output = "";
  let disposed = false;

  function append(text: string) {
    write(text);
    output = (output + text).slice(-200000);
    try {
      sessionStorage.setItem("failsafe_console_output", output);
    } catch {
      /* Optional. */
    }
  }
  function restore() {
    try {
      token.value = sessionStorage.getItem("console-token") || "";
      output = sessionStorage.getItem("failsafe_console_output") || "";
      if (output) write(output);
    } catch {
      /* Optional. */
    }
  }
  watch(token, (value) => {
    try {
      sessionStorage.setItem("console-token", value);
    } catch {
      /* Optional; never include token in URL. */
    }
  });
  async function poll() {
    if (!running.value || disposed) return;
    try {
      const reply = await consoleRequest(
        "poll",
        token.value,
        controller.signal,
      );
      if (disposed) return;
      if (reply.data) append(reply.data);
      busy.value = executing || !!reply.busy;
      if (reply.overflow) error.value = "终端缓冲区溢出，部分输出已丢失。";
    } catch (reason) {
      if (controller.signal.aborted) return;
      error.value = reason instanceof Error ? reason.message : "终端连接失败";
      running.value = false;
      return;
    }
    if (running.value) timer = setTimeout(poll, busy.value ? 250 : 650);
  }
  function connect() {
    if (running.value || disposed) return;
    error.value = "";
    if (demo) {
      append("\r\nMT798x Recovery (demo)\r\n");
      return;
    }
    controller = new AbortController();
    running.value = true;
    void poll();
  }
  async function execute(command: string) {
    if (!command.trim() || busy.value || !running.value) return false;
    history.unshift(command);
    history.length = Math.min(history.length, 50);
    historyIndex = -1;
    executing = true;
    busy.value = true;
    result.value = undefined;
    error.value = "";
    try {
      const reply = await consoleRequest(
        "exec",
        token.value,
        controller.signal,
        command,
      );
      if (!disposed) result.value = reply.ret;
    } catch (reason) {
      if (!controller.signal.aborted)
        error.value = reason instanceof Error ? reason.message : "终端连接失败";
    } finally {
      executing = false;
      busy.value = false;
    }
    return true;
  }
  async function abort() {
    if (!busy.value) return;
    try {
      await consoleRequest("abort", token.value, controller.signal);
    } catch (reason) {
      error.value = String(reason);
    }
  }
  async function clear() {
    if (busy.value) return;
    try {
      if (!demo) await consoleRequest("clear", token.value, controller.signal);
      output = "";
      reset();
      try {
        sessionStorage.removeItem("failsafe_console_output");
      } catch {
        /* Optional. */
      }
    } catch (reason) {
      error.value = String(reason);
    }
  }
  function previous(direction: number) {
    historyIndex = Math.max(
      -1,
      Math.min(history.length - 1, historyIndex + direction),
    );
    return history[historyIndex] || "";
  }
  onBeforeRouteLeave(() => !busy.value);
  onScopeDispose(() => {
    disposed = true;
    running.value = false;
    clearTimeout(timer);
    controller.abort();
  });
  return {
    token,
    busy,
    running,
    error,
    result,
    restore,
    connect,
    execute,
    abort,
    clear,
    previous,
  };
}
