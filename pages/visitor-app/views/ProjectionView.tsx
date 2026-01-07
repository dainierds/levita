import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const ProjectionView: React.FC = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const [translation, setTranslation] = useState('');
    const [segments, setSegments] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!tenantId) return;

        const docRef = doc(db, 'tenants', tenantId, 'live', 'transcription');
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setTranslation(data.translation || '');
                setSegments(data.segments || []);
            }
        });

        return () => unsubscribe();
    }, [tenantId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [segments, translation]);

    return (
        <div className="w-screen h-screen overflow-hidden flex items-end justify-center pb-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-slate-100 font-sans tracking-tight">

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse-slow" />

            {/* Container for Movie Credits Style Scrolling */}
            <div className="relative z-10 w-full max-w-[90%] md:max-w-[80%] h-[85vh] flex flex-col justify-end items-center mask-fade-top">
                <div className="flex flex-col items-center gap-6 md:gap-8 w-full pb-10">
                    {/* Show context, excluding the current live line to avoid duplication */}
                    {segments
                        .slice(-7)
                        // Filter out the last segment if it matches the current hero line
                        .filter((seg, index, arr) => {
                            const isLast = index === arr.length - 1;
                            const text = seg.translation || seg.original;
                            // Strict check to ensure we don't hide previous identical lines, only the immediate duplicate
                            return !(isLast && text === translation);
                        })
                        .map((seg, i) => (
                            <p
                                key={i}
                                className="text-4xl md:text-6xl font-bold text-slate-300 text-center leading-tight drop-shadow-md transition-all duration-500 opacity-80"
                            >
                                {seg.translation || seg.original}
                            </p>
                        ))}

                    {/* Current Live Line */}
                    {translation && (
                        <p className="text-5xl md:text-7xl font-black text-white text-center leading-tight drop-shadow-2xl animate-fade-in-up">
                            {translation}
                        </p>
                    )}
                </div>
            </div>

            <style>{`
                .mask-fade-top { 
                    mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(10px); }
                    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default ProjectionView;
