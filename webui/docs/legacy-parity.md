# 旧前端功能对齐表

核对基准：`uboot-mtk-20250711/failsafe/embedded/fsdata-bootstrap/` 的 HTML/JS，以及 `failsafe/modules/` 与 `failsafe/Kconfig`。所有业务入口已使用原生 Vue 页面，不再依赖 iframe。**俄语按要求暂不实现；动态彩虹主题效果不对齐**。

“已实现”表示有源码和模拟测试，不表示真实设备擦写已验证。

## 更新与设备信息

| 旧功能 | 新实现 |
|---|---|
| firmware、initramfs、fip、bl2、gpt、simg、factory 上传 | `features/upgrade/` 保留原 multipart 字段与编译可用性探测 |
| 上传进度、大小、MD5、文件名 MD5 比对 | ElUpload / ElProgress / ElDescriptions；MD5 不匹配时阻止写入 |
| 确认后执行 /result | 独立确认 Dialog、区域 Loading；仅一次请求，不自动重试 |
| fail 与 /last-error | 展示设备错误码、错误内容，区分明确失败与网络结果未知 |
| /version、board/RAM、MTD、MMC 信息 | 页脚版本、设备概览、当前及全部 MTD 布局定义、MMC 分区 |
| /getmtdlayout | /sysinfo 没有布局列表时降级读取 |
| 更新后自动启动/重启 | 由后端决定，不再错误承诺必然自动重启 |

## 维护工具

| 模块 | 已对齐能力 |
|---|---|
| 重启 | 普通重启、进入恢复模式、启动系统、确认、恢复模式轮询重连 |
| 环境变量 | list/size/set/unset/reset/restore、搜索表格、导入导出、危险操作确认 |
| 设备设置 | 按钮/GPIO、MTD/NMBM/自定义布局、IP/netmask/serverip 同网段同步、自动重启、Telnet、DNS、DHCP、默认值删除变量、部分保存失败可重试 |
| 备份 | MTD/MMC 整盘/分区/范围、RAW/OOB、能力与 RAM 判断、字节进度、直接流式写磁盘及 Blob 降级、板型/日期命名 |
| Flash | 256 KiB 分块读取、512 B 分页、十六进制与 ASCII、跳转、字节选择、Shift/拖动选区（上限256字节）、方向键、选区填充、仅修改字节写入、导出、范围擦除、备份识别及分块恢复、RAW/OOB 读取/恢复 |
| UBI | 设备几何、卷列表/容量/已用/状态、attach/detach/create/remove/rename/check/skipcheck、检查结果、写入/备份字节进度、流式下载 |
| 终端 | xterm.js ANSI、exec/poll/abort/clear、token、忙状态、命令历史、输出留存、阅读历史时不强制滚到底部、滚动位置恢复 |

### RAW/OOB 安全修正

不只是前端开关；原后端存在普通容量界限和原始容量界限混用、恢复块未验证擦除对齐的问题。本轮：

- `/backup/info` 每个 MTD 目标增加 `page_size`、`oob_size`、`erase_size`，仅为附加字段。
- `/flash/restore` 接收显式 `raw=1`；未编译 RAW 支持时拒绝，不静默降级成普通写入。
- RAW 恢复检查 NAND 类型、原始总容量和整擦除块对齐；前端根据真实几何生成块对齐分片。
- `/flash/read` RAW 使用原始容量并检查页对齐；前端使用页对齐的读取片段。
- 旧 `_oob` 备份文件名不再误识别为名为 `oob` 的分区。
- 前端选择的实际目标和范围通过显式表单传递；上传切片使用普通 Blob 文件名，避免后端再用原整盘文件名覆盖切片范围。
- 缺少几何信息时拒绝 RAW 恢复，不猜测几何。

## 全局功能

| 功能 | 当前行为 |
|---|---|
| 中英文 | Vue i18n + Element Plus locale；保存语言偏好；俄语暂不实现 |
| WEBUI_FAILSAFE_I18N | embed 同时生成有字典/无字典 JS，Makefile 根据 Kconfig 仅嵌入一种；无字典版本固定中文、隐藏语言菜单 |
| 浅色/深色/自动、主题色、AMOLED | /theme/get/set + 本地缓存，系统主题监听，切换禁用过渡 |
| 彩虹色 | 接受旧值 rainbow，暂用静态紫色，不实现原版动态效果 |
| favicon、帮助、项目/作者链接 | 复用原 favicon；HelpDialog 提供恢复指引和原项目/作者链接 |
| 侧栏/终端滚动恢复 | sessionStorage 恢复位置 |
| UI 布局 | 固定 Header/侧栏、主内容独立滚动、手机 Drawer |
| 离开保护 | 未保存内容确认、危险操作时阻止路由及刷新、遮罩和警告图标 |
| 编译可选功能 | 顺序探测可选页面，与设备实际注册能力一致 |
| MTK/GL 主题 | 不改原入口；Vue 作为 Bootstrap 主题的新入口 |

## 测试与限制

- `npm test`：协议拒绝、MD5、备份命名与解析、RAW/普通恢复对齐分片。
- `scripts/browser-check.mjs`：语言/标题/图标、多宽度、导航、离页确认、更新区域 Loading、结果、终端。
- `scripts/maintenance-check.mjs`：各原生维护页面和接口路径。
- `scripts/transfer-check.mjs`：流式磁盘写、取消不发请求、磁盘错误中止。
- `scripts/parity-check.mjs`：字节选区填充、RAW 备份识别与显式恢复、UBI 检查详情和 CRC 方向、写入进度、移动布局。

有意行为差异：命令多行粘贴需要逐条确认；token 使用 sessionStorage 而非长期 localStorage；RAW 恢复严格按擦除块对齐；下载选择器取消前不向设备发起下载请求。

**仍未验证而非未实现**：真机 MTD/MMC/NAND/OOB 擦写、真实 UBI、终端长命令/中止、重启重连、不同目标板的完整 U-Boot 编译及 ROM 空间。不得只凭 mock 测试断言真机安全。
