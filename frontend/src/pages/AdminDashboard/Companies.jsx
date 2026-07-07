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

const emptyForm = { companyName: '', industry: '', website: '', verificationStatus: 'unverified' };

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await adminService.getCompanies({ page, limit: 20 });
    setCompanies(res.data.companies);
    setPagination(res.data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (company) => {
    setEditing(company);
    setForm({
      companyName: company.companyName || '',
      industry: company.industry || '',
      website: company.website || '',
      verificationStatus: company.verificationStatus || 'unverified',
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminService.updateCompany(editing._id, {
        companyName: form.companyName,
        industry: form.industry,
        website: form.website,
        verificationStatus: form.verificationStatus,
      });
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (company) => {
    if (!window.confirm(`Permanently delete ${company.companyName}? This cannot be undone.`)) return;
    await adminService.deleteCompany(company._id);
    load();
  };

  return (
    <div>
      <div className="dashboard-header"><h1>Companies</h1></div>

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Company</th><th>Contact Email</th><th>Industry</th><th>Verification</th><th></th></tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c._id}>
                    <td>{c.companyName}</td>
                    <td>{c.email}</td>
                    <td>{c.industry || '—'}</td>
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

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.companyName || 'Company'}`}>
        <Input
          label="Company Name"
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
        />
        <Input
          label="Industry"
          value={form.industry}
          onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
        />
        <Input
          label="Website"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
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
