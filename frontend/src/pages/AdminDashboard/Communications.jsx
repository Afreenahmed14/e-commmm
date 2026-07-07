import { useEffect, useState } from 'react';
import { FiMail, FiPhone } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';

/**
 * Every ContactUnlock record — the moment a company's HR pays to reveal a
 * freelancer's direct contact details. This is the admin's audit trail of
 * which clients are directly connected with which registered freelancers,
 * when the connection happened, and what engagement (if any) each side has
 * logged against it.
 */
export default function AdminCommunications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminService.getCommunications({ status: status || undefined, page, limit: 20 })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div>
      <div className="dashboard-header">
        <h1>Client ↔ Freelancer Communications</h1>
        <select
          className="form-select"
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      <p className="text-muted" style={{ marginTop: '-8px', marginBottom: 'var(--space-4)' }}>
        Every company (HR) that has unlocked a freelancer's direct contact details.
      </p>

      {loading ? (
        <Loader label="Loading communications…" />
      ) : data.communications.length === 0 ? (
        <EmptyState
          title="No connections yet"
          description="Once a company unlocks a freelancer's contact details, the connection will show up here."
        />
      ) : (
        <Card style={{ padding: 'var(--space-5)' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company (HR)</th>
                  <th>Freelancer</th>
                  <th>Contact revealed</th>
                  <th>Unlocked</th>
                  <th>Engagement</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.communications.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.companyId?.companyName || 'Company'}</strong>
                      {c.companyId?.contactPerson?.name && (
                        <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                          {c.companyId.contactPerson.name}
                          {c.companyId.contactPerson.designation ? ` · ${c.companyId.contactPerson.designation}` : ''}
                        </p>
                      )}
                    </td>
                    <td>
                      <strong>{c.candidateId?.name || 'Freelancer'}</strong>
                      {c.candidateId?.headline && (
                        <p className="text-muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                          {c.candidateId.headline}
                        </p>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 'var(--font-size-sm)' }}>
                        {c.candidateId?.email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FiMail size={12} /> {c.candidateId.email}
                          </span>
                        )}
                        {c.companyId?.contactPerson?.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FiPhone size={12} /> {c.companyId.contactPerson.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span title={formatDate(c.unlockDate)}>{formatRelativeTime(c.unlockDate)}</span>
                    </td>
                    <td>
                      {c.engagementStart
                        ? `${formatDate(c.engagementStart)} → ${c.engagementEnd ? formatDate(c.engagementEnd) : 'ongoing'}`
                        : <span className="text-muted">Not set</span>}
                    </td>
                    <td>{formatCurrency(c.paymentId?.amount || 0)}</td>
                    <td>
                      <Badge variant={c.status === 'active' ? 'success' : 'default'}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
