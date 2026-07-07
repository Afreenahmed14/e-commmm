import { useEffect, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { candidateService } from '../../services/candidateService';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import EngagementPanel from '../../components/common/EngagementPanel';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Mirrors CompanyDashboard/PaymentHistory.jsx from the freelancer's side —
 * every company that currently has this freelancer's contact unlocked, with
 * the same editable engagement start/end dates, so both sides land on the
 * same hours x rate total.
 */
export default function CandidateEngagements() {
  const { user } = useAuth();
  const [unlocks, setUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateService.getMyUnlocks()
      .then((res) => setUnlocks(res.data.unlocks))
      .finally(() => setLoading(false));
  }, []);

  const handleEngagementSaved = (unlockId, updated) => {
    setUnlocks((prev) => prev.map((u) => (u._id === unlockId ? { ...u, ...updated } : u)));
  };

  if (loading) return <Loader label="Loading your engagements…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>My Engagements</h1></div>

      {unlocks.length === 0 ? (
        <EmptyState
          title="No engagements yet"
          description="Once a company unlocks your contact, they'll show up here — set the engagement dates so you can both calculate what you're owed."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {unlocks.map((u) => (
            <Card key={u._id} style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <strong>{u.companyId?.companyName || 'Company'}</strong>
                  <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    Unlocked {formatDate(u.unlockDate)}
                  </p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-success)' }}>
                  <FiCheckCircle size={14} /> {formatCurrency(u.paymentId?.amount || 0)} received
                </span>
              </div>

              <EngagementPanel
                unlockId={u._id}
                hourlyRate={user?.hourlyRate}
                initialStart={u.engagementStart}
                initialEnd={u.engagementEnd}
                onSaved={(unlock) => handleEngagementSaved(u._id, unlock)}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
