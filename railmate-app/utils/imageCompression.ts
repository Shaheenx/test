// utils/imageCompression.ts
//
// Resize + compress a locally-picked image before it's read into bytes and
// uploaded. Modern phone camera photos routinely land at 3-4MB+ — this
// brings that down to a few hundred KB before it ever touches the network
// or the storage bucket's size limit.

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * NOTE: manipulateAsync is marked deprecated in the latest expo-image-manipulator
 * docs in favor of a new contextual API (ImageManipulator.manipulate /
 * useImageManipulator). Deliberately still using the old API here — unlike
 * expo-file-system's getInfoAsync, it's not documented as throwing, just
 * superseded, and it's well-proven. Not worth risking an unverified new API
 * shape on a live fix tonight. Worth migrating later when there's room to
 * actually test the new one properly.
 */
export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }], // height omitted — scales proportionally
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}