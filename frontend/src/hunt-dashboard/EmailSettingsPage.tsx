import { Box, Typography } from "@mui/material";
import NavBar from "../shared/NavBar";
import Footer from "../shared/Footer";
import { surface, onSurface } from "../colors";

export default function EmailSettingsPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: surface }}>
      <NavBar />
      <Box component="main" sx={{ pt: "64px", px: 4, pb: 4, maxWidth: 1280, mx: "auto" }}>
        <Typography variant="h4" sx={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, color: onSurface, mt: 4 }}>
          Hello world
        </Typography>
      </Box>
      <Footer />
    </Box>
  );
}
