import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiEye, FiCreditCard, FiPhone, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { SiReact, SiNodedotjs, SiMongodb, SiPython, SiDocker, SiFigma } from 'react-icons/si';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import CountUpValue from '../../components/common/CountUpValue';
import { statsService } from '../../services/statsService';
import { gsap, prefersReducedMotion } from '../../utils/gsapSetup';
import { useScrollReveal } from '../../utils/gsapHooks';
import './Home.css';

const STEPS = [
  { icon: FiSearch, title: 'Search Freelancers', desc: 'Filter by skill, rate, availability, location and more to find the right fit.' },
  { icon: FiEye, title: 'View Profile', desc: 'Review portfolios, experience, ratings, and verified credentials.' },
  { icon: FiCreditCard, title: 'Pay Platform', desc: 'A single, transparent unlock fee — no subscriptions, no hidden costs.' },
  { icon: FiPhone, title: 'Contact Directly', desc: 'Get verified contact details instantly and take the conversation outside the platform.' },
];

const BENEFITS = [
  'No project management overhead — you own the engagement',
  'Verified freelancer profiles with ratings and reviews',
  'Pay only for the contacts you actually want to unlock',
  'Transparent, one-time pricing per unlock',
];

const TEASER_TECH = [SiReact, SiNodedotjs, SiMongodb, SiPython, SiDocker, SiFigma];

export default function Home() {
  const heroRef = useRef(null);
  const stepsRef = useScrollReveal('.step-card');
  const benefitsRef = useScrollReveal('li');
  const techTeaserRef = useScrollReveal('.tech-teaser-icon');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsService.getPlatformStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  // Hero entrance: a GSAP timeline gives finer control than plain CSS —
  // the blobs drift in behind the text, then headline/subtitle/CTAs cascade
  // in with a slight overlap for a punchier first impression.
  useEffect(() => {
    if (prefersReducedMotion() || !heroRef.current) return;

    // See Technologies.jsx for why this uses gsap.context()+revert() rather
    // than a bare timeline+kill(): under React 18 StrictMode's double-mount
    // in development, killing a `.from()` timeline mid-tween leaves elements
    // frozen at their in-progress inline styles (e.g. opacity: 0), and the
    // next `.from()` call would capture that frozen state as its own target,
    // leaving the hero content invisible for good. `ctx.revert()` cleans up
    // fully so every mount starts from the real CSS state.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(heroRef.current.querySelectorAll('.hero-blob'), {
        opacity: 0,
        scale: 0.7,
        duration: 0.9,
      })
        .from(heroRef.current.querySelector('h1'), { opacity: 0, y: 24, duration: 0.6 }, '-=0.5')
        .from(heroRef.current.querySelector('.hero-subtitle'), { opacity: 0, y: 20, duration: 0.6 }, '-=0.35')
        .from(heroRef.current.querySelectorAll('.hero-actions .btn'), {
          opacity: 0,
          y: 16,
          duration: 0.5,
          stagger: 0.12,
        }, '-=0.3');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="home">
      <section className="hero" ref={heroRef}>
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="container hero-inner">
          <h1>Hire Skilled Freelancers <span className="hero-highlight">by the Hour</span></h1>
          <p className="hero-subtitle">
            Search verified freelancers, view their profiles, and unlock contact details
            instantly. No middleman, no project management — just direct access.
          </p>
          <div className="hero-actions">
            <Link to="/browse"><Button size="lg">Browse Freelancers</Button></Link>
            <Link to="/register"><Button size="lg" variant="outline">Join as a Freelancer</Button></Link>
          </div>
        </div>
      </section>

      {stats && (
        <section className="stats-bar">
          <div className="container stats-bar-inner">
            <div className="stat-pill">
              <div className="stat-pill-value"><CountUpValue value={stats.totalCandidates} />+</div>
              <div className="stat-pill-label">Verified Freelancers</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-value"><CountUpValue value={stats.totalCompanies} />+</div>
              <div className="stat-pill-label">Hiring Companies</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-value"><CountUpValue value={stats.totalUnlocks} />+</div>
              <div className="stat-pill-label">Contacts Unlocked</div>
            </div>
          </div>
        </section>
      )}

      <section className="container section">
        <h2 className="section-title text-center">How It Works</h2>
        <div className="steps-grid" ref={stepsRef}>
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Card key={title} hoverable className="step-card">
              <div className="step-number">{i + 1}</div>
              <Icon size={28} className="step-icon" />
              <h3>{title}</h3>
              <p className="text-muted">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section tech-teaser-section">
        <div className="container tech-teaser-inner">
          <div className="tech-teaser-icons" ref={techTeaserRef}>
            {TEASER_TECH.map((Icon, i) => (
              <div className="tech-teaser-icon" key={i}><Icon size={26} /></div>
            ))}
          </div>
          <h2 className="section-title">Every Skill, Organized Like a Tree</h2>
          <p className="text-muted tech-teaser-copy">
            From React to Kubernetes — explore our full technology tree and find
            freelancers by exactly the stack you need.
          </p>
          <Link to="/technologies" className="tech-teaser-link">
            Explore Technologies <FiArrowRight />
          </Link>
        </div>
      </section>

      <section className="section benefits-section">
        <div className="container benefits-inner">
          <div>
            <h2 className="section-title">Why Companies Choose HourlyRecruit</h2>
            <ul className="benefits-list" ref={benefitsRef}>
              {BENEFITS.map((b) => (
                <li key={b}><FiCheckCircle className="benefit-icon" /> {b}</li>
              ))}
            </ul>
            <Link to="/browse"><Button>Start Browsing</Button></Link>
          </div>
          <Card className="cta-card">
            <h3>Are you a freelancer?</h3>
            <p className="text-muted">
              Build your profile, showcase your work, and let companies come to you.
              You keep full control — HourlyRecruit never takes a cut of your rate.
            </p>
            <Link to="/register"><Button variant="secondary" fullWidth>Create Your Profile</Button></Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
