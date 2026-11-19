//////////////////////////////////////
// Photo storage
// The one place that knows photo files live on local disk. To move them (Spaces, S3...), replace
// this module and keep the interface: save, read, remove. Each photo is two files, `{id}.webp`
// (display) and `{id}-thumb.webp`. Ids are validated by the routes (letters, digits, _ and -),
// so they are safe as file names.

import { randomUUID } from 'node:crypto';
import { createReadStream, mkdirSync } from 'node:fs';
import { rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { config } from '../config.js';

export type PhotoSize = 'display' | 'thumb';
export type PhotoBuffers = Record<PhotoSize, Buffer>;

mkdirSync(config.photosDir, { recursive: true });

const fileFor = (id: string, size: PhotoSize) =>
  join(config.photosDir, size === 'thumb' ? `${id}-thumb.webp` : `${id}.webp`);

/** Write both sizes. Each goes to a temp name first, so a reader never sees half a file. */
const save = async (id: string, buffers: PhotoBuffers): Promise<void> => {
  const written: string[] = [];
  try {
    for (const size of ['display', 'thumb'] as const) {
      const target = fileFor(id, size);
      // A temp name per call, so two uploads of the same id at once can't trip over each other
      const temp = `${target}.${randomUUID()}.tmp`;
      await writeFile(temp, buffers[size]);
      await rename(temp, target);
      written.push(target);
    }
  } catch (err) {
    await Promise.all(written.map((file) => rm(file, { force: true })));
    throw err;
  }
};

/** A stream and the byte length of one size, or null if there is no such file. */
const read = async (
  id: string,
  size: PhotoSize,
): Promise<{ stream: Readable; bytes: number } | null> => {
  const file = fileFor(id, size);
  try {
    const { size: bytes } = await stat(file);
    return { stream: createReadStream(file), bytes };
  } catch {
    return null;
  }
};

/** Delete both sizes; a missing file is fine. */
const remove = async (id: string): Promise<void> => {
  await Promise.all(
    (['display', 'thumb'] as const).map((size) => rm(fileFor(id, size), { force: true })),
  );
};

export const photoStorage = { save, read, remove };
