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
  const [targetLang, setTargetLang] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  // Previous text to avoid re-translating same content
  const lastTranslatedTextRef = useRef('');

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

        // Translate if changed and not empty
        if (text && text !== lastTranslatedTextRef.current) {
          lastTranslatedTextRef.current = text;

          if (targetLang === 'es') {
            setTranslation(text);
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

        {/* Translation Area */}
        <div className="p-6 bg-indigo-50 rounded-3xl min-h-[150px] relative border border-indigo-100 transition-all">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-indigo-400">
              {targetLang === 'es' ? 'Texto' : `Traducción (${LANGUAGES.find(l => l.code === targetLang)?.label})`}
            </span>
            {translation && (
              <button onClick={speakTranslation} className="text-indigo-500 hover:text-indigo-700">
                <Volume2 size={16} />
              </button>
            )}
          </div>

          <p className="mt-6 text-lg md:text-xl text-indigo-900 font-bold leading-relaxed animate-in fade-in">
            {isTranslating ? (
              <span className="animate-pulse opacity-50">Traduciendo...</span>
            ) : (
              translation || <span className="text-indigo-200/60 italic">
                {isActive ? "Esperando señal..." : "Pulsa conectar para iniciar."}
              </span>
            )}
          </p>
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