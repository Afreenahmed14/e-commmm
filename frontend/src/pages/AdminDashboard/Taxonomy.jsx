import { useEffect, useState } from 'react';
import { FiTrash2, FiPlus, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { adminService } from '../../services/adminService';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';

export default function AdminTaxonomy() {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillName, setEditingSkillName] = useState('');

  const load = async () => {
    setLoading(true);
    const [catRes, skillRes] = await Promise.all([adminService.getCategories(), adminService.getSkills()]);
    setCategories(catRes.data.categories);
    setSkills(skillRes.data.skills);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await adminService.createCategory({ name: newCategory.trim() });
    setNewCategory('');
    load();
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    await adminService.createSkill({ name: newSkill.trim() });
    setNewSkill('');
    load();
  };

  const removeCategory = async (id) => {
    await adminService.deleteCategory(id);
    load();
  };

  const removeSkill = async (id) => {
    await adminService.deleteSkill(id);
    load();
  };

  const startEditCategory = (c) => {
    setEditingCategoryId(c._id);
    setEditingCategoryName(c.name);
  };

  const saveCategory = async () => {
    if (!editingCategoryName.trim()) return;
    await adminService.updateCategory(editingCategoryId, { name: editingCategoryName.trim() });
    setEditingCategoryId(null);
    load();
  };

  const startEditSkill = (s) => {
    setEditingSkillId(s._id);
    setEditingSkillName(s.name);
  };

  const saveSkill = async () => {
    if (!editingSkillName.trim()) return;
    await adminService.updateSkill(editingSkillId, { name: editingSkillName.trim() });
    setEditingSkillId(null);
    load();
  };

  if (loading) return <Loader label="Loading taxonomy…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>Categories &amp; Skills</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <Card style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Categories</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button className="btn btn-primary btn-sm" onClick={addCategory}><FiPlus /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {categories.map((c) => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                {editingCategoryId === c._id ? (
                  <>
                    <input
                      className="form-input"
                      style={{ flex: 1, marginRight: 'var(--space-2)' }}
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCategory()}
                      autoFocus
                    />
                    <button style={{ background: 'none', border: 'none', color: 'var(--color-success)' }} onClick={saveCategory}>
                      <FiCheck size={14} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }} onClick={() => setEditingCategoryId(null)}>
                      <FiX size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span>{c.name}</span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button style={{ background: 'none', border: 'none' }} onClick={() => startEditCategory(c)}>
                        <FiEdit2 size={14} />
                      </button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--color-danger)' }} onClick={() => removeCategory(c._id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Skills</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="New skill name"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            />
            <button className="btn btn-primary btn-sm" onClick={addSkill}><FiPlus /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {skills.map((s) => (
              editingSkillId === s._id ? (
                <span key={s._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <input
                    className="form-input"
                    style={{ width: 120 }}
                    value={editingSkillName}
                    onChange={(e) => setEditingSkillName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveSkill()}
                    autoFocus
                  />
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer' }} onClick={saveSkill}>
                    <FiCheck size={12} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setEditingSkillId(null)}>
                    <FiX size={12} />
                  </button>
                </span>
              ) : (
                <Badge key={s._id}>
                  {s.name}{' '}
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }} onClick={() => startEditSkill(s)}>
                    <FiEdit2 size={10} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2 }} onClick={() => removeSkill(s._id)}>
                    <FiTrash2 size={10} />
                  </button>
                </Badge>
              )
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
