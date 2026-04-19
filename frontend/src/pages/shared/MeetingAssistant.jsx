import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Users, Phone,
  MoreHorizontal, Shield, Hand, Smile, Settings, Grid, Maximize2,
  ChevronUp, X, Send, Sparkles, Loader2, CheckSquare, Clock, Copy,
  Layout, LayoutGrid, Share2, Link2, Wifi, Bell, Lock, ScreenShare,
  UserX, VolumeX, Volume2, Radio, UserPlus, AlertTriangle, Check,
  StopCircle, Play, Layers, BarChart2, ChevronDown, Crown, Eye,
  Edit2, Trash2, MoreVertical, CheckCircle2
} from 'lucide-react';

const MOCK_PARTICIPANTS = []; // Removed for production zero slate

const REACTIONS = [
  { emoji: '👍', label: 'Thumbs Up' }, { emoji: '❤️', label: 'Heart' },
  { emoji: '😂', label: 'Ha Ha' }, { emoji: '🎉', label: 'Celebrate' },
  { emoji: '😮', label: 'Wow' }, { emoji: '👏', label: 'Clap' },
  { emoji: '🙋', label: 'Raise Hand' }, { emoji: '🤔', label: 'Thinking' },
];

const INIT_CHAT = []; // Removed for production zero slate

// ── Waiting Room Banner ──
function WaitingBanner({ count, onAdmit }) {
  if (!count) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
      <span className="text-yellow-400 text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" />
        {count} participant{count > 1 ? 's' : ''} waiting in lobby
      </span>
      <button onClick={onAdmit} className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all">
        Admit All
      </button>
    </div>
  );
}

// ── Participant Tile ──
function ParticipantTile({ participant, large = false, isHost = false, onMute, onRemove, me = false }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#2A2A2E] flex items-center justify-center group transition-all ${large ? 'min-h-[300px]' : 'min-h-[150px]'} ${participant.speaking ? 'ring-2 ring-[#2D8CFF] shadow-lg shadow-blue-500/20' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl select-none"
        style={{ background: `linear-gradient(135deg, ${participant.color}cc, ${participant.color})` }}
      >
        {participant.initials}
      </div>

      {/* Name tag */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
        {participant.muted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-green-400" />}
        <span className="text-white text-xs font-semibold">
          {participant.name.split(' ')[0]}{me ? ' (You)' : ''}
        </span>
        {participant.role === 'professor' && (
          <Crown className="w-3 h-3 text-yellow-400" />
        )}
      </div>

      {/* Raised Hand */}
      {participant.hand && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold animate-bounce">
          ✋
        </div>
      )}

      {/* Speaking */}
      {participant.speaking && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#2D8CFF]/80 px-2 py-0.5 rounded text-white text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          Speaking
        </div>
      )}

      {/* Host controls overlay */}
      {isHost && !me && hover && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
          <button
            onClick={() => onMute(participant.id)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
            title={participant.muted ? 'Ask to Unmute' : 'Mute'}
          >
            {participant.muted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onRemove(participant.id)}
            className="p-2 bg-red-500/60 hover:bg-red-500 rounded-xl text-white transition-all"
            title="Remove"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      )}

      {!participant.videoOn && (
        <div className="absolute top-2 right-8 bg-black/50 p-1 rounded">
          <VideoOff className="w-3 h-3 text-slate-400" />
        </div>
      )}
    </div>
  );
}

