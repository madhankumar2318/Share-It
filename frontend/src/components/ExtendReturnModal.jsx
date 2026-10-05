import React, { useState } from 'react';
import api from '../services/api';
import { Calendar, Clock, AlertCircle, CheckCircle2, X, RefreshCw } from 'lucide-react';

const ExtendReturnModal = ({ isOpen, onClose, request, onSuccess }) => {
  if (!isOpen || !request) return null;

  const currentEndDate = request.endDate; // "YYYY-MM-DD"
  
  // Quick options helper
  const calculateDate = (daysToAdd) => {
    const d = new Date(currentEndDate);
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(() => calculateDate(1));
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate days extended
  const getDaysDifference = (newDateStr) => {
    const cur = new Date(currentEndDate);
    const next = new Date(newDateStr);
    const diffTime = next - cur;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysExtended = getDaysDifference(selectedDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || selectedDate <= currentEndDate) {
      setError('Please select a date after your current return date.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/requests/${request.id}/extend`, {
        newEndDate: selectedDate,
        reason: reason.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to request date extension. Please check for conflicting dates.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Request Return Extension
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {request.itemTitle}
            </p>
          </div>
        </div>

        {/* Current Schedule Summary */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Owner:</span>
            <span className="font-bold text-gray-900 dark:text-white">{request.ownerName}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Current Return Date:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentEndDate}</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Extension Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Quick Extension Options:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((days) => {
                const targetDate = calculateDate(days);
                const isSelected = selectedDate === targetDate;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setSelectedDate(targetDate);
                      setError('');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition font-bold text-xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    +{days} {days === 1 ? 'Day' : 'Days'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>Proposed New Return Date:</span>
              {daysExtended > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  (+{daysExtended} {daysExtended === 1 ? 'day' : 'days'})
                </span>
              )}
            </label>
            <input
              type="date"
              min={calculateDate(1)}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError('');
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Reason / Message for {request.ownerName} (optional):
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Need 1 extra day to finish painting the shelves"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Date Conflict Shield Notice */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            🛡️ Date Conflict Shield verifies that no other neighbor has booked the item during your extension dates before notifying the lender.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDate}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
            >
              {loading ? 'Checking...' : 'Send Extension Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendReturnModal;
