import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { ShareResult } from './share';

// In the browser the card is drawn to an image with html2canvas, saved as a download,
// and shared through the browser's own share sheet where it can share files (most phones, Chrome and Edge on Windows).
export const canShareImages = true;

/** The card as a PNG data URL, at three times screen size so it stays sharp when shared. */
export async function captureCard(ref: RefObject<View | null>): Promise<string> {
  const node = ref.current as unknown as HTMLElement | null;
  if (!node) throw new Error('The card is not on screen.');
  const html2canvas = (await import('html2canvas')).default;
  // A clear background keeps the card's rounded corners round.
  const canvas = await html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true, logging: false });
  return canvas.toDataURL('image/png');
}

function fileFrom(dataUrl: string, name: string): File {
  const [head, body] = dataUrl.split(',');
  const type = /data:(.*?);/.exec(head)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type });
}

function download(dataUrl: string, name: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** The browser's share sheet when it can share an image; otherwise the card downloads instead. */
export async function shareImage(dataUrl: string, name = 'unknot-week.png'): Promise<ShareResult> {
  const file = fileFrom(dataUrl, name);
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'My week on Unknot' });
      return 'shared';
    } catch (e) {
      // Closing the share sheet isn't an error.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // The browser refused to open it (some do, for some files or without a recent tap): download instead.
    }
  }
  download(dataUrl, name);
  return 'downloaded';
}

/** Saves the card as a download. */
export async function saveImage(dataUrl: string, name = 'unknot-week.png'): Promise<boolean> {
  download(dataUrl, name);
  return true;
}
