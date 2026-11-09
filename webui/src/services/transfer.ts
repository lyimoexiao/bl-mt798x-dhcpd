import { deviceFetch, formData } from "./http";
import { downloadName, saveBlob } from "../utils/download";
import { backupName } from "../utils/backup-name";

export interface TransferProgress {
  loaded: number;
  total: number;
  percent: number;
}
interface DiskWriter {
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}
interface SaveHandle {
  createWritable(): Promise<DiskWriter>;
}
interface SaveWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<SaveHandle>;
}
export interface DownloadOptions {
  path: string;
  values: Record<string, string>;
  fallback: string;
  board: string;
  expected?: number;
  progress: (value: TransferProgress) => void;
}
export async function downloadBackup(options: DownloadOptions) {
  // Open the picker in the click activation, before network awaits. Cancel sends no device request.
  const picker = (window as SaveWindow).showSaveFilePicker;
  let handle: SaveHandle | undefined;
  if (picker) {
    try {
      handle = await picker.call(window, {
        suggestedName: backupName(options.fallback, options.board),
        types: [
          {
            description: "Binary",
            accept: { "application/octet-stream": [".bin"] },
          },
        ],
      });
    } catch (reason) {
      if ((reason as DOMException).name === "AbortError") return false;
      throw reason;
    }
  }
  let writer: DiskWriter | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await deviceFetch(options.path, options.values);
    const filename = backupName(
      downloadName(response, options.fallback),
      options.board,
    );
    const total =
      Number(response.headers.get("Content-Length")) || options.expected || 0;
    reader = response.body?.getReader();
    if (!reader) throw new Error("No download stream");
    writer = await handle?.createWritable();
    const chunks: BlobPart[] = [];
    let loaded = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (writer) await writer.write(chunk.value);
      else chunks.push(chunk.value.slice().buffer);
      loaded += chunk.value.byteLength;
      options.progress({
        loaded,
        total,
        percent: total ? Math.min(99, Math.floor((loaded / total) * 100)) : 0,
      });
    }
    if (total && loaded !== total)
      throw new Error(`Incomplete download: ${loaded} / ${total}`);
    if (writer) await writer.close();
    else
      saveBlob(
        new Blob(chunks, { type: "application/octet-stream" }),
        filename,
      );
    options.progress({ loaded, total: total || loaded, percent: 100 });
    return true;
  } catch (reason) {
    await reader?.cancel().catch(() => {});
    await writer?.abort().catch(() => {});
    throw reason;
  } finally {
    reader?.releaseLock();
  }
}

export function uploadWithProgress<T>(
  path: string,
  values: Record<string, string | Blob | number>,
  progress: (value: TransferProgress) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.timeout = 1800000;
    let lastProgress: TransferProgress = { loaded: 0, total: 0, percent: 0 };
    xhr.upload.onprogress = (event) => {
      lastProgress = {
        loaded: event.loaded,
        total: event.total,
        percent: event.lengthComputable
          ? Math.min(99, Math.floor((event.loaded / event.total) * 100))
          : 0,
      };
      progress(lastProgress);
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "Upload connection interrupted. Verify device state before retrying.",
        ),
      );
    xhr.ontimeout = () =>
      reject(
        new Error("Upload timed out. Verify device state before retrying."),
      );
    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300)
          throw new Error(xhr.responseText || `HTTP ${xhr.status}`);
        const reply = JSON.parse(xhr.responseText);
        if (reply.ok === false || reply.error)
          throw new Error(reply.error || "Device operation failed");
        progress({
          loaded: lastProgress.total || lastProgress.loaded,
          total: lastProgress.total || lastProgress.loaded,
          percent: 100,
        });
        resolve(reply);
      } catch (reason) {
        reject(reason);
      }
    };
    xhr.send(formData(values));
  });
}
