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
                <div className="flex flex-col items-center w-full pb-10">
                    {/* Show last 7 segments for context */}
                    {segments.slice(-7).map((seg, i) => (
                        <div key={i} className="w-full flex justify-center animate-expand-height origin-bottom shrink-0">
                            <p
                                className="text-4xl md:text-6xl font-bold text-slate-200 text-center leading-tight drop-shadow-md py-4"
                            >
                                {seg.translation || seg.original}
                            </p>
                        </div>
                    ))}

                    {/* Current Live Line */}
                    {translation && (
                        <div className="w-full flex justify-center animate-fade-in-up shrink-0 min-h-[min-content]">
                            <p className="text-5xl md:text-7xl font-black text-white text-center leading-tight drop-shadow-2xl py-4">
                                {translation}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .mask-fade-top { 
                    mask-image: linear-gradient(to bottom, transparent 0%, black 20%); 
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%); 
                }
                
                @keyframes expand-height {
                    0% { grid-template-rows: 0fr; opacity: 0; transform: translateY(20px); max-height: 0; padding-top: 0; padding-bottom: 0; margin: 0; }
                    100% { grid-template-rows: 1fr; opacity: 1; transform: translateY(0); max-height: 300px; }
                }
                .animate-expand-height { 
                    animation: expand-height 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    overflow: hidden;
                }

                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
                
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
