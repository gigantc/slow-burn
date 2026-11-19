import { useParams } from 'react-router';
import { useCook, useCooks } from '@/lib/cookHooks';
import { isLiveCook } from '@/lib/cookInfo';
import CookDetail from '../CookDetail/CookDetail';
import CookMissing from '../CookMissing/CookMissing';
import LiveCook from '../LiveCook/LiveCook';

/** /cooks/:id is the live screen while the cook is in progress and the detail once it's done. */
const CookPage = () => {
  const { id } = useParams();
  const cook = useCook(id);
  const { ready } = useCooks();

  if (!cook) return ready ? <CookMissing /> : null;
  return isLiveCook(cook) ? <LiveCook cook={cook} /> : <CookDetail cook={cook} />;
};

export default CookPage;
