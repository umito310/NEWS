const KEY = "biaslens_memos";

export function loadMemos() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveMemoEntry(entry) {
  const memos = loadMemos();
  memos.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(memos));
}

export function formatSavedAt(isoString) {
  return new Date(isoString).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
