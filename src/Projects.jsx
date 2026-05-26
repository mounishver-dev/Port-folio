import { useRef, useEffect } from 'react';
import './projects.css';
import {
  IconShield, IconGlobe, IconNetwork,
  IconDatabase, IconShoppingBag, IconMobile, IconArrow
} from './Icons';

const projects = [
  {
    id: 'ironclad',
    title: 'IronClad AI',
    subtitle: 'Digital Asset Protection System',
    desc: 'AI-powered system that detects unauthorized image usage using perceptual hashing and CNN embeddings. Built with FastAPI backend, React frontend, and Firebase for real-time tracking.',
    tags: ['Python', 'FastAPI', 'React', 'MobileNet', 'Firebase'],
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(79,70,229,0.04))',
    border: 'rgba(79,70,229,0.3)',
    Icon: IconShield,
    link: '#',
  },
  {
    id: 'portfolio',
    title: 'Portfolio 3D',
    subtitle: 'This Very Site',
    desc: 'Cinematic 3D portfolio built with React and Three.js featuring custom scroll animations, glassmorphism UI, bloom post-processing, and an interactive spider scene.',
    tags: ['React', 'Three.js', 'GSAP', 'Vite', 'CSS'],
    color: '#0d9488',
    gradient: 'linear-gradient(135deg, rgba(13,148,136,0.18), rgba(13,148,136,0.04))',
    border: 'rgba(13,148,136,0.3)',
    Icon: IconGlobe,
    link: '#',
  },
  {
    id: 'firewall',
    title: 'Honeypot Firewall',
    subtitle: 'Blockchain-Based Network Security',
    desc: 'Python-built security system combining honeypot traps with blockchain-based audit logs. Detects intrusions, logs attacker behavior immutably, and triggers automated response protocols.',
    tags: ['Python', 'Blockchain', 'Networking', 'Cryptography'],
    color: '#64748b',
    gradient: 'linear-gradient(135deg, rgba(100,116,139,0.18), rgba(100,116,139,0.04))',
    border: 'rgba(100,116,139,0.3)',
    Icon: IconNetwork,
    link: '#',
  },
  {
    id: 'cybervault',
    title: 'Cyber Vault',
    subtitle: 'Decentralized Digital Asset Protection',
    desc: 'MERN stack web app that lets users protect digital assets without intermediaries. End-to-end encrypted storage, zero-knowledge proofs, and decentralized access control.',
    tags: ['MongoDB', 'Express', 'React', 'Node.js', 'Encryption'],
    color: '#059669',
    gradient: 'linear-gradient(135deg, rgba(5,150,105,0.18), rgba(5,150,105,0.04))',
    border: 'rgba(5,150,105,0.3)',
    Icon: IconDatabase,
    link: '#',
  },
  {
    id: 'zarizenith',
    title: 'Zari Zenith',
    subtitle: 'Apparel E-Commerce Platform',
    desc: 'Full-featured e-commerce platform for apparel built end-to-end with .NET and C#. Includes custom UI/UX design, RESTful APIs built with ASP.NET Core, and a complete order management system.',
    tags: ['.NET', 'C#', 'ASP.NET Core', 'REST API', 'UI/UX'],
    color: '#b45309',
    gradient: 'linear-gradient(135deg, rgba(180,83,9,0.18), rgba(180,83,9,0.04))',
    border: 'rgba(180,83,9,0.3)',
    Icon: IconShoppingBag,
    link: '#',
  },
  {
    id: 'softco',
    title: 'SoftCo Platform',
    subtitle: 'Software Company Mobile App',
    desc: 'Cross-platform React Native app for a software company with Razorpay payment integration. Features service listings, project inquiry forms, and a client dashboard with real-time status.',
    tags: ['React Native', 'Razorpay', 'Node.js', 'REST API'],
    color: '#be185d',
    gradient: 'linear-gradient(135deg, rgba(190,24,93,0.18), rgba(190,24,93,0.04))',
    border: 'rgba(190,24,93,0.3)',
    Icon: IconMobile,
    link: '#',
  },
];

function ProjectCard({ project, index }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouse = (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 7}deg) translateY(-5px)`;
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

  const { Icon } = project;

  return (
    <div
      className="project-card"
      ref={cardRef}
      style={{
        '--card-color': project.color,
        '--card-gradient': project.gradient,
        '--card-border': project.border,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Mouse spotlight */}
      <div className="card-glow" />
      {/* Top accent */}
      <div className="card-accent-line" />

      {/* SVG icon */}
      <div className="project-icon-wrap">
        <Icon size={26} color={project.color} />
      </div>

      <div className="project-content">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-subtitle">{project.subtitle}</p>
        <p className="project-desc">{project.desc}</p>

        <div className="project-tags">
          {project.tags.map(tag => (
            <span key={tag} className="project-tag">{tag}</span>
          ))}
        </div>
      </div>

    </div>
  );
}

export default function Projects() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (headingRef.current) headingRef.current.classList.add('visible');
            if (cardsRef.current) cardsRef.current.classList.add('visible');
          }
        });
      },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="projects-section" id="projects" ref={sectionRef}>
      <div className="projects-bg-grid" />
      <div className="projects-glow-left" />
      <div className="projects-glow-right" />

      <div className="projects-heading" ref={headingRef}>
        <p className="section-label">Selected Work</p>
        <h1>Projects</h1>
        <p className="projects-subtitle">
          Things I've built with purpose, precision, and a lot of late nights.
        </p>
      </div>

      <div className="projects-grid" ref={cardsRef}>
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
