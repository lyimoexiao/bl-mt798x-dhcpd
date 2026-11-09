<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElResult, vLoading } from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { deviceText } from "../../services/http";
const { t, enabled, loading, busy, error, run, confirm } = useMaintenance();
const router = useRouter();
const status = ref("");
let disposed = false;
onUnmounted(() => {
  disposed = true;
});
async function reboot(mode: "normal" | "failsafe" | "boot") {
  if (
    !(await confirm(
      t(
        mode === "boot"
          ? "确认启动系统？"
          : mode === "failsafe"
            ? "确认重启进入恢复模式？"
            : "确认重启设备？",
      ),
    ))
  )
    return;
  await run(async () => {
    status.value = t("已发送启动请求，请等待设备响应。");
    try {
      await deviceText(
        mode === "boot"
          ? "/boot"
          : mode === "failsafe"
            ? "/reboot-failsafe"
            : "/reboot",
      );
    } catch {
      /* Reboot can close the connection before delivering the reply. Never retry. */
    }
    if (mode === "failsafe") {
      const start = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      while (!disposed && Date.now() - start < 120000) {
        try {
          await fetch("/version", {
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
          }).then((response) => {
            if (!response.ok) throw new Error("offline");
          });
          status.value = t("设备已恢复连接");
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      error.value = t("等待设备重连超时，请检查网线和设备指示灯。");
    }
  });
}
</script>
<template>
  <MaintenancePanel
    :title="t('重启与启动')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <div
      v-loading="busy"
      :element-loading-text="t('等待设备响应…')"
      class="reboot-state"
    >
      <ElResult v-if="status" icon="info" :title="status" />
      <div class="row flex-wrap">
        <ElButton type="primary" :disabled="busy" @click="reboot('normal')">{{
          t("重启设备")
        }}</ElButton
        ><ElButton :disabled="busy" @click="reboot('failsafe')">{{
          t("进入恢复模式")
        }}</ElButton
        ><ElButton :disabled="busy" @click="reboot('boot')">{{
          t("启动系统")
        }}</ElButton>
      </div>
    </div>
  </MaintenancePanel>
</template>
