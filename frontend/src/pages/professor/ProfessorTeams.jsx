import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professorService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Users, ChevronRight, Loader2, Search } from 'lucide-react';

export default function ProfessorTeams() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await professorService.getTeams(user.id);
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.project_title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-black">Supervised Teams</h1>
         <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium"
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredTeams.map(team => (
            <div 
              key={team.id} 
              onClick={() => navigate(`/professor/team/${team.id}`)}
              className="card group cursor-pointer hover:border-purple-500 transition-all"
            >
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: team.color + '20' }}>
                     {team.emoji}
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 dark:text-white">{team.name}</h3>
                     <p className="text-xs text-slate-400">{team.project_title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-all" />
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>Progress</span>
                     <span>{team.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${team.progress}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                     <Users className="w-3.5 h-3.5" />
                     <span>{team.students?.length || 0} Students</span>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
