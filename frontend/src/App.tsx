import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import HuntPage from './pages/HuntPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/hunt" element={<HuntPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
