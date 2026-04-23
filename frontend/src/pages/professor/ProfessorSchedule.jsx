import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { professorService } from '../../services/api';
import {
  Calendar, Clock, Plus, X, Loader2, Video, Users,
  ChevronLeft, ChevronRight, CheckCircle, Bell, Trash2
} from 'lucide-react';

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const MEETING_TYPES = {
  review: { label: 'مراجعة دورية', color: '#8b5cf6', icon: '📋' },
  presentation: { label: 'عرض تقديمي', color: '#3b82f6', icon: '🎯' },
  consultation: { label: 'استشارة', color: '#10b981', icon: '💬' },
  submission: { label: 'تسليم مشروع', color: '#f59e0b', icon: '📤' },
  exam: { label: 'امتحان', color: '#ef4444', icon: '📝' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function ProfessorSchedule() {
  const { user } = useApp();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [meetings, setMeetings] = useState([]);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    type: 'review',
    teamId: '',
    teamName: '',
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    time: '09:00',
    duration: '60',
    notes: '',
  });

  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        try {
          const [teamsRes, eventsRes] = await Promise.all([
            professorService.getTeams(user.id),
            professorService.getEvents(user.id)
          ]);
          setTeams(teamsRes.data || []);
          
          // Map backend events to internal UI format
          const mapped = (eventsRes.data || []).map(e => {
            const d = new Date(e.date);
            return {
              ...e,
              day: d.getDate(),
              month: d.getMonth(),
              year: d.getFullYear(),
              time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
            };
          });
          setMeetings(mapped);
        } catch (err) {
          console.error("Failed to load schedule data", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user?.id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getMeetingsForDay = (day) => meetings.filter(m => m.day === day && m.month === month && m.year === year);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      // Construct ISO date: YYYY-MM-DDTHH:MM
      const isoDate = new Date(newMeeting.year, newMeeting.month, newMeeting.day, ...newMeeting.time.split(':')).toISOString();
      
      const payload = {
        team_id: newMeeting.teamId,
        title: newMeeting.title,
        description: newMeeting.notes,
        date: isoDate,
        type: newMeeting.type === 'review' ? 'milestone' : 'meeting', // align with backend types
        color: MEETING_TYPES[newMeeting.type]?.color || '#3b82f6'
      };

      const res = await teamService.createEvent(payload);
      
      const mappedNew = {
        ...res.data,
        day: newMeeting.day,
        month: newMeeting.month,
        year: newMeeting.year,
        time: newMeeting.time,
        teamName: teams.find(t => t.id === newMeeting.teamId)?.name || 'فريق غير محدد'
      };

      setMeetings(prev => [...prev, mappedNew]);
      setShowModal(false);
      setNewMeeting({ title: '', type: 'review', teamId: '', teamName: '', day: new Date().getDate(), month: new Date().getMonth(), year: new Date().getFullYear(), time: '09:00', duration: '60', notes: '' });
      alert("تمت إضافة الموعد بنجاح!");
    } catch (err) {
      console.error(err);
      alert("فشل إضافة الموعد. يرجى التأكد من اختيار الفريق.");
    }
  };

  const handleDeleteMeeting = async (id) => {
    // Current backend doesn't have delete event endpoint yet, adding it for consistency
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const today = new Date();
  const upcomingMeetings = meetings
    .filter(m => new Date(m.year, m.month, m.day) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => new Date(a.year, a.month, a.day, ...a.time.split(':')) - new Date(b.year, b.month, b.day, ...b.time.split(':')))
    .slice(0, 5);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">جدول المواعيد</h2>
          <p className="text-sm text-slate-500 mt-1">تنظيم اجتماعاتك مع الفرق</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> موعد جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {MONTHS_AR[month]} {year}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_AR.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d.slice(0, 2)}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsForDay(day);
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                    isToday ? 'bg-purple-600 text-white shadow-sm' :
                    isSelected ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400' :
                    'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {day}
                  {dayMeetings.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5 justify-center">
                      {dayMeetings.slice(0, 3).map(m => (
                        <div key={m.id} className="w-1.5 h-1.5 rounded-full" style={{ background: MEETING_TYPES[m.type]?.color || '#8b5cf6' }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          {selectedDay && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3">
                مواعيد يوم {selectedDay} {MONTHS_AR[month]}
              </h4>
              {getMeetingsForDay(selectedDay).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">لا يوجد مواعيد في هذا اليوم</p>
              ) : (
                <div className="space-y-2">
                  {getMeetingsForDay(selectedDay).map(m => {
                    const typeCfg = MEETING_TYPES[m.type] || MEETING_TYPES.review;
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: typeCfg.color + '20' }}>
                          {typeCfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{m.title}</p>
                          <p className="text-xs text-slate-500">{m.teamName} · {m.time} · {m.duration} دقيقة</p>
                        </div>
                        <button onClick={() => handleDeleteMeeting(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-500" /> المواعيد القادمة
            </h3>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">لا يوجد مواعيد قادمة</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map(m => {
                  const typeCfg = MEETING_TYPES[m.type] || MEETING_TYPES.review;
                  const isToday = m.day === today.getDate() && m.month === today.getMonth() && m.year === today.getFullYear();
                  return (
                    <div key={m.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: typeCfg.color + '20' }}>
                          {typeCfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{m.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.teamName}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isToday ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                              {isToday ? 'اليوم' : `${m.day} ${MONTHS_AR[m.month]}`}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {m.time}
                            </span>
                          </div>
                          {m.notes && <p className="text-xs text-slate-400 mt-1 italic">💬 {m.notes}</p>}
                        </div>
                        <button onClick={() => handleDeleteMeeting(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meeting Type Legend */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">أنواع المواعيد</h4>
            <div className="space-y-2">
              {Object.entries(MEETING_TYPES).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span>{cfg.icon} {cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" /> موعد جديد
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">عنوان الموعد *</label>
                <input required value={newMeeting.title} onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: مراجعة تقدم المشروع" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">النوع</label>
                  <select value={newMeeting.type} onChange={e => setNewMeeting(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {Object.entries(MEETING_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                {teams.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">الفريق</label>
                    <select value={newMeeting.teamId} onChange={e => setNewMeeting(p => ({ ...p, teamId: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">اختر فريق</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">اليوم</label>
                  <input type="number" min="1" max="31" value={newMeeting.day} onChange={e => setNewMeeting(p => ({ ...p, day: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">الوقت</label>
                  <input type="time" value={newMeeting.time} onChange={e => setNewMeeting(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">المدة (د)</label>
                  <input type="number" min="15" max="240" step="15" value={newMeeting.duration} onChange={e => setNewMeeting(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ملاحظات</label>
                <textarea rows={2} value={newMeeting.notes} onChange={e => setNewMeeting(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="أي ملاحظات إضافية..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">إلغاء</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
                  <CheckCircle className="w-4 h-4" /> إضافة الموعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
