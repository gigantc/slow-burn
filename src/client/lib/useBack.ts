import { useNavigate } from 'react-router';

/**
 * Go back one step when this session has in-app history, otherwise go to `fallback`, replacing
 * the current entry. react-router keeps the entry index in history.state (0 for the first
 * entry, unchanged by replace), which is what tells us there is something to go back to.
 */
export const useBack = () => {
  const navigate = useNavigate();

  return (fallback: string) => {
    const index: unknown = window.history.state?.idx;
    if (typeof index === 'number' && index > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
};
