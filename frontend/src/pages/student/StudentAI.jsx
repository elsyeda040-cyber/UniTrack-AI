import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Lightbulb, BarChart2, BookOpen, Zap } from 'lucide-react';

const suggestions = [
  { icon: Lightbulb, text: 'Suggest tasks for my AI Library project', color: 'text-amber-500 bg-amber-50' },
  { icon: BarChart2, text: 'Analyze my current project progress', color: 'text-blue-500 bg-blue-50' },
  { icon: BookOpen, text: 'Help me write the Analysis section of my report', color: 'text-purple-500 bg-purple-50' },
  { icon: Zap, text: 'What are the best practices for system design?', color: 'text-emerald-500 bg-emerald-50' },
];

const aiResponses = {
  default: "Hello! I'm your AI Project Assistant powered by Gemini. I can help you with task suggestions, report writing, progress analysis, and answering project questions. What would you like help with today?",
  tasks: "Here are suggested tasks for your AI Library System project:\n\n1. **Data Collection** - Gather library catalog datasets\n2. **Algorithm Design** - Design the recommendation engine\n3. **API Integration** - Connect with book databases (Google Books API)\n4. **User Authentication** - Implement secure login\n5. **Testing Suite** - Write unit and integration tests\n\nWould you like me to break down any of these into subtasks?",
  progress: "📊 **Progress Analysis for Team Alpha:**\n\n• Overall completion: **68%** (on track!)\n• Completed: Research & Analysis, System Design ✅\n• In Progress: UI/UX Prototype, Backend Development 🔄\n• Upcoming: Frontend, Testing\n\n⚠️ **Alert:** Backend Development deadline is approaching in 3 weeks. Consider prioritizing it.\n\n💡 **Recommendation:** Allocate more team members to Backend to avoid delays.",
};

export default function StudentAI() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: aiResponses.default }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getAIResponse = (q) => {
    if (q.toLowerCase().includes('task') || q.toLowerCase().includes('suggest')) return aiResponses.tasks;
    if (q.toLowerCase().includes('progress') || q.toLowerCase().includes('analyz')) return aiResponses.progress;
    return `Great question! Regarding "${q}" — based on best practices for graduation projects, I recommend breaking this into smaller milestones. Start with research and documentation, then move to implementation. Would you like a detailed action plan?`;
  };

  const send = async (text) => {
    // التقط القيمة الحالية فوراً من الـ ref أو من argument
    const q = (text ?? input).trim();
    if (!q) return;

    // امسح الـ input وأضف رسالة المستخدم قبل أي async operations
    setInput('');
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: q }]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 1200));
    const answer = getAIResponse(q);
    setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: answer }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-3 py-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 dark:text-white">Gemini AI Assistant</p>
          <p className="text-xs text-slate-400">Powered by Google Gemini · Project Advisor <span className="italic">(Demo Mode)</span></p>
        </div>
        <span className="ml-auto badge badge-purple">AI Active</span>
      </div>

      {/* Suggestions (shown when empty) */}
      {messages.length === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {suggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => send(s.text)}
                className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-card-hover transition-all text-left bg-white dark:bg-slate-800`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color} dark:bg-opacity-20`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">{s.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-xs lg:max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-card rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-700 shadow-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card mt-4 flex items-center gap-3 py-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Gemini anything about your project..."
          className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
        />
        <button onClick={() => send()} className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 hover:opacity-90 rounded-xl flex items-center justify-center text-white transition-all">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
