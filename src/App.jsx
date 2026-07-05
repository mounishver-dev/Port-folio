import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import AboutPage from './pages/AboutPage';

/* Scroll to top on route change */
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppInner() {
  return (
    <>
      <ScrollReset />
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/about"   element={<AboutPage />} />
        {/* Catch-all → Home */}
        <Route path="*"        element={<Home />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </ThemeProvider>
  );
}
