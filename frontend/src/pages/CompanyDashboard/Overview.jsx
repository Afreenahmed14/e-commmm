import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiBookmark, FiCreditCard, FiEdit } from 'react-icons/fi';
import { companyService } from '../../services/companyService';
import { paymentService } from '../../services/paymentService';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import CountUpValue from '../../components/common/CountUpValue';

export default function CompanyOverview() {
  const [company, setCompany] = useState(null);
  const [unlockCount, setUnlockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([companyService.getMyProfile(), paymentService.getHistory()])
      .then(([companyRes, paymentsRes]) => {
        setCompany(companyRes.data.company);
        setUnlockCount(paymentsRes.data.payments.length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading your dashboard…" />;

  return (
    <div>
      <div className="dashboard-header">
        <h1>Welcome, {company?.companyName}</h1>
        <Link to="/company/dashboard/profile"><Button size="sm"><FiEdit /> Edit Profile</Button></Link>
      </div>

      <div className="stat-grid stagger-children">
        <Card className="stat-card">
          <div className="stat-card-label"><FiCreditCard size={14} /> Contacts Unlocked</div>
          <div className="stat-card-value"><CountUpValue value={unlockCount} /></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiBookmark size={14} /> Bookmarked</div>
          <div className="stat-card-value"><CountUpValue value={company?.bookmarkedCandidates?.length || 0} /></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiBriefcase size={14} /> Verification</div>
          <div className="stat-card-value" style={{ fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
            {company?.verificationStatus}
          </div>
        </Card>
      </div>

      <Card style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Ready to find your next freelancer?</h3>
        <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
          Search and filter verified freelancers by skill, rate, and availability.
        </p>
        <Link to="/browse"><Button>Browse Freelancers</Button></Link>
      </Card>
    </div>
  );
}