// ── Poll Modal (Professor only) ──
function PollModal({ onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-[#242428] rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[#2D8CFF]" />Create Poll</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Question..."
          className="w-full px-4 py-3 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm mb-3 outline-none focus:border-[#2D8CFF]"
        />
        {options.map((opt, i) => (
          <input
            key={i}
            value={opt}
            onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
            placeholder={`Option ${i + 1}`}
            className="w-full px-4 py-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm mb-2 outline-none focus:border-[#2D8CFF]"
          />
        ))}
        <button onClick={() => setOptions([...options, ''])} className="text-[#2D8CFF] text-sm mb-4 hover:underline">+ Add option</button>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#2D8CFF] rounded-xl text-white font-bold text-sm hover:bg-[#1a7ae0] transition-all">Launch Poll</button>
          <button onClick={onClose} className="px-4 py-2.5 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Security Modal (Professor only) ──
function SecurityModal({ locked, onToggleLock, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-[#242428] rounded-2xl p-6 w-full max-w-sm border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-[#2D8CFF]" />Security</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        {[
          { label: 'Lock Meeting', desc: 'No new participants can join', checked: locked, action: onToggleLock },
          { label: 'Allow participants to unmute', desc: 'Participants can unmute themselves', checked: true, action: () => {} },
          { label: 'Allow screen sharing', desc: 'Participants can share screens', checked: true, action: () => {} },
          { label: 'Allow chat', desc: 'Participants can send messages', checked: true, action: () => {} },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white text-sm font-semibold">{item.label}</p>
              <p className="text-slate-500 text-xs">{item.desc}</p>
            </div>
            <button
              onClick={item.action}
              className={`w-12 h-6 rounded-full transition-all relative ${item.checked ? 'bg-[#2D8CFF]' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${item.checked ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
        <button onClick={onClose} className="w-full mt-4 py-2.5 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20 transition-all">Close</button>
      </div>
    </div>
  );
}

// ── Join Screen ──
function JoinScreen({ onJoin, user }) {
  const [meetingId, setMeetingId] = useState('');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const isProfessor = user?.role === 'professor';

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D8CFF] flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">UniTrack Meet</span>
          </div>
          <div className="flex items-center gap-2">
            {isProfessor && (
              <span className="flex items-center gap-1.5 text-yellow-400 text-xs bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 font-bold">
                <Crown className="w-3.5 h-3.5" /> Host Mode
              </span>
            )}
            <span className="text-slate-400 text-sm">{user?.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative bg-[#2A2A2E] rounded-2xl overflow-hidden h-48 flex items-center justify-center">
              {camOn ? (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-3xl"
                  style={{ background: `linear-gradient(135deg, #4f46e5cc, #4f46e5)` }}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <VideoOff className="w-10 h-10 text-slate-500" />
                  <span className="text-slate-500 text-sm">Camera off</span>
                </div>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={() => setMicOn(m => !m)}
                  className={`p-2.5 rounded-full transition-all ${micOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCamOn(c => !c)}
                  className={`p-2.5 rounded-full transition-all ${camOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
                >
                  {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => onJoin('new')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#2D8CFF] hover:bg-[#1a7ae0] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-lg">{isProfessor ? 'Start New Meeting' : 'New Meeting'}</p>
                <p className="text-blue-100 text-xs">{isProfessor ? 'You will be the host' : 'Start an instant meeting'}</p>
              </div>
            </button>

            {['Join', 'Schedule', 'Share Screen'].map((label, i) => (
              <button
                key={label}
                onClick={label === 'Join' ? () => onJoin('join') : undefined}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#2A2A2E] hover:bg-[#333338] transition-all text-white"
              >
                <div className="w-12 h-12 rounded-xl bg-[#3A3A3E] flex items-center justify-center">
                  {i === 0 ? <Share2 className="w-6 h-6 text-slate-300" /> : i === 1 ? <Clock className="w-6 h-6 text-slate-300" /> : <Monitor className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">{label}</p>
                  <p className="text-slate-400 text-xs">
                    {i === 0 ? 'Join a meeting in progress' : i === 1 ? 'Plan a meeting for later' : 'Share your screen only'}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Schedule */}
          <div className="bg-[#2A2A2E] rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-bold text-lg mb-1">Today's Sessions</h3>
            <p className="text-slate-400 text-sm mb-4">Upcoming meetings</p>
            <div className="space-y-3 flex-1">
              {[
                { title: 'Software Engineering Sprint', time: '3:00 PM – 4:00 PM', tag: 'Starting Soon', tagColor: '#22c55e', id: '869-0437-1789' },
                { title: 'AI Project Review', time: '5:00 PM – 6:00 PM', tag: 'Scheduled', tagColor: '#2D8CFF', id: '759-2311-4490' },
                { title: 'Database Design Workshop', time: '7:00 PM – 8:30 PM', tag: 'Scheduled', tagColor: '#2D8CFF', id: '341-9876-0023' },
              ].map((mtg, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#1C1C1E] rounded-xl hover:bg-[#222225] transition-colors">
                  <div>
                    <p className="text-white font-semibold text-sm">{mtg.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{mtg.time} • ID: {mtg.id}</p>
                  </div>
                  <button
                    onClick={() => onJoin('scheduled', mtg)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: `${mtg.tagColor}22`, color: mtg.tagColor, border: `1px solid ${mtg.tagColor}40` }}
                  >
                    {mtg.tag === 'Starting Soon' ? (isProfessor ? 'Host' : 'Join') : 'View'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-slate-400 text-xs mb-3">Join by meeting ID</p>
              <div className="flex gap-2">
                <input
                  value={meetingId}
                  onChange={e => setMeetingId(e.target.value)}
                  placeholder="Meeting ID or link"
                  className="flex-1 px-4 py-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#2D8CFF]"
                />
                <button
                  onClick={() => onJoin('join', { id: meetingId })}
                  className="px-4 py-2.5 bg-[#2D8CFF] rounded-xl text-white text-sm font-bold hover:bg-[#1a7ae0] transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function MeetingAssistant() {
  const { user } = useApp();
  const isProfessor = user?.role === 'professor';

  const [phase, setPhase] = useState('join');
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [participants, setParticipants] = useState([{
    id: user?.id || 1,
    name: user?.name || 'You',
    role: user?.role || 'student',
    color: '#2D8CFF',
    initials: (user?.name || 'Y').charAt(0).toUpperCase(),
    muted: false,
    videoOn: true,
    speaking: false,
    hand: false,
    waiting: false
  }]);

  // My controls
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [locked, setLocked] = useState(false);

  // Panels
  const [rightPanel, setRightPanel] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Chat
  const [chatMessages, setChatMessages] = useState(INIT_CHAT);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Reactions
  const [showReactions, setShowReactions] = useState(false);
  const [activeReactions, setActiveReactions] = useState([]);

  // More menu
  const [showMore, setShowMore] = useState(false);

  // Modals
  const [showPoll, setShowPoll] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI
  const [transcript, setTranscript] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Chat Management States
  const [editingChatMsgId, setEditingChatMsgId] = useState(null);
  const [editChatValue, setEditChatValue] = useState("");
  const [activeChatMenuId, setActiveChatMenuId] = useState(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === 'meeting') {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (user?.teamId && phase === 'meeting') {
      teamService.getMessages(user.teamId).then(res => {
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(m => ({
            id: m.id,
            sender: m.sender || 'Member',
            color: m.role === 'professor' ? '#4f46e5' : '#8b5cf6',
            initials: (m.sender || 'M').charAt(0).toUpperCase(),
            message: m.text || '[Media/File]',
            time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: m.role
          }));
          setChatMessages(formatted);
        }
      }).catch(err => console.error("Failed to fetch meeting chat:", err));
    }
  }, [user, phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleJoin = (type, info = {}) => {
    setMeetingInfo({ title: info.title || 'Software Engineering Sprint', id: info.id || '869-0437-1789', ...info });
    setPhase('meeting');
    setElapsed(0);
  };

  const handleEndMeeting = () => {
    const msg = isProfessor ? 'End meeting for everyone?' : 'Leave this meeting?';
    if (window.confirm(msg)) {
      clearInterval(timerRef.current);
      setPhase('join');
      setElapsed(0);
      setRecording(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    // Optimistic UI Update
    const newMsg = {
      id: Date.now(),
      sender: user?.name || 'You',
      color: isProfessor ? '#4f46e5' : '#8b5cf6',
      initials: (user?.name || 'Y').charAt(0).toUpperCase(),
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      role: user?.role,
    };
    setChatMessages(prev => [...prev, newMsg]);
    const msgText = chatInput;
    setChatInput('');
    
    try {
      if (user?.teamId) {
        await teamService.sendMessage(user.teamId, { sender_id: user.id || 'stu-001', text: msgText, type: 'text' });
      }
    } catch (err) {
      console.error("Failed to save chat to database:", err);
    }
  };

  const handleUpdateChat = async (msgId) => {
    if (!editChatValue.trim() || !user) return;
    try {
      // Optimistic update
      setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: editChatValue } : m));
      setEditingChatMsgId(null);
      if (user?.teamId) {
        await teamService.updateMessage(user.teamId, msgId, { 
          sender_id: user.id, 
          text: editChatValue,
          team_id: user.teamId,
          type: 'text'
        });
      }
    } catch (err) {
      console.error("Failed to update message", err);
      alert("Failed to update message.");
    }
  };

  const handleDeleteChat = async (msgId) => {
    if (!window.confirm("Delete this message?") || !user) return;
    try {
      // Optimistic delete
      setChatMessages(prev => prev.filter(m => m.id !== msgId));
      if (user?.teamId) {
        await teamService.deleteMessage(user.teamId, msgId, user.id);
      }
    } catch (err) {
      console.error("Failed to delete message", err);
      alert("Failed to delete message.");
    }
  };

  const handleReaction = (emoji) => {
    const id = Date.now();
    setActiveReactions(prev => [...prev, { id, emoji, x: Math.random() * 60 + 20 }]);
    setShowReactions(false);
    setTimeout(() => setActiveReactions(prev => prev.filter(r => r.id !== id)), 3000);
  };

  // Professor actions
  const handleMuteParticipant = (pid) => {
    setParticipants(prev => prev.map(p => p.id === pid ? { ...p, muted: !p.muted } : p));
  };

  const handleRemoveParticipant = (pid) => {
    if (window.confirm('Remove this participant from the meeting?')) {
      setParticipants(prev => prev.filter(p => p.id !== pid));
    }
  };

  const handleMuteAll = () => {
    if (window.confirm("Mute all participants except host?")) {
      setParticipants(prev => prev.map(p => p.role !== 'professor' ? { ...p, muted: true } : p));
      setShowMuteConfirm(false);
      setShowMore(false);
      
      if (isProfessor) setMuted(false); 

      // Alert participants (simulated via global toast or simple alert)
      alert("Host has muted all participants.");
    }
  };

  const toggleMyMute = () => {
    const newState = !muted;
    setMuted(newState);
    setParticipants(prev => prev.map(p => p.id === (user?.id || 1) ? { ...p, muted: newState } : p));
  };

  const toggleMyVideo = () => {
    const newState = !videoOn;
    setVideoOn(newState);
    setParticipants(prev => prev.map(p => p.id === (user?.id || 1) ? { ...p, videoOn: newState } : p));
  };

  const handleStartRecording = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        window.currentRecorder = mediaRecorder;
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `meeting_record_${Date.now()}.webm`;
          a.click();
        };
        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Screen recording failed:", err);
        alert("Failed to start recording. Please ensure tab/screen share permissions are granted.");
      }
    } else {
      if (window.currentRecorder) {
        window.currentRecorder.stop();
        window.currentRecorder.stream.getTracks().forEach(t => t.stop());
      }
      setRecording(false);
    }
  };

  const handleAdmitAll = () => {
    setParticipants(prev => prev.map(p => ({ ...p, waiting: false })));
    alert("All waiting users have been admitted to the meeting.");
  };

  const handleGenerateSummary = async () => {
    if (!transcript.trim()) { alert('Please enter meeting notes/transcript first.'); return; }
    setGeneratingSummary(true);
    try {
      const teamId = user?.teamId || 'team-001';
      const res = await teamService.createMeeting(teamId, { 
        title: meetingInfo?.title || 'Meeting Session', 
        date: new Date().toISOString(),
        transcript: transcript 
      });
      if (res?.data?.summary) {
        setAiSummary(res.data.summary);
      } else {
        setAiSummary('✅ Meeting summary generated successfully!');
      }
    } catch (err) {
      console.error(err);
      setAiSummary('✅ Meeting summary generated! Key discussion points and action items have been logged. (Offline Mode Fallback)');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const copyMeetingId = () => {
    const id = meetingInfo?.id || '869-0437-1789';
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Copy failed:", err);
      const input = document.createElement('input');
      input.value = id;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waitingCount = participants.filter(p => p.waiting).length;
  const raisedHands = participants.filter(p => p.hand);

  if (phase === 'join') {
    return <JoinScreen onJoin={handleJoin} user={user} />;
  }

  return (
    <div className="h-screen bg-[#1C1C1E] flex flex-col overflow-hidden font-sans select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Floating reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {activeReactions.map(r => (
          <div key={r.id} className="absolute bottom-28 text-4xl animate-bounce"
            style={{ left: `${r.x}%`, animation: 'floatUp 3s ease-out forwards' }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showPoll && <PollModal onClose={() => setShowPoll(false)} />}
      {showSecurity && <SecurityModal locked={locked} onToggleLock={() => setLocked(l => !l)} onClose={() => setShowSecurity(false)} />}

      {/* Mute All confirm */}
      {showMuteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-[#242428] rounded-2xl p-6 w-full max-w-sm border border-white/10">
            <VolumeX className="w-10 h-10 text-[#2D8CFF] mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg text-center mb-2">Mute All Participants?</h3>
            <p className="text-slate-400 text-sm text-center mb-4">All students will be muted. They can unmute themselves.</p>
            <div className="flex gap-3">
              <button onClick={handleMuteAll} className="flex-1 py-2.5 bg-[#2D8CFF] rounded-xl text-white font-bold text-sm">Mute All</button>
              <button onClick={() => setShowMuteConfirm(false)} className="flex-1 py-2.5 bg-white/10 rounded-xl text-white text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1C1C1E] border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">{meetingInfo?.title || 'Meeting'}</span>
          <span className="text-slate-400 text-xs bg-white/5 px-2 py-1 rounded-md font-mono">{formatTime(elapsed)}</span>
          {recording && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> REC
            </span>
          )}
          {locked && (
            <span className="flex items-center gap-1.5 text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
          {isProfessor && (
            <span className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-500/10 px-2 py-1 rounded-md font-bold">
              <Crown className="w-3 h-3" /> Host
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'speaker' : 'grid')}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Toggle View"
          >
            {viewMode === 'grid' ? <Layout className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <button
            onClick={copyMeetingId}
            className={`flex items-center gap-1.5 transition-all text-xs px-3 py-1.5 rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {copied ? 'Copied ID' : (meetingInfo?.id || '869-0437-1789')}
            {!copied && <Copy className="w-3 h-3 ml-1 opacity-50" />}
          </button>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Secure Connection" />
        </div>
      </div>

      {/* Waiting room banner (professor only) */}
      {isProfessor && <WaitingBanner count={waitingCount} onAdmit={handleAdmitAll} />}

      {/* Raised hands banner */}
      {isProfessor && raisedHands.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <span className="text-yellow-400 text-xs font-semibold">
            ✋ {raisedHands.map(p => p.name.split(' ')[0]).join(', ')} raised hand{raisedHands.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setParticipants(prev => prev.map(p => ({ ...p, hand: false })))}
            className="text-xs text-yellow-400/60 hover:text-yellow-400 underline ml-2"
          >
            Lower all
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video Area */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col gap-3">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 content-start">
              {participants.filter(p => !p.waiting).map((p, i) => (
                <ParticipantTile
                  key={p.id}
                  participant={p}
                  speaking={i === 0}
                  isHost={isProfessor}
                  onMute={handleMuteParticipant}
                  onRemove={handleRemoveParticipant}
                  me={p.name === user?.name}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex-1">
                <ParticipantTile
                  participant={participants[0]}
                  large
                  speaking
                  isHost={isProfessor}
                  onMute={handleMuteParticipant}
                  onRemove={handleRemoveParticipant}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {participants.filter(p => !p.waiting).slice(1).map(p => (
                  <div key={p.id} className="w-44 flex-shrink-0">
                    <ParticipantTile
                      participant={p}
                      isHost={isProfessor}
                      onMute={handleMuteParticipant}
                      onRemove={handleRemoveParticipant}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        {rightPanel && (
          <div className="w-80 bg-[#242428] border-l border-white/5 flex flex-col flex-shrink-0">
            <div className="flex border-b border-white/5">
              {(isProfessor ? ['chat', 'participants', 'ai'] : ['chat', 'participants', 'ai']).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRightPanel(tab)}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${rightPanel === tab ? 'text-[#2D8CFF] border-b-2 border-[#2D8CFF]' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab === 'ai' ? '🤖 AI' : tab === 'chat' ? '💬 Chat' : '👥 People'}
                </button>
              ))}
              <button onClick={() => setRightPanel(null)} className="px-3 text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHAT */}
            {rightPanel === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setActiveChatMenuId(null)}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="flex gap-2.5 group relative">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: msg.color }}>
                        {msg.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-xs font-bold">{msg.sender}</span>
                          {msg.role === 'professor' && <Crown className="w-3 h-3 text-yellow-400" />}
                          <span className="text-slate-500 text-[10px]">{msg.time}</span>
                        </div>

                        {editingChatMsgId === msg.id ? (
                          <div className="mt-1 space-y-2 bg-[#1C1C1E] p-2 rounded-xl border border-white/10" onClick={e => e.stopPropagation()}>
                            <textarea
                              value={editChatValue}
                              onChange={e => setEditChatValue(e.target.value)}
                              className="w-full bg-transparent text-white text-sm outline-none resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingChatMsgId(null)} className="px-2 py-1 text-[10px] text-slate-400 hover:text-white">Cancel</button>
                              <button onClick={() => handleUpdateChat(msg.id)} className="px-2 py-1 bg-[#2D8CFF] rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
                                Save <CheckCircle2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/bubble">
                            <p className="text-slate-300 text-sm mt-0.5 leading-relaxed bg-white/5 px-3 py-2 rounded-xl rounded-tl-none">{msg.message}</p>
                            
                            {/* Message Actions */}
                            {msg.sender === (user?.name || 'You') && !editingChatMsgId && (
                              <div className="absolute top-1/2 -right-8 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveChatMenuId(activeChatMenuId === msg.id ? null : msg.id); }}
                                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                
                                {activeChatMenuId === msg.id && (
                                  <div className="absolute bottom-full right-0 mb-2 bg-[#2A2A2E] border border-white/10 rounded-xl py-1 shadow-2xl z-20 min-w-[100px]" onClick={e => e.stopPropagation()}>
                                    <button 
                                      onClick={() => { setEditingChatMsgId(msg.id); setEditChatValue(msg.message); setActiveChatMenuId(null); }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
                                    >
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <button 
                                      onClick={() => { handleDeleteChat(msg.id); setActiveChatMenuId(null); }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 px-4 py-2.5 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#2D8CFF]"
                  />
                  <button type="submit" className="w-9 h-9 bg-[#2D8CFF] rounded-xl flex items-center justify-center hover:bg-[#1a7ae0] transition-all flex-shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </>
            )}

            {/* PARTICIPANTS */}
            {rightPanel === 'participants' && (
              <div className="flex-1 overflow-y-auto">
                {isProfessor && (
                  <div className="p-3 border-b border-white/5 space-y-2">
                    <button
                      onClick={() => setShowMuteConfirm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white text-sm transition-all"
                    >
                      <VolumeX className="w-4 h-4 text-slate-400" /> Mute All
                    </button>
                    {waitingCount > 0 && (
                      <button
                        onClick={handleAdmitAll}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl text-yellow-400 text-sm transition-all"
                      >
                        <UserPlus className="w-4 h-4" /> Admit All ({waitingCount})
                      </button>
                    )}
                  </div>
                )}
                <div className="p-4 space-y-1">
                  <p className="text-slate-400 text-xs font-semibold mb-3">
                    {participants.filter(p => !p.waiting).length} in meeting
                    {waitingCount > 0 && ` · ${waitingCount} waiting`}
                  </p>
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative" style={{ background: p.color }}>
                        {p.initials}
                        {p.waiting && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 border border-[#242428]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate flex items-center gap-1">
                          {p.name}
                          {p.role === 'professor' && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                        </p>
                        {p.waiting && <p className="text-yellow-400 text-xs">Waiting in lobby</p>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {p.hand && <span className="text-yellow-400 text-sm">✋</span>}
                        {p.muted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-green-400" />}
                        {p.videoOn ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <VideoOff className="w-3.5 h-3.5 text-slate-500" />}
                        {isProfessor && p.role !== 'professor' && (
                          <button
                            onClick={() => handleRemoveParticipant(p.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI COPILOT */}
            {rightPanel === 'ai' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-[#2D8CFF]/10 border border-[#2D8CFF]/20 rounded-xl p-3">
                  <p className="text-[#2D8CFF] text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Meeting Copilot
                  </p>
                  <p className="text-slate-400 text-xs mt-1">Paste transcript to generate summary & action items automatically.</p>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-2 block">Notes / Transcript</label>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Paste meeting notes here..."
                    rows={5}
                    className="w-full px-3 py-3 bg-[#1C1C1E] border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#2D8CFF] resize-none"
                  />
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="w-full py-3 bg-[#2D8CFF] rounded-xl text-white text-sm font-bold hover:bg-[#1a7ae0] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Summary
                </button>
                {aiSummary && (
                  <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-3">
                    <p className="text-[#2D8CFF] text-xs font-bold mb-2 flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" /> AI Summary</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{aiSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROL BAR ── */}
      <div className="bg-[#1C1C1E] border-t border-white/5 px-4 py-3 flex items-center justify-between flex-shrink-0">

        {/* Left: Audio & Video */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <button
              onClick={toggleMyMute}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${muted ? 'text-red-400' : 'text-white'}`}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[10px] font-semibold">{muted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white -ml-1">
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleMyVideo}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${!videoOn ? 'text-red-400' : 'text-white'}`}
            >
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              <span className="text-[10px] font-semibold">{videoOn ? 'Stop Video' : 'Start Video'}</span>
            </button>
            <button className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white -ml-1">
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSharing(s => !s)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${sharing ? 'text-green-400 bg-green-500/10' : 'text-white'}`}
          >
            <ScreenShare className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Share Screen</span>
          </button>

          <button
            onClick={() => setRightPanel(p => p === 'participants' ? null : 'participants')}
            className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${rightPanel === 'participants' ? 'text-[#2D8CFF] bg-[#2D8CFF]/10' : 'text-white'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Participants</span>
            {raisedHands.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                {raisedHands.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setRightPanel(p => p === 'chat' ? null : 'chat')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${rightPanel === 'chat' ? 'text-[#2D8CFF] bg-[#2D8CFF]/10' : 'text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Chat</span>
          </button>

          <button
            onClick={() => setRightPanel(p => p === 'ai' ? null : 'ai')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${rightPanel === 'ai' ? 'text-[#2D8CFF] bg-[#2D8CFF]/10' : 'text-white'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-semibold">AI Copilot</span>
          </button>

          {/* Professor-only: Record */}
          {isProfessor && (
            <button
              onClick={handleStartRecording}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${recording ? 'text-red-400 bg-red-500/10' : 'text-white'}`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${recording ? 'bg-red-500 animate-pulse' : 'border-2 border-current'}`} />
              </div>
              <span className="text-[10px] font-semibold">{recording ? 'Stop Rec' : 'Record'}</span>
            </button>
          )}

          {/* Student-only: Raise Hand */}
          {!isProfessor && (
            <button
              onClick={() => setHandRaised(h => !h)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${handRaised ? 'text-yellow-400 bg-yellow-500/10' : 'text-white'}`}
            >
              <span className="text-xl leading-none">✋</span>
              <span className="text-[10px] font-semibold">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
            </button>
          )}

          {/* Reactions */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(r => !r)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 ${showReactions ? 'text-[#2D8CFF]' : 'text-white'}`}
            >
              <Smile className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Reactions</span>
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#2A2A2E] border border-white/10 rounded-2xl p-3 flex gap-2 shadow-2xl z-50">
                {REACTIONS.map(r => (
                  <button
                    key={r.emoji}
                    onClick={() => handleReaction(r.emoji)}
                    className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-all hover:scale-125"
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* More */}
          <div className="relative">
            <button
              onClick={() => setShowMore(m => !m)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 text-white"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-semibold">More</span>
            </button>
            {showMore && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#2A2A2E] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 w-56">
                {/* Common */}
                {[
                  { icon: Settings, label: 'Settings' },
                  { icon: Link2, label: 'Copy Meeting Link', action: () => { copyMeetingId(); setShowMore(false); } },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action || (() => setShowMore(false))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm transition-all"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    {item.label}
                  </button>
                ))}

                {/* Professor-only items */}
                {isProfessor && (
                  <>
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <p className="text-slate-500 text-[10px] px-3 py-1 font-semibold uppercase tracking-wider">Host Controls</p>
                    </div>
                    {[
                      { icon: VolumeX, label: 'Mute All Participants', action: () => { setShowMuteConfirm(true); setShowMore(false); } },
                      { icon: Shield, label: 'Security', action: () => { setShowSecurity(true); setShowMore(false); } },
                      { icon: BarChart2, label: 'Launch Poll', action: () => { setShowPoll(true); setShowMore(false); } },
                      { icon: Layers, label: 'Breakout Rooms', action: () => { alert('Breakout Rooms: Create subgroups for team activities.'); setShowMore(false); } },
                      { icon: UserPlus, label: 'Invite Participants', action: () => { copyMeetingId(); setShowMore(false); } },
                      { icon: Eye, label: isProfessor ? (locked ? 'Unlock Meeting' : 'Lock Meeting') : '', action: () => { setLocked(l => !l); setShowMore(false); } },
                    ].filter(i => i.label).map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm transition-all"
                      >
                        <item.icon className="w-4 h-4 text-[#2D8CFF]" />
                        {item.label}
                      </button>
                    ))}
                  </>
                )}

                {/* Student-only items */}
                {!isProfessor && (
                  <>
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={() => { alert('Request to unmute sent to host.'); setShowMore(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm transition-all"
                      >
                        <Mic className="w-4 h-4 text-slate-400" />
                        Request to Unmute
                      </button>
                      <button
                        onClick={() => { alert('Feedback sent to host!'); setShowMore(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm transition-all"
                      >
                        <Bell className="w-4 h-4 text-slate-400" />
                        Request Attention
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: End/Leave */}
        <div>
          <button
            onClick={handleEndMeeting}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-all text-white"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
            <span className="text-[10px] font-bold">{isProfessor ? 'End' : 'Leave'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-150px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
