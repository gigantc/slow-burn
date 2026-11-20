import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './AutoTextarea.module.scss';

// `field-sizing` does the growing where supported; elsewhere (older iOS Safari) the height follows
// scrollHeight. Set before paint so existing text is sized on the first render.
const NATIVE = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

/** A textarea that grows to fit its text instead of scrolling. Give it a min-height in CSS. */
const AutoTextarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (NATIVE || !el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    // A new width rewraps the text
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      className={className ? `${styles.auto} ${className}` : styles.auto}
      {...props}
    />
  );
};

export default AutoTextarea;
