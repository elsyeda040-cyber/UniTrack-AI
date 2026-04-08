import React, { useState, useEffect } from 'react';
import { communityService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Users, Zap, Search, Plus, Loader2, Award, ChevronRight, MessageCircle } from 'lucide-react';

export default function CommunityMarket() {
  const { user } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', bounty: 10 });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await communityService.getHelpRequests();
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentCredits = user?.credits || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Help Market</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">Inter-team collaboration marketplace. Share expertise, earn project credits.</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Your Balance</p>
            <p className="text-3xl font-black text-emerald-500">{currentCredits} <span className="text-sm">Pts</span></p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="w-full p-6 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" /> Post Request
          </button>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">Filter Market</h3>
            <div className="space-y-4">
              {['All Requests', 'High Bounty', 'Newest', 'Development', 'Design'].map((f, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20'}`}>
                   <span className="font-bold text-sm">{f}</span>
                   {i === 0 && <ChevronRight className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <Search className="w-5 h-5 text-slate-400 ml-4" />
            <input 
              placeholder="Search for problems to solve (e.g., Python, Docker, UI)..."
              className="bg-transparent border-none outline-none font-bold text-slate-600 dark:text-white w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              </div>
            ) : requests.length > 0 ? (
              requests.map((r) => (
                <div key={r.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition-all group relative overflow-hidden shadow-sm">
                   <div className="absolute top-0 right-0 p-4">
                      <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-black shadow-inner flex items-center gap-2">
                        <Award className="w-3 h-3" /> {r.bounty} Pts
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                         <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Team {r.team_id}</span>
                   </div>

                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">{r.title}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 line-clamp-3 font-medium leading-relaxed">
                     {r.description}
                   </p>

                   <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                      <button className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" /> Resolve
                      </button>
                      <button className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-emerald-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))
            ) : (
              <div className="col-span-full h-96 flex flex-col items-center justify-center text-center p-12 rounded-[3.5rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <ShoppingBag className="w-16 h-16 text-slate-200 mb-6" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Market is empty for now</h2>
                <p className="text-slate-400 max-w-xs">Be the first to post a help request or check back later for opportunities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
