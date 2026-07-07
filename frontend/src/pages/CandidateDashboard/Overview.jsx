import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiStar, FiEdit } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { candidateService } from '../../services/candidateService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import CountUpValue from '../../components/common/CountUpValue';

export default function CandidateOverview() {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateService.getMyProfile()
      .then((res) => setCandidate(res.data.candidate))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading your dashboard…" />;

  const profileComplete = Boolean(candidate?.headline && candidate?.about && candidate?.skills?.length);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Freelancer Dashboard</h1>
          <p className="text-muted" style={{ margin: 0 }}>Welcome back{candidate?.name ? `, ${candidate.name}` : ''}</p>
        </div>
        <Link to="/candidate/dashboard/profile"><Button size="sm"><FiEdit /> Edit Profile</Button></Link>
      </div>

      {!profileComplete && (
        <Card className="stat-card" style={{ marginBottom: 'var(--space-6)', borderLeft: '3px solid var(--color-warning)' }}>
          <p><strong>Your profile is incomplete.</strong> Complete your headline, about, and skills so companies can find you in search.</p>
        </Card>
      )}

      <div className="stat-grid stagger-children">
        <Card className="stat-card">
          <div className="stat-card-label"><FaRupeeSign size={14} /> Hourly Rate</div>
          <div className="stat-card-value">₹<CountUpValue value={candidate?.hourlyRate || 0} /></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiStar size={14} /> Rating</div>
          <div className="stat-card-value">{candidate?.rating || '—'} <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>({candidate?.reviewsCount || 0})</span></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiEye size={14} /> Visibility</div>
          <div className="stat-card-value" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>{candidate?.visibility}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label">Verification</div>
          <Badge variant={candidate?.verificationStatus === 'verified' ? 'success' : 'default'}>
            {candidate?.verificationStatus}
          </Badge>
        </Card>
      </div>

      <Card style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Profile Summary</h3>
        <p className="text-muted">{candidate?.headline || 'No headline yet — add one so companies know what you do.'}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          {(candidate?.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}
        </div>
      </Card>
    </div>
  );
}
