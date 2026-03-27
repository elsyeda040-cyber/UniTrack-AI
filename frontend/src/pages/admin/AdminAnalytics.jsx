import React, { useState, useEffect } from 'react';
import { adminService, teamService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Loader2, Star, Filter, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { PROGRESS_HISTORY } from '../../data/mockData';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  const topPerformers = users.slice(0, 3);
  const teamProgressData = teams.map(t => ({ name: t.name.split(' ').pop() || t.name, progress: t.progress }));
  
  // Mock data for the pie chart to match the image "Overdue vs Completed"
  const taskStatusData = [
    { name: 'متأخر', value: 64, color: '#f43f5e' },
    { name: 'قيد التنفيذ', value: 202, color: '#3b82f6' },
    { name: 'مكتمل', value: 366, color: '#10b981' }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">نظرة عامة على النجاح</h2>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 text-sm text-slate-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-medium">
             <Filter className="w-4 h-4" /> تصفية النتائج
           </button>
        </div>
      </div>

      {/* Top Cards (Performers) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topPerformers.map((user, idx) => (
          <div key={user.id || idx} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${idx===0 ? 'from-blue-400 to-blue-600' : idx===1 ? 'from-emerald-400 to-emerald-600' : 'from-orange-400 to-orange-500'}`} />
            
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white dark:border-slate-700 shadow-sm mb-3 mt-2 overflow-hidden">
               <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">{user.name}</h3>
            <p className="text-xs text-slate-500 mb-2">{user.role.toUpperCase()}</p>
            <div className="flex gap-1 text-yellow-400 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'fill-current' : 'fill-transparent border-yellow-400'}`} strokeWidth={i >= 4 ? 2 : 0} />)}
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 mt-1">
              أداء متميز
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Line Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">تحليلات الأداء (شهرياً)</h3>
            <span className="text-xs text-slate-500 border rounded px-2 py-1">آخر 6 أشهر</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PROGRESS_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={4} dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} name="المهام المنجزة" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">حالة المهام</h3>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie 
                  data={taskStatusData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={80} 
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">632</span>
              <span className="text-xs text-slate-500">مهمة إجمالية</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
             {taskStatusData.map(item => (
               <div key={item.name} className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                 </div>
                 <span className="font-bold text-slate-800 dark:text-white">{item.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Student Progress Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">تقدم الفرق (%)</h3>
          <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProgressData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} domain={[0, 100]} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} name="نسبة التقدم">
                  {teamProgressData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Progress Mini List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">نبذة عن الفرق</h3>
          <div className="space-y-4">
            {teams.slice(0, 4).map((team, idx) => (
              <div key={team.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${idx===0 ? 'bg-blue-500' : idx===1 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                     {idx===0 ? <Shield className="w-5 h-5"/> : idx===1 ? <CheckCircle className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                   </div>
                   <div>
                     <p className="font-bold text-sm text-slate-800 dark:text-white">{team.name}</p>
                     <p className="text-xs text-slate-500">{team.project_title}</p>
                   </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-slate-800 dark:text-white text-sm whitespace-nowrap">{team.progress}% إنجاز</span>
                  <span className="text-xs text-slate-400">آخر تحديث اليوم</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
