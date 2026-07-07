import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { reviewService } from '../../services/reviewService';
import './ReviewForm.css';

/**
 * Inline star-rating + text review, submitted directly from wherever the
 * company already sees the unlocked contact (CandidateDetails / payment
 * history) — no separate "leave a review" page to navigate to. Only one
 * review per (company, candidate) pair is allowed server-side, so this
 * renders a "already reviewed" summary instead once `existingReview` is set.
 */
export default function ReviewForm({ candidateId, existingReview, onSubmitted }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(existingReview?.review || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (existingReview) {
    return (
      <div className="review-form review-form-done">
        <p className="review-form-label">Your review</p>
        <div className="review-form-stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <FiStar key={n} size={16} fill={n <= existingReview.rating ? 'currentColor' : 'none'} />
          ))}
        </div>
        {existingReview.review && <p className="text-muted">{existingReview.review}</p>}
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await reviewService.create({ candidateId, rating, review: text });
      onSubmitted?.(res.data.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <p className="review-form-label">Leave a review</p>
      <div className="review-form-stars review-form-stars-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className="review-star-btn"
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <FiStar size={20} fill={n <= (hoverRating || rating) ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea
        className="review-form-textarea"
        placeholder="How was working with this freelancer? (optional)"
        value={text}
        maxLength={1000}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <p className="engagement-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
