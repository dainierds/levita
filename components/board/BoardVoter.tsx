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

    // 3. Session Closed (Cleaner View) - MOVED UP PRIORITY
    if (session.status === 'CLOSED') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-100 mb-6">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
                        alt="No voting"
                        className="w-12 h-12 opacity-20 grayscale"
                    />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Sin Votaciones Activas</h2>
                <p className="text-slate-400 max-w-xs mx-auto">
                    No hay ninguna sesión de votación en curso en este momento.
                    La pantalla se actualizará automáticamente cuando inicie una nueva.
                </p>
            </div>
        );
    }

    // 4. Already Voted (Waiting Results)
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
                    Esperando resultados en pantalla...
                </p>
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

    // 5. Session Closed (Cleaner View)
    if (session.status === 'CLOSED') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-100 mb-6">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
                        alt="No voting"
                        className="w-12 h-12 opacity-20 grayscale"
                    />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Sin Votaciones Activas</h2>
                <p className="text-slate-400 max-w-xs mx-auto">
                    No hay ninguna sesión de votación en curso en este momento.
                    La pantalla se actualizará automáticamente cuando inicie una nueva.
                </p>
            </div>
        );
    }

    // 6. VOTING OPEN (Mobile Optimized)
    return (
        <div className="min-h-[80vh] flex flex-col justify-center p-4 max-w-md mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">
                    {session.title}
                </h1>
                {session.description && (
                    <p className="text-slate-500 text-sm">{session.description}</p>
                )}
            </header>

            <div className="space-y-3 w-full flex-1 flex flex-col justify-center">
                {session.options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleVote(opt.id)}
                        disabled={loading}
                        className={`w-full py-5 px-6 rounded-2xl shadow-sm border-2 transform transition-all duration-100 active:scale-95 flex items-center justify-between ${opt.color === 'green' ? 'bg-white border-green-100 text-green-700 shadow-green-100/50' :
                            opt.color === 'red' ? 'bg-white border-red-100 text-red-700 shadow-red-100/50' :
                                'bg-white border-slate-100 text-slate-700 shadow-slate-200/50'
                            }`}
                    >
                        <span className="text-xl font-bold">{opt.label}</span>
                        <div className={`w-6 h-6 rounded-full border-4 ${opt.color === 'green' ? 'border-green-100 bg-green-500' :
                            opt.color === 'red' ? 'border-red-100 bg-red-500' :
                                'border-slate-100 bg-slate-300'
                            }`} />
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    En vivo • Voto Secreto
                </p>
            </div>

            {error && (
                <div className="fixed bottom-6 left-6 right-6 p-4 bg-red-500 text-white text-center rounded-xl shadow-xl font-bold animate-in slide-in-from-bottom-4 z-50">
                    {error}
                </div>
            )}
        </div>
    );
};

export default BoardVoter;
