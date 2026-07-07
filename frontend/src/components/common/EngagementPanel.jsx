import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { toDateTimeInputValue, hoursBetween } from '../../utils/formatters';
import './EngagementPanel.css';

/**
 * Editable "when did this engagement run" panel, shown after a contact is
 * unlocked. Either side (the company or the freelancer) can set these dates
 * — see paymentController.updateEngagement — so both land on the same
 * numbers when working out hours worked x hourly rate, without having to
 * compare notes off-platform.
 */
export default function EngagementPanel({ unlockId, hourlyRate, initialStart, initialEnd, onSaved }) {
  const [start, setStart] = useState(toDateTimeInputValue(initialStart));
  const [end, setEnd] = useState(toDateTimeInputValue(initialEnd));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const hours = hoursBetween(start, end);
  const estimatedTotal = hours !== null && hourlyRate ? Math.round(hours * hourlyRate) : null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await paymentService.updateEngagement(unlockId, {
        engagementStart: start ? new Date(start).toISOString() : null,
        engagementEnd: end ? new Date(end).toISOString() : null,
      });
      onSaved?.(res.data.unlock);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save engagement dates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="engagement-panel">
      <p className="engagement-panel-label">Engagement period</p>
      <div className="engagement-dates">
        <label className="engagement-field">
          <span>Start</span>
          <input type="datetime-local" value={start} onChange={(e) => { setStart(e.target.value); setSaved(false); }} />
        </label>
        <label className="engagement-field">
          <span>End</span>
          <input type="datetime-local" value={end} onChange={(e) => { setEnd(e.target.value); setSaved(false); }} />
        </label>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <p className="engagement-error">{error}</p>}
      {saved && !error && <p className="engagement-saved">Saved.</p>}

      {hours !== null && (
        <p className="engagement-summary">
          {hours}h · ₹{hourlyRate}/hr → <strong>≈ ₹{estimatedTotal}</strong> for this engagement
        </p>
      )}
    </div>
  );
}
