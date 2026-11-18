import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell/AppShell';
import { AuthProvider, useAuth } from '@/lib/auth';
import CookPage from '@/routes/Cooks/CookPage/CookPage';
import Cooks from '@/routes/Cooks/Cooks';
import EditCook from '@/routes/Cooks/EditCook/EditCook';
import NewCook from '@/routes/Cooks/NewCook/NewCook';
import WrapUp from '@/routes/Cooks/WrapUp/WrapUp';
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
            path="/cooks/new"
            element={<NewCook />}
          />
          <Route
            path="/cooks/:id"
            element={<CookPage />}
          />
          <Route
            path="/cooks/:id/edit"
            element={<EditCook />}
          />
          <Route
            path="/cooks/:id/wrap-up"
            element={<WrapUp />}
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
