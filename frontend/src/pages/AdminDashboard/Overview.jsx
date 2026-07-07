import { useEffect, useState } from 'react';
import { FiUsers, FiBriefcase, FiShield, FiUserPlus, FiLogIn } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import CountUpValue from '../../components/common/CountUpValue';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>Admin Dashboard</h1></div>

      <div className="stat-grid stagger-children">
        <Card className="stat-card">
          <div className="stat-card-label"><FaRupeeSign size={14} /> Total Revenue</div>
          <div className="stat-card-value">
            <CountUpValue value={stats.totalRevenue} formatter={(n) => formatCurrency(n)} />
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiUsers size={14} /> Candidates</div>
          <div className="stat-card-value"><CountUpValue value={stats.totalCandidates} /></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiBriefcase size={14} /> Companies</div>
          <div className="stat-card-value"><CountUpValue value={stats.totalCompanies} /></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiShield size={14} /> Pending Verifications</div>
          <div className="stat-card-value"><CountUpValue value={stats.pendingVerifications} /></div>
        </Card>
      </div>

      <div className="stat-grid stagger-children" style={{ marginTop: 'var(--space-4)' }}>
        <Card className="stat-card">
          <div className="stat-card-label"><FiUserPlus size={14} /> New Registrations Today</div>
          <div className="stat-card-value"><CountUpValue value={stats.today.signups.total} /></div>
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
            {stats.today.signups.candidates} freelancers · {stats.today.signups.companies} companies
          </p>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiLogIn size={14} /> Logins Today</div>
          <div className="stat-card-value"><CountUpValue value={stats.today.logins.total} /></div>
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
            {stats.today.logins.candidates} freelancers · {stats.today.logins.companies} companies
          </p>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-label"><FiUsers size={14} /> Active Client-Freelancer Connections</div>
          <div className="stat-card-value"><CountUpValue value={stats.totalActiveUnlocks} /></div>
          <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
            Companies currently able to contact a freelancer directly
          </p>
        </Card>
      </div>

      <Card style={{ padding: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Unlock Payments</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Company</th><th>Candidate</th><th>Amount</th><th>Date</th></tr>
            </thead>
            <tbody>
              {stats.recentPayments.map((p) => (
                <tr key={p._id}>
                  <td>{p.companyId?.companyName}</td>
                  <td>{p.candidateId?.headline}</td>
                  <td>{formatCurrency(p.amount, p.currency)}</td>
                  <td>{formatDate(p.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
