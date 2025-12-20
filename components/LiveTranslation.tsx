import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe, Radio } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

interface LiveTranslationProps {
  initialLanguage?: string;
  tenantId?: string;
}

const LiveTranslation: React.FC<LiveTranslationProps> = ({ initialLanguage = 'en', tenantId }) => {
  // 'isListening' now means "Receiving/Active"
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [segments, setSegments] = useState<any[]>([]); // History
  const [targetLang, setTargetLang] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  // Previous text to avoid re-translating same content
  const lastTranslatedTextRef = useRef('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
            <Globe size={24} className="text-indigo-500" />
            {targetLang === 'es' ? 'Transcripción' : 'Traducción en Vivo'}
          </h3>
          <p className="text-sm text-slate-500">
            {isActive ? 'Recibiendo señal en vivo...' : 'Traducción en Pausa'}
          </p>
        </div>
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

      <div className="space-y-6">
        {/* Transcription Area */}
        <div className="p-6 bg-slate-50 rounded-3xl min-h-[100px] relative hidden md:block">
          <span className="absolute top-4 left-4 text-[10px] font-bold uppercase text-slate-400">Original (Audio Sala)</span>
          <p className="mt-4 text-slate-600 font-medium leading-relaxed">
            {transcript || <span className="text-slate-300 italic">...esperando audio...</span>}
          </p>
        </div>

        {/* Translation Area (Teleprompter) */}
        <div className="p-6 bg-indigo-50 rounded-3xl h-[400px] relative border border-indigo-100 transition-all flex flex-col">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <span className="text-[10px] font-bold uppercase text-indigo-400">
              {targetLang === 'es' ? 'Texto en Vivo' : `Traducción (${LANGUAGES.find(l => l.code === targetLang)?.label})`}
            </span>
            {translation && (
              <button onClick={speakTranslation} className="text-indigo-500 hover:text-indigo-700 bg-white p-2 rounded-full shadow-sm">
                <Volume2 size={16} />
              </button>
            )}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4 no-scrollbar mt-8 mask-fade-top"
          >
            {/* History Segments */}
            {segments.map((seg, i) => (
              <div key={i} className={`transition-all duration-500 ${i === segments.length - 1 ? 'opacity-100 scale-100' : 'opacity-60 scale-95 origin-left'}`}>
                <p className={`text-lg md:text-xl font-bold leading-relaxed ${i === segments.length - 1 ? 'text-indigo-900' : 'text-indigo-900/60'}`}>
                  {targetLang === 'es' ? seg.original : (targetLang === 'en' ? (seg.translation || seg.original) : (i === segments.length - 1 ? translation : (seg.translation || seg.original)))}
                </p>
              </div>
            ))}

            {segments.length === 0 && (
              <div className="h-full flex items-center justify-center text-indigo-300 italic">
                {isActive ? "Esperando señal..." : "Pulsa conectar para iniciar."}
              </div>
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

      {isActive && (
        <p className="text-center text-xs font-bold text-slate-400 mt-4 animate-pulse">
          Conectado al Audio Principal
        </p>
      )}
    </div>
  );
};

export default LiveTranslation;