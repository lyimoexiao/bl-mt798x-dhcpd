export interface BackupRange {
  storage: "mtd" | "mmc";
  target: string;
  start: number;
  end: number;
  raw: boolean;
}
export function sanitizeName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}
export function backupName(original: string, board: string, now = new Date()) {
  let name = original || "backup.bin";
  if (!name.startsWith("backup_")) name = `backup_${name.replace(/^_+/, "")}`;
  const model = sanitizeName(board) || "board";
  if (!name.startsWith(`backup_${model}_`))
    name = name.replace(/^backup_/, `backup_${model}_`);
  if (!/\.[a-z\d]+$/i.test(name)) name += ".bin";
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  if (!/_\d{8}\.[a-z\d]+$/i.test(name))
    name = name.replace(/(\.[a-z\d]+)$/i, `_${date}$1`);
  return name.replace(/[/\\\x00-\x1f]/g, "_");
}
/** Prefer exact known target suffixes: chip and partition names can contain underscores. */
export function parseBackupName(
  name: string,
  knownTargets: string[] = [],
): BackupRange | undefined {
  const range = /_0x([\da-f]+)-0x([\da-f]+)/i.exec(name);
  if (!range || range.index === undefined) return;
  const start = parseInt(range[1], 16),
    end = parseInt(range[2], 16);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    end <= start
  )
    return;
  const prefix = name.slice(0, range.index);
  const mtd = prefix.lastIndexOf("_mtd_"),
    mmc = prefix.lastIndexOf("_mmc_");
  const position = Math.max(mtd, mmc);
  if (position < 0) return;
  const storage = position === mtd ? "mtd" : "mmc";
  const raw = prefix.endsWith("_oob");
  const segment = prefix.slice(position + 5).replace(/_oob$/, "");
  const known = knownTargets
    .filter((value) => value.startsWith(`${storage}:`))
    .map((value) => value.slice(4))
    .sort((a, b) => b.length - a.length)
    .find((value) => segment === value || segment.endsWith(`_${value}`));
  const target = known || segment.split("_").slice(-1)[0];
  if (!target) return;
  return { storage, target, start, end, raw };
}
export function rangeFilename(
  target: string,
  start: number,
  end: number,
  raw = false,
) {
  const [storage, ...name] = target.split(":");
  if (
    !["mtd", "mmc"].includes(storage) ||
    !name.length ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end <= start
  )
    throw new Error("Invalid backup range");
  return `backup_${storage}_${name.join(":")}${raw ? "_oob" : ""}_0x${start.toString(16)}-0x${end.toString(16)}.bin`;
}
