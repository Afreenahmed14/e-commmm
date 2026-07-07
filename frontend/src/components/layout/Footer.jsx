import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';
import logo from '../../assets/logo.png';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img src={logo} alt="HourlyRecruit Tech Labs" className="footer-logo" />
          <p className="text-muted">Hire skilled freelancers by the hour.</p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Platform</h4>
            <Link to="/browse">Browse Freelancers</Link>
            <Link to="/technologies">Technologies</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Get Started</Link>
          </div>
        </div>

        <div className="footer-social">
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub"><FiGithub /></a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FiLinkedin /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><FiTwitter /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="text-muted">© {year} HourlyRecruit. All rights reserved.</p>
      </div>
    </footer>
  );
}
