import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// --- STYLE A: SMOOTH FLOW (Refined Scrolling) ---
const SmoothFlow: React.FC<{ translation: string; segments: any[] }> = ({ translation, segments }) => (
    <div className="relative w-full h-full flex flex-col justify-end items-center p-8 overflow-hidden mask-fade-top">
        <div className="flex flex-col items-center gap-6 w-full pb-10">
            <AnimatePresence mode="popLayout">
                {segments.slice(-4).map((seg, i) => (
                    <motion.p
                        key={seg.timestamp || i}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 0.5, y: 0, scale: 0.9 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                        className="text-3xl font-bold text-slate-400 text-center"
                    >
                        {seg.translation || seg.original}
                    </motion.p>
                ))}
                {translation && (
                    <motion.p
                        key="live"
                        layout
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="text-5xl font-black text-white text-center leading-tight drop-shadow-2xl"
                    >
                        {translation}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    </div>
);

// --- STYLE B: FOCUS FOCUS (Centered & Blurred) ---
const FocusFocus: React.FC<{ translation: string; segments: any[] }> = ({ translation, segments }) => (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-blue-900/10 overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 blur-md pointer-events-none">
            {segments.slice(-2).map((seg, i) => (
                <p key={i} className="text-4xl font-bold text-white mb-4">{seg.translation || seg.original}</p>
            ))}
        </div>
        <AnimatePresence mode="wait">
            <motion.div
                key={translation}
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10 text-6xl font-black text-white text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
                {translation || "..."}
            </motion.div>
        </AnimatePresence>
    </div>
);

// --- STYLE C: WORD STAGGER (Liquid Reveal) ---
const WordStagger: React.FC<{ translation: string }> = ({ translation }) => {
    const words = translation.split(' ');
    return (
        <div className="relative w-full h-full flex items-center justify-center p-8 bg-indigo-900/10">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-2xl">
                {words.map((word, i) => (
                    <motion.span
                        key={`${translation}-${i}`}
                        initial={{ opacity: 0, x: -10, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: "backOut" }}
                        className="text-4xl font-bold text-indigo-200"
                    >
                        {word}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

// --- STYLE D: MINIMAL DISSOLVE (In-place) ---
const MinimalDissolve: React.FC<{ translation: string }> = ({ translation }) => (
    <div className="relative w-full h-full flex items-center justify-center p-8 border-t border-white/5">
        <AnimatePresence mode="wait">
            <motion.p
                key={translation}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl font-medium text-slate-100 italic tracking-wide text-center"
            >
                {translation}
            </motion.p>
        </AnimatePresence>
    </div>
);

const ProjectionView: React.FC = () => {
    const { tenantId } = useParams<{ tenantId: string }>();
    const [translation, setTranslation] = useState('');
    const [segments, setSegments] = useState<any[]>([]);

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

    return (
        <div className="w-screen h-screen overflow-hidden bg-black text-white font-sans grid grid-cols-2 grid-rows-2">

            {/* Quadrant 1: Style A */}
            <div className="relative border-r border-b border-white/10 group">
                <span className="absolute top-4 left-4 z-50 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">Style A: Smooth Flow</span>
                <SmoothFlow translation={translation} segments={segments} />
            </div>

            {/* Quadrant 2: Style B */}
            <div className="relative border-b border-white/10 group">
                <span className="absolute top-4 left-4 z-50 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">Style B: Focus Focus</span>
                <FocusFocus translation={translation} segments={segments} />
            </div>

            {/* Quadrant 3: Style C */}
            <div className="relative border-r border-white/10 group">
                <span className="absolute top-4 left-4 z-50 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">Style C: Word Stagger</span>
                <WordStagger translation={translation} />
            </div>

            {/* Quadrant 4: Style D */}
            <div className="relative group">
                <span className="absolute top-4 left-4 z-50 text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">Style D: Minimal Dissolve</span>
                <MinimalDissolve translation={translation} />
            </div>

            <style>{`
                .mask-fade-top { 
                    mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%); 
                }
            `}</style>
        </div>
    );
};

export default ProjectionView;
