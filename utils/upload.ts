import { API_BASE, apiHeaders } from './api';

/** Upload a file to Cloudflare R2 via the Worker. Returns a stable URL (not base64). */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: apiHeaders(),
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Upload failed');
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadFile));
}

/** Use R2 for new uploads; keep existing data URLs as-is. */
export async function toStoredUrl(data: string | File): Promise<string> {
  if (typeof data === 'string') return data;
  return uploadFile(data);
}
