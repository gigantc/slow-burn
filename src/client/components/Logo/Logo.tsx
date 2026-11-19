import { useId } from 'react';
import styles from './Logo.module.scss';

const FLAME_1 =
  'M 122.7 10.1 C 123.3 15.4 126.9 32.4 125.8 42.1 C 124.8 51.7 121.1 60 116.6 67.8 C 112.1 75.6 104.9 81.9 98.8 88.7 C 92.7 95.6 85.2 101.4 80.1 108.9 C 74.9 116.4 70.4 124.9 68.1 133.6 C 65.8 142.2 65 152 66.3 160.9 C 67.6 169.7 71.4 177.9 75.7 186.6 C 80.1 195.3 89.5 208.6 92.2 212.9 C 92.2 207.6 90.5 190.6 91.9 181.1 C 93.3 171.5 96.6 163.5 100.8 155.7 C 105.1 147.8 111.5 141.1 117.2 134.1 C 122.8 127.1 130.1 121.2 134.9 113.7 C 139.7 106.2 143.9 97.7 145.9 89.1 C 147.9 80.5 148 70.9 146.7 62.2 C 145.4 53.4 142.1 45.3 138.1 36.6 C 134.2 28 125.3 14.5 122.7 10.1 Z';
const FLAME_2 =
  'M 173.2 75.1 C 172.7 79.9 172.2 95.1 170 103.4 C 167.9 111.7 164.5 118.2 160.3 124.7 C 156.1 131.2 150.1 136.6 144.8 142.4 C 139.5 148.2 133.3 153.3 128.7 159.5 C 124 165.7 119.5 172.5 116.8 179.7 C 114 186.9 112.4 195 112.2 202.7 C 112.1 210.4 113.7 217.7 115.7 225.9 C 117.8 234.1 123.1 247.5 124.5 251.8 C 125.4 247.1 126.6 231.5 129.6 223.4 C 132.6 215.3 137.3 209.2 142.3 203.1 C 147.4 197.1 154.3 192.5 160 186.9 C 165.8 181.4 172.4 176.3 176.9 169.9 C 181.5 163.5 185.4 156 187.4 148.4 C 189.4 140.8 189.7 132.4 189 124.6 C 188.2 116.7 185.6 109.6 183 101.3 C 180.4 93.1 174.8 79.5 173.2 75.1 Z';

type Props = {
  /** `horizontal`: flame and name on one line (sidebar, header). `badge`: stacked with the tagline (sign-in). */
  variant?: 'horizontal' | 'badge';
};

// The lockups are laid out in em, so one font-size (set in Logo.module.scss) scales everything.
// The flame is inline SVG filled with one bottom-to-top gradient from the logo tokens; the name
// is text, so it follows the theme's `text` color. The role="img" label is the accessible name.
// Proportions and minimum sizes: docs/design-system.md, Logo.
const Logo = ({ variant = 'horizontal' }: Props) => {
  const id = useId();

  const flame = (
    <svg
      viewBox="55 6 145 252"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="258"
          x2="0"
          y2="6"
        >
          <stop
            className={styles.base}
            offset="0"
          />
          <stop
            className={styles.tip}
            offset="1"
          />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d={FLAME_1}
      />
      <path
        fill={`url(#${id})`}
        d={FLAME_2}
      />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <span
        className={`${styles.logo} ${styles.badge}`}
        role="img"
        aria-label="Slow Burn. Smoke, sip, savor, repeat."
      >
        {flame}
        <span className={styles.name}>SLOW BURN</span>
        <span
          className={styles.tagline}
          aria-hidden="true"
        >
          SMOKE · SIP · SAVOR · REPEAT
        </span>
      </span>
    );
  }

  return (
    <span
      className={`${styles.logo} ${styles.horizontal}`}
      role="img"
      aria-label="Slow Burn"
    >
      {flame}
      SLOW BURN
    </span>
  );
};

export default Logo;
