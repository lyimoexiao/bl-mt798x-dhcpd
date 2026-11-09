import { onMounted, onScopeDispose, ref, type Ref } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate } from "vue-router";

/** One page-owned dialog, one pending navigation. No global MessageBox queue. */
export function useLeaveConfirmation(
  blocked: Ref<boolean>,
  dirty: Ref<boolean>,
) {
  const leaveOpen = ref(false);
  let resolveLeave: ((leave: boolean) => void) | undefined;

  function settle(leave: boolean) {
    const resolve = resolveLeave;
    resolveLeave = undefined;
    leaveOpen.value = false;
    resolve?.(leave);
  }
  function guard() {
    if (blocked.value) return false;
    if (!dirty.value) return true;
    // Repeated menu clicks must not create another dialog or change its destination.
    if (resolveLeave) return false;
    leaveOpen.value = true;
    return new Promise<boolean>((resolve) => {
      resolveLeave = resolve;
    });
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (blocked.value || dirty.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  onMounted(() => window.addEventListener("beforeunload", beforeUnload));
  onScopeDispose(() =>
    window.removeEventListener("beforeunload", beforeUnload),
  );
  onBeforeRouteLeave(guard);
  onBeforeRouteUpdate(guard);
  onScopeDispose(() => settle(false));
  return {
    leaveOpen,
    confirmLeave: () => settle(true),
    cancelLeave: () => settle(false),
  };
}
