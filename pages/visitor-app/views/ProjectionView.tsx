import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
        <div className="w-screen h-screen overflow-hidden bg-black text-white font-sans flex items-center justify-center">
            <FocusFocus translation={translation} segments={segments} />
        </div>
    );
};

export default ProjectionView;
