import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent } from 'react';
import ConfirmSheet from '@/components/ConfirmSheet/ConfirmSheet';
import Field from '@/components/Field/Field';
import Icon from '@/components/Icon/Icon';
import PhotoImage from '@/components/PhotoImage/PhotoImage';
import type { PhotoOps } from '@/lib/photoHooks';
import styles from './PhotoSheet.module.scss';

type Props = {
  ops: PhotoOps;
  /** What the photos are of: "Lagavulin 16". */
  name: string;
  /** The photo being viewed, or null for closed. */
  openId: string | null;
  onOpen: (id: string | null) => void;
};

const FOCUSABLE = 'button, input, textarea, select, a[href]';

// How long the scroll must be still before the viewer decides which photo it landed on
const SETTLE_MS = 80;

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/**
 * A full-screen photo viewer: swipe (or drag with a mouse, or use the arrow keys) between photos,
 * with Make featured, Edit caption and Delete in a toolbar. The open photo is `openId`, kept in
 * step with the scroll position. Deleting closes the viewer.
 */
const PhotoSheet = ({ ops, name, openId, onOpen }: Props) => {
  const open = ops.photos.some((p) => p.id === openId);
  return open ? (
    <Viewer
      ops={ops}
      name={name}
      openId={openId}
      onOpen={onOpen}
    />
  ) : null;
};

