import { useEffect } from 'react';
import { UNDO_TOAST_MS } from '@/config';
import styles from './UndoToast.module.scss';

export type Toast = { id: string; message: string };

type Props = {
  toast: Toast | null;
  onUndo: () => void;
  onClose: () => void;
};

const UndoToast = ({ toast, onUndo, onClose }: Props) => {
  const id = toast?.id;

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(onClose, UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={styles.region}
      role="status"
    >
      {toast && (
        <div>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onUndo}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};

export default UndoToast;
