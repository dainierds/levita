import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe } from 'lucide-react';
import { translateText } from '../services/geminiService';

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
}

const LiveTranslation: React.FC<LiveTranslationProps> = ({ initialLanguage = 'en' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [targetLang, setTargetLang] = useState(initialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Refs for Speech Recognition
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);

  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Update target lang if prop changes (only if user hasn't manually changed it, but for now we sync it)
  useEffect(() => {
    if (initialLanguage) setTargetLang(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Show results as they are spoken
      // We assume the service is in Spanish for now, or we could make this configurable too
      recognition.lang = 'es-ES'; 

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            handleFinalTranscript(finalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };
      
      recognition.onend = () => {
         // Only restart if we are supposed to be listening
         if (isListeningRef.current) {
             try {
                 recognition.start();
             } catch (e) {
                 // Ignore errors if already started
             }
         }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
          recognitionRef.current.onend = null; // Prevent restart
          recognitionRef.current.stop();
      }
    };
  }, []);

  // Control Start/Stop based on state
  useEffect(() => {
      if (!recognitionRef.current) return;

      if (isListening) {
          try {
              recognitionRef.current.start();
          } catch (e) {
              // already started
          }
      } else {
          recognitionRef.current.stop();
      }
  }, [isListening]);

  const handleFinalTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsTranslating(true);
    // If target is same as source (Spanish), don't translate
    if (targetLang === 'es') {
        setTranslation(text);
    } else {
        const translated = await translateText(text, targetLang);
        setTranslation(translated);
    }
    setIsTranslating(false);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTranscript('');
      setTranslation('');
    }
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
          <p className="text-sm text-slate-500">IA escuchando al predicador...</p>
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
           <span className="absolute top-4 left-4 text-[10px] font-bold uppercase text-slate-400">Original</span>
           <p className="mt-4 text-slate-600 font-medium leading-relaxed">
             {transcript || <span className="text-slate-300 italic">...</span>}
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
                <span className="animate-pulse opacity-50">Procesando...</span>
             ) : (
                translation || <span className="text-indigo-200/60 italic">Presiona el micrófono para comenzar.</span>
             )}
           </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
            isListening 
            ? 'bg-red-500 text-white shadow-red-200 animate-pulse' 
            : 'bg-indigo-600 text-white shadow-indigo-200'
          }`}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>
      
      {isListening && (
        <p className="text-center text-xs font-bold text-slate-400 mt-4 animate-pulse">
          Escuchando...
        </p>
      )}
    </div>
  );
};

export default LiveTranslation;