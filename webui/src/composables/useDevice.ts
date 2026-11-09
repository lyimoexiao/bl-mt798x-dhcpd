import {
  inject,
  onScopeDispose,
  provide,
  ref,
  shallowRef,
  type InjectionKey,
} from "vue";
import {
  coreFeatures,
  maintenanceTools,
  upgradeTargets,
} from "../app/navigation";
import { demo, request, systemInfo, type SystemInfo } from "../services/device";

function createDevice() {
  const info = shallowRef<SystemInfo>();
  const version = ref("");
  const connected = ref(false);
  const loading = ref(false);
  const error = ref("");
  const locked = ref(false);
  const available = shallowRef(new Set(coreFeatures));
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
  });

  async function refresh() {
    if (loading.value || locked.value) return;
    loading.value = true;
    error.value = "";
    try {
      info.value = await systemInfo();
      connected.value = true;
      if (demo) {
        version.value = "U-Boot (demo)";
        available.value = new Set(
          [...upgradeTargets, ...maintenanceTools].map((item) => item.id),
        );
      } else {
        try {
          version.value = await request("/version");
        } catch {
          version.value = "";
        }
        if (!info.value.storage?.mtd_layout?.layouts?.length) {
          try {
            const text = await request("/getmtdlayout");
            if (text !== "error" && !text.includes("<")) {
              const [current, ...layouts] = text.split(";");
              info.value = {
                ...info.value,
                storage: {
                  ...info.value.storage,
                  mtd_layout: {
                    ...info.value.storage?.mtd_layout,
                    current,
                    layouts: layouts
                      .filter(Boolean)
                      .map((label) => ({ label, parts: "" })),
                  },
                },
              };
            }
          } catch {
            /* Older single-layout devices may not expose this endpoint. */
          }
        }
        const found = new Set(coreFeatures);
        for (const item of [
          ...upgradeTargets.slice(4),
          ...maintenanceTools.filter((item) => item.id !== "reboot"),
        ]) {
          if (disposed) return;
          try {
            const response = await fetch(`/${item.id}.html?_probe=1`, {
              signal: AbortSignal.timeout(5000),
            });
            await response.text();
            if (response.ok) found.add(item.id);
          } catch {
            /* Optional feature: unavailable until verified. */
          }
        }
        available.value = found;
      }
    } catch {
      connected.value = false;
      error.value =
        "无法连接设备。请使用网线连接设备，检查恢复模式与 IP 地址，然后重试。";
    } finally {
      loading.value = false;
    }
  }
  return {
    info,
    version,
    connected,
    loading,
    error,
    locked,
    available,
    refresh,
  };
}
const key: InjectionKey<ReturnType<typeof createDevice>> = Symbol("device");
export function provideDevice() {
  const device = createDevice();
  provide(key, device);
  return device;
}
export function useDevice() {
  const device = inject(key);
  if (!device) throw new Error("Device provider is missing");
  return device;
}
