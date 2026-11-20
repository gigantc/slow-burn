import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import { FormPage } from '@/components/FormPage/FormPage';
import PhotoSection from '@/components/PhotoSection/PhotoSection';
import StatTile, { StatTiles } from '@/components/StatTile/StatTile';
import { saveCook } from '@/lib/cookActions';
import { useCook, useCooks, useMeatName } from '@/lib/cookHooks';
import { formatDuration } from '@/lib/format';
import { useStoredPhotos } from '@/lib/photoHooks';
import { useUnsaved } from '@/lib/unsaved';
import { useBack } from '@/lib/useBack';
import CookMissing from '../CookMissing/CookMissing';
import { useWrapUp, WrapUpFields } from '../WrapUpFields/WrapUpFields';

const WrapUpForm = ({ cook }: { cook: CookWithEvents }) => {
  const meatName = useMeatName(cook.meatId);
  const navigate = useNavigate();
  const back = useBack();
  // Editing a finished cook's wrap-up was pushed from the detail page, so saving goes back to it.
  const [editing] = useState(Boolean(cook.endedAt));
  const wrap = useWrapUp(cook);
  // Photos save as they are added, not with the form
  const photos = useStoredPhotos('cook', cook.id);

  useUnsaved(wrap.dirty);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (wrap.invalid) return;
    saveCook({ id: cook.id, ...wrap.fields });
    if (editing) back(`/cooks/${cook.id}`);
    else navigate(`/cooks/${cook.id}`, { replace: true });
  };

  return (
    <FormPage
      title="How'd it go?"
      onSubmit={submit}
      submitLabel="Save cook"
      submitDisabled={wrap.invalid}
      cancelFallback={`/cooks/${cook.id}`}
      cancelLabel="Back to cook"
      barCancel={false}
      crumb={{ to: `/cooks/${cook.id}`, label: meatName, current: 'Wrap up' }}
      meta={meatName}
      extra={
        <PhotoSection
          ops={photos}
          name={meatName}
          title="Photos"
          addLabel="Add photos"
        />
      }
    >
      {(wrap.total !== null || (wrap.rested !== null && wrap.rested >= 0)) && (
        <StatTiles>
          {wrap.total !== null && (
            <StatTile
              label="Total time"
              value={wrap.invalid ? 'Check end' : formatDuration(wrap.total)}
            />
          )}
          {wrap.rested !== null && wrap.rested >= 0 && (
            <StatTile
              label="Rested"
              value={formatDuration(wrap.rested)}
            />
          )}
        </StatTiles>
      )}
      <WrapUpFields
        wrap={wrap}
        meatName={meatName}
      />
    </FormPage>
  );
};

const WrapUp = () => {
  const { id } = useParams();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;
  return <WrapUpForm cook={cook} />;
};

export default WrapUp;
