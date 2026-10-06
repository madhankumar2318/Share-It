import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  X,
  RotateCcw,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const QuickReborrowModal = ({ isOpen, onClose, request, onSuccess }) => {
  const toast = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (request) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

      setStartDate(tomorrowStr);
      setEndDate(dayAfterTomorrowStr);
      setMessage(`Hi ${request.ownerName || 'there'}, I'd love to borrow "${request.itemTitle}" again!`);
    }
  }, [request]);

  useEffect(() => {
    const fetchBookedRanges = async () => {
      if (!request?.itemId) return;
      try {
        const res = await api.get(`/requests/item/${request.itemId}/booked-ranges`);
        setBookedRanges(res.data || []);
      } catch (err) {
        console.warn('Could not load booked ranges', err);
      }
    };

    fetchBookedRanges();
  }, [request?.itemId]);

  const hasConflict = (start, end) => {
    if (!start || !end) return false;
    const reqStart = new Date(start);
    const reqEnd = new Date(end);

    return bookedRanges.some((range) => {
      const bStart = new Date(range.startDate);
      const bEnd = new Date(range.endDate);
      return reqStart <= bEnd && reqEnd >= bStart;
    });
  };

  const conflictDetected = hasConflict(startDate, endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Return date must be on or after pickup date.');
      return;
    }

    if (conflictDetected) {
      setError(
        'The selected dates overlap with an already confirmed booking by another neighbor. Please choose other dates.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/requests', {
        itemId: request.itemId,
        startDate,
        endDate,
        message,
      });

      toast.success(`🎉 Re-borrow request sent to ${request.ownerName}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit borrow request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                🔄 Borrow Again (1-Click Re-Request)
              </h3>
              <p className="text-[11px] text-white/80">
                Quickly re-borrow from <strong>{request.ownerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Card Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800">
            {request.itemImageUrl ? (
              <img
                src={request.itemImageUrl}
                alt={request.itemTitle}
                className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0">
                Item
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {request.itemCategory || 'Item'}
              </span>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {request.itemTitle}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-gray-400" />
                Lender: <strong>{request.ownerName}</strong>
              </p>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictDetected && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dates unavailable:</strong> Another neighbor has already booked this item for these dates. Please pick free dates.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Pickup Date
              </label>
              <input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Return Date
              </label>
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Already Booked Schedule Info */}
          {bookedRanges.length > 0 && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Already booked on:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bookedRanges.map((r, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-md font-mono text-[10px]"
                  >
                    {r.startDate} to {r.endDate}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Friendly Note to Lender */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Note to {request.ownerName}
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Need it again for Saturday lawn mowing!"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || conflictDetected}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {submitting ? 'Sending Request...' : 'Confirm Re-Borrow Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickReborrowModal;
