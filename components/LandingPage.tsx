import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, User, Shield, Heart, ArrowRight, LogIn } from 'lucide-react';

const LandingPage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { login } = useAuth();

    const [step, setStep] = useState<'lang' | 'role' | 'ministry_select' | 'login'>('lang');
    const [selectedRoleType, setSelectedRoleType] = useState<'visitor' | 'member' | 'admin' | null>(null);
    const [ministryContext, setMinistryContext] = useState<string>(''); // For UI label only
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-fill emails for demo purposes based on selection
    const handleRoleSelect = (type: 'visitor' | 'member' | 'admin') => {
        if (type === 'visitor') {
            setSelectedRoleType('visitor');
            login('visitor@levita.com');
        } else if (type === 'admin') {
            // New Flow: Admin/Leader -> Ministry Select
            setSelectedRoleType('admin');
            setStep('ministry_select');
        } else {
            // Member -> Direct Login (or remove if merged)
            setSelectedRoleType('member');
            setStep('login');
            setEmail('luis@levita.com');
        }
    };

    const handleMinistrySelect = (context: string, demoEmail?: string) => {
        setMinistryContext(context);
        if (demoEmail) setEmail(demoEmail);
        setStep('login');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ... (Language Step skipped for brevity in replace, effectively unchanged logic) ...

    // STEP 2: ROLE SELECTION (Modified)
    if (step === 'role') {
        return (
            <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
                <div className="max-w-5xl w-full">
                    <button onClick={() => setStep('lang')} className="mb-8 text-slate-400 hover:text-slate-600 font-bold flex items-center gap-2">
                        ← {t('back')}
                    </button>

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-slate-800 mb-4">{t('welcome')}</h2>
                        <p className="text-xl text-slate-500">¿Cómo deseas interactuar hoy?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Visitor */}
                        <button
                            onClick={() => handleRoleSelect('visitor')}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white hover:-translate-y-2 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
                                <Heart size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('visitor')}</h3>
                            <p className="text-slate-400 leading-relaxed">Soy nuevo o visito la iglesia. Quiero ver eventos y horarios.</p>
                        </button>

                        {/* Member (Standard) */}
                        <button
                            onClick={() => handleRoleSelect('member')}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white hover:-translate-y-2 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                                <User size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('member')}</h3>
                            <p className="text-slate-400 leading-relaxed">Acceso general para miembros de la congregación.</p>
                        </button>

                        {/* Admin / Ministries (New Grouping) */}
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white hover:-translate-y-2 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:scale-110 transition-transform">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Líderes y Ministerios</h3>
                            <p className="text-slate-400 leading-relaxed">Pastor, Ancianos, Música, Audio y Administración.</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2.5: MINISTRY SELECTION
    if (step === 'ministry_select') {
        return (
            <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <button onClick={() => setStep('role')} className="mb-8 text-slate-400 hover:text-slate-600 font-bold flex items-center gap-2">
                        ← Volver
                    </button>

                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-800 mb-4">Selecciona tu Departamento</h2>
                        <p className="text-lg text-slate-500">¿A qué área deseas ingresar?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Music */}
                        <button
                            onClick={() => handleMinistrySelect('Música', 'musica@levita.com')}
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-pink-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🎵</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Alabanza</h3>
                                <p className="text-sm text-slate-400">Acceso a la App de Música</p>
                            </div>
                        </button>

                        {/* Elder */}
                        <button
                            onClick={() => handleMinistrySelect('Anciano', 'anciano@levita.com')} // hypothetical email
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-blue-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">👴</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Ancianos</h3>
                                <p className="text-sm text-slate-400">Cuidado Pastoral y Miembros</p>
                            </div>
                        </button>

                        {/* Audio */}
                        <button
                            onClick={() => handleMinistrySelect('Audio', 'luis@levita.com')}
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-amber-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🎧</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Audio / Multimedia</h3>
                                <p className="text-sm text-slate-400">Control de Pantalla y Sonido</p>
                            </div>
                        </button>

                        {/* Admin */}
                        <button
                            onClick={() => handleMinistrySelect('Administración', 'pastor@levita.com')}
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-slate-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                                <Shield size={32} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Administración</h3>
                                <p className="text-sm text-slate-400">Panel General y Configuración</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 3: LOGIN FORM
    return (
        <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 max-w-md w-full relative">
                <button onClick={() => setStep(selectedRoleType === 'admin' ? 'ministry_select' : 'role')} className="absolute top-8 left-8 text-slate-300 hover:text-slate-500">
                    ←
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mx-auto mb-6">
                        <LogIn size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('login')}</h2>
                    <p className="text-slate-400 text-sm mt-2">
                        {ministryContext ? `Acceso a ${ministryContext}` : (selectedRoleType === 'admin' ? 'Acceso Administrativo' : 'Acceso Miembros')}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-soft"
                            placeholder="nombre@levita.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('password')}</label>
                        <input
                            type="password"
                            className="input-soft"
                            placeholder="••••••••"
                            defaultValue="demo123"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary mt-4 flex justify-center"
                    >
                        {loading ? <span className="animate-spin">⏳</span> : t('enter')}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-xs text-center text-slate-400">
                        <strong>Demo Users:</strong><br />
                        Admin: pastor@levita.com<br />
                        Audio: luis@levita.com<br />
                        Music: musica@levita.com
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
