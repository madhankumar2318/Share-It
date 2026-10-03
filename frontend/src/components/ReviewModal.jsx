import React, { useState } from 'react';
import api from '../services/api';
import { Star, X, CheckCircle2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, request, onReviewSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        requestId: request.id,
        rating,
        comment: comment.trim(),
      });
      setSuccess(true);
      if (onReviewSuccess) onReviewSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Leave a Review</h3>
            <p className="text-xs text-gray-500 mt-0.5">{request.itemTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-gray-800 text-base">Thank You!</h4>
            <p className="text-xs text-gray-500">Your feedback helps build trust in the community.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Star Selector */}
            <div className="space-y-1 text-center py-2">
              <label className="block text-xs font-semibold text-gray-600">Rate your experience</label>
              <div className="flex justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Your Feedback</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Was the item in good shape? How was communication with the lender?"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting Review...' : 'Post Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
