import { useParams } from 'react-router';
import { saveTasting } from '@/lib/tastingActions';
import { useTasting, useTastings } from '@/lib/tastingHooks';
import { useBack } from '@/lib/useBack';
import TastingForm from '../TastingForm/TastingForm';
import TastingMissing from '../TastingMissing/TastingMissing';

const EditTasting = () => {
  const { id } = useParams();
  const back = useBack();
  const tasting = useTasting(id);
  const { ready } = useTastings();

  if (!tasting) return ready ? <TastingMissing /> : null;

  return (
    <TastingForm
      title="Edit tasting"
      submitLabel="Save changes"
      initial={tasting}
      ownerId={tasting.id}
      category={tasting.category}
      onSave={(fields) => {
        saveTasting({ id: tasting.id, ...fields });
        back(`/tastings/${tasting.id}`);
      }}
    />
  );
};

export default EditTasting;
