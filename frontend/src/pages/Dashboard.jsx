import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  PlusCircle,
  Calendar,
  Clock,
  User,
  Trash2,
  MessageSquare,
  Star,
} from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('lender'); // 'lender' | 'borrower'
  const [myItems, setMyItems] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myBorrowRequests, setMyBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [itemsRes, receivedRes, borrowedRes] = await Promise.all([
        api.get('/items/my-items'),
        api.get('/requests/received'),
        api.get('/requests/borrowed'),
      ]);
      setMyItems(itemsRes.data);
      setReceivedRequests(receivedRes.data);
      setMyBorrowRequests(borrowedRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.patch(`/requests/${requestId}/status`, { status });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/items/${itemId}`);
        fetchDashboardData();
      } catch (err) {
        alert('Failed to delete item');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pending Approval</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Accepted / Active</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Returned</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Community Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your items as a Lender and your requests as a Borrower
          </p>
        </div>
        <Link
          to="/add-item"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm text-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          List New Item
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('lender')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'lender'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Lender Hub
          <span className="ml-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
            {myItems.length} items / {receivedRequests.length} requests
          </span>
        </button>

        <button
          onClick={() => setActiveTab('borrower')}
          className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'borrower'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Borrower Hub
          <span className="ml-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
            {myBorrowRequests.length} requests
          </span>
        </button>
      </div>

      {/* Lender View */}
      {activeTab === 'lender' && (
        <div className="space-y-10">
          {/* Incoming Borrow Requests */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Incoming Requests For Your Items
            </h2>

            {receivedRequests.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-center text-gray-500 dark:text-gray-400 text-sm">
                No incoming borrow requests yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {receivedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white text-base">{req.itemTitle}</span>
                        {getStatusBadge(req.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          Borrower: {req.borrowerName} ({req.borrowerEmail})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          Period: {req.startDate} to {req.endDate}
                        </span>
                      </div>

                      {req.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                          "{req.message}"
                        </p>
                      )}
                    </div>

                    {/* Lender Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setSelectedChatRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                        title="Chat with Borrower"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Chat
                      </button>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 rounded-xl text-xs font-semibold transition border border-red-200 dark:border-red-900"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'RETURNED')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Confirm Item Returned
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Listed Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              My Listed Items
            </h2>

            {myItems.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-center text-gray-500 dark:text-gray-400 text-sm space-y-3">
                <p>You haven't listed any items yet.</p>
                <Link
                  to="/add-item"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  List Your First Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          item.imageUrl ||
                          'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'
                        }
                        alt={item.title}
                        className="w-20 h-20 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.category}</span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.title}</h4>
                        <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <Link
                        to={`/items/${item.id}`}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                      >
                        View Page
                      </Link>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Borrower View */}
      {activeTab === 'borrower' && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Your Borrow Requests
          </h2>

          {myBorrowRequests.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-center text-gray-500 dark:text-gray-400 text-sm space-y-3">
              <p>You haven't requested to borrow any items yet.</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myBorrowRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/items/${req.itemId}`}
                        className="font-bold text-gray-900 dark:text-white text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      >
                        {req.itemTitle}
                      </Link>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Owner: {req.ownerName} ({req.ownerEmail}
                        {req.ownerPhone ? ` | ${req.ownerPhone}` : ''})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Dates: {req.startDate} to {req.endDate}
                      </span>
                    </div>

                    {req.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                        Your message: "{req.message}"
                      </p>
                    )}
                  </div>

                  {/* Borrower Action Button */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setSelectedChatRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                      title="Chat with Owner"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Chat
                    </button>

                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'CANCELLED')}
                        className="px-3.5 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
                      >
                        Cancel Request
                      </button>
                    )}
                    {req.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'RETURNED')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Mark as Returned
                      </button>
                    )}
                    {req.status === 'RETURNED' && (
                      <button
                        onClick={() => setSelectedReviewRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold transition border border-amber-200 dark:border-amber-900"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Messaging Chat Modal */}
      <ChatModal
        isOpen={!!selectedChatRequest}
        onClose={() => setSelectedChatRequest(null)}
        request={selectedChatRequest}
      />

      {/* Review & Rating Modal */}
      <ReviewModal
        isOpen={!!selectedReviewRequest}
        onClose={() => setSelectedReviewRequest(null)}
        request={selectedReviewRequest}
        onReviewSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
