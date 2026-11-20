import { useState } from 'react';
import PhotoGrid from '@/components/PhotoGrid/PhotoGrid';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import PhotoSheet from '@/components/PhotoSheet/PhotoSheet';
import type { PhotoOps } from '@/lib/photoHooks';
import styles from './PhotoSection.module.scss';

type Props = {
  ops: PhotoOps;
  /** What the photos are of: "Pork shoulder". */
  name: string;
  /** The add tile's accessible name: "Add photos". */
  addLabel: string;
  /** A heading above the grid ("Photos"). */
  title?: string;
};

/** Photos of an entry: the grid, an add tile, and the sheet that opens on a tap. */
const PhotoSection = ({ ops, name, addLabel, title }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className={styles.section}>
      {title && <h2>{title}</h2>}
      <PhotoGrid
        photos={ops.photos}
        name={name}
        onOpen={setOpenId}
        add={
          <PhotoPicker
            label={addLabel}
            onPick={ops.add}
          />
        }
      />
      <PhotoSheet
        ops={ops}
        name={name}
        openId={openId}
        onOpen={setOpenId}
      />
    </section>
  );
};

export default PhotoSection;
