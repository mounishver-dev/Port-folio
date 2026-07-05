import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <NavLink to="/" className="nav-logo" onClick={() => window.scrollTo(0, 0)}>
           <span className="logo-brackets">&lt;</span>
  Mounishver
  <span className="logo-brackets">/&gt;</span>
          </NavLink>
          {/* Desktop links — right aligned */}
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/projects"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                About
              </NavLink>
            </li>
            <li>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  /* Sun icon */
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>
            </li>
          </ul>

          {/* Mobile: theme + hamburger */}
          <div className="nav-mobile-controls">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
            <button
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Scroll progress bar */}
        <div className="scroll-progress" style={{ width: `${progress}%` }} />
      </nav>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>Projects</NavLink></li>
          <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMenuOpen(false)}>About</NavLink></li>
        </ul>
      </div>
      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