const Viewer = ({ ops, name, openId, onOpen }: Props) => {
  const { photos } = ops;
  const index = Math.max(
    0,
    photos.findIndex((p) => p.id === openId),
  );
  const photo = photos[index];
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const settle = useRef<number>(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Reposition mode: the focal point being set, in percent. Closing or leaving cancels it.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const grab = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const entered = useRef(false);

  //////////////////////////////////////
  // Caption

  // Saves the caption being edited (it belongs to the photo it was started on)
  const save = () => {
    if (!draft) return;
    const edited = photos.find((p) => p.id === draft.id);
    if (edited && draft.text.trim() !== (edited.caption ?? ''))
      ops.setCaption(draft.id, draft.text);
    setDraft(null);
  };
  const close = () => {
    save();
    onOpen(null);
  };

  //////////////////////////////////////
  // Moving between photos

  const goTo = (to: number) => {
    const el = track.current;
    const next = photos[to];
    if (!el || !next) return;
    save();
    onOpen(next.id);
    el.scrollTo({ left: to * el.clientWidth, behavior: scrollBehavior() });
  };

  // Opens on the tapped photo, without animating there
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = index * el.clientWidth;
    // Only on mount: later changes come from the scroll position
  }, []);

  // The photo follows the scroll position once it stops moving
  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = track.current;
      if (!el || drag.current) return;
      const next = photos[Math.round(el.scrollLeft / el.clientWidth)];
      if (next && next.id !== photo?.id) {
        save();
        onOpen(next.id);
      }
    }, SETTLE_MS);
  };
  useEffect(() => () => window.clearTimeout(settle.current), []);

  // A mouse can't swipe: dragging moves the track, and letting go snaps to the nearest photo.
  // Touch keeps its native scrolling.
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    if (drag.current) e.currentTarget.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const onPointerUp = (e: PointerEvent<HTMLUListElement>) => {
    if (!drag.current) return;
    const el = e.currentTarget;
    const start = drag.current.left / el.clientWidth;
    drag.current = null;
    setDragging(false);
    // A drag of a fifth of the width is enough to turn the page
    const moved = el.scrollLeft / el.clientWidth - start;
    const to = Math.abs(moved) > 0.2 ? start + Math.sign(moved) : start;
    el.scrollTo({
      left: Math.min(Math.max(Math.round(to), 0), photos.length - 1) * el.clientWidth,
      behavior: scrollBehavior(),
    });
  };

  //////////////////////////////////////
  // Reposition: drag the photo inside a 3:2 frame (the phone hero's shape) to set its focal point

  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  function nudge(dx: number, dy: number) {
    setPos((p) => p && { x: clamp(p.x + dx), y: clamp(p.y + dy) });
  }
  function stopRepositioning() {
    setPos(null);
  }
  const startRepositioning = () => {
    save();
    setPos({ x: photo?.focusX ?? 50, y: photo?.focusY ?? 50 });
  };
  const saveFocus = () => {
    if (!photo || !pos) return;
    const x = Math.round(pos.x);
    const y = Math.round(pos.y);
    ops.setFocus(photo.id, x === 50 && y === 50 ? null : x, x === 50 && y === 50 ? null : y);
    setPos(null);
  };

  // Moving the photo right by d pixels shows more of its left side: the focus moves the other way,
  // by d as a share of how far the photo overflows the frame on that axis
  const onGrab = (e: PointerEvent<HTMLDivElement>) => {
    if (!pos || (e.pointerType === 'mouse' && e.button !== 0)) return;
    grab.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPan = (e: PointerEvent<HTMLDivElement>) => {
    const g = grab.current;
    if (!g || !photo) return;
    const el = e.currentTarget;
    const scale = Math.max(el.clientWidth / photo.width, el.clientHeight / photo.height);
    const overflowX = photo.width * scale - el.clientWidth;
    const overflowY = photo.height * scale - el.clientHeight;
    setPos({
      x: overflowX > 1 ? clamp(g.x - (100 * (e.clientX - g.px)) / overflowX) : g.x,
      y: overflowY > 1 ? clamp(g.y - (100 * (e.clientY - g.py)) / overflowY) : g.y,
    });
  };

  // Focus follows the toolbar swap, so keys and the focus trap keep working
  useEffect(() => {
    if (!entered.current) {
      entered.current = true;
      return;
    }
    root.current?.querySelector<HTMLElement>(pos ? '[data-primary]' : '[data-reposition]')?.focus();
  }, [pos === null]);

  //////////////////////////////////////
  // Keys and focus: Escape closes, arrows move, Tab stays inside, focus returns on close

  const keys = useRef({ close, goTo, index, locked: false, nudge, stopRepositioning });
  useEffect(() => {
    keys.current = { close, goTo, index, locked: deleting, nudge, stopRepositioning };
  });

  useEffect(() => {
    const panel = root.current;
    if (!panel) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () =>
      [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled'),
      );
    panel.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const frameOpen = () => panel.querySelector('[data-frame]') !== null;
    const onKeyDown = (e: KeyboardEvent) => {
      // The delete confirmation has its own keys
      if (keys.current.locked) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        // While repositioning, Escape backs out of that first
        if (frameOpen()) keys.current.stopRepositioning();
        else keys.current.close();
      } else if (frameOpen() && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        keys.current.nudge(
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
        );
      } else if (
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        !(e.target instanceof HTMLInputElement)
      ) {
        keys.current.goTo(keys.current.index + (e.key === 'ArrowLeft' ? -1 : 1));
      } else if (e.key === 'Tab') {
        const list = items();
        const head = list[0];
        const tail = list[list.length - 1];
        if (e.shiftKey && document.activeElement === head) {
          e.preventDefault();
          tail?.focus();
        } else if (!e.shiftKey && document.activeElement === tail) {
          e.preventDefault();
          head?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, []);

  if (!photo) return null;

  const editing = draft?.id === photo.id ? draft : null;
  const onFieldKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    }
  };

  return (
    <>
      <div
        ref={root}
        className={styles.viewer}
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
      >
        <button
          className={styles.close}
          type="button"
          aria-label="Close"
          data-autofocus
          onClick={close}
        >
          <Icon name="close" />
        </button>
        <ul
          ref={track}
          className={styles.track}
          data-dragging={dragging}
          inert={pos !== null}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDragStart={(e) => e.preventDefault()}
        >
          {photos.map((p) => (
            <li key={p.id}>
              <PhotoImage
                photo={p}
                size="display"
                alt={p.caption ?? `${name} photo`}
              />
            </li>
          ))}
        </ul>
        {pos && photo && (
          <div className={styles.stage}>
            <div
              ref={frame}
              className={styles.frame}
              data-frame
              role="group"
              aria-label="Reposition photo: drag, or use the arrow keys"
              onPointerDown={onGrab}
              onPointerMove={onPan}
              onPointerUp={() => (grab.current = null)}
              onPointerCancel={() => (grab.current = null)}
            >
              <PhotoImage
                photo={{ ...photo, focusX: pos.x, focusY: pos.y }}
                size="display"
                alt=""
              />
            </div>
          </div>
        )}
        {photos.length > 1 && !pos && (
          <>
            <button
              className={`${styles.step} ${styles.prev}`}
              type="button"
              aria-label="Previous photo"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <Icon name="chevronLeft" />
            </button>
            <button
              className={`${styles.step} ${styles.next}`}
              type="button"
              aria-label="Next photo"
              disabled={index === photos.length - 1}
              onClick={() => goTo(index + 1)}
            >
              <Icon name="chevron" />
            </button>
          </>
        )}
        <footer>
          {pos ? (
            <>
              <small>Drag the photo to choose what stays in view</small>
              <div
                className={styles.tools}
                role="toolbar"
                aria-label="Reposition"
              >
                <button
                  className={styles.text}
                  type="button"
                  onClick={stopRepositioning}
                >
                  Cancel
                </button>
                <button
                  className={styles.text}
                  type="button"
                  onClick={() => setPos({ x: 50, y: 50 })}
                >
                  Center
                </button>
                <button
                  className={`${styles.text} ${styles.primary}`}
                  type="button"
                  data-primary
                  onClick={saveFocus}
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              {editing ? (
                <Field
                  className={styles.caption}
                  label="Caption"
                  value={editing.text}
                  maxLength={500}
                  autoFocus
                  onChange={(e) => setDraft({ id: editing.id, text: e.target.value })}
                  onBlur={save}
                  onKeyDown={onFieldKey}
                />
              ) : (
                photo.caption && <p>{photo.caption}</p>
              )}
              {photos.length > 1 && (
                <small aria-live="polite">{`${index + 1} / ${photos.length}`}</small>
              )}
              <div
                className={styles.tools}
                role="toolbar"
                aria-label="Photo actions"
              >
                <button
                  type="button"
                  aria-label="Make featured"
                  aria-pressed={photo.featured}
                  onClick={() => !photo.featured && ops.makeFeatured(photo.id)}
                >
                  <Icon
                    name="star"
                    filled={photo.featured}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Reposition"
                  data-reposition
                  onClick={startRepositioning}
                >
                  <Icon name="move" />
                </button>
                <button
                  type="button"
                  aria-label="Edit caption"
                  onClick={() => setDraft({ id: photo.id, text: photo.caption ?? '' })}
                >
                  <Icon name="pencil" />
                </button>
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => setDeleting(true)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
      <ConfirmSheet
        open={deleting}
        title="Delete this photo?"
        message="It will be removed for good."
        confirmLabel="Delete photo"
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          ops.remove(photo.id);
          setDeleting(false);
          onOpen(null);
        }}
      />
    </>
  );
};

export default PhotoSheet;
