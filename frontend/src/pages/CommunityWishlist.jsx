import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocationFilter } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import CreateWishlistModal from '../components/CreateWishlistModal';
import WhatsAppButton from '../components/WhatsAppButton';
import {
  Sparkles,
  Search,
  MapPin,
  Clock,
  User,
  PlusCircle,
  CheckCircle2,
  Trash2,
  HandHeart,
  Navigation,
  MessageSquare,
  AlertCircle,
  Tag,
  Loader2,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electronics',
  'Tools & DIY',
  'Outdoors & Camping',
  'Home & Kitchen',
  'Books & Study',
  'Sports & Fitness',
  'Party & Games',
];

const CommunityWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedLocation, setIsModalOpen: openLocationModal, clearLocation } = useLocationFilter();
  const navigate = useNavigate();
  const toast = useToast();

  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // In-app quick offer states
  const [offeringId, setOfferingId] = useState(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const fetchWishlists = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedLocation && selectedLocation.type !== 'ALL' && selectedLocation.value) {
        params.location = selectedLocation.value;
      }
      const response = await api.get('/wishlists', { params });
      setWishlists(response.data);
    } catch (err) {
      console.error('Failed to load wishlist requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlists();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWishlists();
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      toast.warning('Please log in to post an item request.');
      navigate('/login');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/wishlists/${id}/status`, { status: newStatus });
      toast.success('Request status updated!');
      fetchWishlists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this community request?')) {
      try {
        await api.delete(`/wishlists/${id}`);
        toast.success('Request deleted.');
        fetchWishlists();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete request');
      }
    }
  };

  const handleSendInAppOffer = async (wishlistId) => {
    if (!isAuthenticated) {
      toast.warning('Please log in to offer lending an item.');
      navigate('/login');
      return;
    }
    setSubmittingOffer(true);
    try {
      await api.post(`/wishlists/${wishlistId}/offers`, {
        message: offerMessage.trim() || 'I have this item available and can lend it to you!',
      });
      toast.success('Your offer was sent to the neighbor successfully! 🎉');
      setOfferingId(null);
      setOfferMessage('');
      fetchWishlists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const text = urgency || 'Flexible';
    if (text.includes('Today') || text.includes('Urgently')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          {text}
        </span>
      );
    }
    if (text.includes('Weekend')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          {text}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        {text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white p-6 sm:p-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Wishlist &bull; Reverse Lending</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight">
            Need an item that isn't listed? <br />
            Ask your neighbors!
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base">
            Post what you're looking for. Neighbors who own it can 1-click connect on WhatsApp or offer to lend it.
          </p>
          <div className="pt-2">
            <button
              onClick={handleCreateClick}
              className="px-6 py-3 bg-white text-emerald-800 font-bold rounded-2xl shadow-md hover:bg-emerald-50 transition text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Post What You Need</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search, Categories & Location Bar */}
      <div className="space-y-3 sm:space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requested items (projector, tent, drill, monitor...)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-xs transition text-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 sm:hidden" />
            <span>Search</span>
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Location Status Bar */}
        {selectedLocation?.type !== 'ALL' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="leading-snug">
                Showing neighbor requests near <strong className="font-bold underline decoration-emerald-500">{selectedLocation.label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => openLocationModal(true)}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Change
              </button>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <button
                type="button"
                onClick={clearLocation}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Show All India
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Showing community requests across all of India.</span>
            </div>
            <button
              type="button"
              onClick={() => openLocationModal(true)}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-end sm:self-auto"
            >
              📍 Filter by my neighborhood
            </button>
          </div>
        )}
      </div>

      {/* Wishlist Requests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 border border-gray-100 dark:border-slate-800">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : wishlists.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 p-8 space-y-3">
          <HandHeart className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            No open requests right now {selectedLocation?.type !== 'ALL' ? `in ${selectedLocation.label}` : ''}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Need a tool, camera, game, or gear for an event? Post your request and neighbors who have it will respond!
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleCreateClick}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm w-full sm:w-auto"
            >
              Post a Request Now
            </button>
            {selectedLocation?.type !== 'ALL' && (
              <button
                onClick={clearLocation}
                className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition w-full sm:w-auto"
              >
                View Nationwide Requests
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlists.map((req) => {
            const isAuthor = user && user.id === req.userId;
            const isOpen = req.status === 'OPEN';

            // Pre-filled WhatsApp message for neighbor offering to lend
            const whatsAppMessage = `Hi ${req.userName}! I saw your request on Share-It for "${req.title}". I have this available in ${req.location || 'the area'} and can lend it to you! Are you still looking?`;
            const whatsAppUrl = req.userPhone
              ? `https://wa.me/${req.userPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsAppMessage)}`
              : null;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  {/* Top Bar: Requester & Urgency */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        {req.userName ? req.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {req.userName}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                    {getUrgencyBadge(req.urgency)}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">
                      {req.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium text-[11px]">
                        {req.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{req.location || 'Local Area'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {req.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100 dark:border-slate-800 leading-relaxed">
                      "{req.description}"
                    </p>
                  )}

                  {/* Offers Count */}
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                    <HandHeart className="w-4 h-4" />
                    <span>
                      {req.offersCount === 0
                        ? 'Be the first to offer this!'
                        : `${req.offersCount} neighbor${req.offersCount > 1 ? 's' : ''} offered to lend`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
                  {!isAuthor ? (
                    isOpen ? (
                      <div className="space-y-2">
                        {/* 1-Click WhatsApp Button to lend */}
                        {req.userPhone && (
                          <WhatsAppButton
                            href={whatsAppUrl}
                            recipientName={req.userName}
                            label="I Have This! Lend via WhatsApp"
                            className="w-full justify-center"
                            size="md"
                          />
                        )}

                        {/* In-app offer toggle */}
                        {offeringId === req.id ? (
                          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700">
                            <textarea
                              rows={2}
                              value={offerMessage}
                              onChange={(e) => setOfferMessage(e.target.value)}
                              placeholder="E.g. I have a Canon 1500D with 18-55mm lens available this weekend!"
                              className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-white outline-none resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendInAppOffer(req.id)}
                                disabled={submittingOffer}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition"
                              >
                                {submittingOffer ? 'Sending...' : 'Send In-App Offer'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setOfferingId(null)}
                                className="py-1.5 px-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setOfferingId(req.id)}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Offer via In-App Message</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-gray-400">
                        Request Fulfilled / Closed
                      </div>
                    )
                  ) : (
                    /* Author Controls */
                    <div className="flex items-center justify-between gap-2">
                      {isOpen ? (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(req.id, 'FULFILLED')}
                          className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark as Fulfilled</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Fulfilled
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(req.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Wishlist Modal */}
      <CreateWishlistModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchWishlists}
      />
    </div>
  );
};

export default CommunityWishlist;
