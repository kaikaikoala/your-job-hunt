import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import AppAiAssistant from './AppAiAssistant';
import * as agentsApi from '../api/agents';

vi.mock('../api/agents');
// agents.ts imports firebase; mock it so the module resolves cleanly
vi.mock('../firebase', () => ({ auth: { currentUser: null } }));

function renderAssistant(open: boolean, onClose = vi.fn()) {
  const anchorEl = document.createElement('button');
  document.body.appendChild(anchorEl);
  return render(
    <ThemeProvider theme={theme}>
      <AppAiAssistant
        appId="app-123"
        company="Acme Corp"
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
      />
    </ThemeProvider>,
  );
}

describe('AppAiAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the assistant title when open', () => {
    renderAssistant(true);
    expect(screen.getByText('AI Assistant — Acme Corp')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    renderAssistant(true);
    expect(screen.getByRole('button', { name: 'send' })).toBeDisabled();
  });

  it('calls invokeHuntAgent and displays response on submit', async () => {
    vi.mocked(agentsApi.invokeHuntAgent).mockResolvedValue({ response: 'Hello, world!' });
    renderAssistant(true);

    await userEvent.type(screen.getByPlaceholderText('Describe an update...'), 'I passed the phone screen');
    await userEvent.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => {
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });
    expect(agentsApi.invokeHuntAgent).toHaveBeenCalledWith('app-123', 'I passed the phone screen');
  });

  it('resets input and response when closed then reopened', async () => {
    vi.mocked(agentsApi.invokeHuntAgent).mockResolvedValue({ response: 'Hello, world!' });
    const { rerender } = renderAssistant(true);

    await userEvent.type(screen.getByPlaceholderText('Describe an update...'), 'something');
    await userEvent.click(screen.getByRole('button', { name: 'send' }));
    await waitFor(() => expect(screen.getByText('Hello, world!')).toBeInTheDocument());

    const anchorEl = document.createElement('button');
    rerender(
      <ThemeProvider theme={theme}>
        <AppAiAssistant appId="app-123" company="Acme Corp" anchorEl={anchorEl} open={false} onClose={vi.fn()} />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider theme={theme}>
        <AppAiAssistant appId="app-123" company="Acme Corp" anchorEl={anchorEl} open={true} onClose={vi.fn()} />
      </ThemeProvider>,
    );

    expect(screen.queryByText('Hello, world!')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe an update...')).toHaveValue('');
  });
});
