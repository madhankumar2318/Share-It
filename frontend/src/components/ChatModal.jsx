import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, X, MessageSquare, Clock } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, request }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!request) return;
    try {
      const response = await api.get(`/messages/request/${request.id}`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load chat messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && request) {
      fetchMessages();
      // Polling for new messages every 3 seconds while chat modal is open
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, request]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await api.post(`/messages/request/${request.id}`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !request) return null;

  const isLender = user?.id === request.ownerId;
  const otherPartyName = isLender ? request.borrowerName : request.ownerName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[550px] overflow-hidden border border-gray-100">
        {/* Chat Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Chat with {otherPartyName}</h3>
              <p className="text-[11px] text-emerald-100 font-medium">Item: {request.itemTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-600">No messages yet</p>
              <p>Say hello to coordinate pickup spot, timing, or ask questions!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-gray-400 mb-0.5 px-1 font-medium">
                    {isMine ? 'You' : msg.senderName}
                  </div>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
