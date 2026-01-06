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
        <div className="w-screen h-screen overflow-hidden flex items-center justify-center p-[5%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-slate-100 font-sans tracking-tight">

            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse-slow" />

            {/* Container for centered text - Max width constrained for readability */}
            <div className="relative z-10 max-w-[85%] text-center flex flex-col gap-6 md:gap-10">

                {/* Previous context (Ghost text) */}
                <div className="flex flex-col items-center gap-4 mask-fade-top">
                    {segments.slice(-3).map((seg, i) => (
                        <p
                            key={i}
                            className="text-3xl md:text-5xl font-semibold text-slate-300 leading-tight transition-all duration-700"
                            style={{
                                opacity: 0.4 + (i * 0.2), // 0.4, 0.6, 0.8
                                transform: `scale(${0.9 + (i * 0.02)}) translateY(${10 - (i * 5)}px)`
                            }}
                        >
                            {seg.translation || seg.original}
                        </p>
                    ))}
                </div>

                {/* Latest Active Segment (Hero Text) */}
                {translation && (
                    <div className="relative">
                        <p className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 leading-[1.1] animate-fade-in-up drop-shadow-2xl">
                            {translation}
                        </p>
                        {/* Subtle glow behind text */}
                        <div className="absolute inset-0 bg-white/5 blur-2xl -z-10 rounded-full opacity-50" />
                    </div>
                )}
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
