import { useRef, useEffect, useState } from 'react';
import './skills.css';
import { IconMonitor, IconServer, IconPen } from './Icons';

const skillGroups = [
  {
    category: 'Frontend',
    Icon: IconMonitor,
    color: '#4f7cac',
    items: [
      { name: 'React', level: 90 },
      { name: 'JavaScript', level: 88 },
      { name: 'CSS / Tailwind', level: 92 },
      { name: 'Three.js', level: 75 },
    ],
  },
  {
    category: 'Backend',
    Icon: IconServer,
    color: '#c9a227',
    items: [
      { name: 'Node.js', level: 80 },
      { name: 'Python / FastAPI', level: 78 },
      { name: 'REST APIs', level: 85 },
      { name: 'Firebase', level: 76 },
    ],
  },
  {
    category: 'Design',
    Icon: IconPen,
    color: '#059669',
    items: [
      { name: 'Figma', level: 88 },
      { name: 'Photoshop', level: 82 },
      { name: 'Illustrator', level: 78 },
      { name: 'After Effects', level: 70 },
    ],
  },
];

function SkillBar({ name, level, color, delay }) {
  const [width, setWidth] = useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setWidth(level), delay * 1000);
        }
      },
      { threshold: 0.5 }
    );
    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, [level, delay]);

  return (
    <div className="skill-bar-wrapper" ref={barRef}>
      <div className="skill-bar-label">
        <span className="skill-name">{name}</span>
        <span className="skill-percent" style={{ color }}>{level}%</span>
      </div>
      <div className="skill-bar-track">
        <div
          className="skill-bar-fill"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

export default function Skills() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (headingRef.current) headingRef.current.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="skills-section" id="skills" ref={sectionRef}>
      <div className="skills-bg" />

      <div className="skills-heading" ref={headingRef}>
        <p className="section-label">My Arsenal</p>
        <h1>Skills</h1>
        <p className="skills-subtitle">Technologies I use to bring ideas to life.</p>
      </div>

      <div className="skills-groups">
        {skillGroups.map((group, gi) => (
          <div
            key={group.category}
            className="skill-group"
            style={{
              '--group-color': group.color,
              animationDelay: `${gi * 0.15}s`,
            }}
          >
            <div className="skill-group-header">
              <div className="skill-icon-wrap">
                <group.Icon size={20} color={group.color} />
              </div>
              <h3 style={{ color: group.color }}>{group.category}</h3>
            </div>

            {group.items.map((skill, si) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                level={skill.level}
                color={group.color}
                delay={gi * 0.2 + si * 0.1}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
