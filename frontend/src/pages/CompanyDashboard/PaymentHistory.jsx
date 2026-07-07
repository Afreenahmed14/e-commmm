import { useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCheckCircle } from 'react-icons/fi';
import { paymentService } from '../../services/paymentService';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import EngagementPanel from '../../components/common/EngagementPanel';
import ReviewForm from '../../components/common/ReviewForm';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './PaymentHistory.css';

export default function CompanyPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    paymentService.getHistory()
      .then((res) => setPayments(res.data.payments))
      .finally(() => setLoading(false));
  }, []);

  const handleEngagementSaved = (paymentId, unlock) => {
    setPayments((prev) => prev.map((p) => (p._id === paymentId ? { ...p, unlock } : p)));
  };

  const handleReviewSubmitted = (paymentId, review) => {
    setPayments((prev) => prev.map((p) => (p._id === paymentId ? { ...p, myReview: review } : p)));
  };

  if (loading) return <Loader label="Loading payment history…" />;

  return (
    <div>
      <div className="dashboard-header"><h1>Payment History</h1></div>

      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Your contact-unlock transactions will appear here." />
      ) : (
        <div className="payment-history-list">
          {payments.map((p) => {
            const isOpen = expandedId === p._id;
            return (
              <Card key={p._id} className="payment-history-card">
                <button
                  type="button"
                  className="payment-history-row"
                  onClick={() => setExpandedId(isOpen ? null : p._id)}
                >
                  <div className="payment-history-freelancer">
                    <strong>{p.candidateId?.headline || 'Freelancer'}</strong>
                    <span className="text-muted">₹{p.candidateId?.hourlyRate ?? '—'}/hr</span>
                  </div>
                  <div className="payment-history-amount">{formatCurrency(p.amount, p.currency)}</div>
                  <div className="text-muted">{formatDate(p.paymentDate)}</div>
                  <div className="text-muted payment-history-invoice">{p.invoiceNumber}</div>
                  <span className="payment-history-status">
                    <FiCheckCircle size={14} /> Paid
                  </span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {isOpen && (
                  <div className="payment-history-details">
                    {p.unlock ? (
                      <EngagementPanel
                        unlockId={p.unlock._id}
                        hourlyRate={p.candidateId?.hourlyRate}
                        initialStart={p.unlock.engagementStart}
                        initialEnd={p.unlock.engagementEnd}
                        onSaved={(unlock) => handleEngagementSaved(p._id, unlock)}
                      />
                    ) : (
                      <p className="text-muted">Engagement tracking isn't available for this unlock.</p>
                    )}
                    <ReviewForm
                      candidateId={p.candidateId?._id}
                      existingReview={p.myReview}
                      onSubmitted={(review) => handleReviewSubmitted(p._id, review)}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
