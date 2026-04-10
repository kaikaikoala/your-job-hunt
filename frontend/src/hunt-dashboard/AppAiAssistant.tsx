import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import { invokeHuntAgent } from '../api/agents';
import {
  borderSubtle,
  onSurface,
  onSurfaceVariant,
  primary,
  surfaceContainerLow,
  surfaceContainerLowest,
} from '../colors';

interface Props {
  appId: string;
  company: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function AppAiAssistant({ appId, company, anchorEl, open, onClose }: Props) {
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setChatInput('');
      setChatResponse('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const result = await invokeHuntAgent(appId, chatInput);
      setChatResponse(result.response);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
      <Paper
        elevation={4}
        sx={{
          p: 2,
          mt: 0.5,
          width: 320,
          borderRadius: 2,
          bgcolor: surfaceContainerLowest,
          border: `1px solid ${borderSubtle}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography
            sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: onSurface }}
          >
            AI Assistant — {company}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </IconButton>
        </Box>

        {/* Input */}
        <TextField
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          size="small"
          placeholder="Describe an update..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
          sx={{ mb: 1 }}
        />

        {/* Send */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: chatResponse ? 1.5 : 0 }}>
          <IconButton
            aria-label="send"
            size="small"
            disabled={!chatInput.trim() || chatLoading}
            onClick={handleSubmit}
            sx={{ color: primary }}
          >
            {chatLoading ? (
              <CircularProgress size={18} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
            )}
          </IconButton>
        </Box>

        {/* Response */}
        {chatResponse && (
          <Box
            sx={{
              bgcolor: surfaceContainerLow,
              borderRadius: 1.5,
              p: 1.5,
              minHeight: 60,
            }}
          >
            <Typography sx={{ fontSize: 13, color: onSurfaceVariant }}>{chatResponse}</Typography>
          </Box>
        )}
      </Paper>
    </Popper>
  );
}
