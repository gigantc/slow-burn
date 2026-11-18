import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { initTheme } from '@/lib/theme';
import '@/scss/global.scss';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
