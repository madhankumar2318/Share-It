import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlusCircle,
  Calendar,
  Clock,
  User,
  Trash2,
  MessageSquare,
  Star,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Send,
} from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';
import { useAuth } from '../context/AuthContext';
import WhatsAppButton from '../components/WhatsAppButton';
import TrustBadge from '../components/TrustBadge';
import { buildTransactionWhatsAppUrl, buildReturnPingWhatsAppUrl, getDueDateStatus } from '../utils/whatsapp';

/** Color-coded due-date countdown badge shown on ACCEPTED requests */
const DueDateBadge = ({ endDate }) => {
  const status = getDueDateStatus(endDate);
  if (!status) return null;

  const colorMap = {
    green: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    red: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
  };
  const iconMap = {
    green: <Clock className="w-3 h-3" />,
    amber: <AlertTriangle className="w-3 h-3" />,
    red: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorMap[status.color]}`}
    >
      {iconMap[status.color]}
      {status.label}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lender'); // 'lender' | 'borrower'
  const [myItems, setMyItems] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myBorrowRequests, setMyBorrowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);

  // In-App Screen PIN verification states
  const [pinInputs, setPinInputs] = useState({});
  const [returnPinInputs, setReturnPinInputs] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyingReturnId, setVerifyingReturnId] = useState(null);

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

  const handlePinChange = (requestId, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setPinInputs((prev) => ({ ...prev, [requestId]: clean }));
  };

  const handleReturnPinChange = (requestId, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    setReturnPinInputs((prev) => ({ ...prev, [requestId]: clean }));
  };

  const handleVerifyPickup = async (requestId) => {
    const pin = pinInputs[requestId];
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }
    setVerifyingId(requestId);
    try {
      await api.post(`/requests/${requestId}/verify-pickup`, { otp: pin });
      setPinInputs((prev) => ({ ...prev, [requestId]: '' }));
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid Pickup PIN. Please check with borrower.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyReturn = async (requestId) => {
    const pin = returnPinInputs[requestId];
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }
    setVerifyingReturnId(requestId);
    try {
      await api.post(`/requests/${requestId}/verify-return`, { otp: pin });
      setReturnPinInputs((prev) => ({ ...prev, [requestId]: '' }));
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid Return PIN. Please check with borrower.');
    } finally {
      setVerifyingReturnId(null);
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

  const getStatusBadge = (status, handoverAt) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">Pending Approval</span>;
      case 'ACCEPTED':
        if (handoverAt) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              In Use (Handed Over)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved (Awaiting Pickup)
          </span>
        );
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300">Rejected</span>;
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Returned & Verified
          </span>
        );
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300">{status}</span>;
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 dark:text-gray-400">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Community Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your items as a Lender and your requests as a Borrower
          </p>
        </div>
        <Link
          to="/add-item"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs text-sm transition w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          List New Item
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-4 sm:gap-8 overflow-x-auto scrollbar-none pb-0.5">
        <button
          onClick={() => setActiveTab('lender')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 whitespace-nowrap flex-shrink-0 transition ${
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
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 whitespace-nowrap flex-shrink-0 transition ${
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
        <div className="space-y-8 sm:space-y-10">
          {/* Incoming Borrow Requests */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
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
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-bold text-gray-900 dark:text-white text-base">{req.itemTitle}</span>
                        {getStatusBadge(req.status, req.handoverAt)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          Borrower: {req.borrowerName} ({req.borrowerEmail})
                        </span>
                        {req.borrowerTrust && (
                          <TrustBadge trust={req.borrowerTrust} />
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          Period: {req.startDate} to {req.endDate}
                        </span>
                      </div>

                      {/* Due Date Countdown Badge — only for active borrows */}
                      {req.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-2">
                          <DueDateBadge endDate={req.endDate} />
                        </div>
                      )}

                      {/* Conflict Shield Warning for Pending Requests if overlapping with an accepted booking */}
                      {req.status === 'PENDING' && (() => {
                        const conflictingBooking = receivedRequests.find(
                          (other) =>
                            other.id !== req.id &&
                            other.itemId === req.itemId &&
                            other.status === 'ACCEPTED' &&
                            other.startDate <= req.endDate &&
                            other.endDate >= req.startDate
                        );
                        if (!conflictingBooking) return null;
                        return (
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                              ⚠️ Overlaps with approved booking for {conflictingBooking.borrowerName} ({conflictingBooking.startDate} to {conflictingBooking.endDate})
                            </span>
                          </div>
                        );
                      })()}

                      {req.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                          "{req.message}"
                        </p>
                      )}

                      {/* In-App Uber-style PIN Handover Verification for Lender */}
                      {req.status === 'ACCEPTED' && !req.handoverAt && (
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs flex-shrink-0">
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                🔑 Handover Pickup PIN Verification
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                Ask <strong>{req.borrowerName}</strong> for their 4-digit code at pickup:
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="PIN"
                              value={pinInputs[req.id] || ''}
                              onChange={(e) => handlePinChange(req.id, e.target.value)}
                              className="w-20 text-center font-mono font-bold tracking-widest px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyPickup(req.id)}
                              disabled={verifyingId === req.id || (pinInputs[req.id] || '').length < 4}
                              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition whitespace-nowrap text-center"
                            >
                              {verifyingId === req.id ? 'Verifying...' : 'Verify & Hand Over'}
                            </button>
                          </div>
                        </div>
                      )}

                      {req.status === 'ACCEPTED' && req.handoverAt && (
                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs flex-shrink-0">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                🛡️ Item Handed Over &bull; Return Verification
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                When {req.borrowerName} returns item, ask for their 4-digit Return PIN:
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="PIN"
                              value={returnPinInputs[req.id] || ''}
                              onChange={(e) => handleReturnPinChange(req.id, e.target.value)}
                              className="w-20 text-center font-mono font-bold tracking-widest px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyReturn(req.id)}
                              disabled={verifyingReturnId === req.id || (returnPinInputs[req.id] || '').length < 4}
                              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition whitespace-nowrap text-center"
                            >
                              {verifyingReturnId === req.id ? 'Verifying...' : 'Verify Return'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lender Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                      <button
                        onClick={() => setSelectedChatRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                        title="Chat with Borrower"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Chat
                      </button>

                      {req.borrowerPhone && (
                        <WhatsAppButton
                          href={buildTransactionWhatsAppUrl({
                            phone: req.borrowerPhone,
                            recipientName: req.borrowerName,
                            itemName: req.itemTitle,
                            role: 'borrower',
                            myRoleName: user?.fullName,
                          })}
                          recipientName={req.borrowerName}
                          label="WhatsApp"
                          size="sm"
                          variant="compact"
                        />
                      )}

                      {/* 1-Click Friendly Return Ping — only shown once item is handed over */}
                      {req.status === 'ACCEPTED' && req.handoverAt && req.borrowerPhone && (() => {
                        const pingUrl = buildReturnPingWhatsAppUrl({
                          phone: req.borrowerPhone,
                          borrowerName: req.borrowerName,
                          itemTitle: req.itemTitle,
                          endDate: req.endDate,
                        });
                        if (!pingUrl) return null;
                        return (
                          <a
                            href={pingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send a friendly return reminder to ${req.borrowerName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-semibold transition border border-violet-200 dark:border-violet-800"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Return Ping
                          </a>
                        );
                      })()}

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
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/items/${req.itemId}`}
                        className="font-bold text-gray-900 dark:text-white text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      >
                        {req.itemTitle}
                      </Link>
                      {getStatusBadge(req.status, req.handoverAt)}
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

                    {/* Due Date Countdown Badge — only for active borrows */}
                    {req.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-2">
                        <DueDateBadge endDate={req.endDate} />
                      </div>
                    )}

                    {req.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                        Your message: "{req.message}"
                      </p>
                    )}

                    {/* In-App Uber-style Screen PIN Cards for Borrower */}
                    {req.status === 'ACCEPTED' && !req.handoverAt && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-dashed border-emerald-400 dark:border-emerald-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs flex-shrink-0">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                              Pickup Handover PIN (Uber Style)
                            </span>
                            <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                              Tell this 4-digit code to {req.ownerName} at pickup
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              The lender will type this on their screen to confirm item handover
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 font-mono text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 shadow-inner w-full sm:w-auto">
                          {req.pickupOtp || '----'}
                        </div>
                      </div>
                    )}

                    {req.status === 'ACCEPTED' && req.handoverAt && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-dashed border-blue-400 dark:border-blue-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                              Item In Your Possession &bull; Return PIN
                            </span>
                            <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                              Tell this code to {req.ownerName} when returning the item
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Confirms the lender received the item back safely
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 font-mono text-2xl font-black tracking-widest text-blue-600 dark:text-blue-400 shadow-inner w-full sm:w-auto">
                          {req.returnOtp || '----'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Borrower Action Button */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                    <button
                      onClick={() => setSelectedChatRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                      title="Chat with Owner"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Chat
                    </button>

                    {req.ownerPhone && (
                      <WhatsAppButton
                        href={buildTransactionWhatsAppUrl({
                          phone: req.ownerPhone,
                          recipientName: req.ownerName,
                          itemName: req.itemTitle,
                          role: 'lender',
                          myRoleName: user?.fullName,
                        })}
                        recipientName={req.ownerName}
                        label="WhatsApp"
                        size="sm"
                        variant="compact"
                      />
                    )}

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
