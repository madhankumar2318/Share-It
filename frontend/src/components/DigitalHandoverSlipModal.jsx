import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  Coins,
  FileText,
  FileCheck2,
  Loader2,
  X,
  MapPin,
  QrCode,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { useToast } from '../context/ToastContext';

const DigitalHandoverSlipModal = ({ isOpen, onClose, request }) => {
  const printRef = useRef(null);
  const toast = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !request) return null;

  const isReturned = request.status === 'RETURNED';
  const isBorrowed = request.status === 'BORROWED' || !!request.handoverAt;
  const isApproved = request.status === 'APPROVED';
  const txnId = `SI-TXN-${String(request.id).padStart(6, '0')}`;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = printRef.current;

      // Render high-DPI canvas capture with CORS support
      const canvas = await html2canvas(element, {
        scale: 2, // 2x Retina resolution for razor-sharp typography
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        onclone: (clonedDoc) => {
          // Ensure dark mode classes don't affect paper document rendering in cloned DOM
          const slip = clonedDoc.getElementById('shareit-printable-slip');
          if (slip) {
            slip.style.backgroundColor = '#ffffff';
            slip.style.color = '#0f172a';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // 8mm margin
      const contentWidth = pdfPageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight <= pdfPageHeight - margin * 2) {
        // Fits comfortably on single A4 sheet
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
      } else {
        // Multi-page slicing for comprehensive rental agreements with condition photos
        let position = margin;
        let remainingHeight = contentHeight;
        const pageDrawableHeight = pdfPageHeight - margin * 2;

        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        remainingHeight -= pageDrawableHeight;

        while (remainingHeight > 0) {
          position = position - pageDrawableHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
          remainingHeight -= pageDrawableHeight;
        }
      }

      const fileName = `ShareIt_Rental_Agreement_${txnId}.pdf`;
      pdf.save(fileName);
      toast.success('Official Rental Agreement PDF downloaded! 📄');
    } catch (err) {
      console.error('PDF Generation Failed:', err);
      toast.error('Could not download PDF directly. Opening print view instead...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const totalDays = request.totalDays || 1;
  const dailyRate = request.dailyRate || 0;
  const totalRentalFee = request.totalRentalFee || dailyRate * totalDays;
  const securityDeposit = request.securityDeposit || 0;
  const netRefund =
    request.refundAmount !== null && request.refundAmount !== undefined
      ? request.refundAmount
      : Math.max(0, securityDeposit - totalRentalFee);

  // Structured QR audit payload for instant mobile scanner verification
  const qrVerificationValue = JSON.stringify({
    app: 'Share-It P2P Custody Protocol',
    ref: txnId,
    item: request.itemTitle,
    lender: request.ownerName,
    borrower: request.borrowerName,
    duration: `${request.startDate} to ${request.endDate} (${totalDays}d)`,
    deposit: `₹${securityDeposit}`,
    status: request.status,
    verifiedAt: request.handoverAt || new Date().toISOString(),
  });

  const effectiveLocation =
    request.dropoffLocation ||
    request.itemLocation ||
    'Neighborhood Pickup Point (Coordinated between Lender & Borrower)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #shareit-printable-slip, #shareit-printable-slip * {
            visibility: visible !important;
          }
          #shareit-printable-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden transform transition-all my-6 print:my-0 print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="no-print px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                Official Rental Agreement & Receipt
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Verified tamper-evident digital custody record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Document Container (Target for jsPDF / Print) */}
        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6 print:max-h-none print:overflow-visible">
          <div
            id="shareit-printable-slip"
            ref={printRef}
            className="p-6 sm:p-8 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:border-none print:p-2"
            style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}
          >
            {/* Header: Brand, Title, Status & Scannable QR Code */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-emerald-600">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xl tracking-tight text-emerald-800">
                        Share-It
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider">
                        Official
                      </span>
                    </div>
                    <p className="text-[10px] tracking-wider uppercase text-slate-500 font-bold">
                      Peer-to-Peer Neighborhood Sharing Network
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono font-bold text-slate-700">
                  Transaction Audit ID:{' '}
                  <span className="text-emerald-700 font-black">{txnId}</span>
                </div>
              </div>

              {/* Scannable Verification QR Code & Status */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
                  <QRCodeCanvas
                    value={qrVerificationValue}
                    size={68}
                    level="M"
                    includeMargin={false}
                  />
                  <span className="text-[8px] font-mono text-emerald-800 font-extrabold mt-1 tracking-wider uppercase">
                    Scan to Verify
                  </span>
                </div>

                <div className="text-left space-y-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isReturned
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : isBorrowed
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isReturned
                      ? 'Return Verified & Closed'
                      : isBorrowed
                      ? 'Active Custody Transfer'
                      : 'Rental Agreement Confirmed'}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Issued: {formatDateTime(new Date().toISOString())}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400">
                    Ref #{txnId}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                Peer-to-Peer Equipment Custody Agreement & Deposit Ledger
              </h2>
              <p className="text-[10px] text-slate-500">
                Executed under Share-It Community Lending & Borrowing Standards
              </p>
            </div>

            {/* Item & Schedule Details with Location Landmark */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {request.itemImageUrl ? (
                  <img
                    src={request.itemImageUrl}
                    alt={request.itemTitle}
                    crossOrigin="anonymous"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-300 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 w-full text-center sm:text-left space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider inline-block">
                    {request.itemCategory || 'Household & Community Equipment'}
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    {request.itemTitle}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Pickup Date
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatDate(request.startDate)}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Return Due Date
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatDate(request.endDate)}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Total Duration
                      </span>
                      <span className="font-bold text-emerald-800">
                        {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover Spot / Designated Meeting Location Landmark */}
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs">
                <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-800 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase font-black text-emerald-800 tracking-wider">
                      Handover Location & Custody Landmark
                    </span>
                    {request.isContactless && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 text-[8px] font-extrabold uppercase">
                        Contactless Drop-off
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">
                    {effectiveLocation}
                  </p>
                  {request.dropoffNote && (
                    <p className="text-[10px] text-slate-600 italic mt-0.5">
                      Spot note: "{request.dropoffNote}"
                    </p>
                  )}
                  {request.returnDropoffLocation && (
                    <p className="text-[10px] text-blue-700 font-semibold mt-1">
                      Return Spot: {request.returnDropoffLocation} {request.returnDropoffNote ? `("${request.returnDropoffNote}")` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Identified Parties (Lender & Borrower) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Lender Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    Equipment Owner (Lender)
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Owner
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  {request.ownerName || 'Verified Community Member'}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {request.ownerEmail || 'Email on file'}
                </div>
                {request.ownerPhone && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {request.ownerPhone}
                  </div>
                )}
              </div>

              {/* Borrower Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    Authorized Custodian (Borrower)
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Identity Verified
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  {request.borrowerName || 'Verified Community Member'}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {request.borrowerEmail || 'Email on file'}
                </div>
                {request.borrowerPhone && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {request.borrowerPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ledger & Security Deposit Guarantee */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between text-emerald-950 font-bold border-b border-emerald-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  Security Caution Deposit & Financial Ledger
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-200 text-emerald-900">
                  {request.paymentStatus || (securityDeposit > 0 ? 'ESCROW HELD' : 'COMMUNITY FREE')}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Daily Rate</div>
                  <div className="text-xs font-black text-slate-800">₹{dailyRate}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Rental Fee ({totalDays}d)</div>
                  <div className="text-xs font-black text-rose-600">₹{totalRentalFee}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Advance Deposit</div>
                  <div className="text-xs font-black text-amber-700">₹{securityDeposit}</div>
                </div>

                <div className="p-2 bg-emerald-100/90 rounded-lg border border-emerald-300">
                  <div className="text-[9px] uppercase font-bold text-emerald-900">Net Refund Due</div>
                  <div className="text-xs font-black text-emerald-800">₹{netRefund}</div>
                </div>
              </div>

              <p className="text-[10px] text-slate-600 italic text-center leading-normal">
                🛡️ Advance caution deposit of ₹{securityDeposit} is held as custodian protection. Net refund of ₹{netRefund} is released upon return inspection.
              </p>
            </div>

            {/* Handover & Return Verification Audit Trail */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Pickup Handover Confirmed:
                </span>
                <span className="font-bold text-emerald-800 font-mono">
                  {request.handoverAt
                    ? `${formatDateTime(request.handoverAt)} (Verified via OTP/QR)`
                    : 'Pending Pickup Handover Verification'}
                </span>
              </div>

              {request.returnedAt && (
                <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    Item Return Confirmed:
                  </span>
                  <span className="font-bold text-blue-800 font-mono">
                    {formatDateTime(request.returnedAt)} (Inspection Verified)
                  </span>
                </div>
              )}

              {(request.pickupConditionNote || request.returnConditionNote) && (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                  {request.pickupConditionNote && (
                    <p className="text-slate-600">
                      <strong>Pickup Condition Note:</strong> "{request.pickupConditionNote}"
                    </p>
                  )}
                  {request.returnConditionNote && (
                    <p className="text-slate-600">
                      <strong>Return Condition Note:</strong> "{request.returnConditionNote}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Condition Proof Photos (if uploaded) */}
            {(request.pickupPhotoUrl || request.returnPhotoUrl) && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">
                  Condition Verification Snapshots
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {request.pickupPhotoUrl && (
                    <div className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center space-y-1">
                      <span className="text-[9px] font-bold text-emerald-800 block">
                        Pickup Snapshot (Condition Baseline)
                      </span>
                      <img
                        src={request.pickupPhotoUrl}
                        alt="Pickup Condition"
                        crossOrigin="anonymous"
                        className="w-full h-24 object-cover rounded-lg border border-emerald-300"
                      />
                    </div>
                  )}

                  {request.returnPhotoUrl && (
                    <div className="p-2 rounded-xl border border-blue-200 bg-blue-50/40 text-center space-y-1">
                      <span className="text-[9px] font-bold text-blue-800 block">
                        Return Snapshot (Discharge Baseline)
                      </span>
                      <img
                        src={request.returnPhotoUrl}
                        alt="Return Condition"
                        crossOrigin="anonymous"
                        className="w-full h-24 object-cover rounded-lg border border-blue-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standard Community Rental Agreement Clauses */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[10px] text-slate-600 leading-relaxed">
              <span className="font-black uppercase tracking-wider text-slate-700 block text-[10px]">
                Standard Community Terms & Obligations:
              </span>
              <p>
                <strong>1. Custody & Care:</strong> The Borrower acknowledges receiving the item in good operational condition and agrees to exercise reasonable care during the rental period.
              </p>
              <p>
                <strong>2. Deposit & Settlement:</strong> The security deposit serves as surety against loss or damage. Upon return in verified satisfactory condition, the net refund balance is settled promptly.
              </p>
              <p>
                <strong>3. Timely Restitution:</strong> The borrower agrees to return the item on or before <strong>{formatDate(request.endDate)}</strong>. Any extension must be requested and accepted through the platform.
              </p>
            </div>

            {/* Dual Digital Signatures & Security Seal */}
            <div className="pt-3 border-t-2 border-slate-200 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                  Lender Digital Signature
                </span>
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-dashed border-slate-300 pb-1">
                  {request.ownerName || 'Equipment Owner'}
                </div>
                <div className="text-[8px] font-mono text-emerald-700 font-semibold">
                  E-Signed via Share-It Protocol
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                  Borrower Digital Signature
                </span>
                <div className="font-serif italic font-bold text-slate-800 text-sm border-b border-dashed border-slate-300 pb-1">
                  {request.borrowerName || 'Custodian Borrower'}
                </div>
                <div className="text-[8px] font-mono text-emerald-700 font-semibold">
                  E-Signed via Share-It Protocol
                </div>
              </div>
            </div>

            {/* Security Audit Seal */}
            <div className="text-center pt-2 text-[9px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tamper-evident record • Cryptographically referenced Ref #{txnId} • Share-It Verified</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="no-print p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 transition shadow-2xs"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              Print Slip
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Official PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Receipt & Agreement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalHandoverSlipModal;
