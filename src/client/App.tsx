import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import Home from '@/routes/Home/Home';
import Login from '@/routes/Login/Login';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'out') return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
