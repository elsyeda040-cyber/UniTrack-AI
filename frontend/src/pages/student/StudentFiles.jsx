import React, { useState, useRef, useEffect } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Upload, FileText, File, Trash2, Download, CheckCircle2, X, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const mockFiles = [
  { id: 1, name: 'Research_Analysis_v2.pdf', task: 'Research & Analysis', size: '2.4 MB', date: '2026-03-05', type: 'pdf', status: 'approved', url: null, uploaderId: 'prof-001', uploaderName: 'Dr. Ahmad' },
  { id: 2, name: 'System_Architecture.docx', task: 'System Design', size: '1.1 MB', date: '2026-03-12', type: 'doc', status: 'approved', url: null, uploaderId: 'teammate-1', uploaderName: 'Sara Khaled' },
  { id: 3, name: 'UI_Mockups.zip', task: 'UI/UX Prototype', size: '8.7 MB', date: '2026-03-18', type: 'zip', status: 'pending', url: null, uploaderId: 'current-user' },
];

const typeIcon = { pdf: '📄', doc: '📝', docx: '📝', zip: '📦', ppt: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', default: '📁' };

// ——— File Preview Modal ———
function FilePreviewModal({ file, onClose }) {
  const isPDF = file.type === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type);
  const isDoc = ['doc', 'docx'].includes(file.type);

  const handleDownload = () => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else {
      alert('This is a demo file. Upload a real file to download it.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-900/90 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">{typeIcon[file.type] || typeIcon.default}</span>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{file.name}</p>
            <p className="text-slate-400 text-xs">{file.size} · {file.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.open(file.url, '_blank')}
            disabled={!file.url}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors disabled:opacity-30"
          >
            <ZoomIn className="w-3.5 h-3.5" /> Full View
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {isPDF && file.url ? (
          <iframe
            src={file.url}
            className="w-full h-[85vh] rounded-2xl bg-white shadow-2xl border-none"
            title={file.name}
          />
        ) : (isPDF || isDoc) && !file.url ? (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-16 text-center max-w-xl w-full shadow-2xl animate-slide-up border border-slate-100 dark:border-slate-700">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-indigo-500">
               <FileText className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4">{file.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
               This is a system document. For full academic analysis and reading, please use the <b>Download</b> or <b>Full View</b> options.
            </p>
            <div className="flex gap-4 justify-center">
               <button onClick={handleDownload} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">
                  <Download className="w-5 h-5" /> Download File
               </button>
               <button onClick={onClose} className="px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                  Close Preview
               </button>
            </div>
          </div>
        ) : isImage && file.url ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800"
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-16 text-center max-w-md w-full shadow-2xl">
            <div className="text-6xl mb-6">{typeIcon[file.type] || typeIcon.default}</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{file.name}</h2>
            <p className="text-slate-500 mb-8">Preview not supported for this format.</p>
            <button onClick={handleDownload} className="btn-primary w-full justify-center py-4">
              <Download className="w-5 h-5" /> Download to View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ——— Main Page ———
export default function StudentFiles() {
  const { user } = useApp();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (user?.teamId) fetchFiles();
    else setLoading(false);
  }, [user?.id]);

  const fetchFiles = async () => {
    try {
      const res = await teamService.getFiles(user.teamId);
      // Map API fields to UI fields if necessary
      const apiFiles = (res.data || []).map(f => ({
        ...f,
        id: f.id,
        name: f.name,
        size: f.size || '0 KB',
        date: f.date || new Date().toISOString().split('T')[0],
        type: f.type || 'file',
        status: 'approved',
        uploaderId: f.sender_id || f.uploader_id,
        uploaderName: f.sender || 'Unknown'
      }));
      setFiles(apiFiles.length > 0 ? apiFiles : mockFiles);
    } catch (err) {
      console.error("Failed to fetch files", err);
      setFiles(mockFiles);
    } finally {
      setLoading(false);
    }
  };

  const processFiles = (rawFiles) =>
    Array.from(rawFiles).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      task: 'General',
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      date: new Date().toISOString().split('T')[0],
      type: f.name.split('.').pop().toLowerCase(),
      status: 'pending',
      url: URL.createObjectURL(f), // real URL for preview & download
      uploaderId: user.id,
      uploaderName: user.name
    }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    setFiles(prev => [...prev, ...processFiles(e.dataTransfer.files)]);
  };

  const handleDelete = async (e, file) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${file.name}"? This will remove it from the entire platform.`)) return;
    try {
      if (file.url) {
        await teamService.deleteFile(user.teamId, file.id);
      }
      setFiles(f => f.filter(x => x.id !== file.id));
      alert("File deleted from the entire platform.");
    } catch (err) {
      // Local fallback for demo
      setFiles(f => f.filter(x => x.id !== file.id));
      alert("Syncing: File removed from project dashboard.");
    }
  };

  const handleDeleteAll = async () => {
    const myFiles = files.filter(f => f.uploaderId === user.id || f.uploaderId === 'current-user');
    if (myFiles.length === 0) {
      alert("You don't have any files to delete. You cannot delete files uploaded by others.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${myFiles.length} files you uploaded?`)) return;
    try {
      await teamService.deleteAllFiles(user.teamId);
      setFiles(prev => prev.filter(f => f.uploaderId !== user.id && f.uploaderId !== 'current-user'));
      alert("Your files have been wiped from the platform.");
    } catch (err) {
      setFiles(prev => prev.filter(f => f.uploaderId !== user.id && f.uploaderId !== 'current-user'));
      alert("Personal Cleanup: Your documents removed.");
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
        }`}
      >
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7 text-blue-500" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Drag and drop files here or click to upload</p>
        <p className="text-sm text-slate-400">Supports PDF, DOC, DOCX, ZIP, PPT, and images up to 50MB</p>
        <label className="mt-4 inline-block btn-primary text-sm cursor-pointer">
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.jpg,.jpeg,.png"
            onChange={e => {
              setFiles(prev => [...prev, ...processFiles(e.target.files)]);
              e.target.value = '';
            }}
          />
          Choose Files
        </label>
      </div>

      {/* File List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <h3 className="font-bold text-slate-800 dark:text-white">Uploaded Files</h3>
             <span className="badge badge-blue">{files.length} files</span>
          </div>
          {files.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wipe Platform Files
            </button>
          )}
        </div>
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              onClick={() => setPreviewFile(file)}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group cursor-pointer"
            >
              <div className="text-2xl flex-shrink-0">{typeIcon[file.type] || typeIcon.default}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">{file.name}</p>
                <div className="flex items-center gap-2">
                   <p className="text-xs text-slate-400">{file.task} · {file.size} · {file.date}</p>
                   {file.uploaderName && <span className="text-[10px] text-indigo-400 font-bold">👤 {file.uploaderName}</span>}
                </div>
              </div>
              <span className={`badge text-xs hidden sm:flex ${file.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                {file.status === 'approved' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</> : '⏳ Under Review'}
              </span>
              {/* Buttons - always show on mobile, hover on desktop */}
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setPreviewFile(file); }}
                  className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={e => handleDownload(e, file)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {(file.uploaderId === user.id || file.uploaderId === 'current-user') && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                    title="Delete from Platform"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <File className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No files uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
