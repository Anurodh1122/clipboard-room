export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch((err) =>
    console.error('Clipboard copy failed:', err)
  );
}
