import { bio } from '../data/portfolioData';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-left">
          <p>&copy; {currentYear} {bio.name}. All rights reserved.</p>
        </div>
        
        <div className="footer-right">
          <ul className="social-links">
            <li>
              <a href={bio.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                GitHub
              </a>
            </li>
            <li>
              <a href={bio.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={`mailto:${bio.email}`} aria-label="Email">
                Email
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}