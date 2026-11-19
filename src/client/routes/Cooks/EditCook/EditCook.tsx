import { useParams } from 'react-router';
import { saveCook } from '@/lib/cookActions';
import { useCook, useCooks } from '@/lib/cookHooks';
import { pastTimes } from '@/lib/cookInfo';
import { useBack } from '@/lib/useBack';
import CookForm from '../CookForm/CookForm';
import CookMissing from '../CookMissing/CookMissing';

const EditCook = () => {
  const { id } = useParams();
  const back = useBack();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;

  return (
    <CookForm
      title="Edit setup"
      initial={cook}
      submitLabel="Save changes"
      onSave={(setup, past) => {
        saveCook({ id: cook.id, ...setup, ...(past ? pastTimes(past) : {}) });
        back(`/cooks/${cook.id}`);
      }}
    />
  );
};

export default EditCook;
