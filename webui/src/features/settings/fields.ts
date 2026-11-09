export const settingsGroups = [
  {
    title: "硬件按钮",
    fields: [
      { key: "glbtn_key", label: "按钮名称" },
      { key: "glbtn_gpio", label: "GPIO 名称" },
    ],
  },
  {
    title: "存储设置",
    fields: [
      { key: "mtd_layout", label: "分区布局", type: "layout" },
      { key: "mtdparts_fixed", label: "固定分区定义", type: "bool" },
      { key: "nmbm_enable", label: "NMBM 映射", type: "bool" },
      { key: "mtd_layout_custom", label: "自定义分区定义" },
    ],
  },
  {
    title: "网络设置",
    fields: [
      { key: "ipaddr", label: "设备 IP 地址" },
      { key: "netmask", label: "子网掩码" },
      { key: "serverip", label: "TFTP 服务器地址" },
    ],
  },
  {
    title: "恢复设置",
    fields: [
      { key: "failsafe_auto_reboot", label: "更新后自动重启", type: "bool" },
    ],
  },
  {
    title: "Telnet",
    fields: [
      { key: "telnet_enable", label: "启用 Telnet", type: "bool" },
      { key: "telnet_port", label: "Telnet 端口", type: "port" },
    ],
  },
  { title: "DNS", fields: [{ key: "dnsd_domain", label: "设备域名" }] },
  {
    title: "DHCP",
    fields: [
      { key: "dhcpd_pool_start", label: "地址池起始主机号", type: "number" },
      { key: "dhcpd_pool_size", label: "地址池大小", type: "number" },
      { key: "dhcpd_verbose", label: "详细日志", type: "bool" },
    ],
  },
];
