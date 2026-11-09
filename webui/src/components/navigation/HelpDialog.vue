<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ElButton,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem,
} from "../ui/element-plus";
const { t } = useI18n();
const open = ref(false);
</script>
<template>
  <ElButton text :aria-label="t('使用帮助')" @click="open = true"
    ><span class="i-lucide-circle-help" aria-hidden="true"
  /></ElButton>
  <ElDialog
    v-model="open"
    :title="t('关于与帮助')"
    width="min(560px, calc(100% - 32px))"
    append-to-body
    align-center
  >
    <div class="stack">
      <p>{{ t("1. 使用网线连接设备，在 U-Boot 恢复模式下打开设备地址。") }}</p>
      <p>{{ t("2. 备份重要分区，选择与设备型号匹配的镜像。") }}</p>
      <p>
        {{
          t(
            "3. 上传并核对文件大小与设备返回的 MD5。MD5 仅校验传输一致性，不保证镜像可信或适配。",
          )
        }}
      </p>
      <p>{{ t("4. 确认后开始操作，保持电源与网络连接，等待设备启动。") }}</p>
      <ElDescriptions :column="1"
        ><ElDescriptionsItem :label="t('作者')"
          ><a
            href="https://github.com/Yuzhii0718/"
            target="_blank"
            rel="noopener noreferrer"
            >💡Yuzhii</a
          ></ElDescriptionsItem
        ><ElDescriptionsItem :label="t('项目')"
          ><a
            href="https://github.com/Yuzhii0718/bl-mt798x-dhcpd"
            target="_blank"
            rel="noopener noreferrer"
            >bl-mt798x-dhcpd</a
          ></ElDescriptionsItem
        ></ElDescriptions
      >
    </div>
  </ElDialog>
</template>
