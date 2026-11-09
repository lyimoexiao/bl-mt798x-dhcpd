<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElAlert,
} from "../../components/ui/element-plus";
import MaintenancePanel from "../../components/device/MaintenancePanel.vue";
import { useMaintenance } from "../../composables/useMaintenance";
import { useLeaveConfirmation } from "../../composables/useLeaveConfirmation";
import LeaveDialog from "../../components/navigation/LeaveDialog.vue";
import { deviceText } from "../../services/http";
import { ipToInt, syncServerIp } from "../../utils/network";
import AppearanceSettings from "./AppearanceSettings.vue";
import { settingsGroups } from "./fields";
const { t, enabled, loading, busy, error, run, confirm } = useMaintenance();
const values = reactive<Record<string, string>>({}),
  snapshot = ref<Record<string, string>>({}),
  layouts = ref<string[]>([]);
const dirty = computed(() =>
  Object.keys(values).some((key) => values[key] !== snapshot.value[key]),
);
const leave = useLeaveConfirmation(busy, dirty);
async function load() {
  const text = await deviceText("/env/list");
  const env = Object.fromEntries(
    text
      .split("\n")
      .filter((line) => line.indexOf("=") > 0)
      .map((line) => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1),
      ]),
  );
  for (const group of settingsGroups)
    for (const field of group.fields) values[field.key] = env[field.key] || "";
  snapshot.value = { ...values };
  try {
    layouts.value = (await deviceText("/getmtdlayout"))
      .split(";")
      .filter((value) => value && value !== "error");
  } catch {
    layouts.value = [];
  }
}
watch(
  enabled,
  (value) => {
    if (value) void run(load);
  },
  { immediate: true },
);
function sync() {
  values.serverip = syncServerIp(
    values.ipaddr || "",
    values.netmask || "",
    values.serverip || "",
  );
}
async function save() {
  for (const key of ["ipaddr", "netmask", "serverip"])
    if (values[key] && ipToInt(values[key]) === undefined) {
      error.value = `${key}: ${t("请输入有效的 IPv4 地址")}`;
      return;
    }
  for (const [key, max] of [
    ["telnet_port", 65535],
    ["dhcpd_pool_start", 65534],
    ["dhcpd_pool_size", 65535],
  ] as const)
    if (
      values[key] &&
      (!/^\d+$/.test(values[key]) ||
        Number(values[key]) < 1 ||
        Number(values[key]) > max)
    ) {
      error.value = `${key}: 1–${max}`;
      return;
    }
  if (!(await confirm(t("保存设置会写入设备环境变量，确认继续？")))) return;
  await run(async () => {
    // Device persists each key separately: record successful keys so partial failure can be retried safely.
    for (const key of Object.keys(values)) {
      if (values[key] === snapshot.value[key]) continue;
      await deviceText(
        values[key] ? "/env/set" : "/env/unset",
        values[key] ? { name: key, value: values[key] } : { name: key },
      );
      snapshot.value = { ...snapshot.value, [key]: values[key] };
    }
  }, true);
}
</script>
<template>
  <MaintenancePanel
    :title="t('设备设置')"
    :enabled="enabled"
    :busy="busy"
    :error="error"
    :loading="loading"
  >
    <AppearanceSettings
      :enabled="enabled"
      :busy="busy"
      @save="(action) => run(action, true)"
    />
    <ElAlert
      :title="t('修改网络地址后，下次连接可能需要使用新地址。')"
      type="warning"
      :closable="false"
      show-icon
    />
    <ElForm label-position="top" :disabled="busy" @submit.prevent="save">
      <section
        v-for="group in settingsGroups"
        :key="group.title"
        class="settings-group"
      >
        <h2>{{ t(group.title) }}</h2>
        <div class="settings-fields">
          <template v-for="field in group.fields" :key="field.key"
            ><ElFormItem
              v-if="
                field.key !== 'mtd_layout_custom' ||
                values.mtd_layout === 'custom'
              "
              :label="`${t(field.label)} (${field.key})`"
              ><ElSelect
                v-if="field.type === 'bool'"
                v-model="values[field.key]"
                ><ElOption :label="t('默认')" value="" /><ElOption
                  :label="t('开启')"
                  value="1" /><ElOption
                  :label="t('关闭')"
                  value="0" /></ElSelect
              ><ElSelect
                v-else-if="field.type === 'layout' && layouts.length"
                v-model="values[field.key]"
                ><ElOption :label="t('默认')" value="" /><ElOption
                  v-for="layout in [...new Set(layouts)]"
                  :key="layout"
                  :label="layout"
                  :value="layout" /></ElSelect
              ><ElInput
                v-else
                v-model="values[field.key]"
                :name="field.key"
                autocomplete="off"
                :spellcheck="false"
                @input="
                  ['ipaddr', 'netmask'].includes(field.key) && sync()
                " /></ElFormItem
          ></template>
        </div>
      </section>
      <div class="row">
        <ElButton
          type="primary"
          native-type="submit"
          :loading="busy"
          :disabled="!dirty"
          >{{ t("保存设置") }}</ElButton
        ><ElButton :disabled="busy" @click="Object.assign(values, snapshot)">{{
          t("撤销修改")
        }}</ElButton>
      </div>
    </ElForm>
  </MaintenancePanel>
  <LeaveDialog
    :open="leave.leaveOpen.value"
    @confirm="leave.confirmLeave"
    @cancel="leave.cancelLeave"
  />
</template>
