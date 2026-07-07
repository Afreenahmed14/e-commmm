import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { candidateService } from '../../services/candidateService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Shown once a candidate lands on their dashboard with no hourlyRate set —
 * which only happens after signing up via Google / Phone OTP / Email link,
 * since those flows create the account first and don't force this field up
 * front the way the classic register form does. Companies unlock a
 * freelancer's contact for a price equal to their hourly rate, so this is
 * the one field that genuinely can't stay empty.
 */
export default function HourlyRatePrompt({ open, onClose }) {
  const { refreshUser } = useAuth();
  const [hourlyRate, setHourlyRate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const parsed = Number(hourlyRate);
    if (!hourlyRate || Number.isNaN(parsed) || parsed < 0) {
      setError('Enter a valid hourly rate (₹0 or more).');
      return;
    }
    setSubmitting(true);
    try {
      await candidateService.updateMyProfile({ hourlyRate: parsed });
      await refreshUser();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your hourly rate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Set your hourly rate">
      <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
        You signed up without setting an hourly rate. This is the price a company
        pays to unlock your contact details, so let's get it set before you show
        up in search.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          label="Hourly Rate (₹)"
          type="number"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          error={error}
          autoFocus
        />
        <Button type="submit" fullWidth loading={submitting}>Save & Continue</Button>
      </form>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 'var(--space-3)',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        I'll do this later
      </button>
    </Modal>
  );
}
