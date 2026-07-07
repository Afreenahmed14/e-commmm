import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const STATUS_VARIANT = { active: 'success', suspended: 'danger', pending: 'default', deleted: 'default' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await adminService.getUsers({ page, limit: 20, role: roleFilter || undefined });
    setUsers(res.data.users);
    setPagination(res.data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await adminService.updateUserStatus(user._id, newStatus);
    load();
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Users</h1>
        <select className="form-select" value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}>
          <option value="">All Roles</option>
          <option value="candidate">Candidate</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                    <td><Badge variant={STATUS_VARIANT[u.status] || 'default'}>{u.status}</Badge></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(u)}>
                          {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}
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
    </div>
  );
}
