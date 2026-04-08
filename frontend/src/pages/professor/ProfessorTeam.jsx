import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService, adminService } from '../../services/api';
import { ArrowLeft, Plus, Star, CheckCircle2, Clock, Circle, MessageSquare, FileText, Send, Calendar, Loader2 } from 'lucide-react';

export default function ProfessorTeam() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '', color: '#3b82f6' });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    try {
      const [tRes, tasksRes] = await Promise.all([
        teamService.getAll(), // Professor can see all teams then filter or there should be a getTeam(id)
        teamService.getTasks(teamId)
      ]);
      const foundTeam = tRes.data.find(t => t.id === teamId);
      setTeam(foundTeam);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error("Failed to fetch team data", err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title) return;
    try {
      // Logic for adding task through API would go here
      // For now, let's assume we can update task status or similar
      setShowAddTask(false);
      fetchData();
    } catch (err) { alert("Failed to add task"); }
  };

  const statusCols = ['todo', 'in_progress', 'completed'];
  const statusLabel = { todo: 'To Do', in_progress: 'In Progress', completed: 'Completed' };
  const statusIcon = { todo: Circle, in_progress: Clock, completed: CheckCircle2 };
  const statusColor = { todo: 'text-slate-400', in_progress: 'text-amber-500', completed: 'text-emerald-500' };

  const handleSaveEvaluation = (studentId) => {
    if (!scoreInput) return;
    team.students = team.students.map(s => 
      s.id === studentId ? { ...s, score: parseInt(scoreInput) } : s
    );
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSelectedStudent(null);
      setScoreInput('');
      setFeedbackInput('');
    }, 1500);
  };

  if (loading || !team) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/professor" className="btn-secondary text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{team.emoji} {team.name}</h2>
          <p className="text-sm text-slate-500">{team.projectTitle}</p>
        </div>
        <button onClick={() => setShowAddTask(true)} className="ml-auto btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
        <button 
          onClick={async () => {
            try {
              const res = await teamService.exportReport(teamId);
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `team_report_${teamId}.pdf`);
              document.body.appendChild(link);
              link.click();
            } catch (err) { alert("Report export failed"); }
          }}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-red-500" /> Export PDF
        </button>
        <a 
          href={teamService.getCalendarSyncUrl(teamId)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Calendar className="w-4 h-4 text-blue-500" /> Sync Calendar
        </a>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="card border-2 border-blue-100 dark:border-blue-800 animate-fade-in">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> New Task</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input placeholder="Task title *" value={newTask.title} onChange={e => setNewTask(n => ({ ...n, title: e.target.value }))} className="input" />
            <input placeholder="Description" value={newTask.description} onChange={e => setNewTask(n => ({ ...n, description: e.target.value }))} className="input" />
            <input type="date" value={newTask.deadline} onChange={e => setNewTask(n => ({ ...n, deadline: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Create Task</button>
            <button onClick={() => setShowAddTask(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusCols.map(col => {
              const Icon = statusIcon[col];
              const colTasks = tasks.filter(t => t.status === col);
              return (
                <div key={col} className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${statusColor[col]}`} />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{statusLabel[col]}</span>
                    <span className="ml-auto bg-white dark:bg-slate-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-card">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{task.title}</p>
                        {task.deadline && <p className="text-xs text-slate-400 mt-1">📅 {task.deadline}</p>}
                        {task.score && <p className="text-xs font-bold text-emerald-600 mt-1">⭐ {task.score}/100</p>}
                        {task.feedback && <p className="text-xs text-slate-400 mt-1 italic">💬 {task.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students Panel */}
        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Student Evaluations
          </h3>
          <div className="space-y-3">
            {team.students.map(student => (
              <div key={student.id}>
                <div
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedStudent === student.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}
                  onClick={() => setSelectedStudent(s => s === student.id ? null : student.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.tasksCompleted}/{student.tasksTotal} tasks done</p>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-white text-sm">{student.score}</span>
                </div>
                {selectedStudent === student.id && (
                  <div className="ml-12 mt-2 space-y-2 animate-fade-in">
                    <input type="number" placeholder="Score (0-100)" value={scoreInput} onChange={e => setScoreInput(e.target.value)} className="input text-sm" min="0" max="100" />
                    <input placeholder="Feedback..." value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} className="input text-sm" />
                    <button 
                      onClick={() => handleSaveEvaluation(student.id)}
                      className={`btn-primary text-xs w-full justify-center py-2 ${saveSuccess ? 'bg-emerald-500' : ''}`}
                    >
                      {saveSuccess ? '✅ Saved!' : <><Send className="w-3 h-3" /> Save Evaluation</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
