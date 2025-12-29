import React, { useState, useEffect } from 'react';
import { User, VotingSession } from '../../types';
import { listenToActiveSession, castVote } from '../../services/votingService';
import { CheckCircle, Clock, Lock, AlertCircle, Users } from 'lucide-react';

interface BoardVoterProps {
    user: User;
    tenantId: string;
}

const BoardVoter: React.FC<BoardVoterProps> = ({ user, tenantId }) => {
    const [session, setSession] = useState<VotingSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const unsubscribe = listenToActiveSession(tenantId, (s) => setSession(s));
        return () => unsubscribe();
    }, [tenantId]);

    const handleVote = async (optionId: string) => {
        if (!session) return;
        setLoading(true);
        setError('');
        try {
            await castVote(session.id, user.id, optionId);
            setSuccessMsg("Voto registrado correctamente");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al registrar el voto");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER STATES ---

    // 1. No Session
    if (!session || (session.status === 'CLOSED' && session.closedAt && (new Date().getTime() - new Date(session.closedAt).getTime() > 3600000))) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6 animate-pulse">
                    <Clock size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Esperando Votación</h2>
                <p className="text-slate-500">El administrador iniciará la sesión pronto.</p>
            </div>
        );
    }

    // 2. Not in Quorum (Absent)
    if (!session.presentMemberIds.includes(user.id)) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Habilitado</h2>
                <p className="text-slate-500 max-w-xs">
                    No estás marcado como "Presente" en el quórum de esta sesión. Contacta al administrador si es un error.
                </p>
            </div>
        );
    }

    // 3. Already Voted (Waiting Results) - Or Session Closed (Results on Screen)
    // Note: We check local state 'successMsg' for immediate feedback, OR the array in session for persistence re-load.
    const hasVoted = session.votedUserIds.includes(user.id);

    if (hasVoted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-lg shadow-green-100 animate-in zoom-in duration-500">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Voto Registrado</h2>
                <p className="text-slate-500 mb-8">
                    Tu participación es anónima. <br />
                    {session.status === 'CLOSED' ? 'La votación ha finalizado.' : 'Esperando resultados en pantalla...'}
                </p>
                {/* Could show results here if CLOSED, but requirement says "On Projection Screen". Maybe show simplified here? */}
                {session.status === 'CLOSED' && (
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 w-full max-w-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Resultados Finales</p>
                        {session.options.map(opt => {
                            const count = session.results?.[opt.id] || 0;
                            const total = session.totalVotesCast || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={opt.id} className="mb-3 last:mb-0">
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                        <span>{opt.label}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${pct}%`, backgroundColor: opt.color === 'green' ? '#22c55e' : opt.color === 'red' ? '#ef4444' : '#94a3b8' }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    }

    // 4. Pre-Vote (Connected but waiting start)
    if (session.status === 'PRE_VOTE') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 animate-pulse">
                    <Users size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{session.title}</h2>
                <p className="text-slate-500">Preparando votación... Por favor espera.</p>
            </div>
        );
    }

    // 5. VOTING OPEN
    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center">
            <header className="mb-8 text-center">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
                    Votación Activa
                </span>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                    {session.title}
                </h1>
                {session.description && (
                    <p className="text-slate-500 mt-2 text-sm">{session.description}</p>
                )}
            </header>

            <div className="space-y-4 max-w-md mx-auto w-full">
                {session.options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleVote(opt.id)}
                        disabled={loading}
                        className={`w-full p-6 rounded-2xl shadow-sm border-2 transition-all duration-200 group active:scale-95 ${opt.color === 'green' ? 'bg-white border-green-100 hover:border-green-500 hover:bg-green-50 text-green-700' :
                                opt.color === 'red' ? 'bg-white border-red-100 hover:border-red-500 hover:bg-red-50 text-red-700' :
                                    'bg-white border-slate-100 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
                            }`}
                    >
                        <span className="text-xl font-bold block">{opt.label}</span>
                    </button>
                ))}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 text-center rounded-xl text-sm font-bold animate-in shake">
                    {error}
                </div>
            )}
        </div>
    );
};

export default BoardVoter;
