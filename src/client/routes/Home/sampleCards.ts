import type { EntryCardProps } from '@/components/Card/Card';

// Placeholder content for the design pass. Replace with real entries from the API.
export const sampleCards: EntryCardProps[] = [
  {
    type: 'cook',
    title: 'Thanksgiving turkey',
    tags: ['14 lb', 'Hickory'],
    date: '2025-11-27',
    rating: 5,
  },
  { type: 'cook', title: 'Brisket', tags: ['12 lb', 'Post oak'], date: '2026-10-18', rating: 4 },
  {
    type: 'whisky',
    title: 'Lagavulin 16',
    tags: ['Islay', '16 yr'],
    date: '2026-11-02',
    rating: 5,
  },
  {
    type: 'cigar',
    title: 'Padrón 1964 Anniversary',
    tags: ['Nicaragua', 'Robusto'],
    date: '2026-10-25',
    rating: 4,
  },
  { type: 'wine', title: 'Barolo 2018', tags: ['Piedmont', '2018'], date: '2026-10-10', rating: 4 },
  { type: 'cook', title: 'Pork shoulder', tags: ['9 lb', 'Apple'], date: '2026-09-05' },
];
