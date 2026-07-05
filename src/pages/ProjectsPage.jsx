import { useRef, useEffect, useState } from 'react';
import { projects } from '../data/portfolioData';
import {
  IconShield, IconGlobe, IconNetwork,
  IconDatabase, IconShoppingBag, IconMobile,
} from '../Icons';
import './ProjectsPage.css';

const iconMap = {
  ironclad: IconShield,
  portfolio: IconGlobe,
  firewall: IconNetwork,
  cybervault: IconDatabase,
  zarizenith: IconShoppingBag,
  softco: IconMobile,
};

const categories = ['All', 'Web', 'Mobile', 'Security'];

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

function ProjectCard({ project, index }) {
  const cardRef = useRef(null);
  const Icon = iconMap[project.id];

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouse = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
      card.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };

    const handleLeave = () => {
      card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0px)';
    };

    card.addEventListener('mousemove', handleMouse);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMouse);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div
      className="project-card-v2"
      ref={cardRef}
      style={{
        '--card-color': project.color,
        '--card-gradient': project.gradient,
        '--card-border': project.border,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Spotlight */}
      <div className="card-spotlight" />
      {/* Top accent */}
      <div className="card-top-line" />

      {/* Header row */}
      <div className="pc2-header">
        <div className="pc2-icon-wrap">
          {Icon && <Icon size={22} color={project.color} />}
        </div>
      </div>

      {/* Content */}
      <div className="pc2-body">
        <h3 className="pc2-title">{project.title}</h3>
        <p className="pc2-subtitle">{project.subtitle}</p>
        <p className="pc2-desc">{project.desc}</p>

        <div className="pc2-tags">
          {project.tags.map(tag => (
            <span key={tag} className="pc2-tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* Hover overlay with links */}
      <div className="pc2-links-overlay">
        <div className="pc2-links">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="pc2-link-btn"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="pc2-link-btn pc2-link-live"
            >
              <ExternalIcon />
              <span>Live Demo</span>
            </a>
          )}
          {!project.github && !project.live && (
            <span className="pc2-link-unavailable">Private Project</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const headingRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            headingRef.current?.classList.add('visible');
            gridRef.current?.classList.add('visible');
          }
        });
      },
      { threshold: 0.05 }
    );
    if (headingRef.current) observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, []);

  const filtered = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.category === activeFilter.toLowerCase());

  return (
    <section className="projects-page page-enter" id="projects">
      <div className="pp-bg-grid" aria-hidden="true" />
      <div className="pp-glow-left" aria-hidden="true" />
      <div className="pp-glow-right" aria-hidden="true" />

      <div className="pp-heading reveal" ref={headingRef}>
        <p className="section-label">Selected Work</p>
        <h1 className="heading-gradient">Projects</h1>
        <p className="pp-subtitle">
          Things I've built with purpose, precision, and a lot of late nights.
        </p>

        {/* Filter tabs */}
        <div className="pp-filters" role="tablist">
          {categories.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeFilter === cat}
              className={`pp-filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="pp-grid reveal" ref={gridRef}>
        {filtered.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
