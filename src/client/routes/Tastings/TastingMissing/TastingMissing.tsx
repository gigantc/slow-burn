import { Link } from 'react-router';

// Shown when a tasting id has no match in the local cache.
const TastingMissing = () => (
  <section>
    <h1>Tasting not found</h1>
    <p>
      It may have been deleted. <Link to="/tastings">Back to all tastings</Link>
    </p>
  </section>
);

export default TastingMissing;
