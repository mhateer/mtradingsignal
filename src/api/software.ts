import { api } from './client';

/**
 * Downloads the agent installer as an authenticated blob and triggers
 * a browser save dialog. Works with private GitHub release assets because
 * the backend streams the file server-side using its own GitHub token.
 */
export async function downloadAgent(): Promise<void> {
  const res = await api.get('/software/download', {
    responseType: 'blob',
  });

  // Try to extract filename from Content-Disposition header
  const disposition: string | undefined = res.headers['content-disposition'];
  let filename = 'mTradingSignal-Agent-Setup.exe';
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}