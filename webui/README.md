# MT798x WebUI

Vue 3 + TypeScript + Vue Router + vue-i18n + Element Plus + UnoCSS。默认标题为「固件更新」。图标通过 UnoCSS presetIcons 从本地 Iconify Lucide 集合生成，无 CDN 请求。

## 开发

```sh
cd webui
npm ci
npm run dev
```

- 安全演示：`http://localhost:5173/?demo=1`（示例硬件和校验结果，禁止刷写）
- 真实设备：`DEVICE_URL=http://192.168.1.1 npm run dev`
- 中文 / English 通过顶部下拉菜单切换，保存本地偏好；Element Plus 同步语言。
- 默认跟随浏览器语言，无偏好时中文浏览器显示「固件更新」。

## 构建与嵌入

```sh
npm run typecheck
npm test
npm run embed
```

`embed` 将生产资源复制到 `../uboot-mtk-20250711/failsafe/embedded/fsdata-bootstrap/vue/`。这些产物随代码提交，编译 U-Boot 时无需安装 Vue 工具链。`embed` 还生成 `app-no-i18n.js`；Kconfig 的 `WEBUI_FAILSAFE_I18N=n` 选择无字典版本（固定中文且隐藏语言菜单），仅嵌入其中一份 JS。Bootstrap 主题的 Makefile 同时嵌入新入口和原版入口及资源：新版 `http://<设备IP>/`（80），旧版 `http://<设备IP>:8080/`。两个实例都注册完整设备 API；旧页的相对资源和请求留在 8080，不重定向到新版。MTK、GL 主题不变。两套界面共享同一设备状态，切勿同时执行上传、写入或终端命令。

`.github/workflows/webui-build.yml` 编译 TR3000 V1 的中英文与无字典版本，启用 NAND RAW/UBI，并核实链接结果包含新版入口、旧版入口和 app 资源；固件及日志上传为 Actions artifacts。

Flash / UBI / 备份 / 环境变量 / 设置 / 重启均已改为原生 Vue 页面，不再使用 iframe；终端使用 xterm.js。仍保留固件内的旧资源，作为旧 URL 兼容入口，而不是新应用的运行依赖。功能对齐与有意行为差异见核对表。俄语暂不实现，动态彩虹效果保留为静态色。

完整功能差异、编译兼容与验证边界见 [旧前端核对表](docs/legacy-parity.md)。

## 源码职责

```text
src/
  app/                  路由与导航元数据
  layouts/              固定 Header、侧栏、主内容布局
  components/
    navigation/         桌面/移动共享导航
    device/             设备概要
    ui/                 Element Plus 按需入口、CSS mask 图标
  composables/          设备上下文、偏好、页面离开确认
  features/
    upgrade/            镜像更新页面与生命周期
    console/            xterm 终端页面与控制逻辑
    reboot/             重启与恢复重连
    environment/        环境变量表格与导入导出
    settings/           设备设置与外观
    backup/             存储备份与下载
    flash/              十六进制编辑与分块读写
    ubi/                UBI 卷管理
  pages/                设备概览
  services/             设备与终端 HTTP 协议
  i18n/                 国际化
  styles/               Element Plus 主题与响应式布局
  utils/                纯函数协议校验
```

`App.vue` 只配置语言并挂载布局，路由实际加载业务页面；设备状态通过 provide/inject 共享，不把上传状态和终端实例放进全局状态。

## 组件职责

- ElContainer / ElAside / ElHeader / ElMain / ElFooter：标准应用布局
- ElMenu + Vue Router：桌面导航；ElDrawer：移动端导航
- ElDropdown：语言选项；ElConfigProvider：组件语言
- ElCard：工作区；ElDescriptions：设备/镜像信息；ElEmpty：无设备或无功能
- ElUpload：选择镜像；XMLHttpRequest：兼容固件上传协议；ElProgress：上传进度
- 局部 ElLoading：首次读取设备；按钮 loading：刷新或上传
- ElMessage：短暂操作反馈；ElAlert：持续风险与错误；ElDialog：显式刷写确认；ElDialog：页面离开确认（与刷写确认分开）；ElResult：操作状态

## 验证

```sh
npx playwright install chromium
# 先启动 Vite
node scripts/browser-check.mjs
node scripts/maintenance-check.mjs
node scripts/transfer-check.mjs
node scripts/parity-check.mjs
```

检查中文标题、语言切换及持久化、320/375/768/1024/1440/1920px 宽度、图标 CSS mask、路由、移动导航、上传校验展示、演示模式禁止刷写、深色模式和运行时错误。截图写入 `screenshots/`。

尚需真实设备验证：镜像适配、写入/内存启动、自动重启、可选编译功能、完整固件链接大小与目标板 ROM 空间。不要仅凭浏览器模拟测试刷写真机。
