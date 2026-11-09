<script setup lang="ts">
import { useI18n } from "vue-i18n";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ElConfigProvider } from "./components/ui/element-plus";
import DefaultLayout from "./layouts/DefaultLayout.vue";
const { locale } = useI18n();
</script>
<template>
  <ElConfigProvider :locale="locale === 'zh-CN' ? zhCn : en">
    <DefaultLayout />
  </ElConfigProvider>
</template>
