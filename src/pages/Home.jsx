import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webdev from '../webdev';
import Grap from '../grap';
import './Home.css';

/* ── Typing hook ── */
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

/* ── Aurora canvas background ── */
function AuroraBackground() {
  return (
    <div className="aurora-wrap" aria-hidden="true">
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
    </div>
  );
}

export default function Home() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hasHover, setHasHover] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const { displayed: greeting, done: greetingDone } = useTypingEffect('Hi there, welcome', 70, 500);
 const { displayed: nameTyped } = useTypingEffect(
    greetingDone ? "I'm Mounishver\u00A0S" : '',
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
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        cardRef.current.style.transform = `rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg)`;
      }
    };

    const resetTilt = () => {
      if (cardRef.current) cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    };

    if (mq.matches) window.addEventListener('mousemove', handleMouse);
    cardRef.current?.addEventListener('mouseleave', resetTilt);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const scrollDown = () => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

  return (
    <div className="home-root page-enter">
      {/* ══ Hero ══ */}
      <div className="hero-section">
        <AuroraBackground />

        {/* Cursor glow */}
        {hasHover && (
          <div
            className="cursor-glow"
            style={{
              background: `radial-gradient(circle 300px at ${pos.x}px ${pos.y}px,
                rgba(99,102,241,0.09),
                transparent 65%)`,
            }}
          />
        )}

        {/* Dot grid */}
        <div className="hero-grid" aria-hidden="true" />

        {/* Hero card */}
        <div className="hero-card">
          <div className="hero-glass" ref={cardRef}>
            {/* Top accent line */}
            <div className="hero-glass-accent" />

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
                id="hero-projects-btn"
                className="btn-primary-hero"
                onClick={() => navigate('/projects')}
              >
                View Projects
              </button>
              <button
                id="hero-about-btn"
                className="btn-outline-hero"
                onClick={() => navigate('/about')}
              >
                About Me
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" onClick={scrollDown} aria-label="Scroll down">
          <span>scroll</span>
          <div className="scroll-arrow" />
        </div>

        <p className="tap-hint">tap to explore</p>
      </div>

      {/* ══ Sections ══ */}
      <Webdev />
      <Grap />
    </div>
  );
}
