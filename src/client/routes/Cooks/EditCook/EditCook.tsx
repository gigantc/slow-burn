import { useParams } from 'react-router';
import type { CookWithEvents } from 'shared/types';
import { saveCook } from '@/lib/cookActions';
import { useCook, useCooks, useMeatName } from '@/lib/cookHooks';
import { isLiveCook, pastTimes } from '@/lib/cookInfo';
import { useBack } from '@/lib/useBack';
import CookForm from '../CookForm/CookForm';
import CookMissing from '../CookMissing/CookMissing';
import { useWrapUp, WrapUpFields } from '../WrapUpFields/WrapUpFields';

// A finished cook (anything not on the pit now, past cooks included) edits its setup and its
// wrap-up together and saves both in one write; a live cook edits its setup only.
const EditForm = ({ cook }: { cook: CookWithEvents }) => {
  const back = useBack();
  const meatName = useMeatName(cook.meatId);
  const wrap = useWrapUp(cook);
  const finished = !isLiveCook(cook);

  return (
    <CookForm
      title="Edit cook"
      initial={cook}
      submitLabel="Save changes"
      wrapUp={
        finished
          ? {
              fields: (
                <WrapUpFields
                  wrap={wrap}
                  meatName={meatName}
                  title="Wrap-up"
                />
              ),
              dirty: wrap.dirty,
              invalid: wrap.invalid,
            }
          : undefined
      }
      onSave={(setup, past) => {
        // A past cook's times come from its own date fields, so they go last
        saveCook({
          id: cook.id,
          ...setup,
          ...(finished ? wrap.fields : {}),
          ...(past ? pastTimes(past) : {}),
        });
        back(`/cooks/${cook.id}`);
      }}
    />
  );
};

const EditCook = () => {
  const { id } = useParams();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;
  return <EditForm cook={cook} />;
};

export default EditCook;
