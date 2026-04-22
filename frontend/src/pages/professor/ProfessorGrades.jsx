import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { professorService, teamService } from '../../services/api';
import {
  Star, Users, Loader2, Save, CheckCircle,
  BookOpen, BarChart2, X, Edit3, AlertTriangle, RefreshCcw
} from 'lucide-react';

// --- Constants & Helpers ---
const GRADE_THRESHOLDS = [
  { min: 90, label: 'امتياز', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { min: 80, label: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { min: 70, label: 'جيد', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { min: 60, label: 'مقبول', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { min: 0, label: 'راسب', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const getGradeInfo = (score) => {
  const s = Number(score) || 0;
  return GRADE_THRESHOLDS.find(t => s >= t.min) || GRADE_THRESHOLDS[4];
};

// --- Sub-Components ---
const StatCard = ({ id, label, value, icon: Icon, color, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
      isActive 
        ? 'border-primary-500 bg-primary-50/50' 
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
    }`}
  >
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
  </div>
);

const GradeProgressBar = ({ score }) => {
  const s = Math.min(100, Math.max(0, Number(score) || 0));
  const color = s >= 90 ? 'bg-emerald-500' : s >= 80 ? 'bg-blue-500' : s >= 70 ? 'bg-purple-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 rounded-full ${color}`} 
          style={{ width: `${s}%` }} 
        />
      </div>
      <span className="text-xs font-bold text-slate-500 min-w-[24px]">{s}%</span>
    </div>
  );
};

// --- Main Component ---
export default function ProfessorGrades() {
  const { user } = useApp();
  const navigate = useNavigate();
  
  // State
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesMap, setGradesMap] = useState({}); // { studentId: { score, feedback } }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({}); // { studentId: 'idle' | 'saving' | 'success' | 'error' }
  const [filter, setFilter] = useState('all');

  // Fetch Logic
  const loadData = useCallback(async (isSilent = false) => {
    if (!user?.id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Get Professor's Teams
      const teamsRes = await professorService.getTeams(user.id);
      const teamsData = teamsRes.data || [];
      setTeams(teamsData);

      if (teamsData.length > 0) {
        const currentTeam = selectedTeam || teamsData[0];
        if (!selectedTeam) setSelectedTeam(currentTeam);

        // 2. Get All Teams to find specific details (members/scores)
        const allRes = await teamService.getAll();
        const foundTeam = (allRes.data || []).find(t => t.id === currentTeam.id);

        if (foundTeam?.students) {
          setStudents(foundTeam.students);
          
          // Sync grades map
          const newMap = {};
          foundTeam.students.forEach(s => {
            if (s?.id) {
              newMap[s.id] = { 
                score: s.credits || 0, 
                feedback: s.feedback || '' 
              };
            }
          });
          setGradesMap(newMap);
        } else {
          setStudents([]);
          setGradesMap({});
        }
      }
    } catch (err) {
      console.error("Critical: Failed to load grades data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleSave = async (studentId) => {
    const data = gradesMap[studentId];
    if (!data) return;

    setSaveStatus(prev => ({ ...prev, [studentId]: 'saving' }));
    try {
      await teamService.updateStudentEvaluation(studentId, {
        score: Number(data.score),
        feedback: data.feedback
      });
      
      setSaveStatus(prev => ({ ...prev, [studentId]: 'success' }));
      setEditingId(null);
      
      // Refresh data to ensure everything is synced
      setTimeout(() => loadData(true), 500);
    } catch (err) {
      console.error("Save failed", err);
      setSaveStatus(prev => ({ ...prev, [studentId]: 'error' }));
      alert("حدث خطأ أثناء الحفظ. يرجى التأكد من اتصال الإنترنت.");
    } finally {
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [studentId]: 'idle' })), 3000);
    }
  };

  // Calculations (Safe)
  const filteredStudents = students.filter(s => {
    const score = gradesMap[s.id]?.score || 0;
    if (filter === 'high') return score >= 85;
    if (filter === 'low') return score < 60;
    if (filter === 'avg') return score >= 60 && score < 85;
    return true;
  });

  const scoresArray = Object.values(gradesMap).map(g => Number(g?.score) || 0);
  const avgScore = scoresArray.length > 0 
    ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) 
    : 0;
  const maxScore = scoresArray.length > 0 ? Math.max(...scoresArray) : 0;
  const minScore = scoresArray.length > 0 ? Math.min(...scoresArray) : 0;

  // Render Helpers
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      <p className="text-slate-500 font-medium animate-pulse">جاري تحميل سجل الدرجات...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-500" /> الدرجات والتقييم
          </h1>
          <p className="text-slate-500 mt-1">إدارة وتحليل أداء الطلاب في الفرق الأكاديمية</p>
        </div>
        <button 
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> تحديث البيانات
        </button>
      </div>

      {/* Team Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedTeam(t); setFilter('all'); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${
              selectedTeam?.id === t.id 
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-primary-300'
            }`}
          >
            <span>{t.emoji || '🚀'}</span> {t.name}
          </button>
        ))}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard id="all" label="إجمالي الطلاب" value={students.length} icon={Users} color="bg-blue-500" isActive={filter === 'all'} onClick={() => setFilter('all')} />
        <StatCard id="avg" label="متوسط الأداء" value={`${avgScore}%`} icon={BarChart2} color="bg-purple-500" isActive={filter === 'avg'} onClick={() => setFilter('avg')} />
        <StatCard id="high" label="أعلى درجة" value={maxScore} icon={Star} color="bg-amber-500" isActive={filter === 'high'} onClick={() => setFilter('high')} />
        <StatCard id="low" label="أقل درجة" value={minScore} icon={AlertTriangle} color="bg-rose-500" isActive={filter === 'low'} onClick={() => setFilter('low')} />
      </div>

      {/* Distribution Chart (Simple Implementation) */}
      <div className="card p-6 bg-white dark:bg-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary-500" /> توزيع الدرجات التقديري
        </h3>
        <div className="flex items-end gap-3 h-32 px-2">
          {GRADE_THRESHOLDS.slice().reverse().map((tier, idx) => {
            const count = scoresArray.filter(s => {
              const nextTier = GRADE_THRESHOLDS.slice().reverse()[idx + 1];
              return nextTier ? (s >= tier.min && s < nextTier.min) : (s >= tier.min);
            }).length;
            const percentage = students.length > 0 ? (count / students.length) * 100 : 0;
            return (
              <div key={tier.label} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="absolute -top-6 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{count} طالب</div>
                <div 
                  className={`w-full rounded-t-lg transition-all duration-700 ${tier.color.replace('text', 'bg')}`} 
                  style={{ height: `${Math.max(percentage, 5)}%` }}
                />
                <span className={`text-[10px] font-bold ${tier.color}`}>{tier.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">قائمة طلاب الفريق</h3>
          <span className="text-xs text-slate-400">عرض {filteredStudents.length} من أصل {students.length}</span>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {filteredStudents.length > 0 ? filteredStudents.map((student, index) => {
            const currentData = gradesMap[student.id] || { score: 0, feedback: '' };
            const gradeInfo = getGradeInfo(currentData.score);
            const isEditing = editingId === student.id;
            const status = saveStatus[student.id] || 'idle';

            return (
              <div key={student.id || index} className={`p-4 md:p-6 transition-all ${isEditing ? 'bg-primary-50/20 ring-2 ring-inset ring-primary-100' : 'hover:bg-slate-50/50'}`}>
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 font-black text-lg shadow-inner">
                      {(student?.name || 'S').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate">{student?.name || 'اسم غير معروف'}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${gradeInfo.bg} ${gradeInfo.color} ${gradeInfo.border}`}>
                          {gradeInfo.label}
                        </span>
                      </div>
                      <GradeProgressBar score={currentData.score} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    {status === 'success' ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold animate-fade-in">
                        <CheckCircle className="w-4 h-4" /> تم التحديث
                      </span>
                    ) : status === 'saving' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : (
                      <button
                        onClick={() => setEditingId(isEditing ? null : student.id)}
                        className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-slate-200 text-slate-600' : 'bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600'}`}
                      >
                        {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الدرجة النهائية (100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentData.score}
                          onChange={(e) => setGradesMap(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], score: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-400 outline-none font-bold text-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الملاحظات والتقييم</label>
                        <input
                          type="text"
                          placeholder="اكتب ملاحظاتك للطالب هنا..."
                          value={currentData.feedback}
                          onChange={(e) => setGradesMap(prev => ({
                            ...prev,
                            [student.id]: { ...prev[student.id], feedback: e.target.value }
                          }))}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-400 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSave(student.id)}
                        disabled={status === 'saving'}
                        className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> حفظ التغييرات
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">لا يوجد طلاب في هذا الفريق حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
