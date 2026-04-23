import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './landing-page/LandingPage';
import SignInPage from './profile/SignInPage';
import HuntPage from './hunt-dashboard/HuntPage';
import ApplicationPipelinePage from './hunt-dashboard/ApplicationPipelinePage';
import ApplicationDetailPage from './hunt-dashboard/ApplicationDetailPage';
import ActionItemsPage from './hunt-dashboard/ActionItemsPage';
import NetworkPage from './hunt-dashboard/NetworkPage';
import ProtectedRoute from './shared/ProtectedRoute';
import GmailCallback from './oauth/GmailCallback';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/hunt" element={<HuntPage />} />
            <Route path="/applicationpipeline" element={<ApplicationPipelinePage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/action-items" element={<ActionItemsPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/oauth/gmail/callback" element={<GmailCallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
