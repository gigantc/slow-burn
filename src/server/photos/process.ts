//////////////////////////////////////
// Photo processing
// What goes in is checked by decoding it, not by its extension or mime type. What comes out is
// two WebP sizes, upright, with every bit of metadata (EXIF, GPS) gone.

import sharp from 'sharp';
import { HttpError } from '../errors.js';
import type { PhotoBuffers } from './storage.js';

export const DISPLAY_EDGE = 1600;
export const THUMB_EDGE = 480;
export const WEBP_QUALITY = 80;

const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

// Plenty for any camera; stops a decompression bomb.
const MAX_PIXELS = 100_000_000;

export type ProcessedPhoto = PhotoBuffers & { width: number; height: number };

/** Both sizes and the display dimensions. Throws an HttpError the route sends as is. */
export const processPhoto = async (input: Buffer): Promise<ProcessedPhoto> => {
  let format: string | undefined;
  try {
    ({ format } = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata());
  } catch {
    throw new HttpError(415, 'unsupported_image', "That file isn't an image. Use JPEG or PNG.");
  }
  if (format === 'heif') {
    throw new HttpError(
      415,
      'unsupported_image',
      'HEIC photos are not supported. Use JPEG or PNG.',
    );
  }
  if (!format || !ACCEPTED.has(format)) {
    throw new HttpError(415, 'unsupported_image', 'Use JPEG or PNG.');
  }

  // rotate() with no argument applies the EXIF orientation. sharp drops metadata unless asked to
  // keep it, so none is carried over. Small images are never enlarged.
  const resized = (edge: number) =>
    sharp(input, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

  try {
    const [display, thumb] = await Promise.all([resized(DISPLAY_EDGE), resized(THUMB_EDGE)]);
    return {
      display: display.data,
      thumb: thumb.data,
      width: display.info.width,
      height: display.info.height,
    };
  } catch {
    throw new HttpError(400, 'invalid_image', "Couldn't read that image. Try another photo.");
  }
};
