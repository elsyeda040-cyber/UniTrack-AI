import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { userService } from '../../services/api';
import {
  Bell, CheckCheck, Trash2, Star, Clock, CheckCircle2, MessageSquare,
  Loader2, Heart, Reply, Send, X, ChevronDown, ChevronUp
} from 'lucide-react';

const typeConfig = {
  feedback: { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', label: 'تعليق جديد' },
  deadline: { icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', label: 'موعد نهائي' },
  task:     { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', label: 'مهمة' },
  score:    { icon: Star, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', label: 'تقييم' },
  chat:     { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', label: 'دردشة' },
};

// ========================
// Comment Detail Modal
// ========================
function CommentModal({ notif, onClose }) {
  const { user } = useApp();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(3);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [replies, setReplies] = useState([
    {
      id: 1,
      sender: 'Ahmed Mohamed',
      role: 'student',
      text: 'شكراً جزيلاً دكتور على التعليق.',
      time: 'منذ 3 دقائق',
      liked: false,
      likeCount: 1,
    },
  ]);

  const toggleLike = () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    const newReply = {
      id: Date.now(),
      sender: user?.name || 'You',
      role: user?.role || 'student',
      text: replyText.trim(),
      time: 'الآن',
      liked: false,
      likeCount: 0,
    };
    setReplies(r => [...r, newReply]);
    setReplyText('');
  };

  const toggleReplyLike = (id) => {
    setReplies(r => r.map(rep =>
      rep.id === id
        ? { ...rep, liked: !rep.liked, likeCount: rep.liked ? rep.likeCount - 1 : rep.likeCount + 1 }
        : rep
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-800 dark:text-white">تفاصيل التعليق</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Comment */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              د
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-white text-sm">د. حسن إبراهيم</span>
                <span className="text-xs text-slate-400 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">أستاذ</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {notif.message}
              </p>
              <p className="text-xs text-slate-400 mt-1.5">{notif.time}</p>
            </div>
          </div>

          {/* Like button for original comment */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
            >
              <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={() => setShowReplies(s => !s)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>{replies.length} رد</span>
              {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Replies */}
        {showReplies && (
          <div className="px-5 pb-3 space-y-3 max-h-52 overflow-y-auto scrollbar-hide">
            {replies.map(rep => (
              <div key={rep.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${rep.role === 'professor' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                  {(rep.sender || 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{rep.sender}</span>
                    <span className="text-[10px] text-slate-400">{rep.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{rep.text}</p>
                  <button
                    onClick={() => toggleReplyLike(rep.id)}
                    className={`flex items-center gap-1 mt-1.5 text-[11px] font-medium transition-colors ${rep.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                  >
                    <Heart className={`w-3 h-3 ${rep.liked ? 'fill-current' : ''}`} />
                    {rep.likeCount > 0 && <span>{rep.likeCount}</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(user?.name || 'A').charAt(0)}
            </div>
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              placeholder="اكتب رداً..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim()}
              className="w-7 h-7 bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// Main Notifications Page
// ========================
export default function StudentNotifications() {
  const { user, setNotifications } = useApp();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComment, setActiveComment] = useState(null); // notif to show in modal

  useEffect(() => {
    if (user?.id) {
      fetchNotifs();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchNotifs = async () => {
    try {
      const res = await userService.getNotifications(user.id);
      setNotifs(res.data);
      setNotifications(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    setNotifications(0);
  };

  const dismiss = (id) => {
    setNotifs(n => n.filter(x => x.id !== id));
  };

  const handleNotifClick = (notif) => {
    // Mark as read
    setNotifs(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
    setNotifications(prev => Math.max(0, prev - (notif.read ? 0 : 1)));

    // If it's a feedback/comment notification → open modal
    if (notif.type === 'feedback') {
      setActiveComment(notif);
    } else if (notif.type === 'chat') {
      navigate('/student/chat');
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" /> إشعارات
          {notifs.filter(n => !n.read).length > 0 && (
            <span className="badge badge-blue">{notifs.filter(n => !n.read).length} جديد</span>
          )}
        </h2>
        <button onClick={markAllRead} className="btn-secondary text-sm">
          <CheckCheck className="w-4 h-4" /> مارك الجميع يُقرأ
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifs.map(notif => {
          const cfg = typeConfig[notif.type] || typeConfig.feedback;
          const Icon = cfg.icon;
          const isClickable = notif.type === 'feedback';

          return (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                !notif.read
                  ? 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900 shadow-card'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
              } ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{notif.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-xs text-slate-400">{notif.time}</p>
                  {isClickable && (
                    <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
                      <Reply className="w-3 h-3" /> اضغط لعرض التعليق والرد
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {notifs.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">كل شيء على ما يرام!</p>
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        )}
      </div>

      {/* Comment Detail Modal */}
      {activeComment && (
        <CommentModal
          notif={activeComment}
          onClose={() => setActiveComment(null)}
        />
      )}
    </div>
  );
}
