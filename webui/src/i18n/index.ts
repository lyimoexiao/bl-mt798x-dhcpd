import { createI18n } from "vue-i18n";
import { maintenanceEnglish } from "./maintenance";

export const i18nEnabled = import.meta.env.VITE_WEBUI_I18N !== "0";
const en: Record<string, string> = i18nEnabled
  ? {
      ...maintenanceEnglish,
      "离开当前页面？": "Leave This Page?",
      "离开后将清除已选择的镜像和校验结果，不会执行刷写。":
        "Leaving clears the selected image and verification result. No image will be flashed.",
      留在此页: "Stay Here",
      离开页面: "Leave Page",
      版本: "Version",
      分区定义: "Partition Definition",
      更新完成: "Update Complete",
      "刷写成功。设备是否自动重启取决于设备设置。":
        "Update succeeded. Automatic restart depends on device settings.",
      "终端缓冲区溢出，部分输出已丢失。":
        "The terminal buffer overflowed. Some output was lost.",
      终端连接失败: "Terminal connection failed",
      命令执行中: "Running",
      "请逐条执行命令，已阻止多行粘贴。":
        "Run one command at a time. Multiline paste was blocked.",
      "终端命令可能修改设备，请仅在可信网络中使用。":
        "Commands may modify your device. Use only on trusted networks.",
      终端访问令牌: "Console access token",
      连接终端: "Connect",
      终端输出: "Terminal output",
      命令: "Command",
      执行命令: "Run Command",
      中止命令: "Abort",
      清空终端: "Clear Terminal",
      返回码: "Exit Code",
      "正在加载镜像，请保持设备连接。":
        "Loading the image. Keep the device connected.",
      "正在写入设备，请勿断电或断开网线。":
        "Writing to the device. Do not disconnect power or Ethernet.",
      继续: "Continue",
      刷新: "Refresh",
      上传校验完成: "Upload verified",
      "离开页面将丢弃校验结果，是否继续？":
        "Leaving discards the verification result. Continue?",
      固件更新: "Firmware Update",
      系统固件: "System Firmware",
      内存启动: "Boot from RAM",
      "U-Boot 更新": "Update U-Boot",
      "BL2 更新": "Update BL2",
      分区表更新: "Update Partition Table",
      整盘镜像: "Disk Image",
      "Factory 更新": "Update Factory",
      设备概览: "Device Overview",
      备份与恢复: "Backup & Recovery",
      "Flash 工具": "Flash Tools",
      "UBI 卷管理": "UBI Volumes",
      "U-Boot 终端": "U-Boot Console",
      环境变量: "Environment",
      设备设置: "Device Settings",
      重启与启动: "Reboot & Boot",
      "更新设备操作系统，适用于日常升级或系统恢复。":
        "Update the device operating system, or recover an existing installation.",
      "将镜像加载到内存并启动，不写入闪存。":
        "Load and boot an image from RAM without writing to flash.",
      "更新引导程序。错误的镜像可能导致设备无法启动。":
        "Update the bootloader. An incorrect image may prevent the device from booting.",
      "更新第一阶段引导程序。请确认镜像与设备完全匹配。":
        "Update the first-stage bootloader. Make sure the image matches your device.",
      "更新磁盘分区表，可能导致现有分区数据不可访问。":
        "Update the partition table. Existing partition data may become inaccessible.",
      "写入整盘镜像，将覆盖目标磁盘上的现有数据。":
        "Write a full disk image, overwriting existing data on the target disk.",
      "写入设备校准数据。错误的文件可能导致无线功能失效。":
        "Write device calibration data. An incorrect file may disable wireless functionality.",
      "备份分区、闪存或指定地址范围。恢复操作请使用 Flash 工具。":
        "Back up partitions, flash, or address ranges. Use Flash Tools to restore a backup.",
      "读取、编辑、擦除和恢复闪存数据。":
        "Read, edit, erase, and restore flash data.",
      "管理 UBI 分区与卷。": "Manage UBI partitions and volumes.",
      "直接与设备命令行交互。命令可能修改设备状态。":
        "Interact with the device command line. Commands may change device state.",
      "查看、备份和修改 U-Boot 环境变量。":
        "View, back up, and edit U-Boot environment variables.",
      "配置设备启动行为、网络和维护选项。":
        "Configure boot behavior, networking, and maintenance options.",
      "重启设备、进入恢复模式或启动系统。":
        "Restart the device, enter recovery mode, or boot the system.",
      "查看设备硬件信息与恢复环境状态。":
        "View hardware information and the recovery environment status.",
      跳到主要内容: "Skip to main content",
      主导航: "Main navigation",
      设备维护工作台: "Device maintenance",
      固件与引导: "Firmware & Boot",
      高级维护: "Advanced Maintenance",
      "U-Boot 安全恢复环境": "U-Boot Recovery Environment",
      "本地连接 · 无需互联网": "Local connection · No internet required",
      使用帮助: "Help & Guidance",
      切换导航菜单: "Toggle navigation",
      设备维护: "Maintenance",
      演示模式: "Demo Mode",
      设备已连接: "Device Connected",
      "连接中…": "Connecting…",
      未连接: "Disconnected",
      切换浅色主题: "Switch to light theme",
      切换深色主题: "Switch to dark theme",
      本地安全上传: "Local Upload",
      "当前为界面演示，硬件信息与校验结果为示例；不会写入设备。":
        "Demo mode: hardware information and checksums are examples. Nothing will be written to a device.",
      设备信息: "Device information",
      当前设备: "Current Device",
      "正在读取设备信息…": "Reading device information…",
      设备未连接: "Device disconnected",
      运行内存: "Memory",
      分区布局: "Partition Layout",
      刷新设备信息: "Refresh device information",
      更新步骤: "Update steps",
      选择镜像: "Select Image",
      上传校验: "Upload & Verify",
      确认更新: "Confirm Update",
      完成: "Complete",
      确认镜像信息: "Verify Image Details",
      上传镜像文件: "Upload Image",
      请核对后再继续: "Review before continuing",
      "步骤 01 / 03": "Step 01 / 03",
      目标分区布局: "Target partition layout",
      "仅在了解设备分区结构时更改此选项。":
        "Only change this if you understand the device partition structure.",
      选择或拖入设备镜像: "Select or drop a device image",
      将镜像文件拖到这里: "Drop your image file here",
      点击重新选择: "Click to choose another file",
      或: "or",
      浏览本地文件: "browse local files",
      "镜像 · 文件只会上传到当前设备":
        "image · Files are sent only to this device",
      "请使用与当前设备型号匹配的镜像，不要解压设备要求的原始文件。":
        "Choose an image for your device. Keep the original format required by the device.",
      "上传完成，正在等待设备校验…":
        "Upload complete. Waiting for device verification…",
      "正在上传文件，请保持连接…": "Uploading. Keep your device connected…",
      上传不会立即刷写: "Uploading does not flash the device",
      "上传与校验中…": "Uploading & Verifying…",
      上传并校验: "Upload & Verify",
      "上传完成。请核对文件、大小与 MD5，再确认操作。":
        "Upload complete. Review the file, size, and MD5 before confirming.",
      镜像文件: "Image File",
      设备接收大小: "Received Size",
      "设备计算 MD5": "Device MD5",
      目标布局: "Target Layout",
      更新目标: "Update Target",
      "文件名中的 MD5 与设备校验结果不一致。请重新获取镜像，已阻止刷写。":
        "The filename MD5 does not match the device checksum. Flashing is blocked. Download a fresh image.",
      重新选择: "Choose Another File",
      确认并启动: "Confirm & Boot",
      "此页面不会自动重试写入。设备断开连接可能是重启的正常表现。":
        "This page never retries writes automatically. The device may disconnect while restarting.",
      "先上传校验，再由你确认更新。全程在本地网络完成。":
        "Upload and verify first, then confirm. Everything stays on your local network.",
      操作提示: "Operation guidance",
      "更新前，请留意": "Before You Update",
      保持电源稳定: "Keep Power Connected",
      "刷写过程中不要断电、重启或拔出网线。":
        "Do not power off, restart, or disconnect the Ethernet cable while flashing.",
      确认镜像适配: "Check Image Compatibility",
      "错误的镜像可能导致设备无法启动，请核对型号与文件来源。":
        "An incorrect image may prevent booting. Check the model and source.",
      先备份重要数据: "Back Up Important Data",
      "更新可能覆盖现有配置和数据，建议提前保存备份。":
        "Updates may overwrite configuration and data. Save a backup first.",
      前往备份: "Open Backup",
      "接下来会发生什么？": "What Happens Next?",
      "文件上传后，设备返回大小与 MD5。核对无误并确认后，才会执行操作。":
        "The device returns the file size and MD5 after upload. The operation starts only after you verify and confirm.",
      了解恢复流程: "About the Recovery Process",
      兼容工具: "Compatibility Tool",
      连接真实设备后使用: "Connect a Real Device to Continue",
      请先连接设备: "Connect Your Device First",
      "高级工具保留原有实现与安全校验，避免改变底层操作行为。":
        "Advanced tools retain their original implementation and checks to preserve low-level behavior.",
      "此工具沿用设备原生操作界面。危险操作请再次确认目标与地址范围。":
        "This tool uses the device native interface. Double-check the target and address range for destructive operations.",
      "当前固件未启用此功能。":
        "This feature is not enabled in the current firmware.",
      恢复环境信息: "Recovery Environment",
      已连接: "Connected",
      离线: "Offline",
      设备型号: "Device Model",
      兼容标识: "Compatible ID",
      构建变体: "Build Variant",
      连接方式: "Connection",
      "本地以太网 / HTTP": "Local Ethernet / HTTP",
      所有操作均在设备本地执行: "All operations run locally on your device",
      确认操作目标: "Confirm Operation Target",
      "设备将加载镜像并从内存启动。":
        "The device will load the image and boot from RAM.",
      "该操作将修改设备存储，且不可撤销。":
        "This operation modifies device storage and cannot be undone.",
      目标: "Target",
      文件: "File",
      "已核对设备型号和镜像，并确保供电稳定":
        "I checked the device and image, and ensured stable power",
      取消: "Cancel",
      开始启动: "Start Boot",
      开始更新: "Start Update",
      安全恢复指南: "Safe Recovery Guide",
      知道了: "Got It",
      "1. 使用网线连接设备，在 U-Boot 恢复模式下打开设备地址。":
        "1. Connect via Ethernet and open the device address in U-Boot recovery mode.",
      "2. 备份重要分区，选择与设备型号匹配的镜像。":
        "2. Back up important partitions and select an image for your device.",
      "3. 上传并核对文件大小与设备返回的 MD5。MD5 仅校验传输一致性，不保证镜像可信或适配。":
        "3. Upload and review the size and device MD5. MD5 only checks transfer integrity, not trust or compatibility.",
      "4. 确认后开始操作，保持电源与网络连接，等待设备启动。":
        "4. Confirm to proceed. Keep power and network connected, and wait for the device to boot.",
      "若设备未报告成功，请先查看串口或设备指示灯。不要立即断电或反复刷写。":
        "If success is not reported, check the serial console or device indicators. Do not immediately power off or flash repeatedly.",
      "无法连接设备。请使用网线连接设备，检查恢复模式与 IP 地址，然后重试。":
        "Cannot connect. Check the Ethernet cable, recovery mode, and IP address, then retry.",
      "文件为空，请选择有效的设备镜像。":
        "The file is empty. Choose a valid device image.",
      "请先选择要上传的镜像文件。": "Select an image file first.",
      "校验失败，请重新上传。": "Verification failed. Upload the file again.",
      "上传中断或超时。请检查网线连接，然后重新上传。":
        "Upload interrupted or timed out. Check Ethernet and upload again.",
      "设备正在处理镜像，请勿断电、刷新或断开网线。":
        "The device is processing the image. Do not power off, refresh, or disconnect Ethernet.",
      "镜像已加载，设备正在启动。": "Image loaded. The device is booting.",
      "刷写成功，设备即将重启。请等待设备恢复连接。":
        "Flashing succeeded. Wait for the device to restart and reconnect.",
      "未收到成功确认。设备可能仍在处理镜像，请勿断电。等待后通过设备指示灯或串口确认状态。":
        "Success was not confirmed. The device may still be processing. Keep power connected, wait, then check indicators or the serial console.",
      操作结果尚未确认: "Operation result not confirmed",
      "设备返回的校验信息不完整。请重新上传，不要执行刷写。":
        "The device returned incomplete verification data. Upload again; do not flash.",
    }
  : {};
let initial = navigator.language.startsWith("zh") ? "zh-CN" : "en";
try {
  initial = localStorage.getItem("recovery-locale") || initial;
} catch {
  /* Storage optional. */
}
if (!i18nEnabled || !["zh-CN", "en"].includes(initial)) initial = "zh-CN";
export const i18n = createI18n({
  legacy: false,
  locale: initial,
  fallbackLocale: "zh-CN",
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    "zh-CN": Object.fromEntries(Object.keys(en).map((key) => [key, key])),
    en,
  },
});
