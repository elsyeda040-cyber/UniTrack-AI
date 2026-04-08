import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { professorService, teamService } from '../../services/api';
import {
  Star, Award, TrendingUp, Users, Loader2, Save, CheckCircle,
  ChevronDown, ChevronUp, BookOpen, BarChart2, X, Edit3
} from 'lucide-react';

const GRADE_THRESHOLDS = [
  { min: 90, label: 'امتياز', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-900/50' },
  { min: 80, label: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900/50' },
  { min: 70, label: 'جيد', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-900/50' },
  { min: 60, label: 'مقبول', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-900/50' },
  { min: 0, label: 'راسب', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-900/50' },
];

function getGrade(score) {
  return GRADE_THRESHOLDS.find(t => score >= t.min) || GRADE_THRESHOLDS[4];
}

function GradeBar({ score }) {
  const grade = getGrade(score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: score >= 90 ? '#10b981' : score >= 80 ? '#3b82f6' : score >= 70 ? '#8b5cf6' : score >= 60 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-10 text-right">{score}</span>
    </div>
  );
}

export default function ProfessorGrades() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({}); // { studentId: { score, feedback } }
  const [editingStudent, setEditingStudent] = useState(null);
  const [saveStates, setSaveStates] = useState({});

  useEffect(() => {
    if (user?.id) fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    try {
      const res = await professorService.getTeams(user.id);
      const teamsData = res.data;
      setTeams(teamsData);
      if (teamsData.length > 0) {
        setSelectedTeam(teamsData[0]);
        await fetchTeamData(teamsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (teamId) => {
    try {
      const [allTeams] = await Promise.all([teamService.getAll()]);
      const found = allTeams.data.find(t => t.id === teamId);
      setTeamData(found);
      // Initialize grades from existing student scores
      if (found?.students) {
        const initial = {};
        found.students.forEach(s => {
          initial[s.id] = { score: s.score || 75, feedback: s.feedback || '' };
        });
        setGrades(initial);
      } else {
        // Mock students
        const mockStudents = [
          { id: 'ms1', name: 'أحمد محمد', email: 'ahmed@uni.edu', score: 88 },
          { id: 'ms2', name: 'سارة خالد', email: 'sara@uni.edu', score: 92 },
          { id: 'ms3', name: 'محمود علي', email: 'mahmoud@uni.edu', score: 65 },
          { id: 'ms4', name: 'نور حسن', email: 'nour@uni.edu', score: 78 },
        ];
        const initial = {};
        mockStudents.forEach(s => { initial[s.id] = { score: s.score, feedback: '' }; });
        setGrades(initial);
        setTeamData(prev => ({ ...prev, students: mockStudents }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    await fetchTeamData(team.id);
    setLoading(false);
  };

  const handleSaveGrade = async (studentId) => {
    setSaveStates(prev => ({ ...prev, [studentId]: 'saving' }));
    await new Promise(r => setTimeout(r, 600));
    setSaveStates(prev => ({ ...prev, [studentId]: 'saved' }));
    setEditingStudent(null);
    setTimeout(() => setSaveStates(prev => ({ ...prev, [studentId]: null })), 2000);
  };

  const students = teamData?.students || [];
  const avgScore = students.length > 0 && Object.keys(grades).length > 0
    ? Math.round(Object.values(grades).reduce((s, g) => s + (g.score || 0), 0) / Object.keys(grades).length)
    : 0;
  const topStudent = students.reduce((top, s) => {
    const score = grades[s.id]?.score || 0;
    return score > (grades[top?.id]?.score || 0) ? s : top;
  }, students[0]);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">الدرجات والتقييمات</h2>
        <p className="text-sm text-slate-500 mt-1">إدارة درجات ومراجعات الطلاب</p>
      </div>

      {/* Team Tabs */}
      <div className="flex gap-2 flex-wrap">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => handleSelectTeam(team)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              selectedTeam?.id === team.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
            }`}
          >
            <span>{team.emoji || '🚀'}</span> {team.name}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'متوسط الدرجات', value: `${avgScore}%`, icon: BarChart2, color: 'bg-purple-500' },
          { label: 'عدد الطلاب', value: students.length, icon: Users, color: 'bg-blue-500' },
          { label: 'أعلى درجة', value: Math.max(...Object.values(grades).map(g => g.score || 0), 0), icon: Star, color: 'bg-amber-500' },
          { label: 'أقل درجة', value: Math.min(...(Object.values(grades).map(g => g.score || 100)), 100), icon: TrendingUp, color: 'bg-rose-500' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Grade Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">توزيع الدرجات</h3>
        <div className="flex items-end gap-2 h-24">
          {GRADE_THRESHOLDS.slice().reverse().map(tier => {
            const count = Object.values(grades).filter(g => {
              const s = g.score || 0;
              const idx = GRADE_THRESHOLDS.indexOf(tier);
              const max = idx === 0 ? 100 : GRADE_THRESHOLDS[idx - 1].min - 1;
              return s >= tier.min && s <= max;
            }).length;
            const height = students.length > 0 ? (count / students.length) * 100 : 0;
            return (
              <div key={tier.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{count}</div>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(height, 4)}%`, background: tier.color.includes('emerald') ? '#10b981' : tier.color.includes('blue') ? '#3b82f6' : tier.color.includes('purple') ? '#8b5cf6' : tier.color.includes('amber') ? '#f59e0b' : '#ef4444' }} />
                <div className={`text-xs font-semibold ${tier.color}`}>{tier.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Grades List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-500" /> درجات الطلاب
          </h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {students.map((student, idx) => {
            const g = grades[student.id] || { score: 70, feedback: '' };
            const grade = getGrade(g.score || 0);
            const isEditing = editingStudent === student.id;
            const saveState = saveStates[student.id];

            return (
              <div key={student.id} className={`p-5 transition-all ${isEditing ? 'bg-purple-50/50 dark:bg-purple-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                <div className="flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                    alt={student.name}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm border-2 border-white dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800 dark:text-white">{student.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${grade.bg} ${grade.color} ${grade.border}`}>
                        {grade.label}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> الأول
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{student.email}</p>
                    <GradeBar score={g.score || 0} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {saveState === 'saved' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> تم الحفظ
                      </span>
                    ) : (
                      <button
                        onClick={() => setEditingStudent(isEditing ? null : student.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                          isEditing
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
                        }`}
                      >
                        {isEditing ? <><X className="w-4 h-4" /> إغلاق</> : <><Edit3 className="w-4 h-4" /> تعديل</>}
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">الدرجة (من 100)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={g.score || 0}
                            onChange={e => setGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], score: parseInt(e.target.value) } }))}
                            className="flex-1 accent-purple-600"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={g.score || 0}
                            onChange={e => setGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } }))}
                            className="w-16 px-2 py-1.5 text-sm font-bold border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">ملاحظات المشرف</label>
                        <input
                          value={g.feedback || ''}
                          onChange={e => setGrades(prev => ({ ...prev, [student.id]: { ...prev[student.id], feedback: e.target.value } }))}
                          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="أضف ملاحظة للطالب..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveGrade(student.id)}
                        disabled={saveState === 'saving'}
                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all"
                      >
                        {saveState === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ التقييم
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
