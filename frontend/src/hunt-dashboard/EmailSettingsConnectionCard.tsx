import { Box, Button, Paper, Typography } from "@mui/material";
import { generatePKCE } from "../oauth/pkce";
import {
  borderSubtle,
  onSurface,
  onSurfaceVariant,
  primary,
  successDark,
  surfaceContainerLow,
} from "../colors";

interface Props {
  isConnected: boolean;
  connectedEmail?: string;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

export default function EmailSettingsConnectionCard({
  isConnected,
  connectedEmail,
  isSyncing,
  isDisconnecting,
  onSync,
  onDisconnect,
}: Props) {
  const handleConnect = async () => {
    const { verifier, challenge } = await generatePKCE();
    sessionStorage.setItem("pkce_verifier", verifier);
    const origin = window.location.origin;
    const redirectUri = `${origin}/oauth/gmail/callback`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${import.meta.env.VITE_GMAIL_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly email openid")}` +
      `&response_type=code` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256`;
    window.location.href = url;
  };
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        border: `1px solid ${borderSubtle}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: surfaceContainerLow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGwI_qqJjA6fMC6o2c7xT6-7OAIoKJ_WkpV8dRGk1Ieivv6bvX_kc62ropEfJC-Unhiqb8D0YyAFQtXc5KuJptWsGnN_G-lx_IXg1RHBsrBft1koKyYv_hFEzHYOBe6GLHKwoxCncUZzkTdo4aeL5hnPp3S0my5bt5hK_371R1al4fcFcWbNomCjVQiEC9gi0EIa7uAcBBSiszUHHoEWUG8djInI0kUzi6_S5bom5fWfEAe6l_FLpf6DiCRzlKu0LkzDgwZlrY57Ib"
              alt="Gmail"
              sx={{ width: 40, height: 40 }}
            />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: onSurface,
              }}
            >
              Gmail Integration
            </Typography>
            <Typography sx={{ color: onSurfaceVariant, fontSize: 14 }}>
              {isConnected ? `Connected as ${connectedEmail}` : "Not connected"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            bgcolor: surfaceContainerLow,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <span
              className="material-symbols-outlined"
              style={{
                color: isConnected ? successDark : onSurfaceVariant,
                fontVariationSettings: '"FILL" 1',
              }}
            >
              {isConnected ? "check_circle" : "cancel"}
            </span>
            <Typography
              sx={{ fontWeight: 600, fontSize: 14, color: onSurface }}
            >
              {isConnected ? "Connection Active" : "No Connection"}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isConnected ? successDark : onSurfaceVariant,
            }}
          >
            {isConnected ? "Healthy" : "Inactive"}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        {isConnected ? (
          <>
            <Button
              variant="contained"
              onClick={onSync}
              disabled={isSyncing}
              fullWidth
              sx={{
                background: `linear-gradient(to right, ${onSurface}, ${primary})`,
                "&:hover": { opacity: 0.88 },
              }}
            >
              {isSyncing ? "Syncing…" : "Refresh Connection"}
            </Button>
            <Button
              variant="outlined"
              onClick={onDisconnect}
              disabled={isDisconnecting}
              fullWidth
              sx={{
                color: onSurfaceVariant,
                borderColor: borderSubtle,
              }}
            >
              Disconnect Account
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handleConnect}
            fullWidth
            sx={{
              background: `linear-gradient(to right, ${onSurface}, ${primary})`,
              "&:hover": { opacity: 0.88 },
            }}
          >
            Connect Gmail
          </Button>
        )}
      </Box>
    </Paper>
  );
}
