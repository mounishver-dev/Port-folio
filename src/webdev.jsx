import { useEffect, useRef, useState } from 'react'
import './webdev.css'
import SpiderScene from './SpiderScene'
import { webdevTools } from './data/portfolioData';

function Webdev() {
  const sectionRef   = useRef(null);
  const textRef      = useRef(null);
  const cardRef      = useRef(null);
  const spiderRef    = useRef(null);

  // Scroll progress (0–1) fed into SpiderScene for descent trigger
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect   = sectionRef.current.getBoundingClientRect();
      const winH   = window.innerHeight;

      // 0 = section just entered bottom of screen, 1 = section fully passed
      const progress = Math.max(0, Math.min(1,
        (winH - rect.top) / (winH + rect.height)
      ));

      setScrollProgress(progress);

      // Reveal text panel
      if (progress > 0.2) {
        textRef.current?.classList.add('visible');
        cardRef.current?.classList.add('visible');
      }

      // Reveal spider container
      if (progress > 0.1) {
        spiderRef.current?.classList.add('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="webdev-section" ref={sectionRef} id="webdev">

      {/* Atmospheric background glow */}
      <div className="webdev-glow" />

      {/* ── Left: 3D Spider Scene ── */}
      <div className="webdev-image spider-scene-wrapper" ref={spiderRef}>
        <SpiderScene scrollProgress={scrollProgress} />
      </div>

      {/* ── Right: Text ── */}
      <div className="webdev-text" ref={textRef}>
        <p className="section-label">What I do</p>
        <h2>I'm a</h2>
        <h1 className="heading-gradient">Web Developer</h1>

        <div className="webdevsub" ref={cardRef}>
          <p>
            I develop websites that are fast, organized, and visually
            appealing. Just like a spider's web, I build every section
            with care and precision — ensuring each connection strengthens
            the whole experience. My focus: clean, responsive, reliable.
          </p>
        </div>

        {/* Skills chips */}
        <div className="skills-chips">
          {webdevTools.map((s, i) => (
            <span key={s} className="chip" style={{ animationDelay: `${i * 0.08}s` }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Webdev
