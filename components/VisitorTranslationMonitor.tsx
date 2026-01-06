import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface VisitorTranslationMonitorProps {
    tenantId?: string;
}

const VisitorTranslationMonitor: React.FC<VisitorTranslationMonitorProps> = ({ tenantId }) => {
    const [translation, setTranslation] = useState('');
    const [original, setOriginal] = useState('');
    const [segments, setSegments] = useState<any[]>([]);

    useEffect(() => {
        if (!tenantId) return;

        // Listen to the SAME firestore path as the visitor app
        const docRef = doc(db, 'tenants', tenantId, 'live', 'transcription');
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setOriginal(data.text || '');
                setTranslation(data.translation || '');
                setSegments(data.segments || []);
            }
        });

        return () => unsubscribe();
    }, [tenantId]);

    // Auto-scroll effect
    const scrollRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [segments]);

    return (
        <div className="bg-[#2d313a]/50 p-6 rounded-[2.5rem] border border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-green-400" /> Vista del Visitante (Monitor v1.2)
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-full uppercase">
                    Simulación Móvil
                </span>
            </div>

            {/* Simulated Mobile Screen */}
            <div className="w-[300px] h-[550px] mx-auto bg-white rounded-[2rem] border-[8px] border-slate-800 overflow-hidden relative shadow-2xl flex flex-col">
                {/* Status Bar */}
                <div className="h-6 bg-slate-900 w-full flex justify-between items-center px-4">
                    <span className="text-[10px] text-white font-bold">9:41</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                        <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                </div>

                {/* App Content Simulation */}
                <div className="flex-1 bg-slate-50 p-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                        <div className="w-20 h-4 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>

                    {/* Translation Card (The Core Feature) */}
                    <div className="mt-8 flex-1 flex flex-col min-h-0">
                        <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-xl text-white relative flex-1 flex flex-col">
                            <span className="text-center text-[10px] font-bold uppercase opacity-50 tracking-widest mb-4">
                                TRADUCCIÓN EN VIVO
                            </span>

                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto space-y-6 no-scrollbar mask-fade-top pb-4"
                                style={{ maxHeight: '300px' }}
                            >
                                {segments.length > 0 ? segments.map((seg, i) => (
                                    <div key={i} className={`leading-relaxed break-words transition-all duration-500 ${i === segments.length - 1 ? 'text-xl font-bold opacity-100 text-white' : 'text-base font-medium opacity-60 text-indigo-100'}`}>
                                        {seg.translation || <span className="opacity-0">...</span>}
                                    </div>
                                )) : (
                                    <div className="h-full flex items-center justify-center opacity-50 italic text-sm">
                                        Esperando traducción...
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex justify-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${segments.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            </div>
                        </div>
                    </div>

                    {/* Chat Bubbles Simulation */}
                    <div className="space-y-2 mt-4 opacity-50">
                        <div className="w-3/4 h-10 bg-white rounded-2xl rounded-tl-none shadow-sm ml-0"></div>
                        <div className="w-1/2 h-10 bg-indigo-100 rounded-2xl rounded-tr-none shadow-sm ml-auto"></div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 text-slate-300">
                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                </div>
            </div>

            <div className="mt-4 p-3 bg-black/30 rounded-xl">
                <p className="text-xs text-slate-400 font-mono mb-1">RAW TRANSCRIPT (DEBUG):</p>
                <p className="text-xs text-green-400 font-mono break-all line-clamp-2">
                    {original || "waiting..."}
                </p>
            </div>
        </div>
    );
};

export default VisitorTranslationMonitor;
