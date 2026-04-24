import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { onPrimaryFixedVariant } from "../colors";
import { fetchEmailSettings, startEmailSync } from "../api/emailSettings";

type SyncButtonState = "not-configured" | "idle" | "syncing";

interface EmailSyncButtonProps {
  onSync?: () => Promise<void> | void;
}

function renderNotConfigured(onClick: () => void) {
  return (
    <Button
      variant="text"
      sx={{ fontSize: 13, color: onPrimaryFixedVariant }}
      onClick={onClick}
      startIcon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync</span>}
    >
      Enable Email
    </Button>
  );
}

function renderIdle(onClick: () => void) {
  return (
    <Button
      variant="text"
      sx={{ fontSize: 13, color: onPrimaryFixedVariant }}
      onClick={onClick}
      startIcon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync</span>}
    >
      Email Sync
    </Button>
  );
}

function renderSyncing() {
  return (
    <Button
      variant="text"
      sx={{ fontSize: 13, color: onPrimaryFixedVariant }}
      disabled
      startIcon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync</span>}
    >
      Syncing…
    </Button>
  );
}

export default function EmailSyncButton({ onSync }: EmailSyncButtonProps) {
  const [state, setState] = useState<SyncButtonState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmailSettings()
      .then((s) => setState(s !== null ? "idle" : "not-configured"))
      .catch(() => setState("not-configured"));
  }, []);

  const handleSync = async () => {
    setState("syncing");
    try {
      await startEmailSync();
      await onSync?.();
    } catch {
      // no-op
    } finally {
      setState("idle");
    }
  };

  if (state === null) {
    return null;
  }

  switch (state) {
    case "not-configured":
      return renderNotConfigured(() => navigate("/emailsettings"));
    case "idle":
      return renderIdle(handleSync);
    case "syncing":
      return renderSyncing();
  }
}
