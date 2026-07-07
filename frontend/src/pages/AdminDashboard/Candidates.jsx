import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const VERIFICATION_VARIANT = { verified: 'success', pending: 'warning', rejected: 'danger', unverified: 'default' };

const emptyForm = { headline: '', hourlyRate: '', availability: 'full-time', verificationStatus: 'unverified' };

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // candidate object or null
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminService.getCandidates({ page, limit: 20 });
    setCandidates(res.data.candidates);
    setPagination(res.data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (candidate) => {
    setEditing(candidate);
    setForm({
      headline: candidate.headline || '',
      hourlyRate: candidate.hourlyRate ?? '',
      availability: candidate.availability || 'full-time',
      verificationStatus: candidate.verificationStatus || 'unverified',
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminService.updateCandidate(editing._id, {
        headline: form.headline,
        hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
        availability: form.availability,
        verificationStatus: form.verificationStatus,
      });
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (candidate) => {
    if (!window.confirm(`Permanently delete ${candidate.name}? This cannot be undone.`)) return;
    await adminService.deleteCandidate(candidate._id);
    load();
  };

  return (
    <div>
      <div className="dashboard-header"><h1>Candidates</h1></div>

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Headline</th><th>Rate</th><th>Rating</th><th>Verification</th><th></th></tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.headline || '—'}</td>
                    <td>{c.hourlyRate ? `₹${c.hourlyRate}/hr` : '—'}</td>
                    <td>{c.rating || '—'} ({c.reviewsCount})</td>
                    <td><Badge variant={VERIFICATION_VARIANT[c.verificationStatus]}>{c.verificationStatus}</Badge></td>
                    <td style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => remove(c)}>
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name || 'Candidate'}`}>
        <Input
          label="Headline"
          value={form.headline}
          onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
        />
        <Input
          label="Hourly Rate (₹)"
          type="number"
          value={form.hourlyRate}
          onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
        />
        <div className="form-field">
          <label className="form-label">Availability</label>
          <select
            className="form-select"
            value={form.availability}
            onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="not-available">Not available</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Verification Status</label>
          <select
            className="form-select"
            value={form.verificationStatus}
            onChange={(e) => setForm((f) => ({ ...f, verificationStatus: e.target.value }))}
          >
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <Button fullWidth loading={saving} onClick={saveEdit}>Save changes</Button>
      </Modal>
    </div>
  );
}
