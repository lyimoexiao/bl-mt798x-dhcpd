export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[/\\\x00-\x1f]/g, "_");
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadName(response: Response, fallback: string) {
  return (
    /filename\s*=\s*"([^"]+)"/i.exec(
      response.headers.get("Content-Disposition") || "",
    )?.[1] || fallback
  );
}
