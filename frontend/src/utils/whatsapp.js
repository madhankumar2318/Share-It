/**
 * Sanitizes phone numbers into international WhatsApp format (defaulting to India +91)
 */
export const sanitizeIndianPhone = (phone) => {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, '');

  // 10 digits Indian mobile number (e.g. 9876543210 -> 919876543210)
  if (digits.length === 10) {
    return '91' + digits;
  }
  // 11 digits with leading 0 (e.g. 09876543210 -> 919876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return '91' + digits.slice(1);
  }
  // 12 digits starting with country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  // Fallback if international with country code
  if (digits.length >= 10) {
    return digits;
  }
  return null;
};

/**
 * Constructs secure WhatsApp Click-to-Chat URL with pre-filled message
 */
export const buildItemWhatsAppUrl = ({
  phone,
  itemName,
  ownerName,
  borrowerName,
  location,
  dates,
}) => {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone) return null;

  let text = `Hi ${ownerName || 'there'}! I saw your "${itemName || 'item'}" on Share-It.`;
  if (dates) {
    text += ` I'd like to check if it's available from ${dates}.`;
  } else {
    text += ` I would like to borrow it. Is it currently available for pickup?`;
  }
  if (location) {
    text += ` (Pickup: ${location})`;
  }
  if (borrowerName) {
    text += `\n— From ${borrowerName} on Share-It`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

/**
 * Constructs generic transaction chat URL (for borrower & lender in Dashboard)
 */
export const buildTransactionWhatsAppUrl = ({
  phone,
  recipientName,
  itemName,
  role, // 'borrower' | 'lender'
  myRoleName,
}) => {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone) return null;

  let text = `Hi ${recipientName || 'there'}! Regarding our Share-It request for "${itemName}":\n`;
  if (role === 'borrower') {
    text += `I'm coordinating the item pickup/return. When would be a good time to meet?`;
  } else {
    text += `I have a quick question about picking up the item.`;
  }
  if (myRoleName) {
    text += `\n— ${myRoleName}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

/**
 * Computes due-date status from an endDate string (YYYY-MM-DD).
 * Returns null if endDate is falsy.
 * Returns { type: 'ok'|'due'|'overdue', label: string, color: 'green'|'amber'|'red' }
 */
export const getDueDateStatus = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.round((end - today) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return { type: 'ok', label: `${diffDays} days remaining`, color: 'green' };
  if (diffDays === 1) return { type: 'ok', label: '1 day remaining', color: 'green' };
  if (diffDays === 0) return { type: 'due', label: 'Due Today', color: 'amber' };
  return { type: 'overdue', label: `Overdue by ${Math.abs(diffDays)} day(s)`, color: 'red' };
};

/**
 * Constructs a friendly return-ping WhatsApp URL for lenders to nudge borrowers.
 * Uses wa.me deep link — zero paid APIs, zero server-side calls.
 */
export const buildReturnPingWhatsAppUrl = ({ phone, borrowerName, itemTitle, endDate }) => {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone) return null;

  const message =
    `Hi ${borrowerName || 'there'}! Hope the "${itemTitle || 'item'}" was helpful! 😊 ` +
    `Just a gentle reminder that the scheduled return date is ${endDate}. ` +
    `Let me know what time works best for drop-off. ` +
    `Thank you for being an amazing neighbor! 🏠\n— via Share-It`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
