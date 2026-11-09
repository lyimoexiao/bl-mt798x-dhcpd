import type { StorageTarget } from "../../services/storage";
export function restorePlan(
  target: StorageTarget,
  start: number,
  end: number,
  fileSize: number,
) {
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    end <= start ||
    end - start !== fileSize
  )
    throw new Error("File size must match restore range");
  if (target.size && end > target.size)
    throw new Error("Restore exceeds target size");
  const alignment = target.raw ? target.rawBlockSize : target.eraseSize || 1;
  if (!alignment || start % alignment || (target.raw && fileSize % alignment))
    throw new Error("Restore must align to erase blocks");
  const chunkSize = Math.max(
    alignment,
    Math.floor((4 * 1024 ** 2) / alignment) * alignment,
  );
  const chunks: {
    offset: number;
    end: number;
    start: number;
    limit: number;
  }[] = [];
  for (let offset = 0; offset < fileSize; offset += chunkSize) {
    const limit = Math.min(fileSize, offset + chunkSize);
    chunks.push({
      offset,
      end: limit,
      start: start + offset,
      limit: start + limit,
    });
  }
  return chunks;
}
