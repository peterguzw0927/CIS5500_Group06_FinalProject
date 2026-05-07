import { AppBar, Container, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();

  return (
    <AppBar position='static' sx={{ background: '#0F172A', boxShadow: 'none', borderBottom: '1px solid #334155' }}>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <Typography 
            variant="h6" 
            fontWeight="800" 
            sx={{ flexGrow: 1, color: 'white', textDecoration: 'none', letterSpacing: 1 }} 
            component={Link} 
            to="/"
          >
            ✈️ STRANDED TRAVELER
          </Typography>
          <Box>
            <Button 
              component={Link} 
              to="/" 
              sx={{ 
                color: location.pathname === '/' ? '#38BDF8' : '#94A3B8', 
                fontWeight: 600, 
                mx: 1,
                '&:hover': { color: 'white' }
              }}
            >
              Standard Analytics
            </Button>
            <Button 
              component={Link} 
              to="/advanced" 
              variant={location.pathname === '/advanced' ? 'contained' : 'outlined'}
              color="primary"
              sx={{ 
                fontWeight: 600, 
                borderRadius: '20px', 
                borderWidth: '2px',
                ml: 2,
                '&:hover': { borderWidth: '2px' }
              }}
            >
              Deep Dive Analytics
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}