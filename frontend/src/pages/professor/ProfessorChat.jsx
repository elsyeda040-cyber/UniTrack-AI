import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import StudentChat from '../student/StudentChat';
import PrivateStudentChat from '../../components/PrivateStudentChat';
import { Loader2, Users, User, Hash, MessageSquare } from 'lucide-react';

export default function ProfessorChat() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamStudents, setTeamStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('global'); // 'global' or student object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamService.getAll();
      const myTeams = res.data.filter(t => t.professor_id === user.id);
      setTeams(myTeams);
      if (myTeams.length > 0) handleTeamSelect(myTeams[0]);
    } catch (err) {
      console.error("Failed to fetch professor teams", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = async (team) => {
    setSelectedTeam(team);
    setSelectedStudent('global');
    try {
      // Fetch detailed team to get students
      const res = await teamService.getTeam(team.id);
      setTeamStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to fetch team students", err);
      setTeamStudents([]);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 animate-fade-in" dir="rtl">
      {/* 1. Teams Sidebar */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2 px-1 text-right">
          <Users className="w-5 h-5 text-purple-500" /> الفرق الخاصة بي
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pl-1 custom-scrollbar">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => handleTeamSelect(team)}
              className={`w-full text-right p-3 rounded-xl transition-all ${
                selectedTeam?.id === team.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
              }`}
            >
              <p className="font-semibold text-sm truncate">{team.name}</p>
              <p className={`text-xs truncate mt-0.5 ${selectedTeam?.id === team.id ? 'text-purple-200' : 'text-slate-400'}`}>
                {team.project_title}
              </p>
            </button>
          ))}
          {!loading && teams.length === 0 && (
            <p className="text-sm text-slate-400 p-2 text-center italic">لا يوجد فرق مسندة حالياً</p>
          )}
        </div>
      </div>

      {/* 2. Channels Sidebar (Global + Private DMs) */}
      {selectedTeam && (
        <div className="w-full md:w-60 flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-2 px-2 mt-2 text-right italic opacity-70">القنوات</h3>
          
          <button
            onClick={() => setSelectedStudent('global')}
            className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center gap-3 ${
              selectedStudent === 'global'
                ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white'
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Hash className="w-4 h-4 opacity-70" />
            <span className="text-sm">الشات الجماعي للمشروع</span>
          </button>

          <div className="pt-3 pb-1 px-2 border-t border-slate-200 dark:border-slate-700/50 mt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">المحادثات الخاصة بالطلاب</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {teamStudents.length > 0 ? teamStudents.map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStudent(st)}
                className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                  selectedStudent?.id === st.id
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold border border-purple-100 dark:border-purple-800/30'
                    : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 text-xs font-bold shadow-sm">
                  {st.name.charAt(0)}
                </div>
                <span className="text-sm truncate">{st.name}</span>
              </button>
            )) : (
              <div className="p-4 text-center">
                 <Loader2 className="w-4 h-4 animate-spin text-slate-300 mx-auto" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Chat View */}
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
        {selectedTeam ? (
          <div className="h-full relative [&>div]:h-full [&>div]:border-none [&>div]:shadow-none">
            {selectedStudent === 'global' ? (
              <StudentChat teamId={selectedTeam.id} teamName={`${selectedTeam.name}`} />
            ) : (
              <PrivateStudentChat teamId={selectedTeam.id} student={selectedStudent} />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
            <h4 className="font-bold text-slate-600 dark:text-slate-400 mb-1">ابدأ المحادثة</h4>
            <p className="text-sm opacity-70">اختر فريقاً من القائمة الجانبية للبدء في التواصل مع الطلاب أو الفريق بأكمله.</p>
          </div>
        )}
      </div>
    </div>
  );
}
