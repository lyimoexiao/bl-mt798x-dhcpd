<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElButton, ElInput } from "../../components/ui/element-plus";
const props = defineProps<{
  bytes: Uint8Array;
  base: number;
  addressBase?: number;
  disabled: boolean;
}>();
const emit = defineEmits<{
  fill: [start: number, end: number, byte: number];
}>();
const { t } = useI18n();
const anchor = ref(0),
  cursor = ref(0),
  dragging = ref(false),
  value = ref("");
const first = computed(() => Math.min(anchor.value, cursor.value)),
  last = computed(() => Math.max(anchor.value, cursor.value));
function select(index: number, extend = false) {
  if (props.disabled) return;
  if (!extend) anchor.value = index;
  cursor.value = Math.max(
    0,
    Math.min(props.bytes.length - 1, index, anchor.value + 255),
  );
  cursor.value = Math.max(cursor.value, anchor.value - 255);
}
function key(event: KeyboardEvent) {
  const moves: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: 16,
    ArrowUp: -16,
    PageDown: 64,
    PageUp: -64,
  };
  if (event.key in moves) {
    event.preventDefault();
    select(cursor.value + moves[event.key], event.shiftKey);
    (event.currentTarget as HTMLElement)
      .querySelectorAll<HTMLButtonElement>("button")
      [cursor.value]?.focus();
    return;
  }
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    select(
      Math.floor(cursor.value / 16) * 16 + (event.key === "End" ? 15 : 0),
      event.shiftKey,
    );
  }
}
function fill() {
  if (!/^[\da-f]{2}$/i.test(value.value) || props.disabled) return;
  emit(
    "fill",
    first.value + props.base,
    last.value + props.base,
    parseInt(value.value, 16),
  );
}
</script>
<template>
  <div class="stack">
    <div
      class="hex-scroll"
      @pointerup="dragging = false"
      @pointercancel="dragging = false"
      @pointerleave="dragging = false"
    >
      <div
        class="hex-grid"
        role="group"
        :aria-label="t('字节选区')"
        @keydown="key"
      >
        <button
          v-for="(byte, index) in bytes"
          :key="index"
          type="button"
          :disabled="disabled"
          :tabindex="index === cursor ? 0 : -1"
          :aria-label="`0x${((addressBase || 0) + base + index).toString(16)}: ${byte.toString(16).padStart(2, '0')}`"
          :aria-pressed="index >= first && index <= last"
          :class="{ selected: index >= first && index <= last }"
          @pointerdown="
            (event) => {
              select(index, event.shiftKey);
              dragging = true;
            }
          "
          @pointerenter="dragging && select(index, true)"
          @click="
            (event) => {
              if (event.detail === 0) select(index, event.shiftKey);
            }
          "
        >
          {{ byte.toString(16).padStart(2, "0") }}
        </button>
      </div>
    </div>
    <div class="row flex-wrap">
      <span class="mono"
        >0x{{ ((addressBase || 0) + base + first).toString(16) }}–0x{{
          ((addressBase || 0) + base + last).toString(16)
        }}
        · {{ last - first + 1 }} B</span
      ><ElInput
        v-model="value"
        maxlength="2"
        class="offset-input"
        :disabled="disabled"
        :aria-label="t('填充字节')"
        placeholder="FF"
        @keydown.enter="fill"
      /><ElButton
        :disabled="disabled || !/^[\da-f]{2}$/i.test(value)"
        @click="fill"
        >{{ t("填充选区") }}</ElButton
      >
    </div>
  </div>
</template>
