// src/components/fragments/SubtitleModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import GlassPanel from '../elements/GlassPanel';
import { 
  FaXmark, FaClosedCaptioning, FaUpload, FaPlay, FaFingerprint, 
  FaRotateLeft, FaCheck, FaBan, FaArrowDown 
} from 'react-icons/fa6';
import { Subtitle } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSave: (subs: Subtitle[], offset: number, durationLimit: number) => void;
}

type TabType = 'manual' | 'sync';

export default function SubtitleModal({ isOpen, onClose, audioRef, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [srtInput, setSrtInput] = useState('');
  const [offset, setOffset] = useState(0);
  // Default duration limit (0 = Auto/No Limit)
  const [durationLimit, setDurationLimit] = useState(0);

  // --- STATE UNTUK SYNC TOOL ---
  const [syncStep, setSyncStep] = useState(1); // 1: Input Text, 2: Tapping
  const [rawLyrics, setRawLyrics] = useState('');
  const [syncLines, setSyncLines] = useState<string[]>([]);
  const [syncIndex, setSyncIndex] = useState(0);
  const [syncedData, setSyncedData] = useState<Subtitle[]>([]);
  
  // Helper refs untuk performa tinggi saat tapping
  const syncDataRef = useRef<Subtitle[]>([]);

  // Reset state saat modal dibuka/tutup
  useEffect(() => {
    if (!isOpen) {
        setSyncStep(1);
        setSyncIndex(0);
        setSyncedData([]);
        syncDataRef.current = [];
    }
  }, [isOpen]);

  // Handle Keyboard Space untuk Tap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isOpen && activeTab === 'sync' && syncStep === 2 && e.code === 'Space') {
            e.preventDefault();
            handleSyncTap();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, syncStep, syncIndex, syncLines, durationLimit]); // Tambahkan durationLimit ke dependency

  if (!isOpen) return null;

  // --- LOGIC: MANUAL & SRT ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        if (ev.target?.result) setSrtInput(ev.target.result as string);
    };
    reader.readAsText(file);
  };

  const parseSRT = (data: string): Subtitle[] => {
    const subs: Subtitle[] = [];
    const blocks = data.replace(/\r\n/g, '\n').split(/\n\s*\n/);
    
    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 2) {
            let timeLineIndex = -1;
            // Cari baris yang mengandung '-->'
            for(let i=0; i<lines.length; i++) { 
                if(lines[i].includes('-->')) { timeLineIndex = i; break; } 
            }
            
            if (timeLineIndex !== -1 && lines.length > timeLineIndex + 1) {
                const timeLine = lines[timeLineIndex];
                const textLines = lines.slice(timeLineIndex + 1);
                const text = textLines.join('<br>').trim();
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

  const timeToSeconds = (timeString: string) => {
    const parts = timeString.split(':');
    if (parts.length < 3) return 0;
    const secondsParts = parts[2].split(/[.,]/);
    return (parseInt(parts[0])*3600) + (parseInt(parts[1])*60) + parseInt(secondsParts[0]) + (parseInt(secondsParts[1]||'0')/1000);
  };

  const handleSaveManual = () => {
    const parsed = parseSRT(srtInput);
    onSave(parsed, offset, durationLimit);
    onClose();
  };

  // --- LOGIC: SYNC TOOL ---
  const startSync = () => {
    const lines = rawLyrics.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return alert("Masukkan teks lirik terlebih dahulu!");
    
    setSyncLines(lines);
    setSyncStep(2);
    setSyncIndex(0);
    setSyncedData([]);
    syncDataRef.current = [];
    
    // Reset Audio & Play
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = 1.0;
        audioRef.current.play();
    }
  };

  const handleSyncTap = () => {
    if (!audioRef.current || syncIndex >= syncLines.length) return;

    const currentTime = audioRef.current.currentTime;
    const currentData = [...syncDataRef.current];

    // Update waktu akhir baris sebelumnya (jika ada)
    // Jika durationLimit diset > 0, kita tidak perlu memaksakan end time baris sebelumnya ke current time
    // KECUALI jika kita ingin mode "sambung menyambung" (karaoke style).
    // Tapi untuk fleksibilitas, kita set end time baris sebelumnya ke currentTime agar tidak overlap.
    if (syncIndex > 0 && currentData.length > 0) {
        const prev = currentData[currentData.length - 1];
        // Jika limit aktif, cek apakah durasi real lebih pendek dari limit?
        // Tapi logic standar sync adalah: Tap baru = Akhir tap lama.
        prev.end = currentTime; 
    }

    // Tentukan durasi default untuk baris baru ini
    // Jika durationLimit 0 (Auto), kita pasang placeholder 5 detik (nanti dipotong tap berikutnya).
    // Jika durationLimit > 0, kita gunakan sebagai end time target.
    const effectiveDuration = durationLimit > 0 ? durationLimit : 5;

    // Tambah baris baru
    const newEntry: Subtitle = {
        start: currentTime,
        end: currentTime + effectiveDuration, 
        text: syncLines[syncIndex]
    };

    currentData.push(newEntry);
    syncDataRef.current = currentData;
    setSyncedData(currentData); // Trigger re-render UI
    setSyncIndex(prev => prev + 1);

    // Auto finish jika sudah baris terakhir
    if (syncIndex === syncLines.length - 1) {
       // Tunggu sebentar atau biarkan user klik selesai
    }
  };

  const handleUndo = () => {
     if (syncIndex > 0 && audioRef.current) {
         setSyncIndex(prev => prev - 1);
         const newData = [...syncDataRef.current];
         newData.pop();
         syncDataRef.current = newData;
         setSyncedData(newData);
         
         // Mundur audio 3 detik
         audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
     }
  };

  const finishSync = () => {
    // Finalisasi data terakhir
    const finalData = [...syncDataRef.current];
    if (finalData.length > 0 && audioRef.current) {
        // Jika Auto (0), set end ke waktu stop
        // Jika ada limit, biarkan sesuai perhitungan awal (start + limit) ATAU clamp ke waktu stop
        if (durationLimit === 0) {
             finalData[finalData.length - 1].end = audioRef.current.currentTime;
        }
    }

    // Konversi ke format SRT string untuk ditampilkan di input manual (agar user bisa edit lagi)
    let srtOutput = '';
    finalData.forEach((sub, idx) => {
        const start = formatSRTTime(sub.start);
        const end = formatSRTTime(sub.end);
        srtOutput += `${idx + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
    });

    setSrtInput(srtOutput);
    setSyncStep(1);
    setActiveTab('manual');
    
    // Reset speed
    if (audioRef.current) audioRef.current.playbackRate = 1.0;
  };

  const formatSRTTime = (seconds: number) => {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    const iso = date.toISOString();
    return iso.substr(11, 8) + ',' + iso.substr(20, 3);
  };

  const setPlaybackSpeed = (speed: number) => {
      if (audioRef.current) audioRef.current.playbackRate = speed;
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
            <button 
                onClick={() => setActiveTab('manual')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
                Manual / Upload
            </button>
            <button 
                onClick={() => setActiveTab('sync')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'sync' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
                Sync Tool (Otomatis)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            
            {/* --- VIEW MANUAL --- */}
            {activeTab === 'manual' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Upload File (.srt)</label>
                        <label className="flex items-center justify-center w-full px-4 py-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition border border-dashed border-gray-600 hover:border-cyan-400 group">
                            <FaUpload className="mr-2 text-gray-500 group-hover:text-cyan-400" /> 
                            <span className="text-sm text-gray-300">Pilih File SRT</span>
                            <input type="file" onChange={handleFileUpload} accept=".srt" className="hidden" />
                        </label>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="block text-xs text-gray-400">Edit Text (Format SRT)</label>
                            <button 
                                onClick={() => setSrtInput("1\n00:00:00,000 --> 00:00:05,000\nContoh Lirik Lagu\n\n2\n00:00:05,500 --> 00:00:10,000\nBaris kedua disini...")} 
                                className="text-xs text-cyan-400 hover:underline"
                            >
                                Isi Contoh
                            </button>
                        </div>
                        <textarea 
                            value={srtInput}
                            onChange={(e) => setSrtInput(e.target.value)}
                            className="w-full h-40 bg-black/30 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-cyan-400 resize-none"
                            placeholder="1&#10;00:00:10,000 --> 00:00:15,000&#10;Lirik lagu..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-3 rounded-xl border border-gray-700">
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">Offset (Detik)</label>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setOffset(prev => parseFloat((prev - 0.5).toFixed(1)))} className="bg-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-600">-</button>
                                <input 
                                    type="number" 
                                    value={offset} 
                                    onChange={(e) => setOffset(parseFloat(e.target.value))}
                                    step="0.1" 
                                    className="w-full bg-black/50 border border-gray-600 rounded p-1 text-center text-white text-xs"
                                />
                                <button onClick={() => setOffset(prev => parseFloat((prev + 0.5).toFixed(1)))} className="bg-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-600">+</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">Durasi Tampil (Detik)</label>
                            <div className="flex gap-1">
                                <input 
                                    type="number" 
                                    value={durationLimit}
                                    onChange={(e) => setDurationLimit(parseFloat(e.target.value))}
                                    placeholder="Auto" 
                                    className="w-full bg-black/50 border border-gray-600 rounded p-1 text-center text-white text-xs"
                                />
                            </div>
                            {/* Preset Buttons */}
                            <div className="flex gap-1 mt-1 justify-between">
                                <button onClick={() => setDurationLimit(0)} className={`text-[9px] px-1.5 py-0.5 rounded border ${durationLimit===0 ? 'border-cyan-400 text-cyan-400' : 'border-gray-600 text-gray-400'}`}>Auto</button>
                                <button onClick={() => setDurationLimit(3)} className={`text-[9px] px-1.5 py-0.5 rounded border ${durationLimit===3 ? 'border-cyan-400 text-cyan-400' : 'border-gray-600 text-gray-400'}`}>3s</button>
                                <button onClick={() => setDurationLimit(5)} className={`text-[9px] px-1.5 py-0.5 rounded border ${durationLimit===5 ? 'border-cyan-400 text-cyan-400' : 'border-gray-600 text-gray-400'}`}>5s</button>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSaveManual} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 mt-2">
                        Simpan & Terapkan
                    </button>
                </div>
            )}

            {/* --- VIEW SYNC TOOL --- */}
            {activeTab === 'sync' && (
                <div className="flex flex-col h-full">
                    {syncStep === 1 ? (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400">Paste lirik lagu di sini. Tentukan juga durasi default di tab Manual jika perlu.</p>
                            
                            {/* Short Settings in Sync Mode */}
                            <div className="flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg">
                                <span className="text-[10px] text-gray-400">Durasi per Baris:</span>
                                <div className="flex gap-1">
                                    {[0, 3, 5].map(v => (
                                        <button 
                                            key={v} 
                                            onClick={() => setDurationLimit(v)}
                                            className={`px-2 py-0.5 rounded text-[10px] border ${durationLimit === v ? 'border-cyan-400 text-cyan-400 bg-cyan-900/20' : 'border-gray-600 text-gray-500'}`}
                                        >
                                            {v === 0 ? 'Auto' : `${v}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea 
                                value={rawLyrics}
                                onChange={(e) => setRawLyrics(e.target.value)}
                                className="w-full h-40 bg-black/30 border border-gray-700 rounded-lg p-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-cyan-400 resize-none"
                                placeholder="Paste lirik lagu di sini...&#10;Baris satu&#10;Baris dua"
                            />
                            <button onClick={startSync} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                                <FaPlay /> Mulai Sinkronisasi
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-2 animate-in fade-in zoom-in duration-300">
                             {/* Speed Control */}
                             <div className="flex justify-center gap-2 mb-4 bg-white/5 p-1 rounded-lg">
                                {[0.5, 0.75, 1.0].map(speed => (
                                    <button 
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className="px-3 py-1 rounded text-xs hover:bg-white/10 transition text-gray-300"
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>

                            {/* Lyric Display */}
                            <div className="w-full bg-black/40 border border-gray-600 rounded-xl p-6 text-center mb-6 min-h-[140px] flex flex-col justify-center relative overflow-hidden">
                                <p className="text-xs text-gray-500 mb-2 truncate min-h-[1rem]">
                                    {syncIndex > 0 ? syncLines[syncIndex - 1] : '...'}
                                </p>
                                <p className="text-xl font-bold text-white leading-relaxed scale-105 transition-transform">
                                    {syncIndex < syncLines.length ? syncLines[syncIndex] : <span className="text-green-400">Selesai!</span>}
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-500/70">
                                    <FaArrowDown />
                                    <p className="truncate max-w-[200px]">
                                        {syncIndex + 1 < syncLines.length ? syncLines[syncIndex + 1] : '(Akhir)'}
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-6 mb-6">
                                <button 
                                    onClick={handleUndo}
                                    className="w-14 h-14 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/40 flex flex-col items-center justify-center transition"
                                    title="Undo (Mundur 3s)"
                                >
                                    <FaRotateLeft />
                                    <span className="text-[9px] font-bold mt-1">UNDO</span>
                                </button>

                                <button 
                                    onMouseDown={handleSyncTap}
                                    className="w-24 h-24 rounded-full bg-gray-800 border-4 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95 transition flex flex-col items-center justify-center z-10"
                                >
                                    <FaFingerprint className="text-3xl mb-1" />
                                    <span className="text-xs font-bold">TAP</span>
                                </button>
                            </div>
                            
                            <p className="text-[10px] text-gray-500 mb-4">Tekan <b>SPASI</b> atau tombol <b>TAP</b> saat baris di tengah mulai dinyanyikan.</p>

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => { setSyncStep(1); if(audioRef.current) audioRef.current.playbackRate = 1.0; }} 
                                    className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs flex items-center justify-center gap-2"
                                >
                                    <FaBan /> Batal
                                </button>
                                <button 
                                    onClick={finishSync}
                                    className="flex-1 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-xs flex items-center justify-center gap-2"
                                >
                                    <FaCheck /> Selesai
                                </button>
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