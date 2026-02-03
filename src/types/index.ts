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