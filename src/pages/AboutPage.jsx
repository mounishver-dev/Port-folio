import { useRef, useEffect } from 'react';
import { bio, education, experience, skillGroups, projects } from '../data/portfolioData';
import Connect from '../connect';
import './AboutPage.css';
import profileImg from '../assets/img2.png';
/* ── Scroll reveal hook ── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ── Resume content (auto-generated from portfolioData) ── */
function ResumeSection() {
  const ref = useReveal(0.05);

  const handlePrint = () => {
    const el = document.getElementById('resume-printable');
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${bio.name} — Resume</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', serif;
            color: #1a1a2e;
            background: #fff;
            font-size: 13px;
            line-height: 1.55;
            padding: 40px 48px;
            max-width: 800px;
            margin: 0 auto;
          }
          .r-name { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 2px; }
          .r-title { font-size: 13px; color: #6366f1; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.03em; }
          .r-contact { font-size: 11.5px; color: #555; display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
          .r-contact a { color: #6366f1; text-decoration: none; }
          .r-divider { border: none; border-top: 1.5px solid #e8e8f0; margin: 18px 0 14px; }
          .r-section-title { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #6366f1; font-weight: 700; margin-bottom: 10px; font-family: 'Arial', sans-serif; }
          .r-summary { font-size: 12.5px; color: #333; line-height: 1.65; margin-bottom: 4px; }
          .r-exp-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
          .r-role { font-weight: 700; font-size: 13px; }
          .r-company { font-size: 12px; color: #6366f1; }
          .r-period { font-size: 11px; color: #888; }
          .r-points { padding-left: 16px; margin-top: 4px; color: #333; }
          .r-points li { margin-bottom: 3px; font-size: 12px; }
          .r-proj-title { font-weight: 700; font-size: 12.5px; }
          .r-proj-tags { font-size: 10.5px; color: #888; margin-left: 8px; }
          .r-proj-desc { font-size: 11.5px; color: #444; margin-top: 2px; }
          .r-proj-link { font-size: 10.5px; color: #6366f1; margin-top: 1px; }
          .r-skill-group { margin-bottom: 6px; font-size: 12px; }
          .r-skill-cat { font-weight: 700; color: #1a1a2e; }
          .r-edu-row { display: flex; justify-content: space-between; align-items: baseline; }
          .r-deg { font-weight: 700; font-size: 13px; }
          .r-inst { font-size: 12px; color: #555; margin-top: 1px; }
          @media print { body { padding: 24px 32px; } }
        </style>
      </head>
      <body>
        <div class="r-name">${bio.name}</div>
        <div class="r-title">${bio.title}</div>
        <div class="r-contact">
          <span>📧 <a href="mailto:${bio.email}">${bio.email}</a></span>
          <span>📍 ${bio.location}</span>
          <span><a href="${bio.github}" target="_blank">GitHub</a></span>
          <span><a href="${bio.linkedin}" target="_blank">LinkedIn</a></span>
        </div>

        <hr class="r-divider" />
        <div class="r-section-title">Professional Summary</div>
        <p class="r-summary">${bio.summary}</p>

        <hr class="r-divider" />
        <div class="r-section-title">Experience</div>
        ${experience.map(exp => `
          <div style="margin-bottom:12px">
            <div class="r-exp-row">
              <span class="r-role">${exp.role}</span>
              <span class="r-period">${exp.period}</span>
            </div>
            <div class="r-company">${exp.company}</div>
            <ul class="r-points">
              ${exp.points.map(pt => `<li>${pt}</li>`).join('')}
            </ul>
          </div>
        `).join('')}

        <hr class="r-divider" />
        <div class="r-section-title">Key Projects</div>
        ${projects.filter(p => ['ironclad', 'portfolio', 'zarizenith', 'cybervault'].includes(p.id)).map(p => `
          <div style="margin-bottom:10px">
            <div>
              <span class="r-proj-title">${p.title}</span>
              <span class="r-proj-tags">${p.tags.join(' · ')}</span>
            </div>
            <div class="r-proj-desc">${p.desc}</div>
            ${p.live ? `<div class="r-proj-link">🔗 ${p.live}</div>` : ''}
            ${p.github ? `<div class="r-proj-link">⌥ ${p.github}</div>` : ''}
          </div>
        `).join('')}

        <hr class="r-divider" />
        <div class="r-section-title">Technical Skills</div>
        ${skillGroups.map(g => `
          <div class="r-skill-group">
            <span class="r-skill-cat">${g.category}:</span>
            ${g.items.join(', ')}
          </div>
        `).join('')}

        <hr class="r-divider" />
        <div class="r-section-title">Education</div>
        ${education.map(e => `
          <div>
            <div class="r-edu-row">
              <span class="r-deg">${e.degree}</span>
              <span class="r-period">${e.year}</span>
            </div>
            <div class="r-inst">${e.institution}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="resume-section reveal" ref={ref} id="resume">
      <div className="resume-header">
        <div>
          <p className="section-label">My Resume</p>
          <h2 className="resume-title heading-gradient">Resume</h2>
          <p className="resume-intro">
            Auto-generated from this portfolio. Update your projects or skills here and the resume stays in sync.
          </p>
        </div>
        <button className="btn-download" onClick={handlePrint} id="resume-download-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Resume preview card */}
      <div className="resume-card" id="resume-printable">
        {/* Name & contact */}
        <div className="rv-top">
          <div className="rv-name-block">
            <h3 className="rv-name">{bio.name}</h3>
            <p className="rv-role-line">{bio.title}</p>
          </div>
          <div className="rv-contact-row">
            <a href={`mailto:${bio.email}`} className="rv-contact-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" /></svg>
              {bio.email}
            </a>
            <span className="rv-contact-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              {bio.location}
            </span>
            <a href={bio.github} target="_blank" rel="noopener noreferrer" className="rv-contact-chip">
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              GitHub
            </a>
          </div>
        </div>

        <div className="rv-divider" />

        {/* Summary */}
        <div className="rv-block">
          <p className="rv-section-title">Summary</p>
          <p className="rv-body">{bio.summary}</p>
        </div>

        <div className="rv-divider" />

        {/* Experience */}
        <div className="rv-block">
          <p className="rv-section-title">Experience</p>
          {experience.map((exp, i) => (
            <div key={i} className="rv-exp-item">
              <div className="rv-exp-header">
                <div>
                  <p className="rv-exp-role">{exp.role}</p>
                  <p className="rv-exp-company">{exp.company}</p>
                </div>
                <span className="rv-period">{exp.period}</span>
              </div>
              <ul className="rv-points">
                {exp.points.map((pt, j) => <li key={j}>{pt}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="rv-divider" />

        {/* Key Projects */}
        <div className="rv-block">
          <p className="rv-section-title">Key Projects</p>
          <div className="rv-projects-grid">
            {projects.filter(p => ['ironclad', 'portfolio', 'zarizenith', 'cybervault'].includes(p.id)).map(p => (
              <div key={p.id} className="rv-proj-item" style={{ '--c': p.color }}>
                <div className="rv-proj-header">
                  <p className="rv-proj-name">{p.title}</p>
                  <div className="rv-proj-links">
                    {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="rv-micro-link">GitHub</a>}
                    {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" className="rv-micro-link live">Live</a>}
                  </div>
                </div>
                <p className="rv-proj-desc">{p.desc}</p>
                <div className="rv-proj-tags">
                  {p.tags.map(t => <span key={t} className="rv-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rv-divider" />

        {/* Skills */}
        <div className="rv-block">
          <p className="rv-section-title">Technical Skills</p>
          <div className="rv-skills-grid">
            {skillGroups.map(g => (
              <div key={g.category} className="rv-skill-row">
                <span className="rv-skill-cat">{g.category}</span>
                <span className="rv-skill-items">{g.items.join(' · ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rv-divider" />

        {/* Education */}
        <div className="rv-block">
          <p className="rv-section-title">Education</p>
          {education.map((ed, i) => (
            <div key={i} className="rv-exp-header">
              <div>
                <p className="rv-exp-role">{ed.degree}</p>
                <p className="rv-exp-company">{ed.institution}</p>
              </div>
              <span className="rv-period">{ed.year}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Skills section ── */
function AboutSkills() {
  const ref = useReveal(0.1);
  return (
    <div className="about-skills reveal" ref={ref}>
      <p className="section-label">What I know</p>
      <h2 className="heading-gradient about-section-h2">Skills</h2>
      <div className="about-skills-grid">
        {skillGroups.map((group) => (
          <div key={group.category} className="as-group">
            <p className="as-cat">{group.category}</p>
            <div className="as-items">
              {group.items.map(item => (
                <span key={item} className="as-chip">{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── About page ── */
export default function AboutPage() {
  const heroRef = useReveal(0.08);

  return (
    <div className="about-page page-enter">
      {/* Background */}
      <div className="about-bg-orb about-bg-orb-1" />
      <div className="about-bg-orb about-bg-orb-2" />
      <div className="about-grid-overlay" />

      {/* ── Bio hero ── */}
      <div className="about-hero reveal" ref={heroRef}>
        <div className="about-hero-text">
          <p className="section-label">Who I am</p>
          <h1 className="heading-gradient about-h1">About Me</h1>
          <p className="about-bio-text">{bio.summary}</p>

          <div className="about-stats">
            <div className="about-stat">
              <span className="stat-number">6+</span>
              <span className="stat-label">Projects Built</span>
            </div>
            <div className="about-stat">
              <span className="stat-number">3+</span>
              <span className="stat-label">Years Coding</span>
            </div>
            <div className="about-stat">
              <span className="stat-number">2</span>
              <span className="stat-label">Domains Mastered</span>
            </div>
          </div>

          <div className="about-tags">
            <span className="about-tag">Full-Stack Dev</span>
            <span className="about-tag">UI/UX Designer</span>
            <span className="about-tag">3D Creative</span>
            <span className="about-tag">Problem Solver</span>
          </div>
        </div>

        {/* Avatar / visual */}
        <div className="about-avatar-wrap">
          <div className="about-avatar">
            <img src={profileImg} alt="Mounishver S" className="avatar-image" />
            <div className="avatar-ring avatar-ring-1" />
            <div className="avatar-ring avatar-ring-2" />
          </div>
          <div className="about-available-badge">
            <span className="badge-dot" />
            Available for work
          </div>
        </div>
      </div>

      {/* ── Skills ── */}
      <AboutSkills />

      {/* ── Resume ── */}
      <ResumeSection />

      {/* ── Connect — at the bottom ── */}
      <div className="about-connect-wrap">
        <Connect />
      </div>
    </div>
  );
}
