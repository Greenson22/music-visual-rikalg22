// src/types/index.ts
export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

export interface Subtitle {
  start: number;
  end: number;
  text: string;
  words?: SubtitleWord[]; // Opsional: Detail per kata
}

export interface SyncData {
  start: number;
  end: number;
  text: string;
}

export type TabType = 'manual' | 'sync';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  file?: File;
  children: FileNode[];
}