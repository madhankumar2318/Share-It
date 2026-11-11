import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocationFilter } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import CreateWishlistModal from '../components/CreateWishlistModal';
import WishlistChatModal from '../components/WishlistChatModal';
import {
  Sparkles,
  Search,
  MapPin,
  PlusCircle,
  CheckCircle2,
  Trash2,
  HandHeart,
  Navigation,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
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
  const [searchParams, setSearchParams] = useSearchParams();
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

  // In-app Wishlist conversation states
  const [activeChat, setActiveChat] = useState(null);
  const [expandedOffersWishlistId, setExpandedOffersWishlistId] = useState(null);

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

  // Automatically open the private chat if navigated from a notification (/wishlist?chatOfferId=...)
  useEffect(() => {
    const chatOfferId = searchParams.get('chatOfferId');
    if (chatOfferId && wishlists.length > 0) {
      for (const req of wishlists) {
        const foundOffer = req.offers?.find((o) => String(o.id) === String(chatOfferId));
        if (foundOffer) {
          const isAuthor = user && user.id === req.userId;
          const otherParty = isAuthor ? foundOffer.lenderName : req.userName;
          setActiveChat({
            offer: foundOffer,
            wishlistTitle: req.title,
            wishlistLocation: req.location,
            otherPartyName: otherParty,
          });
          break;
        }
      }
    }
  }, [searchParams, wishlists, user]);

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
      const res = await api.post(`/wishlists/${wishlistId}/offers`, {
        message: offerMessage.trim() || 'I have this item available and can lend it to you!',
      });
      toast.success('Your offer was sent to the neighbor! Opening private chat... 🎉');
      setOfferingId(null);
      setOfferMessage('');
      fetchWishlists();

      // Open in-app chat modal directly with the requester
      const targetWishlist = wishlists.find((w) => w.id === wishlistId);
      if (res.data && targetWishlist) {
        setActiveChat({
          offer: res.data,
          wishlistTitle: targetWishlist.title,
          wishlistLocation: targetWishlist.location,
          otherPartyName: targetWishlist.userName,
        });
      }
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
            Post what you're looking for. Neighbors who own it can securely connect and offer to lend it.
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

                  {/* Title & Category & Location */}
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug">
                      {req.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold text-[11px]">
                        {req.category}
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{req.location || 'Local Community'}</span>
                      </div>
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
                        {/* Check if current user already offered to lend */}
                        {(() => {
                          const myOffer = req.offers?.find((o) => user && o.lenderId === user.id);
                          if (myOffer) {
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveChat({
                                    offer: myOffer,
                                    wishlistTitle: req.title,
                                    wishlistLocation: req.location,
                                    otherPartyName: req.userName,
                                  })
                                }
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center gap-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>You Offered to Lend • Chat with Requester</span>
                              </button>
                            );
                          }

                          return offeringId === req.id ? (
                            <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Private & Secure In-App Offer</span>
                              </div>
                              <textarea
                                rows={2}
                                value={offerMessage}
                                onChange={(e) => setOfferMessage(e.target.value)}
                                placeholder={`Hi ${req.userName}, I have this available near ${req.location || 'your area'} and can lend it!`}
                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-white outline-none resize-none focus:ring-1 focus:ring-emerald-500"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendInAppOffer(req.id)}
                                  disabled={submittingOffer}
                                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {submittingOffer ? 'Sending...' : 'Send Offer to Neighbor'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOfferingId(null)}
                                  className="py-2 px-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  toast.error('Please login to offer an item to your neighbor');
                                  navigate('/login');
                                  return;
                                }
                                setOfferingId(req.id);
                              }}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center gap-2"
                            >
                              <HandHeart className="w-4 h-4 text-emerald-100" />
                              <span>I Have This! Offer to Lend</span>
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-gray-400">
                        Request Fulfilled / Closed
                      </div>
                    )
                  ) : (
                    /* Author Controls & Offers View */
                    <div className="space-y-2">
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

                      {/* Author View of Neighbor Offers */}
                      {req.offers && req.offers.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOffersWishlistId((prev) => (prev === req.id ? null : req.id))
                            }
                            className="w-full py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-between"
                          >
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Neighbor Offers ({req.offers.length})</span>
                            </span>
                            {expandedOffersWishlistId === req.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {expandedOffersWishlistId === req.id && (
                            <div className="mt-2 space-y-2">
                              {req.offers.map((offer) => (
                                <div
                                  key={offer.id}
                                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2 text-left"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
                                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                                        {offer.lenderName ? offer.lenderName.charAt(0).toUpperCase() : 'N'}
                                      </div>
                                      <span>{offer.lenderName || 'Neighbor'}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                      {offer.createdAt
                                        ? new Date(offer.createdAt).toLocaleDateString()
                                        : 'Recently'}
                                    </span>
                                  </div>
                                  {offer.message && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                                      "{offer.message}"
                                    </p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveChat({
                                        offer,
                                        wishlistTitle: req.title,
                                        wishlistLocation: req.location,
                                        otherPartyName: offer.lenderName,
                                      })
                                    }
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Reply to {offer.lenderName} in Private Chat</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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

      {/* Private & Secure In-App Wishlist Conversation Modal */}
      <WishlistChatModal
        isOpen={Boolean(activeChat)}
        onClose={() => {
          setActiveChat(null);
          if (searchParams.get('chatOfferId')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('chatOfferId');
            setSearchParams(nextParams);
          }
        }}
        offer={activeChat?.offer}
        wishlistTitle={activeChat?.wishlistTitle}
        wishlistLocation={activeChat?.wishlistLocation}
        otherPartyName={activeChat?.otherPartyName}
      />
    </div>
  );
};

export default CommunityWishlist;
