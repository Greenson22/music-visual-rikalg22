// src/components/fragments/FileManager.tsx
import React, { useState, useEffect } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { FaFolder, FaFileAudio, FaArrowLeft, FaXmark } from 'react-icons/fa6';
import { FileNode } from '@/types';

interface Props {
  rootNode: FileNode;
  onSelectFile: (file: File) => void;
  onClose: () => void;
}

export default function FileManager({ rootNode, onSelectFile, onClose }: Props) {
  const [currentFolder, setCurrentFolder] = useState<FileNode>(rootNode);
  const [history, setHistory] = useState<FileNode[]>([]);

  const handleEnterFolder = (folder: FileNode) => {
    setHistory([...history, currentFolder]);
    setCurrentFolder(folder);
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentFolder(previous);
  };

  // Sort: Folder dulu, baru File
  const sortedChildren = [...currentFolder.children].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'folder' ? -1 : 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-md pointer-events-auto p-4">
      <GlassPanel className="w-full max-w-3xl h-[80vh] flex flex-col rounded-2xl overflow-hidden relative border border-gray-700">
        
        {/* Header File Manager */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button onClick={handleBack} className="text-gray-300 hover:text-white transition">
                <FaArrowLeft />
              </button>
            )}
            <h2 className="text-lg font-bold text-white truncate max-w-[200px] md:max-w-md">
               /{currentFolder.name === 'root' ? 'Music Library' : currentFolder.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition">
            <FaXmark className="text-xl" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sortedChildren.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Folder ini kosong</div>
          ) : (
            sortedChildren.map((node, idx) => (
              <div 
                key={idx}
                onClick={() => node.type === 'folder' ? handleEnterFolder(node) : (node.file && onSelectFile(node.file))}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer transition group border border-transparent hover:border-white/10"
              >
                <div className={`p-2 rounded-lg ${node.type === 'folder' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                   {node.type === 'folder' ? <FaFolder /> : <FaFileAudio />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                    {node.name}
                  </p>
                  {node.type === 'file' && (
                    <p className="text-xs text-gray-500 truncate">
                      {(node.file!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Breadcrumbs (Opsional simple) */}
        <div className="p-2 bg-black/20 text-xs text-gray-500 px-4">
            Total items: {sortedChildren.length}
        </div>
      </GlassPanel>
    </div>
  );
}