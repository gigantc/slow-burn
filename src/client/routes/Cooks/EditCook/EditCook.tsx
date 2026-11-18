import { useNavigate, useParams } from 'react-router';
import { saveCook } from '@/lib/cookActions';
import { useCook, useCooks } from '@/lib/cookHooks';
import CookForm from '../CookForm/CookForm';
import CookMissing from '../CookMissing/CookMissing';

const EditCook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;

  return (
    <CookForm
      title="Edit setup"
      initial={cook}
      submitLabel="Save"
      onSave={(setup) => {
        saveCook({ id: cook.id, ...setup });
        navigate(`/cooks/${cook.id}`);
      }}
    />
  );
};

export default EditCook;
