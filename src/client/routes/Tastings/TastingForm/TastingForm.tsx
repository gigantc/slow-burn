import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { getTastingCategory, tastingCategories } from 'shared/tastingCategories';
import type { TastingCategoryKey, TastingFieldDef } from 'shared/tastingCategories';
import type { Tasting } from 'shared/types';
import CategorySwitch from '@/components/CategorySwitch/CategorySwitch';
import ChoiceField from '@/components/ChoiceField/ChoiceField';
import Field from '@/components/Field/Field';
import { FormPage } from '@/components/FormPage/FormPage';
import PhotoGrid from '@/components/PhotoGrid/PhotoGrid';
import PhotoImage from '@/components/PhotoImage/PhotoImage';
import PhotoPicker from '@/components/PhotoPicker/PhotoPicker';
import PhotoSheet from '@/components/PhotoSheet/PhotoSheet';
import RatingInput from '@/components/RatingInput/RatingInput';
import { clockTime, formatMonthDay, today } from '@/lib/format';
import { useDraftPhotos, useStoredPhotos } from '@/lib/photoHooks';
import type { PhotoOps } from '@/lib/photoHooks';
import type { TastingFields } from '@/lib/tastingActions';
import { useTastings } from '@/lib/tastingHooks';
import { useUnsaved } from '@/lib/unsaved';
import { useCategoryAccent } from '@/lib/useCategoryAccent';
import { useNow } from '@/lib/useNow';
import { distinctValues } from '@/lib/values';
import styles from './TastingForm.module.scss';

type Props = {
  /** Present when editing; absent for a new tasting. */
  initial?: Tasting;
  /** The tasting's id: an existing one, or the id a new one will be saved under (photos attach to it). */
  ownerId: string;
  /** The category a new tasting starts in (an edit uses the tasting's own). */
  category: TastingCategoryKey;
  title: string;
  submitLabel: string;
  /** Called when the category switch changes, so a new tasting can keep it in the URL. */
  onCategoryChange?: (category: TastingCategoryKey) => void;
  onSave: (fields: TastingFields) => void;
};

const SWITCH_OPTIONS = tastingCategories.map((c) => ({ value: c.key, label: c.label }));
const CATEGORY_KEYS = tastingCategories.map((c) => c.key);

const orNull = (value: string) => value.trim() || null;

