import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiStar, FiMapPin, FiGithub, FiLinkedin, FiLock, FiUnlock, FiMail, FiUser, FiExternalLink } from 'react-icons/fi';
import { candidateService } from '../../services/candidateService';
import { reviewService } from '../../services/reviewService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EngagementPanel from '../../components/common/EngagementPanel';
import ReviewForm from '../../components/common/ReviewForm';
import { formatDate } from '../../utils/formatters';
import { gsap, prefersReducedMotion } from '../../utils/gsapSetup';
import './CandidateDetails.css';

/** Lazily loads the Razorpay Checkout script once per page load. */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CandidateDetails() {
  const { id } = useParams();
  const { isAuthenticated, role, user } = useAuth();

  const [candidate, setCandidate] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const sidebarRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        candidateService.getById(id),
        reviewService.getForCandidate(id),
      ]);
      setCandidate(profileRes.data.candidate);
      setContactInfo(profileRes.data.contactInfo);
      setReviews(reviewsRes.data.reviews);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Entrance animation for the sticky unlock/checkout card, plus a subtle
  // continuous pulse on the price tag while the contact is still locked —
  // draws the eye to the primary CTA, ecommerce-style.
  useEffect(() => {
    if (prefersReducedMotion() || loading || !sidebarRef.current) return;

    gsap.fromTo(
      sidebarRef.current,
      { opacity: 0, x: 24 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 }
    );

    const priceEl = sidebarRef.current.querySelector('.unlock-price');
    let pulseTween;
    if (priceEl && !contactInfo) {
      pulseTween = gsap.to(priceEl, {
        scale: 1.05,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    return () => pulseTween && pulseTween.kill();
  }, [loading, contactInfo]);

  const handleUnlock = async () => {
    setUnlockError('');
    setUnlocking(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Could not load payment gateway. Check your connection.');

      const orderRes = await paymentService.createOrder(id);
      const { orderId, amount, currency, keyId } = orderRes.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'HourlyRecruit',
        description: 'Unlock freelancer contact details',
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#16a34a' },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await loadData(); // refresh to pull in the now-unlocked contactInfo
          } catch {
            setUnlockError('Payment succeeded but verification failed. Contact support if this persists.');
          }
        },
        modal: { ondismiss: () => setUnlocking(false) },
      });

      razorpay.on('payment.failed', () => {
        setUnlockError('Payment failed. Please try again.');
        setUnlocking(false);
      });

      razorpay.open();
    } catch (err) {
      setUnlockError(err.response?.data?.message || err.message || 'Could not start payment');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading profile…" />;
  if (!candidate) return <div className="container section"><p>Freelancer not found.</p></div>;

  const isCompany = isAuthenticated && role === 'company';

  const myReview = isCompany ? reviews.find((r) => r.companyId?._id === user?._id) : null;

  const handleReviewSubmitted = (review) => {
    setReviews((prev) => [{ ...review, companyId: { _id: user._id, companyName: user.companyName } }, ...prev]);
  };

  const handleEngagementSaved = (unlock) => {
    setContactInfo((prev) => (prev ? { ...prev, engagementStart: unlock.engagementStart, engagementEnd: unlock.engagementEnd } : prev));
  };

  return (
    <div className="container section candidate-details-page">
      <div className="details-layout">
        <div className="details-main">
          <Card className="details-header-card">
            <img
              src={candidate.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.headline || 'F'}`}
              alt=""
              className="details-avatar"
            />
            <div>
              <h1>{candidate.headline || 'Freelancer'}</h1>
              {candidate.location?.city && (
                <span className="details-location text-muted">
                  <FiMapPin size={14} /> {candidate.location.city}{candidate.location.country ? `, ${candidate.location.country}` : ''}
                  {candidate.location.remote && ' · Remote'}
                </span>
              )}
              <div className="details-rating">
                <FiStar /> {candidate.rating || '—'} ({candidate.reviewsCount} reviews)
                {candidate.verificationStatus === 'verified' && <Badge variant="success">Verified</Badge>}
              </div>
            </div>
            <div className="details-rate-box">
              <span className="details-rate">₹{candidate.hourlyRate}</span>
              <span className="text-muted">/hour</span>
            </div>
          </Card>

          <Card className="details-section">
            <h2>About</h2>
            <p>{candidate.about || 'No bio provided yet.'}</p>
          </Card>

          <Card className="details-section">
            <h2>Skills</h2>
            <div className="details-skills">
              {(candidate.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
          </Card>

          {candidate.portfolioLinks?.length > 0 && (
            <Card className="details-section">
              <h2>Portfolio</h2>
              <div className="portfolio-links">
                {candidate.portfolioLinks.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="portfolio-link">
                    <FiExternalLink size={14} />
                    <span>{link.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {candidate.projects?.length > 0 && (
            <Card className="details-section">
              <h2>Projects</h2>
              {candidate.projects.map((p, i) => (
                <div key={i} className="project-item">
                  <h4>{p.title}</h4>
                  <p className="text-muted">{p.description}</p>
                  {p.techStack?.length > 0 && (
                    <div className="details-skills">
                      {p.techStack.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {candidate.education?.length > 0 && (
            <Card className="details-section">
              <h2>Education</h2>
              {candidate.education.map((e, i) => (
                <div key={i} className="edu-item">
                  <strong>{e.degree}</strong>
                  <span className="text-muted"> — {e.institution} ({e.startYear}–{e.endYear || 'Present'})</span>
                </div>
              ))}
            </Card>
          )}

          <Card className="details-section">
            <h2>Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-muted">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="review-item">
                  <div className="review-header">
                    <strong>{r.companyId?.companyName || 'Company'}</strong>
                    <span className="review-stars"><FiStar size={14} /> {r.rating}</span>
                    <span className="text-muted review-date">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.review && <p>{r.review}</p>}
                </div>
              ))
            )}
          </Card>
        </div>

        <aside className="details-sidebar" ref={sidebarRef}>
          <Card className="unlock-card">
            {contactInfo ? (
              <>
                <div className="unlock-status unlocked"><FiUnlock /> Contact Unlocked</div>
                <div className="contact-detail"><FiUser /> {contactInfo.name}</div>
                <div className="contact-detail"><FiMail /> {contactInfo.email}</div>

                {isCompany && contactInfo.unlockId && (
                  <>
                    <EngagementPanel
                      unlockId={contactInfo.unlockId}
                      hourlyRate={candidate.hourlyRate}
                      initialStart={contactInfo.engagementStart}
                      initialEnd={contactInfo.engagementEnd}
                      onSaved={handleEngagementSaved}
                    />
                    <ReviewForm
                      candidateId={candidate._id}
                      existingReview={myReview}
                      onSubmitted={handleReviewSubmitted}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <div className="unlock-status locked"><FiLock /> Contact Locked</div>
                <p className="text-muted unlock-desc">
                  Unlock this freelancer's verified contact details — a one-time fee equal to their hourly rate.
                </p>
                <div className="unlock-price">₹{candidate.hourlyRate}</div>

                {unlockError && <div className="unlock-error">{unlockError}</div>}

                {isCompany ? (
                  <Button fullWidth loading={unlocking} onClick={handleUnlock}>
                    Unlock Contact
                  </Button>
                ) : isAuthenticated ? (
                  <p className="text-muted unlock-note">Only company accounts can unlock contacts.</p>
                ) : (
                  <p className="text-muted unlock-note">Log in as a company to unlock this contact.</p>
                )}
              </>
            )}
          </Card>

          {candidate.github && (
            <a href={candidate.github} target="_blank" rel="noreferrer" className="social-link">
              <FiGithub /> GitHub
            </a>
          )}
          {candidate.linkedin && (
            <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="social-link">
              <FiLinkedin /> LinkedIn
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
