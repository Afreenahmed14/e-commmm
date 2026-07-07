import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUpload } from 'react-icons/fi';
import { companyService } from '../../services/companyService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

export default function CompanyEditProfile() {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');

  const loadProfile = async () => {
    const res = await companyService.getMyProfile();
    setCompany(res.data.company);
    reset({
      companyName: res.data.company.companyName,
      website: res.data.company.website,
      industry: res.data.company.industry,
      description: res.data.company.description,
      gstNumber: res.data.company.gstNumber,
      contactPersonName: res.data.company.contactPerson?.name,
      contactPersonDesignation: res.data.company.contactPerson?.designation,
      contactPersonPhone: res.data.company.contactPerson?.phone,
      city: res.data.company.location?.city,
      country: res.data.company.location?.country,
    });
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    setSaving(true);
    setMessage('');
    try {
      await companyService.updateMyProfile({
        companyName: values.companyName,
        website: values.website,
        industry: values.industry,
        description: values.description,
        gstNumber: values.gstNumber,
        contactPerson: {
          name: values.contactPersonName,
          designation: values.contactPersonDesignation,
          phone: values.contactPersonPhone,
        },
        location: { city: values.city, country: values.country },
      });
      setMessage('Profile updated successfully.');
      await loadProfile();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      await companyService.uploadLogo(file);
      await loadProfile();
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <Loader label="Loading profile…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>Company Profile</h1></div>

      <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Logo</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img
            src={company?.logo || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (company?.companyName || 'C')}
            alt=""
            style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', objectFit: 'cover', background: 'var(--color-surface)' }}
          />
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <FiUpload /> {uploadingLogo ? 'Uploading…' : 'Change Logo'}
            <input type="file" accept="image/*" hidden onChange={handleLogoUpload} disabled={uploadingLogo} />
          </label>
        </div>
      </Card>

      <Card style={{ padding: 'var(--space-5)' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Company Name" register={register('companyName', { required: 'Required' })} error={errors.companyName?.message} />
          <Input label="Website" register={register('website')} placeholder="https://…" />
          <Input label="Industry" register={register('industry')} />

          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={4} {...register('description')} />
          </div>

          <Input label="GST Number" register={register('gstNumber')} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Contact Person Name" register={register('contactPersonName')} />
            <Input label="Designation" register={register('contactPersonDesignation')} />
          </div>
          <Input label="Contact Phone" register={register('contactPersonPhone')} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="City" register={register('city')} />
            <Input label="Country" register={register('country')} />
          </div>

          {message && <p style={{ marginBottom: 'var(--space-3)', color: message.includes('success') ? 'var(--color-primary)' : 'var(--color-danger)' }}>{message}</p>}

          <Button type="submit" loading={saving} disabled={!isDirty}>Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
