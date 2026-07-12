import React, { useRef, useState } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

const Dropzone = ({ selectedFile, setSelectedFile, accept = '.pdf, image/*', label = 'Upload evidence file' }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Simple validation matching input acceptance
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      
      if (accept.includes('pdf') && isPdf) {
        setSelectedFile(file);
      } else if (accept.includes('image') && isImage) {
        setSelectedFile(file);
      } else if (accept.includes('pdf') && accept.includes('image') && (isPdf || isImage)) {
        setSelectedFile(file);
      }
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
        isDragOver
          ? 'border-cyber-cyan bg-cyber-cyan/5'
          : selectedFile
          ? 'border-zinc-300 bg-zinc-50/50 dark:border-zinc-700/60 dark:bg-obsidian-800/10'
          : 'border-zinc-300 hover:border-cyber-cyan dark:border-zinc-700/60 dark:hover:border-cyber-cyan hover:bg-zinc-50/50 dark:hover:bg-obsidian-850/5'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-between w-full bg-white dark:bg-obsidian-800 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-obsidian-700 rounded-lg text-zinc-500 dark:text-zinc-400">
              <File size={20} />
            </div>
            <div className="text-left max-w-[180px] sm:max-w-sm truncate">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-obsidian-700 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="p-3 bg-zinc-100 dark:bg-obsidian-850 rounded-full text-zinc-400 dark:text-zinc-600 inline-block mb-3.5">
            <UploadCloud size={28} className="text-cyber-cyan" />
          </div>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {label}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Drag and drop or click to browse files
          </p>
        </div>
      )}
    </div>
  );
};

export default Dropzone;
