import React, { useState, useRef } from 'react';
import { Upload, FileText, File, Trash2, Download, CheckCircle2, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';

const mockFiles = [
  { id: 1, name: 'Research_Analysis_v2.pdf', task: 'بحث وتحليل', size: '2.4 MB', date: '2026-03-05', type: 'pdf', status: 'approved', url: null },
  { id: 2, name: 'System_Architecture.docx', task: 'تصميم النظام', size: '1.1 MB', date: '2026-03-12', type: 'doc', status: 'approved', url: null },
  { id: 3, name: 'UI_Mockups.zip', task: 'نموذج أولي', size: '8.7 MB', date: '2026-03-18', type: 'zip', status: 'pending', url: null },
];

const typeIcon = { pdf: '📄', doc: '📝', docx: '📝', zip: '📦', ppt: '📊', pptx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', default: '📁' };
const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

// ========================
// File Viewer Modal
// ========================
function FileViewer({ file, onClose }) {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.type?.toLowerCase());
  const isPdf = file.type?.toLowerCase() === 'pdf';
  const canView = isImage || isPdf;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-900 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">{typeIcon[file.type] || typeIcon.default}</span>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{file.size} · {file.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {file.url && (
            <a
              href={file.url}
              download={file.name}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-xs flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {!file.url ? (
          // No real URL - demo file
          <div className="text-center text-slate-400">
            <div className="text-6xl mb-4">{typeIcon[file.type] || typeIcon.default}</div>
            <p className="text-lg font-semibold text-white mb-2">{file.name}</p>
            <p className="text-sm mb-6">هذا الملف demo - لم يتم رفعه على السيرفر بعد</p>
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm mx-auto text-right">
              <p className="text-xs text-slate-400 mb-1">📋 اسم الملف</p>
              <p className="text-sm text-white mb-3">{file.name}</p>
              <p className="text-xs text-slate-400 mb-1">📦 الحجم</p>
              <p className="text-sm text-white mb-3">{file.size}</p>
              <p className="text-xs text-slate-400 mb-1">📅 تاريخ الرفع</p>
              <p className="text-sm text-white mb-3">{file.date}</p>
              <p className="text-xs text-slate-400 mb-1">📝 المهمة</p>
              <p className="text-sm text-white">{file.task}</p>
            </div>
          </div>
        ) : isPdf ? (
          <iframe
            src={file.url + '#toolbar=1&navpanes=1&scrollbar=1'}
            className="w-full h-full rounded-xl border-0"
            title={file.name}
          />
        ) : isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        ) : (
          <div className="text-center text-slate-400">
            <div className="text-6xl mb-4">{typeIcon[file.type] || typeIcon.default}</div>
            <p className="text-white font-semibold mb-2">{file.name}</p>
            <p className="text-sm">هذا النوع من الملفات لا يمكن عرضه مباشرة</p>
            {file.url && (
              <a href={file.url} download={file.name}
                className="mt-4 inline-flex items-center gap-2 btn-primary text-sm">
                <Download className="w-4 h-4" /> تحميل الملف
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// Main Files Page
// ========================
export default function StudentFiles() {
  const [files, setFiles] = useState(mockFiles);
  const [dragging, setDragging] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  const processFiles = (rawFiles) =>
    Array.from(rawFiles).map((f, i) => {
      const url = URL.createObjectURL(f); // رابط مؤقت للعرض المباشر
      return {
        id: Date.now() + i,
        name: f.name,
        task: 'عام',
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        date: new Date().toISOString().split('T')[0],
        type: f.name.split('.').pop().toLowerCase(),
        status: 'pending',
        url,
        _blob: f,
      };
    });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    setFiles(prev => [...prev, ...processFiles(e.dataTransfer.files)]);
  };

  const handlePick = (e) => {
    setFiles(prev => [...prev, ...processFiles(e.target.files)]);
  };

  const canView = (type) => viewableTypes.includes(type?.toLowerCase());

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
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">اسحب الملفات هنا أو اضغط للرفع</p>
        <p className="text-sm text-slate-400">يدعم PDF، DOC، DOCX، ZIP، PPT حتى 50MB</p>
        <label className="mt-4 inline-block btn-primary text-sm cursor-pointer">
          <input type="file" className="hidden" multiple onChange={handlePick} accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.jpg,.jpeg,.png" />
          اختر ملفات
        </label>
      </div>

      {/* File List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">الملفات المرفوعة</h3>
          <span className="badge badge-blue">{files.length} ملف</span>
        </div>
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group">
              <div className="text-2xl flex-shrink-0">{typeIcon[file.type] || typeIcon.default}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{file.task} · {file.size} · {file.date}</p>
              </div>
              <span className={`badge text-xs hidden sm:flex ${file.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                {file.status === 'approved' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> معتمد</> : '⏳ قيد المراجعة'}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* زر الفتح/المعاينة */}
                <button
                  onClick={() => setViewingFile(file)}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500"
                  title="عرض الملف"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {/* زر التحميل */}
                {file.url ? (
                  <a href={file.url} download={file.name}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500">
                    <Download className="w-4 h-4" />
                  </a>
                ) : (
                  <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500">
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setFiles(f => f.filter(x => x.id !== file.id))}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Viewer */}
      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
    </div>
  );
}
