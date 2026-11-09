<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { vLoading } from "../ui/element-plus";
import { Cpu } from "../ui/icons";
import { useDevice } from "../../composables/useDevice";
import { formatBytes } from "../../utils/upgrade-protocol.mjs";
const { t } = useI18n();
const { info, loading } = useDevice();
</script>
<template>
  <section
    v-loading="loading && !info"
    class="device-strip"
    :aria-label="t('设备信息')"
    :aria-busy="loading && !info"
  >
    <div class="device-identity row">
      <Cpu :size="22" /><strong>{{
        info?.board?.model || t(loading ? "正在读取设备信息…" : "设备未连接")
      }}</strong>
    </div>
    <span
      >{{ t("运行内存") }}
      <strong class="numeric">{{ formatBytes(info?.ram?.size) }}</strong></span
    >
    <span
      >{{ t("分区布局") }}
      <strong>{{ info?.storage?.mtd_layout?.current || "—" }}</strong></span
    >
  </section>
</template>
