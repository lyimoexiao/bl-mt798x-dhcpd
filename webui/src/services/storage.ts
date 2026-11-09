import { deviceJson } from "./http";
export interface Partition {
  name: string;
  size: number;
  master?: boolean;
  page_size?: number;
  oob_size?: number;
  erase_size?: number;
}
export interface StorageInfo {
  mmc?: { present: boolean; size?: number; parts: Partition[] };
  mtd?: {
    present: boolean;
    parts: Partition[];
    nand_raw_size?: number;
    nand_page_size?: number;
    nand_oob_size?: number;
    ram_available?: number;
  };
}
export interface StorageTarget {
  id: string;
  label: string;
  target: string;
  size: number;
  raw: boolean;
  full: boolean;
  pageSize?: number;
  eraseSize?: number;
  rawBlockSize?: number;
}
export async function storageTargets() {
  const info = await deviceJson<StorageInfo>("/backup/info");
  const targets: StorageTarget[] = [];
  if (info.mmc?.present) {
    targets.push({
      id: "mmc:raw",
      label: "MMC · raw",
      target: "mmc:raw",
      size: info.mmc.size || 0,
      raw: false,
      full: true,
    });
    for (const part of info.mmc.parts)
      targets.push({
        id: `mmc:${part.name}`,
        label: `MMC · ${part.name}`,
        target: `mmc:${part.name}`,
        size: part.size,
        raw: false,
        full: false,
      });
  }
  if (info.mtd?.present)
    for (const part of info.mtd.parts) {
      targets.push({
        id: `mtd:${part.name}`,
        label: `MTD · ${part.name}`,
        target: `mtd:${part.name}`,
        size: part.size,
        raw: false,
        full: !!part.master,
        pageSize: part.page_size,
        eraseSize: part.erase_size,
      });
      if (
        part.master &&
        !part.name.startsWith("nmbm") &&
        info.mtd.nand_raw_size &&
        info.mtd.nand_raw_size <= (info.mtd.ram_available || 0)
      )
        targets.push({
          id: `oob:${part.name}`,
          label: `MTD · ${part.name} (RAW/OOB)`,
          target: `mtd:${part.name}`,
          size: info.mtd.nand_raw_size,
          raw: true,
          full: true,
          pageSize:
            (part.page_size || info.mtd.nand_page_size || 0) +
            (part.oob_size || info.mtd.nand_oob_size || 0),
          eraseSize: part.erase_size,
          rawBlockSize:
            part.erase_size && part.page_size
              ? (part.erase_size / part.page_size) *
                (part.page_size + (part.oob_size || 0))
              : undefined,
        });
    }
  return targets;
}
export function parseLength(value: string) {
  const match = /^(0x[\da-f]+|\d+)\s*([kmg](?:i?b)?)?$/i.exec(value.trim());
  if (!match) throw new Error("Invalid address or size");
  const result =
    Number(match[1]) *
    (match[2] ? 1024 ** ("kmg".indexOf(match[2][0].toLowerCase()) + 1) : 1);
  if (!Number.isSafeInteger(result) || result < 0)
    throw new Error("Invalid address or size");
  return result;
}
