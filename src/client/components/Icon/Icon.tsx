import styles from './Icon.module.scss';

// Placeholder glyphs: 24px grid, stroke only.
const PATHS = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-1-5 1-8z',
  glass: 'M5 4h14l-1.5 15a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z M6 10h12',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  logout: 'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4 M16 8l4 4-4 4 M20 12H9',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:
    'M3 3l18 18 M10.6 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2 M6.6 6.6A16.5 16.5 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-1 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  thermometer: 'M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z M12 9v6',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  box: 'M3 8l9-5 9 5v8l-9 5-9-5z M3 8l9 5 9-5 M12 13v8',
  boxOpen: 'M3 11v5l9 5 9-5v-5 M3 11l9 5 9-5 M3 11l4-5 5 3 5-3 4 5',
  wood: 'M3 17l14-10 M7 21l14-10 M3 17l4 4 M17 7l4 4',
  pencil: 'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
  pause: 'M8 5v14 M16 5v14',
  check: 'M5 12l5 5L20 7',
  dots: 'M5 12h.01 M12 12h.01 M19 12h.01',
  chevronLeft: 'M15 18l-6-6 6-6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  chevronDown: 'M6 9l6 6 6-6',
  chevron: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12 M18 6L6 18',
  sync: 'M20 11a8 8 0 0 0-14.9-3 M4 4v4h4 M4 13a8 8 0 0 0 14.9 3 M20 20v-4h-4',
  cigar:
    'M4 20L17 7 M7 20l-3-3 M10.5 13.5l3 3 M18 3c1.2 1.2 1.2 2.6 0 3.8 M21.5 6.5c1.2 1.2 1.2 2.6 0 3.8',
  wine: 'M8 3h8l1 6a5 5 0 0 1-10 0z M12 14v7 M8 21h8',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
} as const;

export type IconName = keyof typeof PATHS;

const Icon = ({ name, filled = false }: { name: IconName; filled?: boolean }) => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[name]} />
  </svg>
);

export default Icon;
