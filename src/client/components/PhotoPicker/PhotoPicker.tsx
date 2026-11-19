import { useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import Icon from '@/components/Icon/Icon';
import styles from './PhotoPicker.module.scss';

type Props = {
  /** Called with the chosen or dropped files; the picker shows it's busy until this settles. */
  onPick: (files: File[]) => unknown;
  /** The accessible name: "Add a photo of the bottle". */
  label: string;
  /**
   * `tile`: a small square (in a grid, or the phone slot). `zone`: the big drop area. `bare`: just
   * the button, for a parent that styles it (the live cook's action grid).
   */
  variant?: 'tile' | 'zone' | 'bare';
  /** Visible text for `bare` and the phone `zone`. */
  children?: ReactNode;
  className?: string;
};

/**
 * Opens the file chooser (iOS offers Camera or Library); a computer can also drop images on it.
 * Picking several at once is fine.
 */
const PhotoPicker = ({ onPick, label, variant = 'tile', children, className }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const pick = async (files: File[]) => {
    if (files.length === 0) return;
    setBusy(true);
    try {
      await onPick(files);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void pick([...e.dataTransfer.files].filter((file) => file.type.startsWith('image/')));
  };

  const classes = [styles.picker, styles[variant], over && styles.over, className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        className={classes}
        type="button"
        aria-label={label}
        aria-busy={busy}
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <Icon name={variant === 'tile' || variant === 'zone' ? 'plus' : 'camera'} />
        {variant === 'zone' && (
          <>
            <span className={styles.long}>{label}</span>
            <small>Drop an image or click to choose</small>
          </>
        )}
        {busy ? (
          <span>Adding…</span>
        ) : variant === 'zone' ? (
          <span className={styles.short}>{children}</span>
        ) : (
          variant === 'bare' && children
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void pick([...(e.target.files ?? [])]);
          // The same file can be chosen again
          e.target.value = '';
        }}
      />
    </>
  );
};

export default PhotoPicker;
