import React, { useState, useEffect } from 'react';
import { User, VotingSession, VoteOption } from '../../types';
import { createVotingSession, updateSessionQuorum, openVotingSession, closeVotingSession, listenToActiveSession } from '../../services/votingService';
import { Users, CheckCircle, Lock, Play, BarChart2, Plus, X, Hand, AlertTriangle } from 'lucide-react';

interface VotingManagerProps {
    users: User[]; // Expected to be filtered for BOARD members
    tenantId: string;
}

const VotingManager: React.FC<VotingManagerProps> = ({ users, tenantId }) => {
    // Session State
    const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
    const [loading, setLoading] = useState(false);

    // Draft State
    const [draftTitle, setDraftTitle] = useState('');
    const [draftOptions, setDraftOptions] = useState<VoteOption[]>([
        { id: 'yes', label: 'Sí', color: 'green' },
        { id: 'no', label: 'No', color: 'red' },
        { id: 'abstain', label: 'Abstención', color: 'gray' }
    ]);
    const [quorumMap, setQuorumMap] = useState<Record<string, boolean>>({});

    // Listen to real-time session
    useEffect(() => {
        const unsubscribe = listenToActiveSession(tenantId, (session) => {
            setActiveSession(session);
            // Initialize quorum check if new session or first load
            if (session && session.status === 'PRE_VOTE') {
                const initialMap: Record<string, boolean> = {};
                // Default: Everyone is present? Or simple false? Let's default true for ease.
                users.forEach(u => {
                    initialMap[u.id] = session.presentMemberIds.length > 0
                        ? session.presentMemberIds.includes(u.id)
                        : true;
                });
                setQuorumMap(initialMap);
            }
        });
        return () => unsubscribe();
    }, [tenantId, users]);

    // Actions
    const handleCreateSession = async () => {
        if (!draftTitle.trim()) return;
        setLoading(true);
        try {
            await createVotingSession(tenantId, draftTitle, users.length, draftOptions);
            setDraftTitle('');
            // Reset to default options for next time
            setDraftOptions([
                { id: 'yes', label: 'Sí', color: 'green' },
                { id: 'no', label: 'No', color: 'red' },
                { id: 'abstain', label: 'Abstención', color: 'gray' }
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuorum = async () => {
        if (!activeSession) return;
        setLoading(true);
        const presentIds = users.filter(u => quorumMap[u.id]).map(u => u.id);
        try {
            await updateSessionQuorum(activeSession.id, presentIds);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!activeSession) return;
        setLoading(true);
        // Ensure quorum is saved one last time
        const presentIds = users.filter(u => quorumMap[u.id]).map(u => u.id);
        await updateSessionQuorum(activeSession.id, presentIds);

        await openVotingSession(activeSession.id);
        setLoading(false);
    };

    const handleClose = async () => {
        if (!activeSession) return;
        setLoading(true);
        await closeVotingSession(activeSession.id);
        setLoading(false);
    };

    // Option Management
    const addOption = () => {
        const id = Math.random().toString(36).substr(2, 5);
        setDraftOptions([...draftOptions, { id, label: '', color: 'blue' }]);
    };

    const updateOption = (idx: number, field: string, value: string) => {
        const newOpts = [...draftOptions];
        (newOpts[idx] as any)[field] = value;
        setDraftOptions(newOpts);
    };

    const removeOption = (idx: number) => {
        setDraftOptions(draftOptions.filter((_, i) => i !== idx));
    };

    // --- RENDER ---

    // 1. No Active Session -> Creation Form
    if (!activeSession || (activeSession.status === 'CLOSED' && activeSession.closedAt && (new Date().getTime() - new Date(activeSession.closedAt).getTime() > 3600000))) {
        // Logic: If closed > 1 hour ago, treat as "No Session" to allow creating new one.
        // Better: Just always show Create Form at top, and Active Session below.
    }

    // Simplified View State
    const isSetup = activeSession?.status === 'PRE_VOTE';
    const isOpen = activeSession?.status === 'OPEN';
    const isClosed = activeSession?.status === 'CLOSED';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <Hand className="text-indigo-600" />
                    Votación J.D.I
                </h1>
                <p className="text-slate-500">Sistema de Votación Secreta en Tiempo Real</p>
            </header>

            {/* CREATE NEW SESSION CARD */}
            {(!activeSession || isClosed) && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Nueva Votación</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pregunta / Título</label>
                            <input
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                placeholder="Ej. Aprobación de Presupuesto 2024"
                                className="w-full text-lg font-bold border-b-2 border-slate-200 focus:border-indigo-600 outline-none py-2 px-1 bg-transparent transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Opciones de Voto</label>
                            <div className="space-y-2">
                                {draftOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            value={opt.label}
                                            onChange={(e) => updateOption(idx, 'label', e.target.value)}
                                            placeholder="Opción"
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                                        />
                                        <select
                                            value={opt.color}
                                            onChange={(e) => updateOption(idx, 'color', e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs"
                                        >
                                            <option value="green">Verde (Sí)</option>
                                            <option value="red">Rojo (No)</option>
                                            <option value="gray">Gris (Neutro)</option>
                                            <option value="blue">Azul</option>
                                            <option value="yellow">Amarillo</option>
                                        </select>
                                        <button onClick={() => removeOption(idx)} className="text-slate-300 hover:text-red-500">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                                {draftOptions.length < 6 && (
                                    <button onClick={addOption} className="text-xs font-bold text-indigo-500 flex items-center gap-1 mt-2">
                                        <Plus size={14} /> Agregar Opción
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleCreateSession}
                                disabled={loading || !draftTitle}
                                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-black transition-all disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : 'Crear Sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTIVE SESSION CONTROL */}
            {activeSession && !isClosed && (
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border-2 border-indigo-100 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isSetup ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600 animate-pulse'
                                    }`}>
                                    {isSetup ? 'PREPARACIÓN' : 'VOTACIÓN EN CURSO'}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">{activeSession.id}</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight">{activeSession.title}</h2>
                        </div>

                        {isOpen && (
                            <div className="text-right">
                                <p className="text-4xl font-black text-indigo-600">
                                    {activeSession.totalVotesCast} <span className="text-lg text-slate-300">/ {activeSession.presentMemberIds.length}</span>
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Votos Recibidos</p>
                            </div>
                        )}
                    </div>

                    {/* QUORUM CHECKLIST (Only in Pre-Vote) */}
                    {isSetup && (
                        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex justify-between">
                                Control de Asistencia (Quórum)
                                <span className="text-indigo-600">{Object.values(quorumMap).filter(Boolean).length} Presentes</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                {users.map(u => (
                                    <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${quorumMap[u.id] ? 'bg-white border-green-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={!!quorumMap[u.id]}
                                            onChange={(e) => setQuorumMap({ ...quorumMap, [u.id]: e.target.checked })}
                                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                                        />
                                        <span className={`text-sm font-medium ${quorumMap[u.id] ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {u.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={handleUpdateQuorum}
                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline"
                                >
                                    Guardar Asistencia
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex gap-4 border-t border-slate-100 pt-6">
                        {isSetup && (
                            <button
                                onClick={handleStart}
                                disabled={loading}
                                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all flex justify-center items-center gap-2"
                            >
                                <Play size={20} fill="currentColor" /> INICIAR VOTACIÓN
                            </button>
                        )}

                        {isOpen && (
                            <>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex justify-center items-center gap-2"
                                >
                                    <Lock size={20} /> CERRAR Y REVELAR
                                </button>
                                <div className="isolate">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-4 bg-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-200 transition-colors flex items-center gap-2"
                                        title="Cierre de Emergencia (Pánico)"
                                    >
                                        <AlertTriangle size={20} />
                                    </button>
                                </div>
                            </>
                        )}

                        <a
                            href={`/projection/${tenantId}`}
                            target="_blank"
                            className="px-4 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                            title="Abrir Vista Proyector"
                        >
                            <BarChart2 size={20} /> Proyector
                        </a>
                    </div>
                </div>
            )}

            {/* PREVIOUS RESULTS (Closed Sessions could go here) */}
        </div>
    );
};

export default VotingManager;
