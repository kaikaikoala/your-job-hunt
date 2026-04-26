import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  onSurface,
  onSurfaceVariant,
  primary,
  borderLight,
  dark,
} from "../colors";

type NavLink = "resume-builder" | "hunt-tracker" | "application-pipeline" | "email-settings";

interface NavChild {
  label: string;
  key: NavLink;
  href: string;
}

interface NavItem {
  label: string;
  key: NavLink;
  href: string;
  children?: NavChild[];
}

const NAV_LINKS: NavItem[] = [
  { label: "Resume Builder", key: "resume-builder", href: "#" },
  {
    label: "Hunt Tracker",
    key: "hunt-tracker",
    href: "/hunt",
    children: [
      { label: "Hunt Tracker", key: "hunt-tracker", href: "/hunt" },
      { label: "Application Pipeline", key: "application-pipeline", href: "/application-pipeline" },
      { label: "Email Settings", key: "email-settings", href: "/email-settings" },
    ],
  },
];

interface NavBarProps {
  activeLink?: NavLink;
}

export default function NavBar({ activeLink }: NavBarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, key: string) => {
    setMenuAnchor(event.currentTarget);
    setOpenMenuKey(key);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setOpenMenuKey(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${borderLight}`,
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          px: { xs: 3, md: 4 },
          maxWidth: 1280,
          width: "100%",
          mx: "auto",
        }}
      >
        {/* Brand */}
        <Typography
          component="a"
          href="/"
          sx={{
            fontFamily: "Manrope, sans-serif",
            fontWeight: 900,
            fontSize: "1.2rem",
            color: onSurface,
            letterSpacing: "-0.03em",
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          Your Job Hunt
        </Typography>

        {/* Center links */}
        <Box
          component="nav"
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            justifyContent: "center",
            gap: 4,
          }}
        >
          {NAV_LINKS.map(({ label, key, href, children }) => {
            const isActive =
              activeLink === key || children?.some((c) => c.key === activeLink);

            if (children) {
              return (
                <Box key={key}>
                  <Typography
                    component="button"
                    onClick={(e) => handleMenuOpen(e, key)}
                    sx={{
                      color: isActive ? primary : onSurfaceVariant,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.9rem",
                      borderBottom: isActive ? `2px solid ${primary}` : "none",
                      pb: isActive ? 0.5 : 0,
                      "&:hover": { color: onSurface },
                      transition: "color 0.15s",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontFamily: "inherit",
                    }}
                  >
                    {label}
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16 }}
                    >
                      expand_more
                    </span>
                  </Typography>
                  <Menu
                    anchorEl={menuAnchor}
                    open={openMenuKey === key}
                    onClose={handleMenuClose}
                    slotProps={{
                      paper: {
                        elevation: 2,
                        sx: { borderRadius: 2, mt: 0.5, minWidth: 180 },
                      },
                    }}
                  >
                    {children.map((child) => (
                      <MenuItem
                        key={child.key}
                        component="a"
                        href={child.href}
                        onClick={handleMenuClose}
                        selected={activeLink === child.key}
                        sx={{ fontSize: "0.9rem" }}
                      >
                        {child.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              );
            }

            return (
              <Typography
                key={key}
                component="a"
                href={href}
                sx={{
                  color: isActive ? primary : onSurfaceVariant,
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.9rem",
                  borderBottom: isActive ? `2px solid ${primary}` : "none",
                  pb: isActive ? 0.5 : 0,
                  "&:hover": { color: onSurface },
                  transition: "color 0.15s",
                }}
              >
                {label}
              </Typography>
            );
          })}
        </Box>

        {/* Auth controls */}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={user.photoURL ?? undefined}
              alt={user.displayName ?? "User"}
              sx={{
                width: 36,
                height: 36,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {!user.photoURL &&
                (user.displayName?.[0] ?? user.email?.[0] ?? "U")}
            </Avatar>
            <Button
              onClick={signOut}
              sx={{
                fontWeight: 500,
                color: dark.textMuted,
              }}
            >
              Sign Out
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            onClick={() => navigate("/sign-in")}
            sx={{ px: 2.5, py: 1 }}
          >
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
