//////////////////////////////////////
// Resize a photo on the device before it is queued
// The server resizes again, but phones take 5-10 MB pictures and uploads wait for a weak signal:
// sending 2000px JPEGs is a fraction of that. Safari decodes HEIC itself, so an iPhone photo comes
// out of here as a JPEG; a browser that can't decode the file throws PhotoReadError.

export const MAX_EDGE = 2000;
export const JPEG_QUALITY = 0.85;

export const UNREADABLE_PHOTO = "This photo format can't be read here. Try a JPEG or PNG.";

export class PhotoReadError extends Error {
  constructor() {
    super(UNREADABLE_PHOTO);
  }
}

export type ResizedImage = { blob: Blob; width: number; height: number };

/** Long edge at most MAX_EDGE (never enlarged), upright (EXIF orientation applied), as a JPEG. */
export const resizeImage = async (file: Blob): Promise<ResizedImage> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoReadError();
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new PhotoReadError();
    // JPEG has no transparency: a PNG with some would turn black
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) throw new PhotoReadError();
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
};
