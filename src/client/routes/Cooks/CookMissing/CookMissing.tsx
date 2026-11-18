import { Link } from 'react-router';

// Shown when a cook id has no match in the local cache.
const CookMissing = () => (
  <section>
    <h1>Cook not found</h1>
    <p>
      It may have been deleted. <Link to="/cooks">Back to all cooks</Link>
    </p>
  </section>
);

export default CookMissing;
