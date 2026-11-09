import {
  ArrowUpToLine,
  Cpu,
  Database,
  FileArchive,
  HardDrive,
  RefreshCw,
  Settings2,
  Terminal,
} from "../components/ui/icons";

export const upgradeTargets = [
  {
    id: "firmware",
    title: "固件更新",
    label: "系统固件",
    field: "firmware",
    icon: ArrowUpToLine,
  },
  {
    id: "initramfs",
    title: "内存启动",
    label: "Initramfs",
    field: "initramfs",
    icon: Cpu,
  },
  {
    id: "uboot",
    title: "U-Boot 更新",
    label: "U-Boot / FIP",
    field: "fip",
    icon: Cpu,
  },
  { id: "bl2", title: "BL2 更新", label: "BL2", field: "bl2", icon: Cpu },
  {
    id: "gpt",
    title: "分区表更新",
    label: "GPT",
    field: "gpt",
    icon: HardDrive,
  },
  {
    id: "simg",
    title: "整盘镜像",
    label: "SIMG",
    field: "simg",
    icon: FileArchive,
  },
  {
    id: "factory",
    title: "Factory 更新",
    label: "Factory",
    field: "factory",
    icon: Database,
  },
];
export const maintenanceTools = [
  { id: "backup", title: "备份与恢复", icon: Database },
  { id: "flash", title: "Flash 工具", icon: HardDrive },
  { id: "ubi", title: "UBI 卷管理", icon: FileArchive },
  { id: "console", title: "U-Boot 终端", icon: Terminal },
  { id: "env", title: "环境变量", icon: Settings2 },
  { id: "settings", title: "设备设置", icon: Settings2 },
  { id: "reboot", title: "重启与启动", icon: RefreshCw },
];
export const coreFeatures = ["firmware", "initramfs", "uboot", "bl2", "reboot"];
export type UpgradeTarget = (typeof upgradeTargets)[number];
