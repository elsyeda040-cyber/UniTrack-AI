import React, { useState } from 'react';
import { teamService } from '../../services/api';
import { Code, Bug, Zap, Shield, FileText, Loader2, Play } from 'lucide-react';

export default function CodeMentor() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  const startReview = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await teamService.reviewCode(code, language);
      setReview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
               <Code className="w-8 h-8" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white">AI Code Mentor</h1>
               <p className="text-slate-400 font-medium">Automatic review & best practices guide</p>
            </div>
         </div>
         <select 
           value={language} 
           onChange={e => setLanguage(e.target.value)}
           className="px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
         >
           <option value="javascript">JavaScript</option>
           <option value="python">Python</option>
           <option value="java">Java</option>
           <option value="cpp">C++</option>
         </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="flex flex-col gap-4">
            <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative">
               <textarea 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="// Paste your code here..."
                  className="w-full h-full bg-transparent border-none outline-none font-mono text-emerald-400 resize-none"
               />
               <button 
                  onClick={startReview}
                  disabled={loading}
                  className="absolute bottom-6 right-6 px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />} Review Code
               </button>
            </div>
         </div>

         <div className="space-y-6">
            {review ? (
               <div className="space-y-6 animate-slide-up">
                  <div className="card border-l-8 border-emerald-500">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Bug className="w-5 h-5 text-rose-500" /> AI Report Card</h3>
                        <span className="badge badge-green">Score: {review.score}%</span>
                     </div>
                     <div className="space-y-3">
                        {review.issues.map((issue, i) => (
                           <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-2">
                                 <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${issue.severity === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {issue.severity} {issue.type}
                                 </span>
                                 <span className="text-xs text-slate-400">Line {issue.line}</span>
                              </div>
                              <p className="text-sm font-medium mb-3">{issue.text}</p>
                              {issue.fix && (
                                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Suggested Fix</p>
                                    <code className="text-xs font-mono">{issue.fix}</code>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="card h-full flex flex-col items-center justify-center border-dashed opacity-40">
                  <Zap className="w-16 h-16 mb-4" />
                  <p className="font-bold">Waiting for your code...</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
