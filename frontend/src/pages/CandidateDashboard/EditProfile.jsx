import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUpload, FiFileText } from 'react-icons/fi';
import { candidateService } from '../../services/candidateService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { AVAILABILITY_OPTIONS } from '../../utils/constants';

/** Converts a comma-separated string field to/from an array for simple list editing. */
const toCsv = (arr) => (arr || []).join(', ');
const fromCsv = (str) => (str || '').split(',').map((s) => s.trim()).filter(Boolean);

export default function CandidateEditProfile() {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadProfile = async () => {
    const res = await candidateService.getMyProfile();
    setCandidate(res.data.candidate);
    reset({
      headline: res.data.candidate.headline,
      about: res.data.candidate.about,
      experience: res.data.candidate.experience,
      hourlyRate: res.data.candidate.hourlyRate,
      availability: res.data.candidate.availability,
      skills: toCsv(res.data.candidate.skills),
      languages: toCsv(res.data.candidate.languages),
      portfolioLinks: toCsv(res.data.candidate.portfolioLinks),
      github: res.data.candidate.github,
      linkedin: res.data.candidate.linkedin,
      visibility: res.data.candidate.visibility,
      city: res.data.candidate.location?.city,
      country: res.data.candidate.location?.country,
      remote: res.data.candidate.location?.remote,
    });
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    setSaving(true);
    setMessage('');
    try {
      await candidateService.updateMyProfile({
        headline: values.headline,
        about: values.about,
        experience: Number(values.experience) || 0,
        hourlyRate: Number(values.hourlyRate) || 0,
        availability: values.availability,
        skills: fromCsv(values.skills),
        languages: fromCsv(values.languages),
        portfolioLinks: fromCsv(values.portfolioLinks),
        github: values.github,
        linkedin: values.linkedin,
        visibility: values.visibility,
        location: {
          city: values.city,
          country: values.country,
          remote: Boolean(values.remote),
        },
      });
      setMessage('Profile updated successfully.');
      await loadProfile();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await candidateService.uploadResume(file);
      await loadProfile();
    } finally {
      setUploadingResume(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      await candidateService.uploadImage(file);
      await loadProfile();
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <Loader label="Loading profile…" />;

  return (
    <div>
      <div className="dashboard-header">
        <h1>My Profile</h1>
      </div>

      <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Photo &amp; Resume</h3>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img
              src={candidate?.profileImage || 'https://api.dicebear.com/7.x/initials/svg?seed=U'}
              alt=""
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: 'var(--color-surface)' }}
            />
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <FiUpload /> {uploadingImage ? 'Uploading…' : 'Change Photo'}
              <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {candidate?.resume ? (
              <a href={candidate.resume} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                <FiFileText /> View Resume
              </a>
            ) : (
              <span className="text-muted">No resume uploaded</span>
            )}
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <FiUpload /> {uploadingResume ? 'Uploading…' : 'Upload Resume'}
              <input type="file" accept=".pdf" hidden onChange={handleResumeUpload} disabled={uploadingResume} />
            </label>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 'var(--space-5)' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input label="Headline" register={register('headline')} error={errors.headline?.message} placeholder="e.g. Full-Stack MERN Developer" />

          <div className="form-field">
            <label className="form-label">About</label>
            <textarea className="form-textarea" rows={4} {...register('about')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="Hourly Rate (₹)" type="number" register={register('hourlyRate')} />
            <Input label="Experience (years)" type="number" register={register('experience')} />
          </div>

          <div className="form-field">
            <label className="form-label">Availability</label>
            <select className="form-select" {...register('availability')}>
              {AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <Input label="Skills (comma-separated)" register={register('skills')} placeholder="React, Node.js, MongoDB" />
          <Input label="Languages (comma-separated)" register={register('languages')} placeholder="English, Hindi" />
          <Input label="Portfolio Links (comma-separated)" register={register('portfolioLinks')} />
          <Input label="GitHub URL" register={register('github')} />
          <Input label="LinkedIn URL" register={register('linkedin')} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input label="City" register={register('city')} />
            <Input label="Country" register={register('country')} />
          </div>

          <div className="form-field">
            <label className="form-label">
              <input type="checkbox" {...register('remote')} /> Available for remote work
            </label>
          </div>

          <div className="form-field">
            <label className="form-label">Profile Visibility</label>
            <select className="form-select" {...register('visibility')}>
              <option value="public">Public — visible in search</option>
              <option value="private">Private — hidden from search</option>
            </select>
          </div>

          {message && <p style={{ marginBottom: 'var(--space-3)', color: message.includes('success') ? 'var(--color-primary)' : 'var(--color-danger)' }}>{message}</p>}

          <Button type="submit" loading={saving} disabled={!isDirty}>Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
