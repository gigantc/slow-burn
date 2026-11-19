import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { tastingCategoryKeys } from 'shared/tastingCategories';
import type { TastingCategoryKey } from 'shared/tastingCategories';
import { saveTasting } from '@/lib/tastingActions';
import TastingForm from '../TastingForm/TastingForm';

const isCategory = (value: string | null): value is TastingCategoryKey =>
  tastingCategoryKeys.some((key) => key === value);

/** /tastings/new?category=whisky. The category lives in the URL; without a valid one, the first. */
const NewTasting = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = params.get('category');

  if (!isCategory(category)) {
    return (
      <Navigate
        to={`/tastings/new?category=${tastingCategoryKeys[0]}`}
        replace
      />
    );
  }

  return (
    <TastingForm
      title="New tasting"
      submitLabel="Save tasting"
      category={category}
      onCategoryChange={(next) => setParams({ category: next }, { replace: true })}
      onSave={(fields) => {
        const tasting = saveTasting(fields);
        navigate(`/tastings/${tasting.id}`, { replace: true });
      }}
    />
  );
};

export default NewTasting;
