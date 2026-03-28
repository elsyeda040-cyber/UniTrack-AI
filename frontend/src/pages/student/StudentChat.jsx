import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { Send, Paperclip, Mic, Trash2, Play, FileText, Download, Loader2, Sparkles, X } from 'lucide-react';

const roleColor = { professor: 'from-purple-500 to-purple-600', assistant: 'from-emerald-500 to-emerald-600', student: 'from-blue-500 to-blue-600' };

export default function StudentChat({ teamId: propTeamId, teamName: propTeamName }) {
  const { user, clearChatBadge } = useApp();
  const activeTeamId = propTeamId || user?.teamId;
  const activeTeamName = propTeamName || 'Workspace Chat';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  
  // AI Summary States
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    clearChatBadge();
  }, []);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null); // قراءة مباشرة من DOM لتجنب مشاكل IME على الموبايل

  useEffect(() => {
    if (!activeTeamId) {
      setLoading(false);
      return;
    }
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000); // 3-second polling
    return () => clearInterval(interval);
  }, [activeTeamId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeRef = useRef(0);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Use the native mimeType (fixes iOS/Safari playback issues)
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          send('voice', { 
            url: base64Audio, 
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
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = null; // Prevent sending
    }
    setIsRecording(false);
  };

  const fetchMessages = async (isBackground = false) => {
    try {
      const res = await teamService.getMessages(activeTeamId);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const send = async (type = 'text', data = null) => {
    // اقرأ مباشرة من DOM ref عشان تتجنب stale state على الموبايل مع IME/Autocorrect
    const domValue = textInputRef.current?.value?.trim() ?? '';
    const latestInput = domValue || input.trim();
    if (type === 'text' && !latestInput) return;

    const textToSend = type === 'text' ? latestInput : null;
    if (type === 'text') {
      setInput(''); // مسح الـ state
      if (textInputRef.current) textInputRef.current.value = ''; // مسح الـ DOM مباشرة
    }

    // Optimistic update: اعرض الرسالة فوراً بدون استنياء الـ backend
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
      team_id: activeTeamId,
      sender_id: user.id,
      text: textToSend,
      type,
      ...data,
    };

    try {
      await teamService.sendMessage(activeTeamId, payload);
      // لا حاجة لتحديث الرسالة - هي اتعرضت بالفعل من الـ local state
    } catch (err) {
      // لو فشل الإرسال، امسح الرسالة المؤقتة
      setMessages(m => m.filter(msg => msg.id !== optimisticId));
      if (type === 'text') setInput(textToSend); // رجّع النص للـ input
      alert("Failed to send message. Please try again.");
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSummary = async () => {
    if (!activeTeamId) return;
    setIsSummarizing(true);
    try {
      const res = await teamService.getChatSummary(activeTeamId);
      setSummary(res.data.summary);
      setShowSummary(true);
    } catch (err) {
      console.error("AI Summary failed", err);
    } finally {
      setIsSummarizing(false);
    }
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

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

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
          {playing ? <div className="w-3 h-3 bg-white rounded-sm" /> : <Play className="w-4 h-4 fill-current" />}
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md sticky top-0 z-10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColor[user.role] || 'from-blue-600 to-blue-700'} flex items-center justify-center text-white shadow-lg`}>
            {activeTeamName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{activeTeamName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Workspace</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleGetSummary}
          disabled={isSummarizing}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all font-medium text-xs group border border-blue-100 dark:border-blue-800"
        >
          {isSummarizing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
          <span>AI Summary</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-2 scrollbar-hide">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === user.id;
          const msgSender = isOwn ? user.name : (msg.sender || 'Member');
          const msgRole = isOwn ? user.role : (msg.role || 'student');
          return (
          <div key={msg.id || idx} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br ${roleColor[msgRole] || 'from-slate-400 to-slate-500'}`}>
              {(msgSender || 'U').charAt(0)}
            </div>
            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {!isOwn && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{msgSender}</p>}
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isOwn
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-card rounded-tl-sm'
              } ${msg.type === 'image' ? 'p-1' : ''}`}>
                {msg.type === 'voice' ? (
                  <AudioPlayer url={msg.url} duration={msg.duration} />
                ) : msg.type === 'image' ? (
                  <div className="space-y-2">
                    <img src={msg.url} alt="Uploaded" className="rounded-xl max-w-full h-auto max-h-60 object-cover" />
                  </div>
                ) : msg.type === 'file' ? (
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{msg.file_name}</p>
                      <p className="text-[10px] opacity-70">{msg.file_size}</p>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Download className="w-4 h-4" /></button>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tighter">
                {(() => {
                  const timeStr = msg.time || new Date().toISOString();
                  const dateObj = new Date(timeStr.endsWith('Z') ? timeStr : timeStr + 'Z');
                  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                })()}
              </p>
            </div>
          </div>
        )})}
        <div ref={bottomRef} />
      </div>

      <div className="card mt-4 flex items-center gap-3 py-3 overflow-hidden relative">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.zip" />
        
        {isRecording ? (
          <div className="flex-1 flex items-center gap-4 animate-fade-in">
            <button onClick={cancelRecording} className="p-2 rounded-xl hover:bg-red-50 text-red-400"><Trash2 className="w-5 h-5" /></button>
            <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{formatTime(recordingTime)}</span>
              <div className="flex-1 flex items-center gap-1 h-6">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="flex-1 bg-blue-500/30 rounded-full animate-audio-bar" style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            </div>
            <button onClick={stopRecording} className="w-9 h-9 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center text-white transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={textInputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.nativeEvent?.isComposing && send()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
            <button onClick={startRecording} className="p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button onClick={() => send()} className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center text-white transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowSummary(false)}>
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-800 dark:text-white">ملخص الشات (AI)</span>
              </div>
              <button 
                onClick={() => setShowSummary(false)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
            
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setShowSummary(false)}
                className="px-5 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg"
              >
                فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
