import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { blue, red } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import FlightsPage from './pages/FlightsPage';

// Update the theme to a travel-oriented color scheme
export const theme = createTheme({
  palette: {
    primary: blue,
    secondary: red,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/advanced" element={<FlightsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}