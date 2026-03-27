import React, { useState, useEffect } from 'react';
import { adminService, teamService } from '../../services/api';
import { Plus, Search, Trash2, Mail, Users, BookOpen, GraduationCap, Loader2, X } from 'lucide-react';

export default function AdminUsers() {
  const [tab, setTab] = useState('professors');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student', bio: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        adminService.getUsers(),
        teamService.getAll()
      ]);
      setUsers(uRes.data);
      setTeams(tRes.data);
    } catch (err) {
      console.error("Failed to fetch admin users data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    // Simulate API call for adding user
    const newUserObj = {
      id: Date.now(),
      ...newUser,
      teamId: null,
    };
    setUsers([newUserObj, ...users]); // Add to beginning of list
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', email: '', role: 'student', bio: '' });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const professors = filteredUsers.filter(u => u.role === 'professor');
  const students = filteredUsers.filter(u => u.role === 'student');

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Management</h2>
        <button onClick={() => setIsAddUserModalOpen(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-700">
        {[['professors', BookOpen, 'Professors'], ['students', GraduationCap, 'Students'], ['teams', Users, 'Teams']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === key ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-9" />
      </div>

      {/* Content */}
      {tab === 'professors' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Supervisor</th>
                <th className="pb-3 font-semibold">Teams</th>
                <th className="pb-3 font-semibold">Rating</th>
                <th className="pb-3 font-semibold"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {professors.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">{p.name}</td>
                    <td className="py-3 text-slate-400"><Mail className="w-3.5 h-3.5 inline mr-1" />{p.email}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 capitalize">{p.role}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-200">
                      {teams.filter(t => t.professor_id === p.id).length}
                    </td>
                    <td className="py-3 font-bold text-amber-500">4.8 ⭐</td>
                    <td className="py-3"><button onClick={() => alert('تم إرسال طلب حذف المستخدم للمراجعة')} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'students' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Team ID</th>
                <th className="pb-3 font-semibold">Bio</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{s.name.charAt(0)}</div>
                      {s.name}
                    </td>
                    <td className="py-3 text-slate-500">{s.email}</td>
                    <td className="py-3 text-slate-400 text-xs">{s.teamId || 'No Team'}</td>
                    <td className="py-3 text-slate-400 truncate max-w-[200px]">{s.bio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{team.emoji}</div>
                <div><p className="font-bold text-slate-800 dark:text-white">{team.name}</p><p className="text-xs text-slate-400">{team.project_title}</p></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Internal ID: {team.id}</p>
              <div className="progress-bar mb-1"><div className="h-full rounded-full" style={{ width: `${team.progress}%`, background: team.color }} /></div>
              <p className="text-xs text-slate-400">{team.progress}% complete · {team.students?.length || 0} students</p>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add New User</h3>
              <button 
                onClick={() => setIsAddUserModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  required 
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="input w-full" 
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  required 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="input w-full" 
                  placeholder="name@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="input w-full"
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>

              {newUser.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio (Optional)</label>
                  <textarea 
                    value={newUser.bio}
                    onChange={e => setNewUser({...newUser, bio: e.target.value})}
                    className="input w-full resize-none" 
                    rows="2"
                    placeholder="Short bio..."
                  ></textarea>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-6"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
