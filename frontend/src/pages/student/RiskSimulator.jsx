import React, { useState } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Activity, AlertTriangle, Play, Loader2, Info } from 'lucide-react';

export default function RiskSimulator() {
  const { user } = useApp();
  const [delay, setDelay] = useState(0);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await teamService.simulateRisk(user.teamId, {
        team_id: user.teamId,
        hypothetical_delays: [{ task_id: 'hypothetical', delay_days: parseInt(delay) }]
      });
      setSimulation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-6 bg-slate-900 text-white overflow-hidden relative">
      <div className="flex items-center justify-between relative z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
               <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Risk Simulator</h3>
         </div>
         <div className="p-2 rounded-xl bg-slate-800 text-slate-400 group cursor-help">
            <Info className="w-4 h-4" />
            <div className="absolute top-12 right-0 w-48 p-3 bg-white text-slate-900 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold z-50 pointer-events-none">
               Simulate how hypothetical delays affect your project outcome.
            </div>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
         <div className="flex justify-between items-center text-xs font-bold">
            <label className="text-slate-400 uppercase tracking-widest">Global Delay (Days)</label>
            <span className="text-rose-400">{delay} days</span>
         </div>
         <input 
            type="range" min="0" max="30" value={delay}
            onChange={e => setDelay(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
         />
         <button 
           onClick={runSimulation}
           disabled={loading}
           className="w-full py-3 rounded-2xl bg-white text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50 transition-all"
         >
           {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-900" />} 
           Run "What-if" Analysis
         </button>
      </div>

      {simulation && (
         <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700 animate-slide-up relative z-10">
            <div className="flex items-center justify-between mb-3">
               <span className="text-[10px] font-black uppercase text-slate-500">Projected Risk</span>
               <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                  simulation.projected_risk === 'low' ? 'bg-emerald-500 text-white' : 
                  simulation.projected_risk === 'medium' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
               }`}>
                  {simulation.projected_risk}
               </span>
            </div>
            <p className="text-sm font-medium mb-2">{simulation.advice}</p>
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, simulation.impact_score)}%` }} 
               />
            </div>
         </div>
      )}

      {/* Decorative pulse */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
    </div>
  );
}
