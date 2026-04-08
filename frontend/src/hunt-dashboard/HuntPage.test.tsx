import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import HuntPage from './HuntPage';
import * as applicationsApi from '../api/applications';

// Mock Firebase auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Test User', photoURL: null },
    signOut: vi.fn(),
  }),
}));

// Mock the API module
vi.mock('../api/applications');

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
  });

  it('shows loading indicator while query is pending', () => {
    vi.mocked(applicationsApi.fetchApplications).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HuntPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when API returns empty list', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([]);
    renderWithProviders(<HuntPage />);
    await waitFor(() => {
      expect(screen.getByText('No applications yet.')).toBeInTheDocument();
    });
  });

  it('shows application cards when API returns data', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([
      { appId: '1', company: 'Stripe', role: 'Staff Engineer' },
      { appId: '2', company: 'Linear', role: 'Product Designer' },
    ]);
    renderWithProviders(<HuntPage />);
    await waitFor(() => {
      expect(screen.getByText('Staff Engineer')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
      expect(screen.getByText('Linear')).toBeInTheDocument();
    });
  });

  it('"New Application" button opens the add dialog', async () => {
    vi.mocked(applicationsApi.fetchApplications).mockResolvedValue([]);
    renderWithProviders(<HuntPage />);
    await waitFor(() => screen.getByText('No applications yet.'));

    await userEvent.click(screen.getByRole('button', { name: /new application/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });
});
