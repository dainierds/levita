import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { listenToActiveSession } from '../../../services/votingService';
import { VotingSession } from '../../../types';
import { BarChart2, Users, CheckCircle } from 'lucide-react';

const BoardProjection: React.FC = () => {
    // We assume the URL is /projection/:tenantId
    const { tenantId } = useParams();
    const [session, setSession] = useState<VotingSession | null>(null);

    useEffect(() => {
        if (!tenantId) return;
        const unsubscribe = listenToActiveSession(tenantId, (s) => setSession(s));
        return () => unsubscribe();
    }, [tenantId]);

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center opacity-50">
                    <BarChart2 size={64} className="mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">Junta de Iglesia</h1>
                    <p className="text-xl">Esperando sesión...</p>
                </div>
            </div>
        );
    }

    const { options, totalVotesCast, presentMemberIds, status, results } = session;
    const totalPresent = presentMemberIds.length;
    const isClosed = status === 'CLOSED';

    // Animation: If closed, bars height = pct. If open, height = 0.

    return (
        <div className="min-h-screen bg-slate-900 text-white p-12 flex flex-col relative overflow-hidden">
            {/* BACKGROUND ACCENTS */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-900 z-0" />

            {/* HEADER */}
            <header className="relative z-10 flex justify-between items-start mb-16">
                <div>
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/50">
                        Votación en Curso
                    </span>
                    <h1 className="text-6xl font-black mt-6 leading-tight max-w-4xl tracking-tight">
                        {session.title}
                    </h1>
                </div>

                {/* COUNTER */}
                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-center min-w-[240px]">
                    <div className="flex justify-center items-end gap-2 mb-2">
                        <span className={`text-7xl font-black ${totalVotesCast === totalPresent ? 'text-green-400' : 'text-white'}`}>
                            {totalVotesCast}
                        </span>
                        <span className="text-2xl text-slate-500 font-bold mb-3">/ {totalPresent}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        {totalVotesCast === totalPresent ? <CheckCircle size={16} /> : <Users size={16} />}
                        Votos Recibidos
                    </p>
                </div>
            </header>

            {/* CHART AREA */}
            <main className="relative z-10 flex-1 flex items-end justify-center gap-8 pb-12 w-full max-w-7xl mx-auto">
                {options.map((opt) => {
                    // Logic: Even if OPEN, we render columns but height 0.
                    // If CLOSED, we calculate height.
                    const count = isClosed ? (results?.[opt.id] || 0) : 0;
                    // For height calc, assume max possible is totalPresent (100% height)
                    // Or relative to highest vote? Relative to totalPresent is safer for "Majority" visualization.
                    const percentage = totalPresent > 0 ? (count / totalPresent) * 100 : 0;
                    // Min height for label visibility
                    const displayHeight = isClosed ? Math.max(percentage, 5) : 5; // 5% min

                    const barColor = opt.color === 'green' ? 'bg-green-500' :
                        opt.color === 'red' ? 'bg-red-500' :
                            opt.color === 'gray' ? 'bg-slate-500' : 'bg-indigo-500';

                    return (
                        <div key={opt.id} className="flex-1 h-[60vh] flex flex-col justify-end group">
                            {/* DATA LABEL (Only Visible if Closed) */}
                            <div className={`text-center mb-4 transition-all duration-1000 ${isClosed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <span className="text-5xl font-black block">{count}</span>
                                <span className="text-slate-400 font-bold">{Math.round(percentage)}%</span>
                            </div>

                            {/* BAR */}
                            <div className="relative w-full bg-slate-800/50 rounded-t-3xl overflow-hidden backdrop-blur-sm border-x border-t border-white/5 mx-auto max-w-[200px]" style={{ height: '100%' }}>
                                <div
                                    className={`absolute bottom-0 w-full rounded-t-3xl transition-all duration-[2000ms] ease-out ${barColor} shadow-[0_0_40px_rgba(0,0,0,0.3)]`}
                                    style={{ height: isClosed ? `${percentage}%` : '0%' }}
                                >
                                    {/* Gloss Effect */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>
                            </div>

                            {/* AXIS LABEL */}
                            <div className="text-center mt-6">
                                <h3 className="text-2xl font-bold text-slate-200">{opt.label}</h3>
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

export default BoardProjection;
