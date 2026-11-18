import { useNavigate } from 'react-router';
import { addEvent, saveCook } from '@/lib/cookActions';
import { fromLocalInput } from '@/lib/format';
import CookForm from '../CookForm/CookForm';
import type { PastDates, Setup } from '../CookForm/CookForm';

const NewCook = () => {
  const navigate = useNavigate();

  const onSave = (setup: Setup, past: PastDates | null) => {
    if (past) {
      const cook = saveCook({
        ...setup,
        startedAt: fromLocalInput(past.startedAt),
        endedAt: fromLocalInput(past.endedAt),
      });
      navigate(`/cooks/${cook.id}/wrap-up`);
      return;
    }

    const startedAt = new Date().toISOString();
    const cook = saveCook({ ...setup, startedAt });
    addEvent(cook.id, { type: 'on_pit', at: startedAt });
    navigate(`/cooks/${cook.id}`);
  };

  return (
    <CookForm
      title="New cook"
      submitLabel="Start cook"
      onSave={onSave}
    />
  );
};

export default NewCook;
