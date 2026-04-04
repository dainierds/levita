import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe, Radio, Headphones, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translateText } from '../services/geminiService';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
];

interface LiveTranslationProps {
  initialLanguage?: string;
  tenantId?: string;
}

const LiveTranslation: React.FC<LiveTranslationProps> = ({ initialLanguage = 'en', tenantId }) => {
  const { t, language } = useLanguage();
  // 'isListening' now means "Receiving/Active"
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [segments, setSegments] = useState<any[]>([]); // History
  const [targetLang, setTargetLang] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Previous text to avoid re-translating same content
  const lastTranslatedTextRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Audio Context for Streaming Playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize Audio Context on user interaction (Headphones button)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioEnabled(true);
  };

  const playNextInQueue = () => {
    if (!audioCtxRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift();
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer!;
    source.connect(audioCtxRef.current.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  const enqueueAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioCtxRef.current) return;
    try {
      const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      audioQueueRef.current.push(audioBuffer);
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
    } catch (e) {
      console.error("Error decoding audio data", e);
    }
  };


  useEffect(() => {
    // Determine Server URL (assume localhost for dev, relative for prod if proxied)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
    // NOTE: If using Vercel, standard WS might need a separate server URL. 
    // For now assuming the 'server/index.js' runs on port 3000 locally or is routed.
    // Ideally, get this from env but hardcoding typical dev setup for now specific to this project context.

    // Determine Server URL
    // Use the same Environment Variable or Fallback as TranslationMaster
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://web-production-14c5c.up.railway.app';

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => console.log("Connected to Translation Stream");

    ws.onmessage = async (event) => {
      let data = event.data;

      // Handle Blob explicitly (sometimes binaryType isn't respected or defaults vary)
      if (data instanceof Blob) {
        if (isAudioEnabled) {
          // Convert Blob to ArrayBuffer for AudioContext
          const buffer = await data.arrayBuffer();
          enqueueAudio(buffer);
        }
        return;
      }

      if (typeof data === 'string') {
        // Guard against "stringified" Blobs
        if (data.startsWith('[object Blob]')) {
          console.warn("Received [object Blob] as string. Ignoring.");
          return;
        }

        // Text Message (JSON)
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'TRANSCRIPTION' && parsed.translation) {
            setTranslation(parsed.translation || "");
            setSegments(prev => {
              // Keep last 5 segments to avoid huge DOM
              const newSegments = [...prev, {
                original: parsed.original,
                translation: parsed.translation || "",
                timestamp: Date.now()
              }];
              return newSegments.slice(-5);
            });
          }
        } catch (e) {
          console.error("JSON Parse Error:", e, "Raw Data:", data);
        }
      } else if (data instanceof ArrayBuffer) {
        // Binary Message (Audio)
        if (isAudioEnabled) {
          enqueueAudio(data);
        }
      }
    };

    return () => ws.close();
  }, [isAudioEnabled]); // Re-connect/logic depends on audio state mostly for processing

  const toggleAudio = () => {
    if (!isAudioEnabled) {
      initAudio();
    } else {
      setIsAudioEnabled(false);
      audioQueueRef.current = []; // Clear queue
    }
  };

  // ... Keep existing Render Logic ... 

  // NOTE: Replacing the old "useEffect" for TTS with this WS logic.


  useEffect(() => {
    if (initialLanguage) setTargetLang(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (!tenantId || !isActive) return;

    // Subscribe to Firestore Transcription
    const docRef = doc(db, 'tenants', tenantId, 'live', 'transcription');
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const text = data.text || '';

        setTranscript(text);
        setSegments(data.segments || []); // Update history

        // Translate if changed and not empty (For other languages)
        if (text && text !== lastTranslatedTextRef.current) {
          lastTranslatedTextRef.current = text;

          if (targetLang === 'es') {
            setTranslation(text);
          } else if (targetLang === 'en') {
            setTranslation(data.translation || "");
          } else {
            setIsTranslating(true);
            try {
              const translated = await translateText(text, targetLang);
              setTranslation(translated);
            } catch (e) {
              console.error("Translation fail:", e);
            } finally {
              setIsTranslating(false);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [tenantId, isActive, targetLang]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, translation]);





  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const speakTranslation = () => {
    if (!translation) return;
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = targetLang;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-100 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8 rounded-full shadow-sm" alt="Logo" />
            {targetLang === 'es' ? t('visitor.transcription') : t('visitor.live_translation')}
          </h3>
          <p className="text-sm text-slate-500">
            {isActive ? t('visitor.receiving_signal') : t('visitor.translation_paused')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full transition-colors ${isAudioEnabled ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}
            title="Escuchar Traducción (Deepgram Aura)"
          >
            <Headphones size={20} />
          </button>

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">IDIOMA:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-sm font-bold text-indigo-600 outline-none uppercase"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Transcription Area */}
        <div className="p-6 bg-slate-50 rounded-3xl min-h-[100px] relative hidden md:block">
          <span className="absolute top-4 left-4 text-[10px] font-bold uppercase text-slate-400">{t('visitor.original_audio')}</span>
          <p className="mt-4 text-slate-600 font-medium leading-relaxed">
            {transcript || <span className="text-slate-300 italic">{t('visitor.waiting_audio')}</span>}
          </p>
        </div>

        {/* Translation Area (Teleprompter) */}
        <div className={`transition-all ${
          isFullscreen 
            ? 'fixed inset-0 z-[9999] bg-black flex flex-col' 
            : 'bg-black rounded-[2rem] h-[400px] relative border border-slate-800 flex flex-col overflow-hidden shadow-2xl'
        }`}>
          <div className={`absolute left-0 right-0 flex justify-between items-center z-50 ${isFullscreen ? 'p-8 top-0' : 'p-6 top-0'}`}>
            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
              {targetLang === 'es' ? t('visitor.live_translation') : `${t('member.translation')} (${LANGUAGES.find(l => l.code === targetLang)?.label})`}
            </span>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="text-white/50 hover:text-white p-2.5 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>

          {/* Focus Focus Area - matching ProjectionView exactly */}
          <div className="relative w-full h-full flex items-center justify-center p-6 md:p-12 bg-blue-900/10 overflow-hidden rounded-[inherit]">
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 blur-md pointer-events-none px-4">
              {segments.slice(-2).map((seg, i) => (
                <p key={seg.timestamp || i} className={`${isFullscreen ? 'text-4xl md:text-6xl mb-6' : 'text-2xl md:text-3xl mb-4'} font-bold text-white text-center`}>
                   {targetLang === 'es' ? seg.original : (seg.translation || '...')}
                </p>
              ))}
            </div>
            
            {!isActive && segments.length === 0 ? (
              <div className="text-white/30 italic z-10 text-center font-medium">
                {t('visitor.press_to_start')}
              </div>
            ) : isActive && !translation ? (
              <div className="text-white/30 italic z-10 text-center font-medium animate-pulse">
                {t('visitor.waiting_signal')}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                    key={translation}
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`z-10 ${isFullscreen ? 'text-5xl md:text-7xl lg:text-8xl' : 'text-3xl md:text-4xl'} font-black text-white text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-tight px-4`}
                >
                    {translation || "..."}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={toggleActive}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${isActive
            ? 'bg-red-500 text-white shadow-red-200 animate-pulse'
            : 'bg-indigo-600 text-white shadow-indigo-200'
            }`}
        >
          {isActive ? <MicOff size={32} /> : <Radio size={32} />}
        </button>
      </div>

      {
        isActive && (
          <p className="text-center text-xs font-bold text-slate-400 mt-4 animate-pulse">
            {t('visitor.connected_audio')}
          </p>
        )
      }
    </div >
  );
};

export default LiveTranslation;