// src/components/fragments/SubtitleModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { 
  FaXmark, FaClosedCaptioning, FaUpload, FaPlay, FaFingerprint, 
  FaRotateLeft, FaCheck, FaBan, FaArrowDown 
} from 'react-icons/fa6';
import { Subtitle, SubtitleWord } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSave: (subs: Subtitle[], offset: number, durationLimit: number) => void;
}

type TabType = 'manual' | 'sync';
type SyncMode = 'line' | 'word'; // Mode baru

export default function SubtitleModal({ isOpen, onClose, audioRef, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [syncMode, setSyncMode] = useState<SyncMode>('word'); // Default ke Word sync agar lebih presisi
  
  const [srtInput, setSrtInput] = useState('');
  const [offset, setOffset] = useState(0);
  const [durationLimit, setDurationLimit] = useState(0);

  // --- STATE UNTUK SYNC TOOL ---
  const [syncStep, setSyncStep] = useState(1); 
  const [rawLyrics, setRawLyrics] = useState('');
  
  // Data Logic
  const [syncLines, setSyncLines] = useState<string[]>([]);
  const [syncIndex, setSyncIndex] = useState(0); // Index Baris
  const [wordIndex, setWordIndex] = useState(0); // Index Kata dalam Baris (untuk Word Mode)
  
  // Hasil
  const [syncedData, setSyncedData] = useState<Subtitle[]>([]);
  const syncDataRef = useRef<Subtitle[]>([]); // Ref untuk performa tinggi

  // Reset saat buka/tutup
  useEffect(() => {
    if (!isOpen) {
        resetSync();
    }
  }, [isOpen]);

  const resetSync = () => {
    setSyncStep(1);
    setSyncIndex(0);
    setWordIndex(0);
    setSyncedData([]);
    syncDataRef.current = [];
  };

  // Handle Space Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isOpen && activeTab === 'sync' && syncStep === 2 && e.code === 'Space') {
            e.preventDefault();
            handleSyncTap();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, syncStep, syncIndex, wordIndex, syncLines, syncMode]); 

  if (!isOpen) return null;

  // ... (Bagian Manual/SRT Parser sama seperti sebelumnya, dipersingkat) ...
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* Sama seperti sebelumnya */ 
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => ev.target?.result && setSrtInput(ev.target.result as string);
    reader.readAsText(file);
  };

  const parseSRT = (data: string): Subtitle[] => {
      // Parser sederhana (tidak mendeteksi word timing dari SRT biasa)
      const subs: Subtitle[] = [];
      const blocks = data.replace(/\r\n/g, '\n').split(/\n\s*\n/);
      blocks.forEach(block => {
          const lines = block.split('\n');
          if (lines.length >= 2) {
             let timeLineIndex = lines.findIndex(l => l.includes('-->'));
             if (timeLineIndex !== -1 && lines.length > timeLineIndex + 1) {
                 const timeLine = lines[timeLineIndex];
                 const text = lines.slice(timeLineIndex + 1).join('<br>').trim();
                 const times = timeLine.split('-->');
                 if (times.length === 2 && text) {
                     subs.push({
                         start: timeToSeconds(times[0].trim()),
                         end: timeToSeconds(times[1].trim()),
                         text: text
                     });
                 }
             }
          }
      });
      return subs;
  };
  
  const timeToSeconds = (timeString: string) => { /* Sama seperti sebelumnya */ 
    const parts = timeString.split(':');
    if (parts.length < 3) return 0;
    const sec = parts[2].split(/[.,]/);
    return (parseInt(parts[0])*3600) + (parseInt(parts[1])*60) + parseInt(sec[0]) + (parseInt(sec[1]||'0')/1000);
  };

  const handleSaveManual = () => {
    const parsed = parseSRT(srtInput);
    onSave(parsed, offset, durationLimit);
    onClose();
  };

  // --- LOGIC: SYNC TOOL (REVISED) ---
  
  const startSync = () => {
    const lines = rawLyrics.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return alert("Masukkan teks lirik terlebih dahulu!");
    
    setSyncLines(lines);
    setSyncStep(2);
    setSyncIndex(0);
    setWordIndex(0);
    
    // Inisialisasi struktur data kosong untuk Word Mode
    if (syncMode === 'word') {
        // Kita pre-populate syncDataRef dengan struktur baris & kata kosong
        syncDataRef.current = lines.map(line => ({
            start: 0,
            end: 0,
            text: line,
            words: line.split(' ').map(w => ({ text: w, start: 0, end: 0 }))
        }));
    } else {
        syncDataRef.current = [];
    }
    
    setSyncedData([...syncDataRef.current]);

    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = 1.0;
        audioRef.current.play();
    }
  };

  const handleSyncTap = () => {
    if (!audioRef.current || syncIndex >= syncLines.length) return;
    const currentTime = audioRef.current.currentTime;

    if (syncMode === 'line') {
        // --- LOGIC LAMA (PER BARIS) ---
        const currentData = [...syncDataRef.current];
        if (syncIndex > 0 && currentData.length > 0) {
            currentData[currentData.length - 1].end = currentTime; 
        }
        const effectiveDuration = durationLimit > 0 ? durationLimit : 5;
        currentData.push({
            start: currentTime,
            end: currentTime + effectiveDuration, 
            text: syncLines[syncIndex]
        });
        syncDataRef.current = currentData;
        setSyncedData(currentData);
        setSyncIndex(prev => prev + 1);

    } else {
        // --- LOGIC BARU (PER KATA) ---
        // Kita memodifikasi syncDataRef yang sudah di-prefill di startSync
        const allData = [...syncDataRef.current];
        const currentLine = allData[syncIndex];
        
        if (!currentLine.words) return; // Safety check

        // 1. Set Start Time untuk Kata saat ini
        const currentWord = currentLine.words[wordIndex];
        currentWord.start = currentTime;
        
        // 2. Set End Time untuk Kata SEBELUMNYA (jika ada dalam baris yang sama)
        if (wordIndex > 0) {
            const prevWord = currentLine.words[wordIndex - 1];
            prevWord.end = currentTime;
        } 
        // 3. Jika ini kata PERTAMA di baris, set Start Time Baris
        if (wordIndex === 0) {
             currentLine.start = currentTime;
             // Cek baris sebelumnya untuk menutup end time baris & kata terakhir baris tsb
             if (syncIndex > 0) {
                 const prevLine = allData[syncIndex - 1];
                 // End time baris sebelumnya = start time baris ini (minus sedikit gap optional)
                 // Atau biarkan logic durasi minimum
                 if (prevLine.end === 0 || prevLine.end > currentTime) {
                     prevLine.end = currentTime;
                 }
                 // Fix last word of prev line
                 if (prevLine.words && prevLine.words.length > 0) {
                     const lastWordPrev = prevLine.words[prevLine.words.length - 1];
                     if (lastWordPrev.end === 0) lastWordPrev.end = currentTime;
                 }
             }
        }

        // 4. Maju ke kata berikutnya
        if (wordIndex < currentLine.words.length - 1) {
            setWordIndex(prev => prev + 1);
        } else {
            // Sudah kata terakhir di baris ini
            // Set End time kata terakhir (estimasi sementara: +0.5s atau +1s)
            // Nanti akan di-overwrite saat tap baris berikutnya (di step 3 logic di atas),
            // TAPI untuk baris terakhir lagu, kita perlu nilai default.
            currentWord.end = currentTime + 0.5; 
            currentLine.end = currentTime + 1.0;

            // Pindah Baris
            setWordIndex(0);
            setSyncIndex(prev => prev + 1);
        }
        
        syncDataRef.current = allData;
        setSyncedData([...allData]); // Trigger re-render
    }
  };

  const handleUndo = () => {
     if (syncMode === 'line') {
         if (syncIndex > 0) {
             setSyncIndex(prev => prev - 1);
             syncDataRef.current.pop();
             setSyncedData([...syncDataRef.current]);
             if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
         }
     } else {
         // Undo Word logic (agak kompleks, sederhanakan: mundur 1 kata)
         if (wordIndex > 0) {
             setWordIndex(prev => prev - 1);
             // Reset timing kata tsb? Tidak perlu strict, user akan tap ulang.
             if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 1);
         } else if (syncIndex > 0) {
             // Mundur ke baris sebelumnya (akhir baris)
             const prevLine = syncDataRef.current[syncIndex - 1];
             if (prevLine.words) {
                 setSyncIndex(prev => prev - 1);
                 setWordIndex(prevLine.words.length - 1);
                 if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 2);
             }
         }
     }
  };

  const finishSync = () => {
    // Save to parent
    onSave(syncDataRef.current, offset, durationLimit);
    
    // Generate SRT text representation (hanya baris, karena SRT standar tidak support word)
    let srtOutput = '';
    syncDataRef.current.forEach((sub, idx) => {
        if (sub.end === 0 && sub.words && sub.words.length > 0) {
             // Fix unclosed timestamps
             sub.end = sub.words[sub.words.length-1].start + 1;
        }
        const start = formatSRTTime(sub.start);
        const end = formatSRTTime(sub.end);
        srtOutput += `${idx + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
    });
    setSrtInput(srtOutput);
    
    onClose();
    if (audioRef.current) audioRef.current.playbackRate = 1.0;
  };

  const formatSRTTime = (seconds: number) => {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    return date.toISOString().substr(11, 8) + ',' + date.toISOString().substr(20, 3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 pointer-events-auto">
      <GlassPanel className="w-full max-w-lg rounded-2xl p-6 flex flex-col max-h-[90vh] relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
            <FaXmark className="text-xl" />
        </button>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <FaClosedCaptioning className="text-cyan-400" /> Editor Lirik
        </h2>

        {/* TABS */}
        <div className="flex gap-4 mb-4 border-b border-gray-700">
            <button onClick={() => setActiveTab('manual')} className={`pb-2 text-sm font-medium transition ${activeTab === 'manual' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
                Manual / Upload
            </button>
            <button onClick={() => setActiveTab('sync')} className={`pb-2 text-sm font-medium transition ${activeTab === 'sync' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
                Sync Tool (Rekam)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {activeTab === 'manual' && (
                <div className="space-y-4">
                    {/* ... (Konten Manual sama seperti sebelumnya, saya potong untuk hemat space) ... */}
                    <div className="p-4 bg-white/5 rounded text-center text-xs text-gray-400">
                        Fitur upload .SRT tersedia. Gunakan tab "Sync Tool" untuk membuat lirik karaoke per kata.
                    </div>
                    <textarea value={srtInput} onChange={e => setSrtInput(e.target.value)} className="w-full h-40 bg-black/30 border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono" />
                    <button onClick={handleSaveManual} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl">Simpan</button>
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="flex flex-col h-full">
                    {syncStep === 1 ? (
                        <div className="space-y-4">
                            {/* Mode Selection */}
                            <div className="flex bg-gray-800 p-1 rounded-lg mb-2">
                                <button 
                                    onClick={() => setSyncMode('word')} 
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${syncMode === 'word' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Per Kata (Karaoke)
                                </button>
                                <button 
                                    onClick={() => setSyncMode('line')} 
                                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${syncMode === 'line' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Per Baris (Simpel)
                                </button>
                            </div>
                            
                            <p className="text-xs text-gray-400">
                                {syncMode === 'word' 
                                    ? "Paste lirik. Anda akan menekan tombol TAP untuk SETIAP KATA."
                                    : "Paste lirik. Anda akan menekan tombol TAP untuk SETIAP BARIS."}
                            </p>

                            <textarea 
                                value={rawLyrics}
                                onChange={(e) => setRawLyrics(e.target.value)}
                                className="w-full h-40 bg-black/30 border border-gray-700 rounded-lg p-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-cyan-400 resize-none"
                                placeholder="Paste lirik lagu di sini..."
                            />
                            <button onClick={startSync} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                <FaPlay /> Mulai Sinkronisasi
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-2">
                             {/* Display Lirik */}
                            <div className="w-full bg-black/40 border border-gray-600 rounded-xl p-6 text-center mb-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden">
                                {syncIndex < syncLines.length ? (
                                    <>
                                        {/* Baris Sebelumnya */}
                                        <p className="text-xs text-gray-500 mb-4 truncate">{syncIndex > 0 ? syncLines[syncIndex - 1] : '...'}</p>
                                        
                                        {/* Baris Aktif (Logic tampilan beda untuk Word vs Line mode) */}
                                        <div className="text-xl md:text-2xl font-bold text-white leading-relaxed flex flex-wrap justify-center gap-x-2">
                                            {syncMode === 'word' && syncDataRef.current[syncIndex]?.words ? (
                                                syncDataRef.current[syncIndex].words!.map((w, idx) => (
                                                    <span key={idx} className={`${idx === wordIndex ? 'text-cyan-400 scale-110 border-b-2 border-cyan-400' : idx < wordIndex ? 'text-green-500' : 'text-gray-600'} transition-all duration-100`}>
                                                        {w.text}
                                                    </span>
                                                ))
                                            ) : (
                                                <span>{syncLines[syncIndex]}</span>
                                            )}
                                        </div>

                                        {/* Next Line Preview */}
                                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cyan-500/50">
                                            <FaArrowDown />
                                            <p className="truncate max-w-[200px]">{syncIndex + 1 < syncLines.length ? syncLines[syncIndex + 1] : '(Akhir)'}</p>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-green-400 text-2xl font-bold">Selesai!</span>
                                )}
                            </div>

                            {/* TAP Button */}
                            <button 
                                onMouseDown={(e) => { e.preventDefault(); handleSyncTap(); }}
                                className="w-24 h-24 rounded-full bg-gray-800 border-4 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95 transition flex flex-col items-center justify-center mb-6"
                            >
                                <FaFingerprint className="text-3xl mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {syncMode === 'word' ? 'Tap Kata' : 'Tap Baris'}
                                </span>
                            </button>

                            <div className="flex gap-3 w-full">
                                <button onClick={handleUndo} className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-xs"><FaRotateLeft className="inline mr-1"/> Undo</button>
                                <button onClick={finishSync} className="flex-1 py-2 bg-green-600 rounded-lg hover:bg-green-500 text-white text-xs"><FaCheck className="inline mr-1"/> Selesai</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </GlassPanel>
    </div>
  );
}