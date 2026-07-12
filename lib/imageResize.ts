/**
 * lib/imageResize.ts
 *
 * Downscales + re-encodes an image before we send it to Gemini.
 * Full-res iPhone photos are ~4-8 MB base64 — too big for reliable
 * multimodal requests (upload latency + Gemini token cost + timeouts).
 *
 * Output is capped at 1280px longest edge at JPEG q=0.75, which is
 * plenty for OCR-grade chat-screenshot analysis and ends up ~200-400 KB.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

const MAX_LONGEST_EDGE = 1280;
const JPEG_QUALITY = 0.75;
const SCREENSHOTS_DIR = `${FileSystem.documentDirectory}screenshots/`;

export interface ResizedImage {
  base64: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err),
    );
  });
}

export async function readAndResizeImage(uri: string): Promise<ResizedImage> {
  const { width, height } = await getImageSize(uri);
  const longest = Math.max(width, height);

  // Compute the target resize so the longest edge is MAX_LONGEST_EDGE.
  // If already smaller, pass empty actions array and just re-encode.
  const actions: ImageManipulator.Action[] =
    longest > MAX_LONGEST_EDGE
      ? [
          width >= height
            ? { resize: { width: MAX_LONGEST_EDGE } }
            : { resize: { height: MAX_LONGEST_EDGE } },
        ]
      : [];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('[imageResize] ImageManipulator did not return base64');
  }

  return {
    base64: result.base64,
    mimeType: 'image/jpeg',
    width: result.width,
    height: result.height,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────
// expo-image-picker returns URIs in the app's tmp directory, which iOS may
// evict on low memory or at app upgrade. Conversation-list thumbnails need a
// URI that survives app restarts — copy the file into documentDirectory.

async function ensureScreenshotsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SCREENSHOTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SCREENSHOTS_DIR, { intermediates: true });
  }
}

export async function persistScreenshotLocally(sourceUri: string): Promise<string> {
  await ensureScreenshotsDir();
  const rawExt = sourceUri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
  const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const destUri = `${SCREENSHOTS_DIR}${id}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}
