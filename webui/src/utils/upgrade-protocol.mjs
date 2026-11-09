// The upload endpoint returns a space-separated receipt, not JSON.
export function parseReceipt(text) {
  if (text.trim().split("\n")[0] === "fail") throw new Error(text.trim());
  const [size, md5, layout] = text.trim().split(/\s+/);
  if (
    !/^\d+$/.test(size || "") ||
    Number(size) <= 0 ||
    !/^[a-f\d]{32}$/i.test(md5 || "")
  )
    throw new Error("设备返回的校验信息不完整。请重新上传，不要执行刷写。");
  return { size: Number(size), md5, layout: layout || "" };
}
export function checksumMismatch(name, md5) {
  const expected = /(?:^|[._-])md5-([a-f\d]{32})(?:$|[._-])/i.exec(name)?.[1];
  return !!expected && expected.toLowerCase() !== md5.toLowerCase();
}
export function formatBytes(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  const unit =
    value >= 1024 ** 3 ? 3 : value >= 1024 ** 2 ? 2 : value >= 1024 ? 1 : 0;
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value / 1024 ** unit)} ${["B", "KiB", "MiB", "GiB"][unit]}`;
}
