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
        <div className="bg-black w-screen h-screen overflow-hidden flex items-center justify-center p-[5%]">
            {/* Container for centered text */}
            <div
                className="max-w-[90%] text-center flex flex-col gap-8"
            >
                {/* Previous context (faded) */}
                {segments.slice(-5).map((seg, i) => (
                    <p key={i} className={`text-4xl md:text-5xl font-bold leading-tight transition-all duration-500`} style={{ opacity: 0.2 + (i * 0.15), color: 'white' }}>
                        {seg.translation || seg.original}
                    </p>
                ))}

                {/* Latest Active Segment (Huge) */}
                {translation && (
                    <p className="text-6xl md:text-8xl font-black text-white leading-tight animate-fade-in-up drop-shadow-2xl">
                        {translation}
                    </p>
                )}
            </div>

            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-top { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%); mask-image: linear-gradient(to bottom, transparent 0%, black 20%); }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
};

export default ProjectionView;
