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
        <div className="bg-black w-screen h-screen overflow-hidden flex flex-col justify-end p-[5%]">
            {/* Container for scrolling text */}
            <div
                ref={scrollRef}
                className="overflow-y-auto no-scrollbar mask-fade-top flex flex-col gap-6"
                style={{ scrollBehavior: 'smooth' }}
            >
                {segments.slice(-3).map((seg, i) => ( // Show last 3 segments for context
                    <p key={i} className="text-4xl md:text-6xl font-bold text-white/50 leading-tight">
                        {seg.translation || seg.original}
                    </p>
                ))}

                {/* Latest Active Segment */}
                {translation && (
                    <p className="text-5xl md:text-7xl font-black text-white leading-tight animate-fade-in-up">
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
