import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FirebaseAuthButtons from '../../components/auth/FirebaseAuthButtons';
import { ROLES } from '../../utils/constants';
import './Auth.css';

const DASHBOARD_PATH = {
  candidate: '/candidate/dashboard',
  company: '/company/dashboard',
};

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: ROLES.CANDIDATE },
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = watch('role');
  const hourlyRate = watch('hourlyRate');
  const companyName = watch('companyName');

  // Extra fields the backend needs only the first time this person signs in
  // via Firebase (account creation) — see firebaseAuthController.js. They
  // come straight from the same form fields shown above for this role, so
  // Google/Phone/Email-link sign-in reuses whatever the person already typed.
  const firebaseExtra =
    selectedRole === ROLES.CANDIDATE ? { hourlyRate } : { companyName };

  const handleFirebaseSuccess = (user) => {
    navigate(DASHBOARD_PATH[user.role] || '/', { replace: true });
  };

  const onSubmit = async (payload) => {
    setServerError('');
    setSubmitting(true);
    try {
      const user = await registerUser(selectedRole, payload);
      navigate(DASHBOARD_PATH[user.role] || '/', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>Create your account</h1>
        <p className="text-muted auth-subtitle">Join HourlyRecruit as a freelancer or a company</p>

        <div className="role-toggle">
          <label className={`role-option ${selectedRole === ROLES.CANDIDATE ? 'role-option-active' : ''}`}>
            <input type="radio" value={ROLES.CANDIDATE} {...register('role')} />
            I'm a Freelancer
          </label>
          <label className={`role-option ${selectedRole === ROLES.COMPANY ? 'role-option-active' : ''}`}>
            <input type="radio" value={ROLES.COMPANY} {...register('role')} />
            I'm a Company
          </label>
        </div>

        {serverError && <div className="auth-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={selectedRole === ROLES.COMPANY ? 'Contact Person Name' : 'Full Name'}
            error={errors.name?.message}
            register={register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })}
          />

          {selectedRole === ROLES.COMPANY && (
            <Input
              label="Company Name"
              error={errors.companyName?.message}
              register={register('companyName', { required: 'Company name is required' })}
            />
          )}

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            register={register('email', { required: 'Email is required' })}
          />

          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            register={register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: (v) => /\d/.test(v) || 'Password must contain at least one number',
            })}
          />

          {selectedRole === ROLES.CANDIDATE && (
            <Input
              label="Hourly Rate (₹)"
              type="number"
              min="0"
              error={errors.hourlyRate?.message}
              register={register('hourlyRate', { required: 'Hourly rate is required', min: { value: 0, message: 'Must be positive' } })}
            />
          )}

          <Button type="submit" fullWidth loading={submitting}>Create Account</Button>
        </form>

        <FirebaseAuthButtons
          role={selectedRole}
          extra={firebaseExtra}
          onSuccess={handleFirebaseSuccess}
          onError={setServerError}
        />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
