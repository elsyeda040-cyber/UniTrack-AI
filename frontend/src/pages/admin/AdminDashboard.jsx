import React, { useState, useEffect } from 'react';
import { adminService, teamService } from '../../services/api';
import { Shield, Loader2, Star, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, teamsRes, usersRes] = await Promise.all([
          adminService.getStats(),
          teamService.getAll(),
          adminService.getUsers()
        ]);
        setStats(statsRes.data);
        setTeams(teamsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );

  // Derive professors for the top visual cards
  const professors = users.filter(u => u.role === 'professor').slice(0, 3);
  const colorByIdx = ['from-blue-500 to-indigo-600', 'from-slate-700 to-slate-900', 'from-orange-400 to-orange-500'];

  // Filter teams based on selected professor
  const displayedTeams = selectedProfessor ? teams.filter(t => t.professor_id === selectedProfessor.id) : teams;

  return (
    <div className="space-y-6 animate-fade-in pb-8 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          مساحة الإدارة
        </h2>
        <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
          مساحة الإدارة / الرئيسية
        </div>
      </div>

      {/* Top Cards (Professors) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {professors.map((prof, idx) => {
          const isSelected = selectedProfessor?.id === prof.id;
          return (
            <div 
              key={prof.id} 
              onClick={() => setSelectedProfessor(isSelected ? null : prof)}
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-slate-100 dark:border-slate-700'} overflow-hidden group hover:shadow-md transition-all cursor-pointer`}
            >
              <div className={`h-24 bg-gradient-to-r ${colorByIdx[idx % 3]} relative`}>
                 <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-lg p-1.5 text-white">
                   <Shield className="w-5 h-5" />
                 </div>
              </div>
              <div className="p-5 pt-0 relative">
                <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-slate-800 bg-slate-100 -mt-8 mb-3 overflow-hidden shadow-sm">
                   <img src={`https://ui-avatars.com/api/?name=${prof.name}&background=random`} alt={prof.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{prof.name}</h3>
                <p className="text-sm text-slate-500 mb-3 font-medium capitalize">عضو هيئة تدريس / مشرف</p>
                
                {/* Stars to mock ratings as per ui */}
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < (4+Math.random()) ? 'fill-current' : 'fill-transparent border-yellow-400'}`} strokeWidth={i >= 4 ? 2 : 0} />
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                   <span className="font-semibold">الفرق المشرف عليها</span>
                   <span className="font-bold text-slate-700 dark:text-slate-300">
                     {teams.filter(t => t.professor_id === prof.id).length} فرق
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

     {/* List Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mt-8">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {selectedProfessor ? `الفرق الخاصة بـ ${selectedProfessor.name}` : 'جميع الفرق المسجلة'}
            </h3>
            <button 
              onClick={() => setSelectedProfessor(null)}
              className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              عرض كل الفرق
            </button>
         </div>
         
         <div className="space-y-4">
           {displayedTeams.length === 0 ? (
              <p className="text-center text-slate-500 py-8">لا يوجد فرق مخصصة حالياً.</p>
           ) : displayedTeams.map(team => {
             const isExpanded = expandedTeamId === team.id;
             const statusColor = team.progress === 100 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 
                               team.progress >= 50 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200';
             const statusText = team.progress === 100 ? 'مكتمل' : team.progress >= 50 ? 'قيد التطوير' : 'في الانتظار';
             
             // Extract team students
             let teamStudents = users.filter(u => u.role === 'student' && String(u.teamId) === String(team.id));
             if (teamStudents.length === 0) {
                // Mock students for visual testing if DB relations are empty
                teamStudents = [
                  { id: `mock1-${team.id}`, name: 'أحمد محمود', email: 'ahmed@student.edu', rating: 4.8 },
                  { id: `mock2-${team.id}`, name: 'سارة خالد', email: 'sara@student.edu', rating: 4.5 }
                ];
             }

             return (
               <div key={team.id} className="rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all bg-white dark:bg-slate-800 overflow-hidden">
                 
                 {/* Main Row */}
                 <div 
                   onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                   className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors gap-4"
                 >
                   {/* Identity Info */}
                   <div className="flex items-center gap-4 min-w-[250px]">
                     <img src={`https://ui-avatars.com/api/?name=${team.name}&background=random`} alt={team.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                     <div>
                       <h4 className="font-bold text-slate-800 dark:text-white text-sm">{team.name}</h4>
                       <p className="text-xs text-slate-500 mt-0.5">{team.project_title}</p>
                     </div>
                   </div>

                   {/* Progress Bar */}
                   <div className="flex-1 w-full max-w-sm px-4">
                     <div className="flex justify-between text-xs mb-1.5">
                       <span className="text-slate-500 font-medium">التقدم</span>
                       <span className="font-bold text-slate-700 dark:text-slate-200">{team.progress}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{width: `${team.progress}%`}} />
                     </div>
                   </div>

                   {/* Status Badge */}
                   <div className="w-32 flex justify-end">
                     <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-1.5 w-full ${statusColor}`}>
                       {team.progress === 100 ? <CheckCircle className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                       {statusText}
                     </span>
                   </div>
                 </div>

                 {/* Expanded Details Section */}
                 {isExpanded && (
                   <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4">أعضاء الفريق والتقييمات</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                             <div className="flex items-center gap-3">
                               <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt={student.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" />
                               <div>
                                 <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</p>
                                 <p className="text-xs text-slate-500">{student.email}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                               <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500">{student.rating || '4.5'}</span>
                               <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                             </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                         <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">ملخص تطور الفريق</p>
                            <p className="text-xs text-slate-500 mt-1">يتم احتساب هذا التقدم بناءً على المهام المنجزة ومراجعات المشرف.</p>
                         </div>
                         <div className="text-left">
                           <p className="text-2xl font-black text-blue-600">{team.progress}%</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Success</p>
                         </div>
                      </div>
                   </div>
                 )}
               </div>
             )
           })}
         </div>
      </div>
    </div>
  );
}
