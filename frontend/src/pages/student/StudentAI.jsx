import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Lightbulb, BarChart2, BookOpen, Zap } from 'lucide-react';
import { aiService } from '../../services/api';

const suggestions = [
  { icon: Lightbulb, text: 'Suggest tasks for my AI Library project', color: 'text-amber-500 bg-amber-50' },
  { icon: BarChart2, text: 'Analyze my current project progress', color: 'text-blue-500 bg-blue-50' },
  { icon: BookOpen, text: 'Help me write the Analysis section of my report', color: 'text-purple-500 bg-purple-50' },
  { icon: Zap, text: 'What are the best practices for system design?', color: 'text-emerald-500 bg-emerald-50' },
];


export default function StudentAI() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: "مرحباً! أنا المساعد الذكي لمشروع التخرج الخاص بك والمدعوم من Google Gemini. يمكنني مساعدتك بخطط المشروع، الأكواد، الأبحاث القادمة. كيف يمكنني مساعدتك؟" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);



  const send = async (text) => {
    const domValue = textInputRef.current?.value?.trim() ?? '';
    const q = ((text ?? domValue) || input).trim();
    if (!q) return;

    setInput('');
    if (textInputRef.current && !text) textInputRef.current.value = '';
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: q }]);
    setLoading(true);

    try {
      const contextStr = "You are a specialized AI Assistant for university graduation projects. Answer concisely. Act as an expert advisor.";
      const res = await aiService.chat(q, contextStr);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: "عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي الخادم. يرجى التأكد من أن GEMINI_API_KEY معد بشكل صحيح في الخادم." }]);
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-slate-400">Powered by Google Gemini · Project Advisor</p>
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
          ref={textInputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.nativeEvent?.isComposing && send()}
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