const TastingForm = ({
  initial,
  ownerId,
  category: startCategory,
  title,
  submitLabel,
  onCategoryChange,
  onSave,
}: Props) => {
  const listId = useId();
  const { tastings } = useTastings();

  // An existing tasting's photos save as they are added; a new one's wait for Save
  const stored = useStoredPhotos('tasting', ownerId);
  const drafts = useDraftPhotos('tasting', ownerId);
  const photos: PhotoOps = initial ? stored : drafts;
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);

  const initialValues = {
    category: initial?.category ?? startCategory,
    name: initial?.name ?? '',
    maker: initial?.maker ?? '',
    date: initial?.tastedOn ?? today(),
    rating: initial?.rating ?? null,
    notes: initial?.notes ?? '',
    // Every field's value as typed, keyed by field key. Switching category keeps them all (the
    // form only shows the current category's); saving keeps only that category's.
    details: Object.fromEntries(
      Object.entries(initial?.details ?? {}).map(([key, value]) => [key, String(value)]),
    ),
  };
  const [values, setValues] = useState(initialValues);
  const [baseline] = useState(initialValues);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const now = useNow(60_000);

  const { specFields, noteFields } = getTastingCategory(values.category);
  const featured = photos.photos.find((photo) => photo.featured) ?? photos.photos[0];
  useCategoryAccent(values.category);
  useUnsaved(JSON.stringify(values) !== JSON.stringify(baseline) || drafts.photos.length > 0);

  // Suggestions from what's been logged: makers across everything, field values within a category
  const makers = useMemo(() => distinctValues(tastings.map((t) => t.maker)), [tastings]);
  const suggestions = (field: TastingFieldDef) =>
    distinctValues(
      tastings
        .filter((t) => t.category === values.category)
        .map((t) => t.details[field.key])
        .filter((value) => typeof value === 'string'),
    );

  const setDetail = (key: string, value: string) =>
    setValues((v) => ({ ...v, details: { ...v.details, [key]: value } }));
  const pickCategory = (category: TastingCategoryKey) => {
    setValues((v) => ({ ...v, category }));
    onCategoryChange?.(category);
  };

  const badNumber = (field: TastingFieldDef) => {
    const value = values.details[field.key]?.trim();
    return field.kind === 'number' && value ? Number.isNaN(Number(value)) : false;
  };
  const invalid = !values.name.trim() || [...specFields].some(badNumber);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (invalid) return;

    const details = Object.fromEntries(
      Object.entries(values.details).map(([key, value]) => {
        const kind = [...specFields, ...noteFields].find((f) => f.key === key)?.kind;
        return [key, kind === 'number' && value.trim() ? Number(value) : value];
      }),
    );
    onSave({
      category: values.category,
      name: values.name,
      maker: orNull(values.maker),
      tastedOn: values.date || null,
      rating: values.rating,
      notes: orNull(values.notes),
      details,
    });
    // After the tasting's own save, so its photos upload behind it
    if (!initial) drafts.commit();
  };

  return (
    <FormPage
      full
      title={title}
      onSubmit={submit}
      submitLabel={submitLabel}
      cancelFallback={initial ? `/tastings/${initial.id}` : `/tastings?category=${values.category}`}
      crumb={
        initial
          ? { to: `/tastings/${initial.id}`, label: initial.name, current: title }
          : { to: `/tastings?category=${values.category}`, label: 'Tastings', current: title }
      }
      meta={
        initial ? undefined : `${formatMonthDay(new Date(now).toISOString())} · ${clockTime(now)}`
      }
      control={
        <CategorySwitch
          label="Category"
          options={SWITCH_OPTIONS}
          categories={CATEGORY_KEYS}
          value={values.category}
          onChange={(value) => pickCategory(value as TastingCategoryKey)}
        />
      }
    >
      <div className={styles.body}>
        <div className={styles.media}>
          {featured ? (
            <button
              className={styles.slot}
              type="button"
              aria-label={`Open photos: ${featured.caption ?? `${values.name || 'Tasting'} photo`}`}
              onClick={() => setOpenPhoto(featured.id)}
            >
              <PhotoImage
                photo={featured}
                size="display"
                alt={featured.caption ?? `${values.name || 'Tasting'} photo`}
              />
            </button>
          ) : (
            <PhotoPicker
              variant="zone"
              label={getTastingCategory(values.category).photoLabel}
              onPick={photos.add}
            >
              Photo
            </PhotoPicker>
          )}
          {featured && (
            <PhotoGrid
              photos={photos.photos}
              name={values.name || 'Tasting'}
              onOpen={setOpenPhoto}
              add={
                <PhotoPicker
                  label="Add photos"
                  onPick={photos.add}
                />
              }
            />
          )}
        </div>
        <div className={styles.fields}>
          <div className={styles.identity}>
            <Field
              className={styles.name}
              label="Name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              error={triedSubmit && !values.name.trim() ? 'Give it a name.' : undefined}
            />
            <Field
              label="Maker"
              list={`${listId}-maker`}
              value={values.maker}
              onChange={(e) => setValues((v) => ({ ...v, maker: e.target.value }))}
            />
          </div>
          {specFields
            .filter((field) => field.kind === 'choice')
            .map((field) => (
              <ChoiceField
                key={`${values.category}-${field.key}`}
                label={field.label}
                options={field.options ?? []}
                value={values.details[field.key] ?? ''}
                onChange={(value) => setDetail(field.key, value)}
              />
            ))}
          <div className={styles.specs}>
            {specFields
              .filter((field) => field.kind !== 'choice')
              .map((field) => (
                <Field
                  key={`${values.category}-${field.key}`}
                  className={field.kind === 'number' ? styles.numberSpec : undefined}
                  label={field.label}
                  unit={field.unit}
                  list={field.kind === 'text' ? `${listId}-${field.key}` : undefined}
                  inputMode={field.kind === 'number' ? 'decimal' : undefined}
                  placeholder={field.placeholder}
                  value={values.details[field.key] ?? ''}
                  onChange={(e) => setDetail(field.key, e.target.value)}
                  error={triedSubmit && badNumber(field) ? 'Numbers only.' : undefined}
                />
              ))}
            <Field
              className={styles.date}
              label="Date"
              type="date"
              max={today()}
              value={values.date}
              onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            />
          </div>
          <RatingInput
            value={values.rating}
            onChange={(rating) => setValues((v) => ({ ...v, rating }))}
          />
          {noteFields.length > 0 && (
            <div className={styles.notes}>
              {noteFields.map((field) => (
                <label key={`${values.category}-${field.key}`}>
                  <span>{field.label}</span>
                  <textarea
                    rows={2}
                    placeholder={field.placeholder}
                    value={values.details[field.key] ?? ''}
                    onChange={(e) => setDetail(field.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          )}
          <Field
            multiline
            label="Notes"
            rows={3}
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          />
          <datalist id={`${listId}-maker`}>
            {makers.map((value) => (
              <option
                key={value}
                value={value}
              />
            ))}
          </datalist>
          {specFields
            .filter((field) => field.kind === 'text')
            .map((field) => (
              <datalist
                key={field.key}
                id={`${listId}-${field.key}`}
              >
                {suggestions(field).map((value) => (
                  <option
                    key={value}
                    value={value}
                  />
                ))}
              </datalist>
            ))}
        </div>
      </div>
      <PhotoSheet
        ops={photos}
        name={values.name || 'Tasting'}
        openId={openPhoto}
        onOpen={setOpenPhoto}
      />
    </FormPage>
  );
};

export default TastingForm;
