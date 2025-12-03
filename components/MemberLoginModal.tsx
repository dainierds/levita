import React, { useState } from 'react';
import { Search, Lock, Loader2, X, Church } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MemberLoginModalProps {
    onClose: () => void;
    initialTenantId?: string;
    initialChurchName?: string;
}

const MemberLoginModal: React.FC<MemberLoginModalProps> = ({ onClose, initialTenantId, initialChurchName }) => {
    const { loginAsMember } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<'search' | 'pin'>(initialTenantId ? 'pin' : 'search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedChurch, setSelectedChurch] = useState<any>(initialTenantId ? { id: initialTenantId, name: initialChurchName || 'Tu Iglesia' } : null);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        try {
            // Simple search: name >= term AND name <= term + '\uf8ff'
            const q = query(
                collection(db, 'tenants'),
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'),
                limit(5)
            );

            const snapshot = await getDocs(q);
            const results: any[] = [];
            snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));

            setSearchResults(results);
            if (results.length === 0) setError('No se encontraron iglesias.');
        } catch (err) {
            console.error(err);
            setError('Error al buscar.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChurch || !pin) return;

        setLoading(true);
        setError('');
        try {
            await loginAsMember(selectedChurch.id, pin);
            navigate('/app');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al ingresar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Acceso Miembros</h2>

                {step === 'search' ? (
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                placeholder="Buscar nombre de tu iglesia..."
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            </button>
                        </form>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {searchResults.map(church => (
                                <button
                                    key={church.id}
                                    onClick={() => { setSelectedChurch(church); setStep('pin'); setError(''); }}
                                    className="w-full p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl flex items-center gap-3 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm">
                                        <Church size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 group-hover:text-indigo-700">{church.name}</p>
                                        <p className="text-xs text-slate-400">{church.pastorName}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Church size={32} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800">{selectedChurch.name}</h3>
                            <button type="button" onClick={() => setStep('search')} className="text-xs text-indigo-500 hover:underline">Cambiar Iglesia</button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">Ingresa el PIN de Acceso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all text-center tracking-[0.5em] font-bold text-xl"
                                    placeholder="••••"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Ingresar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default MemberLoginModal;
