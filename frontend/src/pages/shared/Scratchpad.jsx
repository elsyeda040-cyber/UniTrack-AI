import React, { useState, useEffect, useCallback } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Edit3, Save, Loader2, CheckCircle, Clock } from 'lucide-react';
import { debounce } from 'lodash';

export default function Scratchpad({ teamId: propTeamId }) {
  const { user } = useApp();
  const activeTeamId = propTeamId || user?.teamId;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (activeTeamId) fetchScratchpad();
  }, [activeTeamId]);

  const fetchScratchpad = async () => {
    try {
      const res = await teamService.getScratchpad(activeTeamId);
      setContent(res.data.content);
      if (res.data.last_updated) setLastSaved(new Date(res.data.last_updated));
    } catch (err) {
      console.error("Failed to fetch scratchpad", err);
    } finally {
      setLoading(false);
    }
  };

  const saveScratchpad = async (newContent) => {
    setSaving(true);
    try {
      const res = await teamService.updateScratchpad(activeTeamId, newContent);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save scratchpad", err);
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = useCallback(
    debounce((nextValue) => saveScratchpad(nextValue), 1000),
    [activeTeamId]
  );

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setContent(nextValue);
    debouncedSave(nextValue);
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Team Scratchpad</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live collaborative notes for your team.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          {saving ? (
            <span className="flex items-center gap-1.5 text-blue-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle className="w-3.5 h-3.5" /> Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Ready to type
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 relative group">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Start typing your team notes here... Suggestions: Project goals, meeting minutes, research links."
          className="w-full h-full p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none text-slate-700 dark:text-slate-200 leading-relaxed font-medium transition-all group-hover:shadow-md"
        />
        
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/10 dark:bg-white/5 backdrop-blur-sm text-[10px] uppercase tracking-widest font-bold text-slate-500">
            Auto-saves as you type
          </div>
        </div>
      </div>
    </div>
  );
}
