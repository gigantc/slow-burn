import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Field.module.scss';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const Field = ({ label, ...rest }: Props) => {
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
};

export default Field;
