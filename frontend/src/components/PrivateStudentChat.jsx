import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { teamService } from '../services/api';
import { Send, Loader2, User, Paperclip, Mic, Trash2, Play, FileText, Download, MoreVertical, Edit2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const roleColor = { professor: 'from-purple-500 to-purple-600', assistant: 'from-emerald-500 to-emerald-600', student: 'from-blue-500 to-blue-600' };

export default function PrivateStudentChat({ teamId, student }) {
  const { user } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeRef = useRef(0);

  // Message Edit/Delete States
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleClickAway = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickAway);
    return () => window.removeEventListener('click', handleClickAway);
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(interval);
  }, [teamId, student.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          const newTime = t + 1;
          recordingTimeRef.current = newTime;
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const fetchMessages = async (isBackground = false) => {
    try {
      const res = await teamService.getMessages(teamId, student.id, user.id);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleUpdate = async (msgId) => {
    if (!editValue.trim() || !user) return;
    try {
      const updatedMessages = messages.map(m => 
        m.id === msgId ? { ...m, text: editValue } : m
      );
      setMessages(updatedMessages);
      setEditingMsgId(null);

      await teamService.updateMessage(teamId, msgId, { 
        sender_id: user.id || '', 
        text: editValue,
        team_id: teamId,
        type: 'text'
      });
      fetchMessages(true);
    } catch (err) {
      console.error("Failed to update message", err);
      alert("فشل تحديث الرسالة. يرجى المحاولة مرة أخرى.");
      fetchMessages(true);
    }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟") || !user) return;
    try {
      const isOptimistic = typeof msgId === 'number' && msgId > 1000000000000;
      setMessages(prev => prev.filter(m => m.id !== msgId));
      
      if (!isOptimistic) {
        await teamService.deleteMessage(teamId, msgId, user.id);
      }
      fetchMessages(true);
    } catch (err) {
      console.error("Failed to delete message", err);
      alert("فشل حذف الرسالة. يرجى المحاولة مرة أخرى.");
      fetchMessages(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const send = async (type = 'text', data = null) => {
    const domValue = textInputRef.current?.value?.trim() ?? '';
    const latestInput = domValue || input.trim();
    if (type === 'text' && !latestInput) return;

    const textToSend = type === 'text' ? latestInput : null;
    if (type === 'text') {
      setInput('');
      if (textInputRef.current) textInputRef.current.value = '';
    }

    // Optimistic update
    const optimisticId = Date.now();
    const optimisticMsg = {
      id: optimisticId,
      text: textToSend,
      type,
      is_own: true,
      sender: user.name,
      sender_id: user.id,
      role: user.role,
      time: new Date().toISOString(),
      ...data,
    };
    setMessages(m => [...m, optimisticMsg]);

    const payload = {
      team_id: teamId,
      sender_id: user.id,
      text: textToSend,
      type,
      ...data,
    };

    try {
      await teamService.sendMessage(teamId, payload, student.id);
    } catch (err) {
      setMessages(m => m.filter(msg => msg.id !== optimisticId));
      if (type === 'text') setInput(textToSend);
      alert("Failed to send message. Please try again.");
      console.error("Failed to send private message", err);
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          send('voice', { 
            url: reader.result, 
            duration: recordingTimeRef.current 
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Please allow microphone access to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = null;
    }
    setIsRecording(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const isImage = file.type.startsWith('image/');
      send(isImage ? 'image' : 'file', {
        url: event.target.result,
        file_name: file.name,
        file_size: (file.size / 1024).toFixed(1) + ' KB'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const AudioPlayer = ({ url, duration }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);
    
    useEffect(() => {
      audioRef.current = new Audio(url);
      const audio = audioRef.current;
      const handleEnd = () => setPlaying(false);
      audio.addEventListener('ended', handleEnd);
      return () => {
        audio.removeEventListener('ended', handleEnd);
        audio.pause();
      };
    }, [url]);

    const toggle = () => {
      if (!audioRef.current) return;
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
      }
      setPlaying(!playing);
    };

    return (
      <div className="flex items-center gap-3 min-w-[140px]">
        <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
          {playing ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Play className="w-4 h-4 fill-current text-white" />}
        </button>
        <div className="flex-1 flex items-end gap-0.5 h-4">
          {[1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2,1].map((h, i) => (
            <div key={i} className={`w-0.5 bg-current opacity-40 rounded-full ${playing ? 'animate-audio-bar' : ''}`} style={{ height: `${h * 20}%`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
        <span className="text-[10px] whitespace-nowrap opacity-80">{typeof duration === 'number' ? formatTime(duration) : duration}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[450px] border border-purple-100 dark:border-purple-900/40 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs">محادثة خاصة</div>
            <div className="text-[10px] opacity-80">{student.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[9px] font-medium uppercase tracking-tighter">نشط الآن</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-hide" dir="rtl">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
             <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3">
                <Send className="w-8 h-8 text-purple-300" />
             </div>
             <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
                لا توجد رسائل سابقة. ابدأ المحادثة الآن بشكل سري مع الطالب.
             </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = String(msg.sender_id) === String(user.id);
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
                <div className={`flex-1 flex flex-col ${isMe ? 'items-start' : 'items-end'} gap-1`}>
                  <div 
                    className={`max-w-[90%] group relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700/50 rounded-tl-sm'
                    } ${msg.type === 'image' ? 'p-1' : ''}`}
                  >
                  {/* Edit/Delete Menu Button */}
                  {((isMe && msg.type === 'text') || user.role === 'professor' || user.role === 'admin' || isMe) && !editingMsgId && (
                    <div className={`absolute top-1/2 ${isMe ? '-left-8' : '-right-8'} -translate-y-1/2 transition-opacity ${activeMenuId === msg.id ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100'}`}>
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
                          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 bg-white/50 dark:bg-slate-800/50 shadow-sm md:bg-transparent md:shadow-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeMenuId === msg.id && (
                          <div className={`absolute bottom-full ${isMe ? 'left-0' : 'right-0'} mb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl py-1 z-50 min-w-[120px] animate-fade-in`} onClick={e => e.stopPropagation()}>
                            {isMe && msg.type === 'text' && (
                              <button 
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingMsgId(msg.id); setEditValue(msg.text || ""); setActiveMenuId(null); }}
                                className="w-full text-right flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
                              >
                                <span>تعديل</span> <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(isMe || user.role === 'professor' || user.role === 'admin') && (
                              <button 
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(msg.id); setActiveMenuId(null); }}
                                className="w-full text-right flex items-center justify-between px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
                              >
                                <span>حذف</span> <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {editingMsgId === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-[180px]" onClick={e => e.stopPropagation()}>
                      <textarea 
                        value={editValue || ""}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 resize-none w-full"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                         <button type="button" onClick={(e) => { e.preventDefault(); setEditingMsgId(null); }} className="px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 text-[10px] font-bold">إلغاء</button>
                         <button type="button" onClick={(e) => { e.preventDefault(); handleUpdate(msg.id); }} className="px-2 py-1 bg-white text-purple-600 rounded-md hover:bg-purple-50 text-[10px] font-bold flex items-center gap-1">حفظ <CheckCircle2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ) : msg.type === 'voice' ? (
                      <AudioPlayer url={msg.url} duration={msg.duration} />
                    ) : msg.type === 'image' ? (
                      <img src={msg.url} alt="Uploaded" className="rounded-xl max-w-full h-auto max-h-40 object-cover" />
                    ) : msg.type === 'file' ? (
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate">{msg.file_name}</p>
                          <p className="text-[9px] opacity-70">{msg.file_size}</p>
                        </div>
                        <Download className="w-3.5 h-3.5 opacity-50" />
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-current">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1">
                    {new Date(msg.time || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 relative">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.zip" />
        
        {isRecording ? (
          <div className="flex items-center gap-3 animate-fade-in" dir="rtl">
            <button onClick={cancelRecording} className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors">
               <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{formatTime(recordingTime)}</span>
              <div className="flex-1 flex items-center gap-1 h-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 bg-purple-500/30 rounded-full animate-audio-bar" style={{ height: '100%', animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
            <button onClick={stopRecording} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2" dir="rtl">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-purple-500 transition-all"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
                <input
                  ref={textInputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.nativeEvent?.isComposing && send()}
                  placeholder="اكتب رسالتك الخاصة هنا..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none placeholder:text-slate-400 text-slate-700 dark:text-slate-200 transition-all"
                />
            </div>

            <button 
                onClick={startRecording} 
                className="p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button 
                onClick={() => send()} 
                disabled={!input.trim()}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
