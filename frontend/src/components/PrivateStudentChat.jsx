import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { Send, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PrivateStudentChat({ teamId, student }) {
  const { user } = useApp();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [teamId, student.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await teamService.getMessages(teamId, student.id);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msgData = {
        sender_id: user.id,
        text: newMessage,
        type: 'text'
      };
      
      const res = await teamService.sendMessage(teamId, msgData, student.id);
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send private message", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] border border-purple-100 dark:border-purple-900/40 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 text-white flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <User className="w-4 h-4" />
        </div>
        <div className="font-semibold text-sm">شات خاص: {student.name}</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50" dir="rtl">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            لا توجد رسائل سابقة. ابدأ المحادثة الآن بطمأنة الطالب وتوجيهه بخصوص مهامه بشكل سري، ولن يرى باقي الطلاب هذه المحادثة! 🤫
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    isMe 
                    ? 'bg-purple-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/50 shadow-sm rounded-tl-sm'
                  }`}
                >
                  <div className="text-[13px] break-words prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] pr-1 mt-1 font-medium text-right ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2" dir="rtl">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك الخاصة هنا للطالب..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 text-sm focus:ring-0 outline-none placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || sending}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
