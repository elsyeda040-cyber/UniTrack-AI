import React, { useState, useRef } from 'react';
import { Upload, FileText, File, Trash2, Download, CheckCircle2, X, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const mockFiles = [
  { id: 1, name: 'Research_Analysis_v2.pdf', task: 'Research & Analysis', size: '2.4 MB', date: '2026-03-05', type: 'pdf', status: 'approved', url: null },
  { id: 2, name: 'System_Architecture.docx', task: 'System Design', size: '1.1 MB', date: '2026-03-12', type: 'doc', status: 'approved', url: null },
  { id: 3, name: 'UI_Mockups.zip', task: 'UI/UX Prototype', size: '8.7 MB', date: '2026-03-18', type: 'zip', status: 'pending', url: null },
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
          /* Real PDF from upload */
          <iframe
            src={file.url}
            className="w-full h-full rounded-lg bg-white"
            style={{ minHeight: '70vh' }}
            title={file.name}
          />
        ) : isPDF && !file.url ? (
          /* Demo PDF - no real file */
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">📄</div>
            <p className="font-bold text-slate-800 text-lg mb-2">{file.name}</p>
            <p className="text-slate-500 text-sm mb-6">This is a demo file. Upload a real PDF to view it here.</p>
            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
              <div className="h-2 bg-slate-200 rounded w-full" />
              <div className="h-2 bg-slate-200 rounded w-4/5" />
              <div className="h-2 bg-slate-200 rounded w-full" />
              <div className="h-2 bg-slate-200 rounded w-3/5" />
              <div className="h-2 bg-blue-100 rounded w-full mt-3" />
              <div className="h-2 bg-blue-100 rounded w-4/5" />
            </div>
          </div>
        ) : isImage && file.url ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
        ) : isDoc ? (
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">📝</div>
            <p className="font-bold text-slate-800 text-lg mb-2">{file.name}</p>
            <p className="text-slate-500 text-sm mb-4">Word files cannot be previewed directly in the browser.</p>
            <button onClick={handleDownload} className="btn-primary text-sm">
              <Download className="w-4 h-4 mr-1" /> Download to open
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
            <div className="text-6xl mb-4">{typeIcon[file.type] || typeIcon.default}</div>
            <p className="font-bold text-slate-800 text-lg mb-2">{file.name}</p>
            <p className="text-slate-500 text-sm mb-4">This file type does not support direct preview.</p>
            <button onClick={handleDownload} className="btn-primary text-sm">
              <Download className="w-4 h-4 mr-1" /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ——— Main Page ———
export default function StudentFiles() {
  const [files, setFiles] = useState(mockFiles);
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

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
    }));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    setFiles(prev => [...prev, ...processFiles(e.dataTransfer.files)]);
  };

  const handleDownload = (e, file) => {
    e.stopPropagation();
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
          <h3 className="font-bold text-slate-800 dark:text-white">Uploaded Files</h3>
          <span className="badge badge-blue">{files.length} files</span>
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
                <p className="text-xs text-slate-400">{file.task} · {file.size} · {file.date}</p>
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
                <button
                  onClick={e => { e.stopPropagation(); setFiles(f => f.filter(x => x.id !== file.id)); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
