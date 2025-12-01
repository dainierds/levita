import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, User, Shield, Heart, ArrowRight, LogIn } from 'lucide-react';

const LandingPage: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { login } = useAuth();

    const [step, setStep] = useState<'lang' | 'role' | 'login'>('lang');
    const [selectedRoleType, setSelectedRoleType] = useState<'visitor' | 'member' | 'admin' | null>(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-fill emails for demo purposes based on selection
    const handleRoleSelect = (type: 'visitor' | 'member' | 'admin') => {
        setSelectedRoleType(type);
        if (type === 'visitor') {
            // Auto-login as visitor
            login('visitor@levita.com'); // This should trigger the visitor flow in AuthContext
        } else {
            setStep('login');
            // Suggest demo emails
            if (type === 'admin') setEmail('pastor@levita.com');
            if (type === 'member') setEmail('luis@levita.com'); // Audio tech example
        }
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

    // STEP 1: LANGUAGE SELECTION
    if (!language || step === 'lang') {
        return (
            <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Brand */}
                    <div className="flex flex-col justify-center items-start space-y-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                            <Globe size={32} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">LEVITA</h1>
                            <p className="text-xl text-slate-500 font-medium">Church Operating System</p>
                        </div>
                    </div>

                    {/* Right: Selection */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-white">
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Select Language / Idioma</h2>
                        <div className="space-y-4">
                            <button
                                onClick={() => { setLanguage('es'); setStep('role'); }}
                                className="w-full group relative p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-lg transition-all text-left flex items-center gap-4"
                            >
                                <span className="text-4xl">🇪🇸</span>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Español</h3>
                                    <p className="text-sm text-slate-400">Continuar en Español</p>
                                </div>
                                <div className="absolute right-6 text-slate-300 group-hover:text-indigo-500">
                                    <ArrowRight size={24} />
                                </div>
                            </button>

                            <button
                                onClick={() => { setLanguage('en'); setStep('role'); }}
                                className="w-full group relative p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-lg transition-all text-left flex items-center gap-4"
                            >
                                <span className="text-4xl">🇺🇸</span>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">English</h3>
                                    <p className="text-sm text-slate-400">Continue in English</p>
                                </div>
                                <div className="absolute right-6 text-slate-300 group-hover:text-indigo-500">
                                    <ArrowRight size={24} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2: ROLE SELECTION
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

                        {/* Member/Leader */}
                        <button
                            onClick={() => handleRoleSelect('member')}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white hover:-translate-y-2 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                                <User size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('member')}</h3>
                            <p className="text-slate-400 leading-relaxed">Soy parte del equipo (Música, Audio, Ujier) o miembro activo.</p>
                        </button>

                        {/* Admin */}
                        <button
                            onClick={() => handleRoleSelect('admin')}
                            className="group bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-white hover:-translate-y-2 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:scale-110 transition-transform">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('admin')}</h3>
                            <p className="text-slate-400 leading-relaxed">Gestión administrativa, configuración y liderazgo principal.</p>
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
                <button onClick={() => setStep('role')} className="absolute top-8 left-8 text-slate-300 hover:text-slate-500">
                    ←
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mx-auto mb-6">
                        <LogIn size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('login')}</h2>
                    <p className="text-slate-400 text-sm mt-2">
                        {selectedRoleType === 'admin' ? 'Acceso Administrativo' : 'Acceso Miembros y Líderes'}
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
