import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async ({ password }) => {
    setServerError('');
    setSubmitting(true);
    try {
      await authService.resetPassword({ token, password });
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1>Reset your password</h1>
        <p className="text-muted auth-subtitle">Choose a new password for your account.</p>

        {!token && <div className="auth-error">This reset link is missing its token. Please request a new one.</div>}
        {serverError && <div className="auth-error">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="New Password"
            type="password"
            error={errors.password?.message}
            register={register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: (v) => /\d/.test(v) || 'Password must contain at least one number',
            })}
          />
          <Button type="submit" fullWidth loading={submitting} disabled={!token}>Reset Password</Button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}
