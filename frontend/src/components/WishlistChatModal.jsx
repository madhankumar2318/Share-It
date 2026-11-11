import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, X, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const WishlistChatModal = ({
  isOpen,
  onClose,
  offer,
  wishlistTitle,
  wishlistLocation,
  otherPartyName,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const offerId = offer?.id;

  const fetchMessages = async () => {
    if (!offerId) return;
    try {
      const response = await api.get(`/wishlists/offers/${offerId}/messages`);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to load wishlist chat messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && offerId) {
      setLoading(true);
      fetchMessages();
      // Polling every 3 seconds while chat modal is open
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
      setNewMessage('');
    }
  }, [isOpen, offerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setSending(true);
    try {
      const response = await api.post(`/wishlists/offers/${offerId}/messages`, {
        content: text,
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!isOpen || !offer) return null;

  const displayName = otherPartyName || offer.lenderName || 'Neighbor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[560px] max-h-[92vh] overflow-hidden border border-gray-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                Chat with {displayName}
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium truncate">
                Item: {wishlistTitle || 'Wishlist Request'}{' '}
                {wishlistLocation ? `• ${wishlistLocation}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition flex-shrink-0"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Privacy Banner */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Private In-App Conversation • Mobile numbers remain hidden</span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950">
          {loading ? (
            <div className="text-center py-16 text-xs text-gray-400 dark:text-gray-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-xs space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                Start your conversation!
              </p>
              <p className="max-w-xs mx-auto text-[11px]">
                Coordinate pickup location, time, or ask questions safely without sharing your phone number.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                      {isMine ? 'You' : msg.senderName || displayName}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">
                      • {timeStr}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm break-words ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-slate-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${displayName}...`}
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default WishlistChatModal;
