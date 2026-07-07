import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiShield } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FirebaseAuthButtons from '../../components/auth/FirebaseAuthButtons';
import './Auth.css';

/**
 * Admin login — deliberately not linked from the public navbar, footer, or
 * the candidate/company login pages. Reached only by knowing the URL.
 * Calls POST /auth/admin/login against the separate Admin collection.
 */
export default function LoginAdmin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (payload) => {
    setServerError('');
    setSubmitting(true);
    try {
      await login('admin', payload);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page-admin">
      <Card className="auth-card auth-card-accent-admin">
        <div className="auth-role-icon auth-role-icon-admin"><FiShield size={22} /></div>
        <h1>Admin Login</h1>
        <p className="text-muted auth-subtitle">Restricted access — administrators only.</p>

        {serverError && <div className="auth-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
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
            register={register('password', { required: 'Password is required' })}
          />
          <Button type="submit" fullWidth loading={submitting}>Log In</Button>
        </form>

        <FirebaseAuthButtons
          role="admin"
          allowCreate={false}
          onSuccess={() => navigate('/admin/dashboard', { replace: true })}
          onError={setServerError}
        />
      </Card>
    </div>
  );
}
