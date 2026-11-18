import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell/AppShell';
import { AuthProvider, useAuth } from '@/lib/auth';
import Cooks from '@/routes/Cooks/Cooks';
import Home from '@/routes/Home/Home';
import Login from '@/routes/Login/Login';
import Tastings from '@/routes/Tastings/Tastings';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'out')
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  return children;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/cooks"
            element={<Cooks />}
          />
          <Route
            path="/tastings"
            element={<Tastings />}
          />
        </Route>
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
