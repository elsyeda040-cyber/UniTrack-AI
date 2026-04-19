import React, { useState } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Mic, Play, FileAudio, CheckCircle, AlertTriangle, MessageSquare, Loader2, Sparkles } from 'lucide-react';

export default function PresentationCoach() {
  const { user } = useApp();
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const startAnalysis = async () => {
    setAnalyzing(true);
    try {
      // In a real scenario, we might upload a file. 
      // For now, we simulate the analysis request to the backend.
      const res = await teamService.reviewPresentation({
        user_id: user.id,
        team_id: user.teamId,
        title: `Rehearsal - ${new Date().toLocaleDateString()}`,
        score: Math.floor(Math.random() * 20) + 75, // Simulated score for now
        review_json: JSON.stringify({
          tone: "Professional and clear",
          speed: "Perfectly paced",
          key_points: ["Excellent structure", "Strong conclusion"],
          recommendations: ["Work on hand gestures", "Slightly more eye contact"]
        })
      });
      setFeedback({ ...res.data, review: JSON.parse(res.data.review_json) });
    } catch (err) {
      console.error(err);
      alert("Failed to analyze presentation.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Mic className="w-8 h-8" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white">Presentation Coach</h1>
               <p className="text-slate-400 font-medium">Elevate your public speaking with AI insights</p>
            </div>
         </div>
         <button 
           onClick={() => setRecording(!recording)}
           className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${recording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
         >
           {recording ? 'Stop Recording' : <><Mic className="w-5 h-5" /> Start Coaching</>}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="card h-[400px] flex flex-col items-center justify-center border-dashed border-2">
            <div className="w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
               <FileAudio className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">Record or Upload your rehearsal</p>
            <button 
              onClick={startAnalysis}
              disabled={analyzing}
              className="mt-6 px-10 py-4 rounded-2xl bg-indigo-600 text-white font-bold flex items-center gap-3 hover:scale-105 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Analyze My Performance
            </button>
         </div>

         <div className="space-y-6">
            {feedback ? (
               <div className="card space-y-6 border-l-8 border-indigo-500 animate-slide-up">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-bold">AI Feedback Report</h3>
                     <span className="px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 font-black text-2xl">
                        {feedback.score}/100
                     </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Tone & Clarity</p>
                        <p className="font-medium">{feedback.review.tone}</p>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pacing</p>
                        <p className="font-medium">{feedback.review.speed}</p>
                     </div>
                  </div>

                  <div>
                     <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Strong Points
                     </p>
                     <ul className="space-y-2">
                        {feedback.review.key_points.map((p, i) => (
                           <li key={i} className="text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                              {p}
                           </li>
                        ))}
                     </ul>
                  </div>

                  <div>
                     <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Recommendations
                     </p>
                     <ul className="space-y-2">
                        {feedback.review.recommendations.map((p, i) => (
                           <li key={i} className="text-sm font-medium bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                              {p}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            ) : (
               <div className="card h-full flex flex-col items-center justify-center opacity-40">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p className="font-bold">No Analysis Yet</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
