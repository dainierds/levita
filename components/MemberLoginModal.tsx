import React, { useState, useEffect } from 'react';
import { Search, Lock, Loader2, X, Church, MapPin } from 'lucide-react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
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
    const [churches, setChurches] = useState<any[]>([]);
    const [filteredChurches, setFilteredChurches] = useState<any[]>([]);
    const [selectedChurch, setSelectedChurch] = useState<any>(initialTenantId ? { id: initialTenantId, name: initialChurchName || 'Tu Iglesia' } : null);
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch churches on mount if in search step
    useEffect(() => {
        if (step === 'search') {
            fetchChurches();
        }
    }, [step]);

    // Filter churches when search term changes
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredChurches(churches);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = churches.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                c.pastorName?.toLowerCase().includes(lowerTerm)
            );
            setFilteredChurches(filtered);
        }
    }, [searchTerm, churches]);

    const fetchChurches = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'tenants'), limit(50)); // Fetch up to 50 churches
            const snapshot = await getDocs(q);
            const results: any[] = [];
            snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
            setChurches(results);
            setFilteredChurches(results);
        } catch (err) {
            console.error(err);
            setError('Error al cargar las iglesias.');
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
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Acceso Miembros</h2>
                <p className="text-slate-500 text-center mb-6 text-sm">
                    {step === 'search' ? 'Selecciona tu congregación' : 'Ingresa tu credencial'}
                </p>

                {step === 'search' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                placeholder="Filtrar por nombre..."
                            />
                        </div>

                        {loading && churches.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {filteredChurches.map(church => (
                                    <button
                                        key={church.id}
                                        onClick={() => { setSelectedChurch(church); setStep('pin'); setError(''); }}
                                        className="w-full p-4 bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl flex items-center gap-3 transition-all text-left group shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            <Church size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-700 group-hover:text-indigo-700">{church.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>{church.pastorName}</span>
                                                {church.city && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {church.city}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {filteredChurches.length === 0 && !loading && (
                                    <div className="text-center py-8 text-slate-400">
                                        No se encontraron iglesias.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Church size={32} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800">{selectedChurch.name}</h3>
                            <p className="text-xs text-slate-400 mb-4">{selectedChurch.pastorName}</p>
                            <button
                                type="button"
                                onClick={() => setStep('search')}
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 hover:underline"
                            >
                                Cambiar Iglesia
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">PIN de Acceso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-center tracking-[0.5em] font-bold text-xl text-slate-800"
                                    placeholder="••••"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg font-medium">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
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
