import Button from '@/components/Button/Button';
import Sheet from '@/components/Sheet/Sheet';
import styles from './ConfirmSheet.module.scss';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmSheet = ({ open, title, message, confirmLabel, onConfirm, onClose }: Props) => (
  <Sheet
    open={open}
    onClose={onClose}
    label={title}
  >
    <h2>{title}</h2>
    <p className={styles.confirm}>{message}</p>
    <Button
      size="lg"
      variant="danger"
      onClick={onConfirm}
    >
      {confirmLabel}
    </Button>
    <Button
      size="lg"
      variant="secondary"
      onClick={onClose}
      data-autofocus
    >
      Cancel
    </Button>
  </Sheet>
);

export default ConfirmSheet;
