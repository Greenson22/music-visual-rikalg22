// src/types/index.ts
export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface SyncData {
  start: number;
  end: number;
  text: string;
}

export type TabType = 'manual' | 'sync';

// --- TAMBAHAN BARU ---
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  file?: File; // Hanya ada jika type === 'file'
  children: FileNode[];
}