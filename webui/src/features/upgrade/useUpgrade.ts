import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { UploadFile } from "element-plus";
import { ElMessage, ElUpload } from "../../components/ui/element-plus";
import { useLeaveConfirmation } from "../../composables/useLeaveConfirmation";
import { useDevice } from "../../composables/useDevice";
import { upgradeTargets } from "../../app/navigation";
import { demo } from "../../services/device";
import { lastUpgradeError } from "../../services/upgrade";
import {
  checksumMismatch,
  parseReceipt,
} from "../../utils/upgrade-protocol.mjs";

export function useUpgrade() {
  const { t } = useI18n();
  const router = useRouter();
  const currentRoute = useRoute();
  const route = computed(() => String(currentRoute.name));
  const activeTarget = computed(() =>
    upgradeTargets.find((item) => item.id === route.value),
  );
  const { info, available, locked } = useDevice();
  const error = ref("");
  const file = shallowRef<File>();
  const uploadRef = ref<InstanceType<typeof ElUpload>>();
  const receipt = shallowRef<ReturnType<typeof parseReceipt>>();
  const layout = ref("");
  const busy = ref(false);
  const progress = ref(0);
  const confirmOpen = ref(false);
  const acknowledged = ref(false);
  const flashing = ref(false);
  const operationDone = ref(false);
  const status = ref("");
  const operationPending = ref(false);
  const operationSpinner =
    '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="20" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M25 12v8m14-8v8M25 44v8m14-8v8M12 25h8m-8 14h8m24-14h8m-8 14h8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="110 66" opacity=".6"/></svg>';
  let xhr: XMLHttpRequest | undefined;
  const mismatch = computed(
    () =>
      !!receipt.value &&
      checksumMismatch(file.value?.name || "", receipt.value.md5),
  );
  const step = computed(() =>
    operationDone.value
      ? 4
      : flashing.value
        ? 3
        : receipt.value
          ? 2
          : busy.value
            ? 1
            : 0,
  );
  const navigationBlocked = computed(
    () => busy.value || (flashing.value && !operationDone.value),
  );
  const dirty = computed(
    () => !operationDone.value && (!!file.value || !!receipt.value),
  );
  const protectedOperation = computed(
    () => navigationBlocked.value || dirty.value,
  );
  const { leaveOpen, confirmLeave, cancelLeave } = useLeaveConfirmation(
    navigationBlocked,
    dirty,
  );

  function clearFile() {
    file.value = undefined;
    receipt.value = undefined;
    uploadRef.value?.clearFiles();
    error.value = "";
  }
  function selectFile(value: UploadFile) {
    receipt.value = undefined;
    error.value = "";
    if (!value.raw?.size) {
      clearFile();
      error.value = "文件为空，请选择有效的设备镜像。";
      return;
    }
    file.value = value.raw;
  }
  function upload() {
    if (!file.value) {
      ElMessage.warning(t("请先选择要上传的镜像文件。"));
      return;
    }
    if (!activeTarget.value || busy.value || !available.value.has(route.value))
      return;
    busy.value = true;
    error.value = "";
    receipt.value = undefined;
    progress.value = 0;
    if (demo) {
      progress.value = 100;
      receipt.value = {
        size: file.value.size,
        md5: "d41d8cd98f00b204e9800998ecf8427e",
        layout: layout.value,
      };
      busy.value = false;
      return;
    }
    const data = new FormData();
    data.append(activeTarget.value.field, file.value);
    if (layout.value && activeTarget.value.id === "firmware")
      data.append("mtd_layout", layout.value);
    const request = new XMLHttpRequest();
    xhr = request;
    request.open("POST", "/upload");
    request.timeout = 180000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress.value = Math.floor((event.loaded / event.total) * 100);
    };
    request.onload = async () => {
      try {
        if (request.status !== 200) throw new Error(`HTTP ${request.status}`);
        receipt.value = parseReceipt(request.responseText);
        ElMessage.success(t("上传校验完成"));
      } catch (reason) {
        error.value =
          (await lastUpgradeError()) ||
          (reason instanceof Error ? reason.message : "校验失败，请重新上传。");
      } finally {
        busy.value = false;
      }
    };
    request.onerror = request.ontimeout = () => {
      busy.value = false;
      error.value = "上传中断或超时。请检查网线连接，然后重新上传。";
    };
    request.onabort = () => {
      busy.value = false;
    };
    request.send(data);
  }
  async function flash() {
    if (
      !receipt.value ||
      !acknowledged.value ||
      mismatch.value ||
      demo ||
      flashing.value
    )
      return;
    confirmOpen.value = false;
    flashing.value = true;
    operationPending.value = true;
    error.value = "";
    status.value = "设备正在处理镜像，请勿断电、刷新或断开网线。";
    try {
      // GET /result STARTS the write. Never prefetch or automatically retry it.
      const response = await fetch("/result", { cache: "no-store" });
      const result = (await response.text()).trim();
      if (!response.ok || result.split("\n")[0] !== "success") {
        const detail = await lastUpgradeError();
        if (detail || result.startsWith("failed")) {
          error.value = detail || result;
          status.value = "设备报告更新失败";
          flashing.value = false;
          receipt.value = undefined;
          return;
        }
        throw new Error(result);
      }
      operationDone.value = true;
      status.value =
        activeTarget.value?.id === "initramfs"
          ? "镜像已加载，设备正在启动。"
          : "刷写成功。设备是否自动重启取决于设备设置。";
    } catch {
      error.value =
        "未收到成功确认。设备可能仍在处理镜像，请勿断电。等待后通过设备指示灯或串口确认状态。";
      status.value = "操作结果尚未确认";
    } finally {
      operationPending.value = false;
    }
  }
  function finish() {
    flashing.value = false;
    receipt.value = undefined;
    router.push("/reboot");
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (protectedOperation.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  watch(route, () => {
    clearFile();
    status.value = "";
    operationDone.value = false;
    nextTick(() => document.querySelector<HTMLElement>("#page-title")?.focus());
  });

  watch(
    () => info.value,
    (value) => {
      layout.value = value?.storage?.mtd_layout?.current || "";
    },
    { immediate: true },
  );
  watch(layout, () => {
    receipt.value = undefined;
  });
  watch(
    protectedOperation,
    (value) => {
      locked.value = value;
    },
    { immediate: true, flush: "sync" },
  );
  onMounted(() => window.addEventListener("beforeunload", beforeUnload));
  onUnmounted(() => {
    xhr?.abort();
    locked.value = false;
    window.removeEventListener("beforeunload", beforeUnload);
  });
  return {
    leaveOpen,
    confirmLeave,
    cancelLeave,
    activeTarget,
    route,
    file,
    uploadRef,
    receipt,
    layout,
    busy,
    progress,
    confirmOpen,
    acknowledged,
    flashing,
    operationDone,
    status,
    operationPending,
    operationSpinner,
    mismatch,
    step,
    error,
    selectFile,
    upload,
    flash,
    clearFile,
    finish,
  };
}
