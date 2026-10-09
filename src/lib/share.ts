import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';

export const canShareImages = Platform.OS === 'ios' || Platform.OS === 'android';

/** What happened when sharing: the sheet opened, it was closed, the card was downloaded instead (web), or sharing isn't available. */
export type ShareResult = 'shared' | 'cancelled' | 'downloaded' | 'unavailable';

// The capture, share and Photos modules load only when someone shares. If one of them is
// missing (Expo Go doesn't ship every native module), only that action fails, never app start.

/** The card as an image file, at full screen resolution. */
export async function captureCard(ref: RefObject<View | null>): Promise<string> {
  const { captureRef } = await import('react-native-view-shot');
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', fileName: 'unknot-week' });
}

/** Opens the system share sheet (Instagram, TikTok, WhatsApp, Messages, Save Image…). */
export async function shareImage(uri: string): Promise<ShareResult> {
  const Sharing = await import('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your week' });
  return 'shared';
}

/** Saves the image to Photos. Returns false if permission was refused. */
export async function saveImage(uri: string): Promise<boolean> {
  // The classic media library API: it's in Expo Go, and only asks to add photos.
  const MediaLibrary = await import('expo-media-library/legacy');
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return false;
  await MediaLibrary.saveToLibraryAsync(uri);
  return true;
}
