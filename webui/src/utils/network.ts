export function ipToInt(ip: string): number | undefined {
  const parts = ip.split(".");
  if (
    parts.length !== 4 ||
    parts.some(
      (value) =>
        !/^\d+$/.test(value) ||
        Number(value) > 255 ||
        String(Number(value)) !== value,
    )
  )
    return;
  return parts.reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);
}
export function syncServerIp(ip: string, mask: string, server: string) {
  const address = ipToInt(ip),
    netmask = ipToInt(mask),
    current = ipToInt(server);
  if (address === undefined || netmask === undefined) return server;
  const network = (address & netmask) >>> 0,
    max = ~netmask >>> 0,
    host = (address & ~netmask) >>> 0;
  if (max < 2) return server;
  if (
    current !== undefined &&
    (current & netmask) >>> 0 === network &&
    (current & ~netmask) >>> 0 > 0 &&
    (current & ~netmask) >>> 0 < max &&
    current !== address
  )
    return server;
  const next =
    (network | (max - 1 === host ? Math.max(1, max - 2) : max - 1)) >>> 0;
  return [24, 16, 8, 0].map((shift) => (next >>> shift) & 255).join(".");
}
