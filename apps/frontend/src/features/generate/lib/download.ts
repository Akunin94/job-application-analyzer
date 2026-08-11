/** Letters download as plain text — nothing about them needs a document format. */
export function buildTextFile(text: string, subject = ''): Blob {
  const body = subject ? `Subject: ${subject}\n\n${text}` : text;
  return new Blob([body], { type: 'text/plain;charset=utf-8' });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
}
