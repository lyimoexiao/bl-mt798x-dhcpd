import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDevice } from "./useDevice";
import { ElMessage, ElMessageBox } from "../components/ui/element-plus";
import { demo } from "../services/device";

export function useMaintenance() {
  const { t } = useI18n();
  const route = useRoute();
  const { connected, available, loading, locked } = useDevice();
  const busy = ref(false);
  const error = ref("");
  const enabled = computed(
    () => !demo && connected.value && available.value.has(String(route.name)),
  );
  async function run(action: () => Promise<void>, success = false) {
    if (busy.value || !enabled.value) return;
    busy.value = true;
    error.value = "";
    try {
      await action();
      if (success) ElMessage.success(t("操作完成"));
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason);
    } finally {
      busy.value = false;
    }
  }
  async function confirm(message: string) {
    try {
      await ElMessageBox.confirm(message, t("确认操作目标"), {
        type: "warning",
        confirmButtonText: t("确认"),
        cancelButtonText: t("取消"),
        closeOnClickModal: false,
      });
      return true;
    } catch {
      return false;
    }
  }
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
  onUnmounted(() => {
    locked.value = false;
    window.removeEventListener("beforeunload", beforeUnload);
  });
  onBeforeRouteLeave(() => !busy.value);
  onBeforeRouteUpdate(() => !busy.value);
  return { t, enabled, loading, busy, error, run, confirm };
}
