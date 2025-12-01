import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, User, Shield, ArrowRight, LogIn, Church } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StaffPortal: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<'lang' | 'role' | 'login'>('lang');
    const [selectedRoleType, setSelectedRoleType] = useState<'member' | 'admin' | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRoleSelect = (type: 'member' | 'admin') => {
        setSelectedRoleType(type);
        setStep('login');
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            // AuthContext will update 'user', and the MainApp wrapper should render the dashboard
        } catch (error: any) {
            console.error(error);
            setError('Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // ... (Language and Role steps remain the same)

    // STEP 3: LOGIN
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl border border-slate-700 max-w-md w-full relative">
                <button onClick={() => setStep('role')} className="absolute top-8 left-8 text-slate-500 hover:text-white">
                    ←
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900 mx-auto mb-6">
                        <LogIn size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{t('login')}</h2>
                    <p className="text-slate-400 text-sm mt-2">
                        {selectedRoleType === 'admin' ? 'Acceso Administrativo' : 'Acceso Equipo'}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder="nombre@levita.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all mt-4 disabled:opacity-50"
                    >
                        {loading ? <span className="animate-spin">⏳</span> : t('enter')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffPortal;
