# TR3000 静态资源加载停滞修复

## 真机只读复现

测试地址：192.168.1.1，版本 d81d0b4。仅 GET 版本、HTML、JS、CSS，未调用上传、/result、重启或终端。

- /version：72 B，约 2 ms。
- /：364 B gzip，约 2 ms。
- /app.css：29,884 B gzip，约 3 ms。
- /app.js：Content-Length 315,885，40 秒仅收到 112,420 B；重试 12 秒收到 281,780 B 后仍超时。
- TCP 抓包中，发送方已发出 seq 316096，接收端 ACK 停在 114091；后续缺失段在约 0.4、0.8、1.6、3.2 秒后依次重传。接收端每次都有新 ACK，但发送方依旧逐段等待指数退避。

这不是 gzip 缺失，也不是单纯 CPU 解析 JavaScript 慢；大文件丢包后恢复路径有问题。

## 修复

- 有进展的 ACK 重置重传退避；恢复未完成时继续发送下一个缺失段，不再每段重新等待 RTO。
- 过期 ACK 不回退 local_seq_acked。
- 窗口从 ACK 位置计算，扣除已在途字节；支持小于或恰等于 MSS 的非零窗口。
- 未确认在途数据限制为 4 个 MSS，避免无拥塞控制的小栈突发整个浏览器窗口。
- HTTP 标准响应以 16 KiB 的 TCP 缓冲区推进，仍是单个 Content-Length 响应和完整 gzip 流，不是 HTTP chunked encoding。
- 维护页面改为 Vue Router 懒加载；首页不再加载 xterm、Flash、UBI 等页面。恢复入口 gzip 从约 316 KiB 降至约 173 KiB，xterm 仅打开终端时加载。
- embed 自动生成 Kbuild 资源清单及 HTTP 路由 allowlist；只链接所选 i18n 版本的 chunks，不将文件系统目录暴露为通用路由。
- HTML 内提供不依赖 JavaScript 的加载提示和 8080 旧版入口。

## 验证边界

本地：TCP 策略 C 单元测试、前端类型/协议/浏览器测试、两种生产包按需加载测试及嵌入路由清单校验。

需要更新固件后再次测量真实设备，旧固件不会因修改本地源码而自动变化。编译成功不代表真机传输修复已完成验收。
