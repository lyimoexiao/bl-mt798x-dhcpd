<script setup lang="ts">
import { reactive, watch } from "vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from "../../components/ui/element-plus";
import { useI18n } from "vue-i18n";
import { loadTheme, saveTheme } from "../../services/theme";
const props = defineProps<{ enabled: boolean; busy: boolean }>();
const emit = defineEmits<{ save: [action: () => Promise<void>] }>();
const { t } = useI18n();
const settings = reactive({
  theme: "auto",
  color: "#2563eb",
  dark_variant: "",
});
watch(
  () => props.enabled,
  async (value) => {
    if (value) {
      try {
        Object.assign(settings, await loadTheme());
      } catch {
        /* Keep defaults. */
      }
    }
  },
  { immediate: true },
);
</script>
<template>
  <section class="settings-group">
    <h2>{{ t("外观设置") }}</h2>
    <ElForm
      label-position="top"
      :disabled="busy"
      @submit.prevent="emit('save', () => saveTheme(settings))"
      ><div class="settings-fields">
        <ElFormItem :label="t('主题模式')"
          ><ElSelect v-model="settings.theme"
            ><ElOption :label="t('跟随系统')" value="auto" /><ElOption
              :label="t('浅色')"
              value="light" /><ElOption
              :label="t('深色')"
              value="dark" /></ElSelect></ElFormItem
        ><ElFormItem :label="t('主题色')"
          ><ElInput
            v-model="settings.color"
            name="theme-color"
            placeholder="#2563eb" /></ElFormItem
        ><ElFormItem :label="t('深色样式')"
          ><ElSelect v-model="settings.dark_variant"
            ><ElOption :label="t('标准')" value="" /><ElOption
              label="AMOLED"
              value="amoled" /></ElSelect
        ></ElFormItem>
      </div>
      <ElButton native-type="submit" :loading="busy">{{
        t("保存外观")
      }}</ElButton></ElForm
    >
  </section>
</template>
