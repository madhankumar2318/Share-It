import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Package,
  Award,
  X,
  Sparkles
} from 'lucide-react';

/**
 * Renders a color-coded Trust Tier Badge pill and optional interactive Trust Card Modal
 */
const TrustBadge = ({ trust, showScore = true, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  if (!trust) return null;

  const {
    fullName,
    trustTier = 'NEW_NEIGHBOR',
    tierLabel = 'Verified Neighbor',
    tierDescription,
    trustScore = 50,
    phoneVerified,
    completedReturns = 0,
    onTimeRate = 100,
    itemsLentCount = 0,
    averageRating = 0,
    totalReviews = 0,
    memberSince = 'Member',
  } = trust;

  // Visual styles according to tier
  const tierConfig = {
    GOLD_BORROWER: {
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80',
      icon: <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      colorName: 'amber',
    },
    SILVER_BORROWER: {
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />,
      colorName: 'slate',
    },
    VERIFIED_NEIGHBOR: {
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      colorName: 'emerald',
    },
    NEW_NEIGHBOR: {
      badgeClass: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700',
      icon: <Shield className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />,
      colorName: 'gray',
    },
  };

  const config = tierConfig[trustTier] || tierConfig.NEW_NEIGHBOR;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        title="Click to view Neighbor Trust & Verification Record"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition hover:scale-102 hover:shadow-2xs cursor-pointer ${config.badgeClass} ${className}`}
      >
        {config.icon}
        <span>{tierLabel}</span>
        {showScore && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-white/70 dark:bg-black/40 rounded-full font-mono text-[10px]">
            {trustScore}
          </span>
        )}
      </button>

      {/* Trust & Verification Scorecard Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                    {fullName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {memberSince}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Tier Card */}
            <div className={`p-4 rounded-2xl border ${config.badgeClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <span className="font-extrabold text-sm">{tierLabel}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-lg">{trustScore}</span>
                  <span className="text-[10px] font-bold opacity-75"> / 100</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {tierDescription || 'Active verified neighbor on Share-It.'}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-current h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, trustScore))}%` }}
                />
              </div>
            </div>

            {/* Trust Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Return Rate</span>
                </div>
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {completedReturns > 0 ? `${onTimeRate}% On-Time` : '100% (New)'}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {completedReturns} {completedReturns === 1 ? 'return' : 'returns'} completed
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Community Rating</span>
                </div>
                <div className="text-sm font-black text-gray-900 dark:text-white">
                  {totalReviews > 0 ? `${averageRating} / 5.0` : '5.0 (Default)'}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {totalReviews} {totalReviews === 1 ? 'neighbor review' : 'neighbor reviews'}
                </p>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Neighbor Verifications
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/30 text-xs">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp / Mobile Number</span>
                  </span>
                  {phoneVerified ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[11px]">Unverified</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/30 text-xs">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Registered Account</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/30 text-xs">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Items Handed Over / Lent</span>
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px]">
                    {itemsLentCount} {itemsLentCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TrustBadge;
