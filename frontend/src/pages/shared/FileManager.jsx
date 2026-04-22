import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  FileText, Image as ImageIcon, Mic, Download, Eye, Search, 
  Filter, Calendar, User, Loader2, File as FileIcon, X, ChevronRight, Trash2
} from 'lucide-react';

export default function FileManager({ teamId: propTeamId }) {
  const { user } = useApp();
  const activeTeamId = propTeamId || user?.teamId;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (activeTeamId) fetchFiles();
  }, [activeTeamId]);

  const fetchFiles = async () => {
    try {
      const res = await teamService.getFiles(activeTeamId);
      setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, file) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    try {
      await teamService.deleteFile(activeTeamId, file.id);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) {
      // Local fallback for UI consistency
      setFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesFilter = filter === 'all' || f.type === filter;
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.sender.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'voice': return <Mic className="w-5 h-5 text-emerald-500" />;
      case 'file': return <FileText className="w-5 h-5 text-orange-500" />;
      default: return <FileIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" /> مدير ملفات المشروع
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">جميع الوسائط والمستندات المشتركة في مساحة عمل الفريق.</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="بحث عن ملف أو مرسل..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'الكل', icon: <Filter className="w-3.5 h-3.5" /> },
          { id: 'file', label: 'مستندات', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'image', label: 'صور', icon: <ImageIcon className="w-3.5 h-3.5" /> },
          { id: 'voice', label: 'تسجيلات', icon: <Mic className="w-3.5 h-3.5" /> },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === btn.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => (
          <div 
            key={file.id} 
            className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-900/50 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                {getIcon(file.type)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setPreviewFile(file)}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <a 
                  href={file.url} 
                  download={file.name}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
                 {(file.sender_id === user.id || file.sender === user.name) && (
                   <button 
                     onClick={(e) => handleDelete(e, file)}
                     className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 )}
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate mb-1">{file.name}</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <User className="w-3 h-3" /> بواسطة: {file.sender}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Calendar className="w-3 h-3" /> التاريخ: {file.date}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-50 dark:border-slate-700 mt-auto flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400 capitalize">{file.type}</span>
              <span className="text-blue-500 uppercase">{file.size}</span>
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد ملفات تطابق بحثك حالياً.</p>
          </div>
        )}
      </div>

      {/* Simple Image Preview Overlay */}
      {previewFile && previewFile.type === 'image' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewFile(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
          <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-zoom-in" />
        </div>
      )}
    </div>
  );
}
