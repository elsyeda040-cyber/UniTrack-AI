import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { LayoutGrid, Target, Zap, Loader2, ArrowUpRight } from 'lucide-react';

export default function SkillMatrix() {
  const { user } = useApp();
  const [matrix, setMatrix] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(user.teamId || localStorage.getItem('lastSelectedTeamId'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (user.role === 'professor') {
        try {
          const res = await teamService.getAll();
          const supervised = res.data.filter(t => t.professor_id === user.id);
          setTeams(supervised);
          if (!selectedTeamId && supervised.length > 0) {
            setSelectedTeamId(supervised[0].id);
          } else if (supervised.length === 0) {
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed to fetch teams", err);
          setLoading(false);
        }
      } else if (user.teamId) {
        setSelectedTeamId(user.teamId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchMatrix();
    }
  }, [selectedTeamId]);

  const fetchMatrix = async () => {
    const tid = selectedTeamId || user.teamId;
    if (!tid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await teamService.getSkillMatrix(tid);
      setMatrix(res.data.matrix || []);
    } catch (err) {
      console.error(err);
      setMatrix([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-100 p-10 rounded-[4rem] text-slate-900 flex items-center justify-between shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32" />
         <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight mb-2">Skill Matrix Heatmap</h1>
             <div className="flex items-center gap-4">
               <p className="text-slate-500 font-medium">Visualization of team capabilities and expertise balance</p>
               {user.role === 'professor' && teams.length > 0 && (
                 <select 
                   value={selectedTeamId} 
                   onChange={(e) => {
                     setSelectedTeamId(e.target.value);
                     localStorage.setItem('lastSelectedTeamId', e.target.value);
                   }}
                   className="bg-indigo-50 border-none text-indigo-600 text-xs font-bold py-1 px-3 rounded-lg outline-none cursor-pointer"
                 >
                   {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
               )}
             </div>
         </div>
         <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl rotate-12">
            <LayoutGrid className="w-10 h-10" />
         </div>
      </div>

      {matrix.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {matrix.map((member, i) => (
              <div key={i} className="card group hover:scale-[1.02] transition-all bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-black text-xl">
                          {member.name.charAt(0)}
                       </div>
                       <div>
                          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">{member.name}</h3>
                          <div className="flex items-center gap-1">
                             <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                             <span className="text-[10px] font-bold text-slate-400">Expertise Level: {member.level}%</span>
                          </div>
                       </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${member.level > 85 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                       {member.level > 85 ? 'ELITE' : 'ADVANCED'}
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, j) => (
                       <span key={j} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 group-hover:border-indigo-300 transition-colors">
                          <Target className="w-3 h-3 text-indigo-500" />
                          {skill}
                       </span>
                    ))}
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="h-64 card flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 opacity-20 mb-2" />
          <p className="font-bold">No matrix data available for this team.</p>
        </div>
      )}
      
      <div className="card bg-slate-900 text-white p-8 flex items-center justify-between overflow-hidden relative">
         <div className="relative z-10">
            <h4 className="text-xl font-bold mb-2">Team Strategy Insight</h4>
            <p className="text-slate-400 text-sm max-w-lg">Your team shows high overlap in Python and Frontend development. Recommendation: Task the "Advanced" members with Research documentation to balance the workload.</p>
         </div>
         <ArrowUpRight className="w-12 h-12 text-indigo-500 opacity-50 relative z-10" />
         <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
      </div>
    </div>
  );
}
