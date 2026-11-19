import { useState } from 'react';
import Field from '@/components/Field/Field';
import type { InputProps } from '@/components/Field/Field';
import Icon from '@/components/Icon/Icon';
import styles from './PasswordField.module.scss';

type Props = Omit<InputProps, 'type' | 'multiline' | 'unit' | 'action'>;

/** A password Field with an eye button inside it that shows or hides the text. */
const PasswordField = (props: Props) => {
  const [shown, setShown] = useState(false);

  return (
    <Field
      {...props}
      type={shown ? 'text' : 'password'}
      action={
        <button
          className={styles.toggle}
          type="button"
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
        >
          <Icon name={shown ? 'eyeOff' : 'eye'} />
        </button>
      }
    />
  );
};

export default PasswordField;
