<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDialog,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElResult,
  vLoading,
  ElOption,
  ElProgress,
  ElSelect,
  ElStep,
  ElSteps,
  ElTag,
  ElUpload,
} from "../../components/ui/element-plus";
import {
  ArrowRight,
  ArrowUpToLine,
  FileCheck2,
} from "../../components/ui/icons";
import { useDevice } from "../../composables/useDevice";
import { demo } from "../../services/device";
import { formatBytes } from "../../utils/upgrade-protocol.mjs";
import { useUpgrade } from "./useUpgrade";
const { t } = useI18n();
const { info, available, connected } = useDevice();
const {
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
} = useUpgrade();
</script>
<template>
  <div v-if="error" class="mb-5" role="alert">
    <ElAlert :title="t(error)" type="error" :closable="false" show-icon />
  </div>
  <template v-if="activeTarget && available.has(route)">
    <ElSteps
      class="update-steps"
      :active="step"
      finish-status="success"
      align-center
      ><ElStep
        v-for="label in ['选择镜像', '上传校验', '确认更新', '完成']"
        :key="label"
        :title="t(label)"
    /></ElSteps>
    <div :class="['content-grid', { 'is-complete': operationDone }]">
      <ElCard
        v-loading="operationPending"
        class="upload-panel"
        shadow="never"
        :aria-busy="operationPending"
        :element-loading-text="
          t(
            activeTarget.id === 'initramfs'
              ? '正在加载镜像，请保持设备连接。'
              : '正在写入设备，请勿断电或断开网线。',
          )
        "
        :element-loading-spinner="operationSpinner"
        element-loading-svg-view-box="0 0 64 64"
        element-loading-custom-class="operation-loading"
        ><template #header
          ><div class="card-header">
            <h2>
              {{
                t(
                  operationDone
                    ? "更新完成"
                    : receipt
                      ? "确认镜像信息"
                      : "上传镜像文件",
                )
              }}
            </h2>
            <ElTag effect="plain">{{ t(activeTarget.label) }}</ElTag>
          </div></template
        >
        <div class="panel-body stack">
          <template v-if="!receipt && !flashing">
            <div
              v-if="
                activeTarget.id === 'firmware' &&
                (info?.storage?.mtd_layout?.layouts?.length || 0) > 1
              "
              class="stack"
            >
              <label for="layout">{{ t("目标分区布局") }}</label
              ><ElSelect
                id="layout"
                v-model="layout"
                :disabled="busy"
                :aria-label="t('目标分区布局')"
                ><ElOption
                  v-for="item in info?.storage?.mtd_layout?.layouts"
                  :key="item.label"
                  :label="item.label"
                  :value="item.label"
              /></ElSelect>
            </div>
            <ElUpload
              ref="uploadRef"
              class="image-upload"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :disabled="busy"
              :on-change="selectFile"
              :multiple="false"
              :aria-label="t('选择或拖入设备镜像')"
              ><span class="upload-icon"
                ><FileCheck2
                  v-if="file"
                  :size="30"
                  aria-hidden="true" /><ArrowUpToLine
                  v-else
                  :size="30"
                  aria-hidden="true" /></span
              ><strong>{{ file ? file.name : t("将镜像文件拖到这里") }}</strong
              ><span v-if="file" class="numeric"
                >{{ formatBytes(file.size) }} · {{ t("点击重新选择") }}</span
              ><span v-else
                >{{ t("或") }}
                <span class="upload-link">{{ t("浏览本地文件") }}</span></span
              ></ElUpload
            >
            <div v-if="busy" class="stack" aria-live="polite">
              <ElProgress :percentage="progress" :stroke-width="7" /><span>{{
                t(
                  progress === 100
                    ? "上传完成，正在等待设备校验…"
                    : "正在上传文件，请保持连接…",
                )
              }}</span>
            </div>
            <div class="upload-actions">
              <ElButton
                type="primary"
                :loading="busy"
                :disabled="!connected"
                @click="upload"
                ><ArrowUpToLine v-if="!busy" :size="16" aria-hidden="true" />{{
                  t(busy ? "上传与校验中…" : "上传并校验")
                }}</ElButton
              >
            </div>
          </template>
          <template v-else-if="receipt && !flashing">
            <ElAlert
              :title="t('上传完成。请核对文件、大小与 MD5，再确认操作。')"
              type="success"
              :closable="false"
              show-icon
            />
            <ElDescriptions :column="1" border
              ><ElDescriptionsItem :label="t('镜像文件')">{{
                file?.name
              }}</ElDescriptionsItem
              ><ElDescriptionsItem :label="t('设备接收大小')">{{
                formatBytes(receipt.size)
              }}</ElDescriptionsItem
              ><ElDescriptionsItem :label="t('设备计算 MD5')"
                ><span class="mono">{{ receipt.md5 }}</span></ElDescriptionsItem
              ><ElDescriptionsItem
                v-if="receipt.layout"
                :label="t('目标布局')"
                >{{ receipt.layout }}</ElDescriptionsItem
              ><ElDescriptionsItem :label="t('更新目标')">{{
                t(activeTarget.label)
              }}</ElDescriptionsItem></ElDescriptions
            >
            <ElAlert
              v-if="mismatch"
              :title="
                t(
                  '文件名中的 MD5 与设备校验结果不一致。请重新获取镜像，已阻止刷写。',
                )
              "
              type="error"
              :closable="false"
              show-icon
            />
            <div class="row flex-wrap justify-end">
              <ElButton @click="clearFile">{{ t("重新选择") }}</ElButton
              ><ElButton
                type="primary"
                :disabled="mismatch || demo"
                @click="
                  acknowledged = false;
                  confirmOpen = true;
                "
                >{{
                  t(
                    activeTarget.id === "initramfs" ? "确认并启动" : "确认更新",
                  )
                }}<ArrowRight :size="16" aria-hidden="true"
              /></ElButton>
            </div>
          </template>
          <div
            v-else-if="operationPending"
            class="operation-placeholder"
            role="status"
            aria-live="polite"
          >
            <span class="sr-only">{{ t(status) }}</span>
          </div>
          <ElResult
            v-else
            :icon="error ? 'warning' : operationDone ? 'success' : 'info'"
            :title="t(status)"
            role="status"
            aria-live="polite"
            ><template v-if="operationDone" #extra
              ><ElButton type="primary" @click="finish">{{
                t("重启与启动")
              }}</ElButton></template
            ></ElResult
          >
        </div>
      </ElCard>
      <aside
        v-if="!operationDone"
        class="guide-column stack"
        :aria-label="t('操作提示')"
      >
        <ElAlert
          :title="t('更新前，请留意')"
          type="warning"
          :closable="false"
          show-icon
          ><ul class="safety-list">
            <li>{{ t("刷写过程中不要断电、重启或拔出网线。") }}</li>
            <li>
              {{ t("错误的镜像可能导致设备无法启动，请核对型号与文件来源。") }}
            </li>
            <li>{{ t("更新可能覆盖现有配置和数据，建议提前保存备份。") }}</li>
          </ul></ElAlert
        ><RouterLink
          v-if="available.has('backup')"
          class="backup-link"
          to="/backup"
          >{{ t("前往备份") }}<ArrowRight :size="16" aria-hidden="true"
        /></RouterLink>
      </aside>
    </div>
  </template>
  <ElEmpty v-else :description="t('当前固件未启用此功能。')" />
  <ElDialog
    :model-value="leaveOpen"
    :title="t('离开当前页面？')"
    width="min(440px, calc(100% - 32px))"
    :modal="true"
    modal-class="leave-confirm-overlay"
    :close-on-click-modal="false"
    :lock-scroll="true"
    append-to-body
    align-center
    @close="cancelLeave"
  >
    <template #header="{ titleId, titleClass }"
      ><div class="row">
        <span
          class="i-lucide-triangle-alert text-xl leave-warning-icon"
          aria-hidden="true"
        />
        <h2 :id="titleId" :class="titleClass">{{ t("离开当前页面？") }}</h2>
      </div></template
    >
    <p>{{ t("离开后将清除已选择的镜像和校验结果，不会执行刷写。") }}</p>
    <template #footer
      ><ElButton @click="cancelLeave">{{ t("留在此页") }}</ElButton
      ><ElButton type="primary" @click="confirmLeave">{{
        t("离开页面")
      }}</ElButton></template
    >
  </ElDialog>
  <ElDialog
    v-model="confirmOpen"
    :title="t('确认操作目标')"
    width="min(480px, calc(100% - 32px))"
    :close-on-click-modal="false"
    align-center
    ><ElAlert
      :title="
        t(
          activeTarget?.id === 'initramfs'
            ? '设备将加载镜像并从内存启动。'
            : '该操作将修改设备存储，且不可撤销。',
        )
      "
      type="warning"
      :closable="false"
      show-icon
    />
    <dl class="receipt dialog-receipt">
      <dt>{{ t("目标") }}</dt>
      <dd>{{ t(activeTarget?.label || "") }}</dd>
      <dt>{{ t("文件") }}</dt>
      <dd>{{ file?.name }}</dd>
    </dl>
    <ElCheckbox v-model="acknowledged">{{
      t("已核对设备型号和镜像，并确保供电稳定")
    }}</ElCheckbox
    ><template #footer
      ><ElButton @click="confirmOpen = false">{{ t("取消") }}</ElButton
      ><ElButton
        type="primary"
        :disabled="!acknowledged || demo"
        @click="flash"
        >{{
          t(activeTarget?.id === "initramfs" ? "开始启动" : "开始更新")
        }}</ElButton
      ></template
    ></ElDialog
  >
</template>
