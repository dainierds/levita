import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
                    <AnimatePresence mode="popLayout">
                        {/* Show context, excluding the current live line to avoid duplication */}
                        {segments
                            .slice(-5)
                            .filter((seg, index, arr) => {
                                const isLast = index === arr.length - 1;
                                const text = seg.translation || seg.original;
                                return !(isLast && text === translation);
                            })
                            .map((seg, i) => (
                                <motion.p
                                    key={seg.timestamp || `seg-${i}`}
                                    layout
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 0.6, y: 0, scale: 0.9 }}
                                    exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 30,
                                        opacity: { duration: 0.5 }
                                    }}
                                    className="text-4xl md:text-5xl font-bold text-slate-400 text-center leading-tight drop-shadow-md"
                                >
                                    {seg.translation || seg.original}
                                </motion.p>
                            ))}

                        {/* Current Live Line */}
                        {translation && (
                            <motion.p
                                key="live-line"
                                layout
                                initial={{ opacity: 0, y: 60, scale: 0.8, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                transition={{
                                    type: "spring",
                                    stiffness: 150,
                                    damping: 25,
                                    opacity: { duration: 0.6 }
                                }}
                                className="text-5xl md:text-8xl font-black text-white text-center leading-tight drop-shadow-2xl"
                            >
                                {translation}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .mask-fade-top { 
                    mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                }
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
