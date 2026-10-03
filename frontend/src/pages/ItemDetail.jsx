import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, User, Phone, Mail, ArrowLeft, CheckCircle2, AlertCircle, Star } from 'lucide-react';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookedRanges, setBookedRanges] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

  // Request form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    const fetchItemAndDetails = async () => {
      try {
        const [itemRes, rangesRes, reviewsRes, statsRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/requests/item/${id}/booked-ranges`),
          api.get(`/reviews/item/${id}`),
          api.get(`/reviews/item/${id}/stats`),
        ]);
        setItem(itemRes.data);
        setBookedRanges(rangesRes.data || []);
        setReviews(reviewsRes.data || []);
        setStats(statsRes.data || { averageRating: 0, totalReviews: 0 });
      } catch (err) {
        setError('Item not found or unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchItemAndDetails();
  }, [id]);

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/requests', {
        itemId: item.id,
        startDate,
        endDate,
        message,
      });
      setRequestSuccess(true);
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to submit borrow request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading item details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 font-semibold">{error || 'Item not found'}</p>
        <Link to="/" className="mt-4 inline-block text-emerald-600 font-medium">
          &larr; Back to catalog
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.ownerId;
  const isAvailable = item.status === 'AVAILABLE';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Items
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
        {/* Left: Image & Tags */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square border border-gray-100">
            <img
              src={
                item.imageUrl ||
                'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'
              }
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {item.category}
            </div>
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>

          {/* Owner Info Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Listed By Owner</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {item.ownerName ? item.ownerName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{item.ownerName}</p>
                <p className="text-xs text-gray-500">{item.ownerEmail}</p>
              </div>
            </div>
            {item.ownerPhone && (
              <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {item.ownerPhone}
              </p>
            )}
          </div>
        </div>

        {/* Right: Details & Request Form */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{item.title}</h1>
              {stats.totalReviews > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex-shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-amber-900 text-sm">{stats.averageRating}</span>
                  <span className="text-xs text-amber-700">({stats.totalReviews})</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {item.location || 'Community Hub'}
              </span>
            </div>

            <div className="border-t border-b border-gray-100 py-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Item Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {item.description || 'No detailed description provided by the owner.'}
              </p>
            </div>
          </div>

          {/* Borrow Request Section */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200">
            {isOwner ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">You listed this item!</p>
                <p className="text-xs text-gray-500">
                  Track incoming borrow requests from your lender dashboard.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : requestSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-gray-800 text-base">Request Submitted!</h4>
                <p className="text-xs text-gray-600">
                  The owner ({item.ownerName}) has been notified. You can track this request on your dashboard.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  View My Requests
                </Link>
              </div>
            ) : !isAvailable ? (
              <div className="text-center py-4 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-gray-800 text-sm">Item is currently borrowed</h4>
                <p className="text-xs text-gray-500">
                  This item is not available right now. Please check back later or explore other listings.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBorrowSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Request to Borrow
                </h3>

                {bookedRanges.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <span>⚠️ Reserved Dates:</span>
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                      {bookedRanges.map((r, i) => (
                        <li key={i}>
                          Booked from <span className="font-semibold">{r.startDate}</span> to <span className="font-semibold">{r.endDate}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-amber-700 italic pt-1">
                      Please select dates outside these reserved ranges.
                    </p>
                  </div>
                )}

                {requestError && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {requestError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      min={startDate || new Date().toISOString().split('T')[0]}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Message to Owner (optional)</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi! I need this for a weekend project. I will return it in pristine condition."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Sending Request...' : 'Send Borrow Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Community Reviews Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <h3 className="font-extrabold text-gray-900 text-lg">Community Reviews</h3>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {stats.totalReviews}
            </span>
          </div>
          {stats.totalReviews > 0 && (
            <div className="text-sm font-semibold text-gray-700">
              Average: <span className="text-amber-600 font-bold">{stats.averageRating} / 5.0</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs space-y-1">
            <p className="font-medium text-gray-500">No reviews yet for this item</p>
            <p>Borrow this item and be the first to leave a review once returned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {rev.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-800 text-xs">{rev.reviewerName}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                )}
                <p className="text-[10px] text-gray-400">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;
