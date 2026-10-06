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
  Camera,
  RefreshCw,
  QrCode,
  FileText,
  Heart,
  Bell,
  Building2,
  PackageCheck,
  Coins,
} from 'lucide-react';
import ChatModal from '../components/ChatModal';
import ReviewModal from '../components/ReviewModal';
import ConditionProofModal from '../components/ConditionProofModal';
import ExtendReturnModal from '../components/ExtendReturnModal';
import HandoverQrModal from '../components/HandoverQrModal';
import QrScannerModal from '../components/QrScannerModal';
import DigitalHandoverSlipModal from '../components/DigitalHandoverSlipModal';
import QuickReborrowModal from '../components/QuickReborrowModal';
import ContactlessDropoffModal from '../components/ContactlessDropoffModal';
import ContactlessCollectModal from '../components/ContactlessCollectModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import WhatsAppButton from '../components/WhatsAppButton';
import TrustBadge from '../components/TrustBadge';
import { DashboardRowSkeleton } from '../components/SkeletonCard';
import { compressImage } from '../utils/imageCompressor';
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

/** Financial Breakdown and Caution Deposit Refund Settlement card */
const FinancialSummaryCard = ({ req, isLender, onSettleRefund, isSettling }) => {
  const hasFinance = (req?.securityDeposit && req.securityDeposit > 0) || (req?.dailyRate && req.dailyRate > 0);
  if (!hasFinance) return null;

  const deposit = req.securityDeposit || 0;
  const rate = req.dailyRate || 0;
  const days = req.totalDays || 1;
  const fee = req.totalRentalFee || (rate * days);
  const refund = req.refundAmount ?? Math.max(0, deposit - fee);
  const status = req.paymentStatus || 'FREE';

  return (
    <div className="p-3.5 bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-800/60 rounded-xl space-y-2.5 text-xs shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg flex-shrink-0 shadow-2xs">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-amber-950 dark:text-amber-200">
              Pricing & Caution Deposit
            </span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400 ml-1.5 font-medium">
              ({rate > 0 ? `₹${rate}/day` : 'Free Daily Use'} &bull; ₹{deposit} Advance)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'REFUND_SETTLED' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              Refund Settled (₹{refund})
            </span>
          ) : status === 'ADVANCE_PAID' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              <ShieldCheck className="w-3 h-3" />
              Advance Held (₹{deposit})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              <Clock className="w-3 h-3" />
              Advance Due at Pickup (₹{deposit})
            </span>
          )}
        </div>
      </div>

      {/* Grid of values */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Advance Deposit</div>
          <div className="text-xs font-black text-amber-800 dark:text-amber-300">₹{deposit}</div>
        </div>
        <div className="p-2 bg-white/80 dark:bg-slate-900/70 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
          <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Rental Fee ({days}d)</div>
          <div className="text-xs font-black text-rose-600 dark:text-rose-400">₹{fee}</div>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800">
          <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Net Refund</div>
          <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">₹{refund}</div>
        </div>
      </div>

      {/* Explanatory subtitle and lender settlement button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-gray-600 dark:text-gray-300">
        <p className="italic">
          {status === 'REFUND_SETTLED'
            ? `Net balance of ₹${refund} has been settled and returned to the borrower.`
            : status === 'ADVANCE_PAID'
            ? `₹${deposit} advance held in trust. ₹${refund} will be refunded upon verified return.`
            : `Borrower pays ₹${deposit} advance caution deposit to owner during pickup handover.`}
        </p>

        {isLender && req.status === 'RETURNED' && status !== 'REFUND_SETTLED' && (
          <button
            type="button"
            onClick={() => onSettleRefund(req.id, refund)}
            disabled={isSettling}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition whitespace-nowrap self-end sm:self-auto"
          >
            {isSettling ? 'Settling...' : `Confirm ₹${refund} Refund Paid`}
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('lender'); // 'lender' | 'borrower' | 'saved'
  const [myItems, setMyItems] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [myBorrowRequests, setMyBorrowRequests] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatRequest, setSelectedChatRequest] = useState(null);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);
  const [selectedReborrowRequest, setSelectedReborrowRequest] = useState(null);

  // In-App Screen PIN verification states
  const [pinInputs, setPinInputs] = useState({});
  const [returnPinInputs, setReturnPinInputs] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyingReturnId, setVerifyingReturnId] = useState(null);

  // Condition Proof states
  const [pickupPhotos, setPickupPhotos] = useState({});
  const [pickupNotes, setPickupNotes] = useState({});
  const [returnPhotos, setReturnPhotos] = useState({});
  const [returnNotes, setReturnNotes] = useState({});
  const [uploadingPickupPhoto, setUploadingPickupPhoto] = useState({});
  const [uploadingReturnPhoto, setUploadingReturnPhoto] = useState({});
  const [selectedProofRequest, setSelectedProofRequest] = useState(null);
  const [selectedExtendRequest, setSelectedExtendRequest] = useState(null);
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [qrModalData, setQrModalData] = useState({ isOpen: false, request: null, type: 'pickup' });
  const [scannerModalData, setScannerModalData] = useState({ isOpen: false, request: null, type: 'pickup' });
  const [slipModalData, setSlipModalData] = useState({ isOpen: false, request: null });
  const [dropoffModalData, setDropoffModalData] = useState({ isOpen: false, request: null, mode: 'pickup' });
  const [collectModalData, setCollectModalData] = useState({ isOpen: false, request: null, mode: 'pickup' });
  const [settlingRefundId, setSettlingRefundId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [itemsRes, receivedRes, borrowedRes, savedRes] = await Promise.all([
        api.get('/items/my-items'),
        api.get('/requests/received'),
        api.get('/requests/borrowed'),
        api.get('/favorites'),
      ]);
      setMyItems(itemsRes.data);
      setReceivedRequests(receivedRes.data);
      setMyBorrowRequests(borrowedRes.data);
      setSavedItems(savedRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId) => {
    try {
      await api.post(`/favorites/${itemId}/toggle`);
      setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.info('Item removed from saved list.');
    } catch (err) {
      toast.error('Failed to remove item from saved list.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.patch(`/requests/${requestId}/status`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully!`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleRespondExtension = async (requestId, approve) => {
    try {
      await api.post(`/requests/${requestId}/extend/respond`, { approve });
      toast.success(approve ? 'Extension approved!' : 'Extension declined.');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update extension status');
    }
  };

  const isReminderRecentlySent = (lastReminderSentAt) => {
    if (!lastReminderSentAt) return false;
    const diffHours = (new Date() - new Date(lastReminderSentAt)) / (1000 * 60 * 60);
    return diffHours < 12;
  };

  const formatReminderTime = (lastReminderSentAt) => {
    if (!lastReminderSentAt) return '';
    try {
      const date = new Date(lastReminderSentAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleSendReturnReminder = async (requestId, borrowerName) => {
    setSendingReminderId(requestId);
    try {
      const res = await api.post(`/requests/${requestId}/send-reminder`);
      toast.success(`⏰ Gentle return reminder sent to ${borrowerName || 'borrower'}!`);
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, lastReminderSentAt: res.data.lastReminderSentAt } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send return reminder.');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handlePinChange = (requestId, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setPinInputs((prev) => ({ ...prev, [requestId]: clean }));
  };

  const handleReturnPinChange = (requestId, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setReturnPinInputs((prev) => ({ ...prev, [requestId]: clean }));
  };

  const handlePhotoUpload = async (requestId, file, type) => {
    if (!file) return;
    const setUploading = type === 'pickup' ? setUploadingPickupPhoto : setUploadingReturnPhoto;
    const setPhotos = type === 'pickup' ? setPickupPhotos : setReturnPhotos;

    setUploading((prev) => ({ ...prev, [requestId]: true }));
    try {
      // Compress image client-side to keep DB small and free
      const compressedFile = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.fileUrl;
      setPhotos((prev) => ({ ...prev, [requestId]: url }));
      toast.success('Condition photo uploaded! 📸');
    } catch (err) {
      toast.error('Failed to upload condition photo. Please try again.');
    } finally {
      setUploading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleVerifyPickup = async (requestId, overridePin = null) => {
    const pin = overridePin || pinInputs[requestId];
    if (!pin || (pin.length !== 6 && pin.length !== 4)) {
      toast.warning('Please enter a valid 6-digit PIN');
      return;
    }
    setVerifyingId(requestId);
    try {
      await api.post(`/requests/${requestId}/verify-pickup`, {
        otp: pin,
        photoUrl: pickupPhotos[requestId] || '',
        conditionNote: pickupNotes[requestId] || '',
      });
      setPinInputs((prev) => ({ ...prev, [requestId]: '' }));
      toast.success('Pickup verified! Handover complete. 🎉');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Pickup PIN. Please check with borrower.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyReturn = async (requestId, overridePin = null) => {
    const pin = overridePin || returnPinInputs[requestId];
    if (!pin || (pin.length !== 6 && pin.length !== 4)) {
      toast.warning('Please enter a valid 6-digit PIN');
      return;
    }
    setVerifyingReturnId(requestId);
    try {
      await api.post(`/requests/${requestId}/verify-return`, {
        otp: pin,
        photoUrl: returnPhotos[requestId] || '',
        conditionNote: returnNotes[requestId] || '',
      });
      setReturnPinInputs((prev) => ({ ...prev, [requestId]: '' }));
      toast.success('Return verified! Item returned successfully. 🛡️');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Return PIN. Please check with borrower.');
    } finally {
      setVerifyingReturnId(null);
    }
  };

  const handleSettleRefund = async (requestId, refundAmount = null) => {
    setSettlingRefundId(requestId);
    try {
      await api.post(`/requests/${requestId}/settle-refund`, { refundAmount });
      toast.success('Net refund settled and marked as returned to borrower! 💰');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle refund');
    } finally {
      setSettlingRefundId(null);
    }
  };

  const handleScannerSuccess = (scannedPin) => {
    const { request, type } = scannerModalData;
    if (!request) return;
    setScannerModalData({ isOpen: false, request: null, type: 'pickup' });
    if (type === 'pickup') {
      setPinInputs((prev) => ({ ...prev, [request.id]: scannedPin }));
      handleVerifyPickup(request.id, scannedPin);
    } else {
      setReturnPinInputs((prev) => ({ ...prev, [request.id]: scannedPin }));
      handleVerifyReturn(request.id, scannedPin);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/items/${itemId}`);
        toast.success('Listing deleted.');
        fetchDashboardData();
      } catch (err) {
        toast.error('Failed to delete item');
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-72 animate-pulse" />
        </div>
        <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-36 animate-pulse" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-36 animate-pulse" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-36 animate-pulse" />
        </div>
        <div className="space-y-4">
          <DashboardRowSkeleton />
          <DashboardRowSkeleton />
          <DashboardRowSkeleton />
        </div>
      </div>
    );
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

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 whitespace-nowrap flex-shrink-0 transition ${
            activeTab === 'saved'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${activeTab === 'saved' ? 'fill-red-500 stroke-red-500' : ''}`} />
          Saved Items
          <span className="ml-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
            {savedItems.length}
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

                      {/* Financial Caution Deposit & Rental Settlement Breakdown */}
                      <FinancialSummaryCard
                        req={req}
                        isLender={true}
                        onSettleRefund={handleSettleRefund}
                        isSettling={settlingRefundId === req.id}
                      />

                      {/* Lender In-App Extension Request Approval/Decline Box */}
                      {req.status === 'ACCEPTED' && req.extensionStatus === 'PENDING' && (
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 rounded-xl space-y-2.5 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-amber-500 text-white rounded-lg flex-shrink-0">
                                <RefreshCw className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                  🔄 Extension Requested by {req.borrowerName}
                                </span>
                                <div className="text-[11px] text-amber-800 dark:text-amber-300">
                                  Current return: <strong>{req.endDate}</strong> &rarr; Proposed: <strong className="underline decoration-amber-500 underline-offset-2">{req.extensionProposedEndDate}</strong>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleRespondExtension(req.id, true)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                              >
                                ✓ Approve Extension
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondExtension(req.id, false)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900 transition"
                              >
                                ✕ Decline
                              </button>
                            </div>
                          </div>
                          {req.extensionReason && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/50">
                              Note from borrower: "{req.extensionReason}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* In-App Uber-style PIN Handover Verification for Lender */}
                      {req.status === 'ACCEPTED' && !req.handoverAt && (() => {
                        const isPickupLocked = req.pickupLockoutUntil && new Date(req.pickupLockoutUntil) > new Date();
                        return (
                          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 rounded-xl space-y-3">
                            {isPickupLocked && (
                              <div className="p-2.5 bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2 font-bold animate-pulse">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <span>🚨 Security Lockout: 5 failed PIN attempts reached. Handover locked until {new Date(req.pickupLockoutUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs flex-shrink-0">
                                  <KeyRound className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                    🔑 Handover Pickup PIN Verification
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                    Ask <strong>{req.borrowerName}</strong> for their 6-digit code at pickup:
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="PIN"
                                  disabled={isPickupLocked}
                                  value={pinInputs[req.id] || ''}
                                  onChange={(e) => handlePinChange(req.id, e.target.value)}
                                  className="w-28 text-center font-mono font-bold tracking-widest px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white disabled:opacity-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPickup(req.id)}
                                  disabled={isPickupLocked || verifyingId === req.id || !((pinInputs[req.id] || '').length === 6 || (pinInputs[req.id] || '').length === 4)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition whitespace-nowrap text-center"
                                >
                                  {verifyingId === req.id ? 'Verifying...' : 'Verify'}
                                </button>
                                 <button
                                  type="button"
                                  disabled={isPickupLocked}
                                  onClick={() => setScannerModalData({ isOpen: true, request: req, type: 'pickup' })}
                                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 shadow-2xs whitespace-nowrap disabled:opacity-50"
                                  title="Scan borrower QR code with camera"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Scan QR</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPickupLocked}
                                  onClick={() => setDropoffModalData({ isOpen: true, request: req, mode: 'pickup' })}
                                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-2xs whitespace-nowrap disabled:opacity-50"
                                  title="Drop item with security guard or leave at porch"
                                >
                                  <Building2 className="w-3.5 h-3.5" />
                                  <span>{req.dropoffStatus === 'DROPPED_OFF' ? 'Update Drop-off' : 'Drop at Guard/Porch'}</span>
                                </button>
                              </div>
                            </div>

                          {/* Contactless Drop-off Active Indicator */}
                          {req.dropoffStatus === 'DROPPED_OFF' && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span>🚪 Left at: <strong>{req.dropoffLocation}</strong></span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                                  Awaiting Collection
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 gap-2">
                                <div>Guard Passcode: <span className="font-mono font-bold tracking-wider">{req.dropoffPasscode || 'None'}</span></div>
                                {req.dropoffPhotoUrl && (
                                  <a href={req.dropoffPhotoUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-900">
                                    📸 View Spot Photo
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pickup Condition Proof Snapshot (Optional but Recommended) */}
                          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-dashed border-emerald-400 dark:border-emerald-700 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 transition shadow-2xs">
                              <Camera className="w-3.5 h-3.5" />
                              <span>{uploadingPickupPhoto[req.id] ? 'Uploading...' : pickupPhotos[req.id] ? '✓ Photo Snapped' : '📸 Snap Pickup Condition'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                disabled={uploadingPickupPhoto[req.id]}
                                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(req.id, e.target.files[0], 'pickup')}
                              />
                            </label>
                            <input
                              type="text"
                              placeholder="Condition note (e.g. scratch on handle, full battery)"
                              value={pickupNotes[req.id] || ''}
                              onChange={(e) => setPickupNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {pickupPhotos[req.id] && (
                              <img
                                src={pickupPhotos[req.id]}
                                alt="Pickup preview"
                                className="w-8 h-8 rounded-lg object-cover border border-emerald-400 self-center"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}

                      {req.status === 'ACCEPTED' && req.handoverAt && (() => {
                        const isReturnLocked = req.returnLockoutUntil && new Date(req.returnLockoutUntil) > new Date();
                        return (
                          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 rounded-xl space-y-3">
                            {isReturnLocked && (
                              <div className="p-2.5 bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2 font-bold animate-pulse">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <span>🚨 Security Lockout: 5 failed Return PIN attempts reached. Return verification locked until {new Date(req.returnLockoutUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</span>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs flex-shrink-0">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                    🛡️ Item Handed Over &bull; Return Verification
                                  </div>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                    When {req.borrowerName} returns item, ask for their 6-digit Return PIN:
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="PIN"
                                  disabled={isReturnLocked}
                                  value={returnPinInputs[req.id] || ''}
                                  onChange={(e) => handleReturnPinChange(req.id, e.target.value)}
                                  className="w-28 text-center font-mono font-bold tracking-widest px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white disabled:opacity-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVerifyReturn(req.id)}
                                  disabled={isReturnLocked || verifyingReturnId === req.id || !((returnPinInputs[req.id] || '').length === 6 || (returnPinInputs[req.id] || '').length === 4)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition whitespace-nowrap text-center"
                                >
                                  {verifyingReturnId === req.id ? 'Verifying...' : 'Verify'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isReturnLocked}
                                  onClick={() => setScannerModalData({ isOpen: true, request: req, type: 'return' })}
                                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-300 dark:border-blue-700 shadow-2xs whitespace-nowrap disabled:opacity-50"
                                  title="Scan borrower return QR code with camera"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Scan QR</span>
                                </button>
                              </div>
                            </div>

                          {/* Contactless Return Drop-off Indicator for Lender */}
                          {req.returnDropoffStatus === 'DROPPED_OFF' && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span>🚪 Borrower Returned Item to: <strong>{req.returnDropoffLocation}</strong></span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCollectModalData({ isOpen: true, request: req, mode: 'return' })}
                                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Confirm Return Received</span>
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-purple-800 dark:text-purple-300 gap-2">
                                {req.returnDropoffPhotoUrl && (
                                  <a href={req.returnDropoffPhotoUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-purple-900">
                                    📸 View Return Drop-off Photo
                                  </a>
                                )}
                                {req.returnDropoffNote && (
                                  <span className="italic">Note: "{req.returnDropoffNote}"</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Return Condition Proof Snapshot */}
                          <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-dashed border-blue-400 dark:border-blue-700 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition shadow-2xs">
                              <Camera className="w-3.5 h-3.5" />
                              <span>{uploadingReturnPhoto[req.id] ? 'Uploading...' : returnPhotos[req.id] ? '✓ Photo Snapped' : '📸 Snap Return Condition'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                disabled={uploadingReturnPhoto[req.id]}
                                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(req.id, e.target.files[0], 'return')}
                              />
                            </label>
                            <input
                              type="text"
                              placeholder="Return note (e.g. returned clean and undamaged)"
                              value={returnNotes[req.id] || ''}
                              onChange={(e) => setReturnNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {returnPhotos[req.id] && (
                              <img
                                src={returnPhotos[req.id]}
                                alt="Return preview"
                                className="w-8 h-8 rounded-lg object-cover border border-blue-400 self-center"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    </div>

                    {/* Lender Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                      {/* Condition Proof Button if item handed over or photos recorded */}
                      {(req.handoverAt || req.pickupPhotoUrl || req.returnPhotoUrl) && (
                        <button
                          onClick={() => setSelectedProofRequest(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                          title="View item condition proof photos"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Condition Proof
                        </button>
                      )}

                      {req.handoverAt && (
                        <button
                          onClick={() => setSlipModalData({ isOpen: true, request: req })}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                          title="View & Print Digital Handover Slip"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Handover Slip
                        </button>
                      )}

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

                      {/* 1-Tap In-App Polite Return Reminder — only shown once item is handed over and not yet returned */}
                      {req.status === 'ACCEPTED' && req.handoverAt && !req.returnedAt && (
                        <button
                          type="button"
                          onClick={() => handleSendReturnReminder(req.id, req.borrowerName)}
                          disabled={sendingReminderId === req.id || isReminderRecentlySent(req.lastReminderSentAt)}
                          title={
                            isReminderRecentlySent(req.lastReminderSentAt)
                              ? `Gentle reminder already sent at ${formatReminderTime(req.lastReminderSentAt)} (throttled to 1 per 12h)`
                              : `Send a gentle in-app return reminder to ${req.borrowerName}`
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                            isReminderRecentlySent(req.lastReminderSentAt)
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 shadow-2xs'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${sendingReminderId === req.id ? 'animate-bounce' : ''}`} />
                          {sendingReminderId === req.id ? (
                            'Sending...'
                          ) : isReminderRecentlySent(req.lastReminderSentAt) ? (
                            `Reminded (${formatReminderTime(req.lastReminderSentAt)})`
                          ) : (
                            'Gentle Reminder'
                          )}
                        </button>
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

                      {req.status === 'PENDING' && (() => {
                        const conflict = receivedRequests.find(
                          (other) =>
                            other.id !== req.id &&
                            other.itemId === req.itemId &&
                            other.status === 'ACCEPTED' &&
                            !other.returnedAt &&
                            req.startDate <= other.endDate &&
                            req.endDate >= other.startDate
                        );

                        return (
                          <>
                            {conflict ? (
                              <div
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200"
                                title={`Already booked by ${conflict.borrowerName || 'another neighbor'} from ${conflict.startDate} to ${conflict.endDate}`}
                              >
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span>Dates Overlap with Confirmed Booking</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accept
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 rounded-xl text-xs font-semibold transition border border-red-200 dark:border-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        );
                      })()}

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

                    {/* Due Date Countdown Badge & Extension Status */}
                    {req.status === 'ACCEPTED' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <DueDateBadge endDate={req.endDate} />
                        {req.extensionStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <Clock className="w-3 h-3" />
                            Extension to {req.extensionProposedEndDate} Requested
                          </span>
                        )}
                        {req.extensionStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Return Extended to {req.endDate}
                          </span>
                        )}
                        {req.extensionStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                            Extension Declined
                          </span>
                        )}
                      </div>
                    )}

                    {/* Friendly Polite Return Reminder Banner for Borrower */}
                    {req.status === 'ACCEPTED' && !req.returnedAt && (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const due = new Date(req.endDate);
                      due.setHours(0, 0, 0, 0);
                      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                      const isUpcomingOrOverdue = diffDays <= 1;
                      const hasReminder = Boolean(req.lastReminderSentAt);

                      if (!isUpcomingOrOverdue && !hasReminder) return null;

                      return (
                        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs border ${
                          diffDays < 0
                            ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                            : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl mt-0.5 shadow-2xs flex-shrink-0 text-white ${
                              diffDays < 0 ? 'bg-red-600' : 'bg-amber-500'
                            }`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <div className={`font-bold flex items-center gap-2 ${
                                diffDays < 0 ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'
                              }`}>
                                <span>
                                  {diffDays < 0
                                    ? '⚠️ Item Return Overdue'
                                    : diffDays === 0
                                    ? '⏰ Return Due Today!'
                                    : '📅 Return Due Tomorrow'}
                                </span>
                                {hasReminder && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                                    Nudged by Lender
                                  </span>
                                )}
                              </div>
                              <p className={`leading-relaxed ${
                                diffDays < 0 ? 'text-red-800/90 dark:text-red-300/90' : 'text-amber-800/90 dark:text-amber-300/90'
                              }`}>
                                {diffDays === 0
                                  ? `Reminder: Please return "${req.itemTitle}" to ${req.ownerName} by 6 PM today! Have your 6-digit Return PIN or QR code ready.`
                                  : diffDays < 0
                                  ? `"${req.itemTitle}" was due on ${req.endDate}. Please return it to ${req.ownerName} as soon as possible, or request an extension.`
                                  : `Friendly reminder: "${req.itemTitle}" is due for return to ${req.ownerName} tomorrow (${req.endDate}).`}
                              </p>
                            </div>
                          </div>
                          {req.extensionStatus !== 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => setSelectedExtendRequest(req)}
                              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shadow-2xs whitespace-nowrap self-end sm:self-auto flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Request Extension
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {req.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                        Your message: "{req.message}"
                      </p>
                    )}

                    {/* Financial Caution Deposit & Rental Settlement Breakdown */}
                    <FinancialSummaryCard
                      req={req}
                      isLender={false}
                    />

                    {/* Contactless Drop-off Notice Card for Borrower */}
                    {req.status === 'ACCEPTED' && !req.handoverAt && req.dropoffStatus === 'DROPPED_OFF' && (
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl space-y-3 shadow-md">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-md text-[10px] font-black uppercase tracking-wider">
                                🚪 Contactless Drop-off &bull; Ready for Pickup!
                              </span>
                              <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                                Waiting at: {req.dropoffLocation}
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300">
                                {req.dropoffNote ? `"${req.dropoffNote}"` : `Left safely by ${req.ownerName}.`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {req.dropoffPasscode && (
                              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-mono text-base font-black tracking-widest text-amber-700 dark:text-amber-300">
                                PIN: {req.dropoffPasscode}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setCollectModalData({ isOpen: true, request: req, mode: 'pickup' })}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Collect from Spot</span>
                            </button>
                          </div>
                        </div>
                      </div>
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
                              Tell this 6-digit code to {req.ownerName} at pickup
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              The lender will type this on their screen to confirm item handover
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 font-mono text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 shadow-inner w-full sm:w-auto">
                            {req.pickupOtp || '------'}
                          </div>
                          {req.pickupOtp && (
                            <button
                              type="button"
                              onClick={() => setQrModalData({ isOpen: true, request: req, type: 'pickup' })}
                              className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                              title="Show large QR code for lender to scan"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Show QR</span>
                            </button>
                          )}
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
                              Tell this 6-digit code to {req.ownerName} when returning the item
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              Confirms the lender received the item back safely
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 font-mono text-2xl font-black tracking-widest text-blue-600 dark:text-blue-400 shadow-inner w-full sm:w-auto">
                            {req.returnOtp || '------'}
                          </div>
                          {req.returnOtp && (
                            <button
                              type="button"
                              onClick={() => setQrModalData({ isOpen: true, request: req, type: 'return' })}
                              className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap"
                              title="Show return QR code for lender to scan"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Show QR</span>
                            </button>
                          )}
                          {req.returnDropoffStatus === 'DROPPED_OFF' ? (
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 px-3 py-1.5 bg-purple-100 dark:bg-purple-950 rounded-xl border border-purple-200">
                              🚪 Left at {req.returnDropoffLocation}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDropoffModalData({ isOpen: true, request: req, mode: 'return' })}
                              className="w-full sm:w-auto px-3.5 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-purple-300 dark:border-purple-700 shadow-2xs whitespace-nowrap"
                              title="Leave item with gate security or at doorstep for return"
                            >
                              <Building2 className="w-4 h-4" />
                              <span>Return via Drop-off</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Borrower Action Button */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                    {/* Condition Proof Button if item handed over or photos recorded */}
                    {(req.handoverAt || req.pickupPhotoUrl || req.returnPhotoUrl) && (
                      <button
                        onClick={() => setSelectedProofRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                        title="View item condition proof photos"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Condition Proof
                      </button>
                    )}

                    {req.handoverAt && (
                      <button
                        onClick={() => setSlipModalData({ isOpen: true, request: req })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                        title="View & Print Digital Handover Slip"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Handover Slip
                      </button>
                    )}

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

                    {/* 1-Click Request Extension button for active accepted requests */}
                    {req.status === 'ACCEPTED' && !req.returnedAt && req.extensionStatus !== 'PENDING' && (
                      <button
                        onClick={() => setSelectedExtendRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800"
                        title="Request to extend your return date"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Extend Return
                      </button>
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
                      <>
                        <button
                          onClick={() => setSelectedReborrowRequest(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold transition border border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                          title="Borrow this item again from the same lender"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Borrow Again
                        </button>
                        <button
                          onClick={() => setSelectedReviewRequest(req)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold transition border border-amber-200 dark:border-amber-900"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Leave Review
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Items View */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                Your Saved Community Items ({savedItems.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Quickly access and re-borrow tools, appliances, and gear you have bookmarked
              </p>
            </div>
          </div>

          {savedItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 p-8">
              <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800/60 shadow-xs">
                <Heart className="w-8 h-8 fill-red-500/20" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No saved items yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Bookmark items with the ❤️ icon to quickly access and re-borrow them anytime.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Browse Neighborhood Items
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-lg text-xs font-medium">
                      {item.category}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(item.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800/60 transition shadow-xs"
                      title="Remove from saved"
                    >
                      <Heart className="w-4 h-4 fill-red-500 stroke-red-500" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                          {item.title}
                        </h3>
                        {item.averageRating > 0 && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.averageRating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {item.description || 'No description provided.'}
                      </p>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>Owner: <strong>{item.ownerName}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <Link
                        to={`/items/${item.id}`}
                        className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        Borrow Now
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(item.id)}
                        className="py-2 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-xl text-xs font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1-Click Quick Re-Borrow Modal */}
      <QuickReborrowModal
        isOpen={!!selectedReborrowRequest}
        onClose={() => setSelectedReborrowRequest(null)}
        request={selectedReborrowRequest}
        onSuccess={fetchDashboardData}
      />

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

      {/* Item Condition Proof Modal (Before & After Photos) */}
      <ConditionProofModal
        isOpen={!!selectedProofRequest}
        onClose={() => setSelectedProofRequest(null)}
        request={selectedProofRequest}
      />

      {/* 1-Click Borrow Return Extension Modal */}
      <ExtendReturnModal
        isOpen={!!selectedExtendRequest}
        onClose={() => setSelectedExtendRequest(null)}
        request={selectedExtendRequest}
        onSuccess={fetchDashboardData}
      />

      {/* Dynamic QR Code Modal for Borrower Handover & Return */}
      <HandoverQrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        request={qrModalData.request}
        type={qrModalData.type}
      />

      {/* Camera QR Scanner Modal for Lender */}
      <QrScannerModal
        isOpen={scannerModalData.isOpen}
        onClose={() => setScannerModalData((prev) => ({ ...prev, isOpen: false }))}
        request={scannerModalData.request}
        type={scannerModalData.type}
        onScanSuccess={handleScannerSuccess}
      />

      {/* Digital Handover & Return Slip Modal (Print / PDF) */}
      <DigitalHandoverSlipModal
        isOpen={slipModalData.isOpen}
        onClose={() => setSlipModalData({ isOpen: false, request: null })}
        request={slipModalData.request}
      />

      {/* Contactless Drop-off Modal (Porch / Gate Security) */}
      <ContactlessDropoffModal
        isOpen={dropoffModalData.isOpen}
        onClose={() => setDropoffModalData((prev) => ({ ...prev, isOpen: false }))}
        request={dropoffModalData.request}
        mode={dropoffModalData.mode}
        onSuccess={fetchDashboardData}
      />

      {/* Contactless Collection Confirmation Modal */}
      <ContactlessCollectModal
        isOpen={collectModalData.isOpen}
        onClose={() => setCollectModalData((prev) => ({ ...prev, isOpen: false }))}
        request={collectModalData.request}
        mode={collectModalData.mode}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
