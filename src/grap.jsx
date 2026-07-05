import { useEffect, useRef } from 'react'
import './grap.css'
import ModelScene from './ModelScene.jsx'
import { designTools } from './data/portfolioData';

function Grap() {
  const sectionRef = useRef(null);
  const modelRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (modelRef.current) modelRef.current.classList.add('visible');
            if (textRef.current) textRef.current.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="main-container" ref={sectionRef} id="universe">
      {/* Stars overlay */}
      <div className="stars-overlay" />

      {/* 3D model column */}
      <div className="model-column" ref={modelRef}>
        <ModelScene />
      </div>

      {/* Text column */}
      <div className="content-column" ref={textRef}>
        <p className="section-label">My craft</p>
        <h2>And Also a</h2>
        <h1 className="heading-gradient">Graphical Designer</h1>

        <div className="content">
          <p>
            I craft visually striking designs that blend creativity with
            precision. From branding to digital graphics, I focus on
            creating clean, modern visuals that tell a story and elevate
            the user experience. Bold ideas, smooth execution, and
            attention to every tiny detail — that's my design philosophy.
          </p>
        </div>

        <div className="design-tools">
          {designTools.map((tool, i) => (
            <span key={tool} className="tool-badge" style={{ animationDelay: `${i * 0.1}s` }}>
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Grap
