import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import HuntPage from './HuntPage';
import * as applicationsApi from '../api/applications';
import * as emailSettingsApi from '../api/emailSettings';
import type { ApplicationWithStages } from '../api/applications';

// Mock Firebase auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Test User', photoURL: null },
    signOut: vi.fn(),
  }),
}));

vi.mock('../api/applications');
vi.mock('../api/emailSettings');

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('HuntPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(emailSettingsApi.fetchEmailSettings).mockResolvedValue(null);
  });

  it('shows loading indicator while query is pending', () => {
    vi.mocked(applicationsApi.fetchDashboard).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HuntPage />);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('shows empty state when API returns empty list', async () => {
    vi.mocked(applicationsApi.fetchDashboard).mockResolvedValue({ applications: [] });
    renderWithProviders(<HuntPage />);
    await waitFor(() => {
      expect(screen.getByText('No applications yet.')).toBeInTheDocument();
    });
  });

  it('shows application cards when API returns data', async () => {
    const apps: ApplicationWithStages[] = [
      { appId: '1', company: 'Stripe', role: 'Staff Engineer', stages: [] },
      { appId: '2', company: 'Linear', role: 'Product Designer', stages: [] },
    ];
    vi.mocked(applicationsApi.fetchDashboard).mockResolvedValue({ applications: apps });
    renderWithProviders(<HuntPage />);
    await waitFor(() => {
      expect(screen.getByText('Staff Engineer')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
      expect(screen.getByText('Linear')).toBeInTheDocument();
    });
  });

  it('"New Application" button opens the add dialog', async () => {
    vi.mocked(applicationsApi.fetchDashboard).mockResolvedValue({ applications: [] });
    renderWithProviders(<HuntPage />);
    await waitFor(() => screen.getByText('No applications yet.'));

    await userEvent.click(screen.getByRole('button', { name: /new application/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  it('shows "Sync Emails" button when email settings exist', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([]);
    vi.mocked(emailSettingsApi.fetchEmailSettings).mockResolvedValue({ email: 'me@gmail.com' });
    renderWithProviders(<HuntPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync emails/i })).toBeInTheDocument();
    });
  });

  it('"Sync Emails" button is disabled and shows "Syncing…" while a sync is running', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([]);
    vi.mocked(emailSettingsApi.fetchEmailSettings).mockResolvedValue({ email: 'me@gmail.com' });
    vi.mocked(emailSettingsApi.startEmailSync).mockResolvedValue({ syncId: 'sync-1', status: 'running' });
    vi.mocked(emailSettingsApi.fetchEmailSync).mockResolvedValue({ syncId: 'sync-1', status: 'running' });

    renderWithProviders(<HuntPage />);
    const syncBtn = await screen.findByRole('button', { name: /sync emails/i });

    await userEvent.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /syncing/i })).toBeDisabled();
    });
  });

  it('"Sync Emails" button re-enables after sync completes', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([]);
    vi.mocked(emailSettingsApi.fetchEmailSettings).mockResolvedValue({ email: 'me@gmail.com' });
    vi.mocked(emailSettingsApi.startEmailSync).mockResolvedValue({ syncId: 'sync-1', status: 'running' });
    vi.mocked(emailSettingsApi.fetchEmailSync).mockResolvedValue({ syncId: 'sync-1', status: 'completed' });

    renderWithProviders(<HuntPage />);
    const syncBtn = await screen.findByRole('button', { name: /sync emails/i });

    await userEvent.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync emails/i })).not.toBeDisabled();
    });
  });
});
