import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { teamService } from '../../services/api';
import { CheckCircle2, Clock, Circle, MessageSquare, ChevronDown, ChevronUp, Upload, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusCols = [
  { key: 'todo', label: 'To Do', color: 'border-slate-300', bg: 'bg-slate-50 dark:bg-slate-700/30', icon: Circle, iconColor: 'text-slate-400' },
  { key: 'in_progress', label: 'In Progress', color: 'border-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10', icon: Clock, iconColor: 'text-amber-500' },
  { key: 'completed', label: 'Completed', color: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: CheckCircle2, iconColor: 'text-emerald-500' },
];

const MOCK_TASKS = [
  { id: 101, title: 'Draft Research Proposal', status: 'completed', description: 'Complete the initial draft of the methodology section', deadline: '2026-03-15', score: 95, feedback: 'Excellent depth of research. Proceed to next phase.' },
  { id: 102, title: 'System Architecture Design', status: 'in_progress', description: 'Design database schema and component diagrams', deadline: '2026-04-05' },
  { id: 103, title: 'Frontend UI Implementation', status: 'in_progress', description: 'Build responsive React components following Figma', deadline: '2026-04-10' },
  { id: 104, title: 'Backend API Integration', status: 'todo', description: 'Connect frontend actions to Node.js backend endpoints', deadline: '2026-04-20' },
  { id: 105, title: 'User Testing', status: 'todo', description: 'Conduct usability tests with 5 students', deadline: '2026-04-25' },
];

function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-card-hover transition-all cursor-pointer">
      <div className="p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{task.title}</h4>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{task.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">📅 {task.deadline}</span>
          {task.score && <span className="text-xs font-bold text-emerald-600">⭐ {task.score}/100</span>}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-3 animate-fade-in">
          {task.feedback && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">📝 Professor Feedback</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{task.feedback}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); navigate('/student/files'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentTasks() {
  const { user } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const res = await teamService.getTasks(user.teamId);
      if (res.data && res.data.length > 0) {
        setTasks(res.data);
      } else {
        setTasks(MOCK_TASKS);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setTasks(MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Task Board</h2>
          <p className="text-sm text-slate-500 mt-0.5">Project Tracking Central</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-blue">{tasks.length} Tasks Total</span>
          <button 
            onClick={() => alert('New Task modal will open here!')}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key} className={`rounded-2xl border-t-4 ${col.color} ${col.bg} p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-4 h-4 ${col.iconColor}`} />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{col.label}</h3>
                <span className="ml-auto bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No tasks here</div>
                ) : (
                  colTasks.map(task => <TaskCard key={task.id} task={task} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
