export function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

export function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "—";
}

export function fileKind(mimeType = "") {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) return "Sheet";
  if (mimeType.startsWith("text/") || mimeType.includes("document")) return "Document";
  return "File";
}

export function fileId(file) {
  return file.id || file._id;
}
