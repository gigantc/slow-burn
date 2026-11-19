import { useNavigate } from 'react-router';
import { addEvent, saveCook } from '@/lib/cookActions';
import { pastTimes } from '@/lib/cookInfo';
import type { PastDates } from '@/lib/cookInfo';
import CookForm from '../CookForm/CookForm';
import type { Setup } from '../CookForm/CookForm';

const NewCook = () => {
  const navigate = useNavigate();

  const onSave = (setup: Setup, past: PastDates | null) => {
    if (past) {
      // Logged after the fact: 'import' keeps it from ever counting as live.
      const cook = saveCook({ ...setup, ...pastTimes(past), source: 'import' });
      navigate(`/cooks/${cook.id}/wrap-up`, { replace: true });
      return;
    }

    const startedAt = new Date().toISOString();
    const cook = saveCook({ ...setup, startedAt });
    addEvent(cook.id, { type: 'on_pit', at: startedAt });
    navigate(`/cooks/${cook.id}`, { replace: true });
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
