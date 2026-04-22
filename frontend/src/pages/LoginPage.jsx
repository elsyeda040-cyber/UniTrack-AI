import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookOpen, GraduationCap, Shield, Users, Eye, EyeOff, Sparkles } from 'lucide-react';

const roles = [
  { key: 'student', label: 'Student', icon: GraduationCap, color: 'from-blue-500 to-blue-600', desc: 'Access your projects & tasks' },
  { key: 'professor', label: 'Professor', icon: BookOpen, color: 'from-purple-500 to-purple-600', desc: 'Manage your teams' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role.key);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password, selectedRole);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const currentRole = roles.find(r => r.key === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}} />
      </div>

      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Branding */}
        <div className="text-white text-center lg:text-left">
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">UniTrack AI</h1>
              <p className="text-blue-300 text-sm">Graduation Project Platform</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Manage Projects <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Intelligently
            </span>
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            A complete platform connecting students, professors, supervisors, and administration for seamless project tracking.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'AI-Powered', desc: 'Smart suggestions' },
              { label: 'Real-time', desc: 'Live updates' },
              { label: 'Analytics', desc: 'Deep insights' },
              { label: 'Secure', desc: 'Role-based access' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="font-semibold text-white text-sm">{f.label}</div>
                <div className="text-slate-400 text-xs">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h3>
          <p className="text-slate-500 mb-6 text-sm">Select your role to continue</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {roles.map(role => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mb-1.5`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{role.label}</div>
                  <div className="text-xs text-slate-400">{role.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-fade-in text-right" dir="rtl">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">University Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="your@university.edu"
                autoComplete="off"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-blue-600 hover:underline">Forgot password?</button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : `bg-gradient-to-r ${currentRole?.color} hover:opacity-90 hover:shadow-lg`
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : `Sign in as ${currentRole?.label}`}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            Don't have an account? Contact your administrator to get access.
          </p>
        </div>
      </div>
    </div>
  );
}
