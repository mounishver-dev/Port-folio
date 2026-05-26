import { useState, useEffect, useRef } from 'react'
import bg from './assets/lamp.png'
import './App.css'
import Webdev from './webdev'
import Grap from './grap'
import Projects from './Projects'
import Skills from './Skills'
import Connect from './connect'

/* ─── Typing hook ─── */
function useTypingEffect(text, speed = 65, startDelay = 300) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    setDone(false);
    const timeout = setTimeout(() => {
      const id = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(id); setDone(true); }
      }, speed);
      return () => clearInterval(id);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

function App() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hasHover, setHasHover] = useState(false);

  const cardRef = useRef(null);
  const bgRef   = useRef(null);

  const { displayed: greeting, done: greetingDone } = useTypingEffect('Hi there, welcome', 70, 400);
  const { displayed: nameTyped } = useTypingEffect(
    greetingDone ? "I'm Mounishver S" : '',
    65,
    greetingDone ? 200 : 99999
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    setHasHover(mq.matches);

    const handleMouse = (e) => {
      setPos({ x: e.clientX, y: e.clientY });

      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width  / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        cardRef.current.style.transform =
          `rotateY(${dx * 7}deg) rotateX(${-dy * 5}deg)`;
      }
    };

    const resetTilt = () => {
      if (cardRef.current) cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    };

    const handleScroll = () => {
      if (bgRef.current)
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
    };

    if (mq.matches) window.addEventListener('mousemove', handleMouse);
    cardRef.current?.addEventListener('mouseleave', resetTilt);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

  return (
    <>
      {/* ══ Hero ══ */}
      <div className="hero-section">
        <img ref={bgRef} src={bg} className="background" alt="" aria-hidden="true" />

        {/* Cursor glow — warm gold */}
        {hasHover && (
          <div
            className="light"
            style={{
              background: `radial-gradient(circle 260px at ${pos.x}px ${pos.y}px,
                rgba(201,162,39,0.1),
                rgba(79,124,172,0.05) 55%,
                transparent 70%)`,
            }}
          />
        )}

        {/* Hero card */}
        <div className="hero-card">
          <div className="hero-glass" ref={cardRef}>
            <p className="hero-greeting">
              {greeting}
              <span className="cursor" />
            </p>

            <h1 className="hero-name">{nameTyped || '\u00A0'}</h1>

            <p className="hero-role">
              <span>Full-Stack Developer</span> &amp; <span>Graphic Designer</span>
            </p>

            <p className="hero-tagline">Code meets Creativity. I build experiences that connect.</p>

            <div className="hero-actions">
              <button
                className="btn-primary-hero"
                onClick={() => document.getElementById('connect').scrollIntoView({ behavior: 'smooth' })}
              >
                Let's Work Together
              </button>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={scrollDown} aria-label="Scroll down">
          <span>scroll</span>
          <div className="scroll-arrow" />
        </div>

        <p className="tap-hint">scroll to explore</p>
      </div>

      {/* ══ Sections ══ */}
      <Webdev />
      <Projects />
      <Grap />
      <Skills />
      <div style={{ backgroundColor: 'var(--color-bg)', paddingTop: '20px' }}>
        <Connect />
      </div>
    </>
  );
}

export default App
