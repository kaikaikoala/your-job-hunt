import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import heroPng from '../assets/corp-man.png';
import NavBar from '../components/NavBar';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#F7F9FB', minHeight: '100vh' }}>
      <NavBar />

      {/* Page content */}
      <Box
        component="main"
        sx={{
          pt: '64px',
          px: { xs: 3, md: 6, lg: 12 },
          pb: 12,
          maxWidth: '88rem',
          mx: 'auto',
        }}
      >
        {/* Hero */}
        <Box sx={{ textAlign: 'center', pt: 10, pb: 8 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: { xs: '2.8rem', md: '4.5rem' },
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              mb: 3,
            }}
          >
            Master Your <br />
            <Box component="span" sx={{ color: '#607CEC' }}>
              Career Trajectory.
            </Box>
          </Typography>
          <Typography
            sx={{
              color: '#45464D',
              fontSize: '1.2rem',
              maxWidth: '42rem',
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Choose your path: Refine your professional story with AI or conquer
            the market with our premium hunt pipeline.
          </Typography>
        </Box>

        {/* Path cards */}
        <Grid container spacing={4}>
          {/* Card A: Refine & Tailor */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                bgcolor: 'white',
                border: '1px solid #f1f5f9',
                borderRadius: '12px',
                p: 5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.4s',
                '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
              }}
            >
              {/* Background icon */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  opacity: 0.04,
                  fontSize: '10rem',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '10rem' }}>
                  edit_note
                </span>
              </Box>

              <Box sx={{ flex: 1 }}>
                {/* Icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: '#EEF2FF',
                    color: '#607CEC',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '1.75rem', fontVariationSettings: '"wght" 600' }}
                  >
                    auto_fix_high
                  </span>
                </Box>

                <Typography
                  component="h2"
                  sx={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    color: '#0F172A',
                    mb: 2,
                  }}
                >
                  Refine &amp; Tailor
                </Typography>
                <Typography sx={{ color: '#45464D', fontSize: '1.05rem', lineHeight: 1.7, mb: 4 }}>
                  Editorial-grade resume refinement. Our AI aligns your experience to
                  specific roles with surgical precision.
                </Typography>

                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 6 }}>
                  {['AI-Driven Alignment', 'Editorial Polish'].map((item) => (
                    <Box
                      key={item}
                      component="li"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#334155', fontWeight: 500 }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#607CEC', fontSize: '1.2rem' }}>
                        check_circle
                      </span>
                      {item}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/sign-in')}
                sx={{
                  bgcolor: '#0F172A',
                  color: 'white',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  py: 1.75,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
                endIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                    arrow_forward
                  </span>
                }
              >
                Start Refinement
              </Button>
            </Box>
          </Grid>

          {/* Card B: Track & Conquer (high emphasis) */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                bgcolor: '#0F172A',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                p: 5,
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
                transition: 'box-shadow 0.4s',
                '&:hover': { boxShadow: '0 25px 50px rgba(96,124,236,0.15)' },
              }}
            >
              {/* Glow */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 256,
                  height: 256,
                  bgcolor: 'rgba(96,124,236,0.1)',
                  borderRadius: '50%',
                  filter: 'blur(48px)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ flex: 1, position: 'relative' }}>
                {/* Icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: '#607CEC',
                    color: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '1.75rem', fontVariationSettings: '"wght" 600' }}
                  >
                    query_stats
                  </span>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.75rem',
                      color: 'white',
                    }}
                  >
                    Track &amp; Conquer
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      bgcolor: 'rgba(96,124,236,0.2)',
                      color: '#a5b4fc',
                      fontSize: '0.625rem',
                      px: 1,
                      py: 0.25,
                      borderRadius: '999px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(96,124,236,0.3)',
                    }}
                  >
                    Primary
                  </Box>
                </Box>

                <Typography sx={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.7, mb: 4 }}>
                  Already have a resume? Jump straight into your hunt. Track applications,
                  interviews, and offers in one premium pipeline.
                </Typography>

                {/* Mini dashboard preview */}
                <Box
                  sx={{
                    bgcolor: 'rgba(30,41,59,0.5)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    p: 2.5,
                    mb: 6,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Box sx={{ height: 8, width: 32, bgcolor: '#607CEC', borderRadius: '999px' }} />
                    <Box sx={{ height: 8, width: 48, bgcolor: '#475569', borderRadius: '999px' }} />
                  </Box>
                  {[
                    { role: 'Senior Product Designer', stage: 'Interview', stageBg: 'rgba(74,222,128,0.1)', stageColor: '#4ade80' },
                    { role: 'Design Systems Lead', stage: 'Applied', stageBg: 'rgba(96,124,236,0.1)', stageColor: '#a5b4fc', dim: true },
                  ].map(({ role, stage, stageBg, stageColor, dim }) => (
                    <Box
                      key={role}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'rgba(2,6,23,0.5)',
                        border: '1px solid rgba(51,65,85,0.5)',
                        borderRadius: '4px',
                        mb: 1,
                        opacity: dim ? 0.6 : 1,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>
                        {role}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.625rem',
                          px: 1,
                          py: 0.25,
                          bgcolor: stageBg,
                          color: stageColor,
                          borderRadius: '4px',
                        }}
                      >
                        {stage}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/sign-in')}
                sx={{
                  bgcolor: '#607CEC',
                  color: 'white',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  py: 1.75,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 0 20px rgba(96,124,236,0.3)',
                  position: 'relative',
                  '&:hover': { bgcolor: '#7c93f0' },
                }}
                endIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                    dashboard
                  </span>
                }
              >
                Go to Hunt Tracker
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Social Proof / Features */}
        <Box
          component="section"
          sx={{
            mt: 12,
            bgcolor: '#f8fafc',
            border: '1px solid #f1f5f9',
            borderRadius: '16px',
            p: { xs: 6, md: 8 },
          }}
        >
          <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
            {/* Left: text */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.875rem',
                  color: '#0F172A',
                  mb: 5,
                  lineHeight: 1.2,
                }}
              >
                Designed for the{' '}
                <Box component="span" sx={{ color: '#607CEC' }}>
                  Discerning
                </Box>{' '}
                Professional
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  {
                    icon: 'filter_list',
                    title: 'ATS-Optimized Pipeline',
                    body: 'Ensure your applications pass through filters with our automated score analysis.',
                  },
                  {
                    icon: 'history_edu',
                    title: 'Editorial Precision',
                    body: 'Your professional summary, refined for human readers who care about narrative.',
                  },
                ].map(({ icon, title, body }) => (
                  <Box key={title} sx={{ display: 'flex', gap: 2.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: '#607CEC' }}>
                        {icon}
                      </span>
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                        {title}
                      </Typography>
                      <Typography sx={{ color: '#45464D', fontSize: '0.875rem', lineHeight: 1.7 }}>
                        {body}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Right: image */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                }}
              >
                <Box
                  component="img"
                  src={heroPng}
                  alt="Platform Preview"
                  sx={{ width: '100%', display: 'block', opacity: 0.9 }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.4) 0%, transparent 60%)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'white',
          borderTop: '1px solid #f1f5f9',
          py: 8,
          px: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            maxWidth: '88rem',
            mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              sx={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 900,
                fontSize: '1.2rem',
                color: '#0F172A',
                letterSpacing: '-0.03em',
                mb: 0.5,
              }}
            >
              The Digital Curator
            </Typography>
            <Typography sx={{ color: '#45464D', fontSize: '0.875rem' }}>
              © 2025 The Premium Job Hunting Experience.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 5 }}>
            {['Privacy', 'Terms', 'Contact'].map((label) => (
              <Typography
                key={label}
                component="a"
                href="#"
                sx={{
                  color: '#45464D',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  '&:hover': { color: '#607CEC' },
                  transition: 'color 0.15s',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
