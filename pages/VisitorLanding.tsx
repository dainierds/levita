import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Globe, ArrowRight, Heart, User, Lock, Users, Palette, Shield, LogIn, BookOpen, Smartphone } from 'lucide-react';
import VisitorApp from './visitor-app/App';
import MemberLoginModal from '../components/MemberLoginModal';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ChurchEvent, ChurchSettings, ChurchTenant } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const SUPPORTED_LANGUAGES = [
    { code: 'es', label: 'Español', flagUrl: 'https://flagcdn.com/w80/es.png' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/w80/us.png' },
    { code: 'pt', label: 'Português', flagUrl: 'https://flagcdn.com/w80/br.png' },
    { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/w80/fr.png' },
];

const ROLE_MESSAGES = {
    es: { visitor: "Soy Visitante", member: "Soy Miembro", admin: "Soy Administrador", title: "¿Quién eres?" },
    en: { visitor: "I am a Visitor", member: "I am a Member", admin: "I am an Admin", title: "Who are you?" },
    pt: { visitor: "Sou Visitante", member: "Sou Membro", admin: "Sou Administrador", title: "Quem é você?" },
    fr: { visitor: "Je suis visiteur", member: "Je suis membre", admin: "Je suis administrateur", title: "Qui êtes-vous ?" }
};

const VisitorLanding: React.FC = () => {
    const { setLanguage } = useLanguage();
    const { login, user, role, isLoading } = useAuth(); // Add isLoading
    const { events } = useEvents();
    const { plans } = usePlans();
    const navigate = useNavigate();

    const [step, setStep] = useState<'language' | 'role_selection' | 'app' | 'ministry_selection' | 'ministry_login'>('language');
    const [selectedLang, setSelectedLang] = useState<string>('es');
    const [showMemberLogin, setShowMemberLogin] = useState(false);
    const [settings, setSettings] = useState<ChurchSettings | null>(null);
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);

    // New State for Ministry Flow (Hoisted)
    const [ministryContext, setMinistryContext] = useState<string>(() => sessionStorage.getItem('ministryContext') || '');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Redirect authenticated users
    useEffect(() => {
        if (!isLoading && user) {


            // Check for explicit Ministry Context override (Secondary Roles)
            if (ministryContext === 'Junta de Iglesia' && (role === 'BOARD' || user.secondaryRoles?.includes('BOARD'))) {
                // Keep session storage for AdminApp persistence
                navigate('/app/board'); // Explicit URL
                return;
            }

            if (ministryContext === 'Audio' && (role === 'AUDIO' || user.secondaryRoles?.includes('AUDIO'))) {
                // Keep session storage
                navigate('/app/audio'); // Explicit route for Audio Dashboard
                return;
            }



            // Default Redirects based on Role
            if (role === 'ELDER') navigate('/anciano');
            else if (role === 'MEMBER') navigate('/miembro');
            else if (role === 'MUSIC') navigate('/musica');
            else navigate('/app');
        }
    }, [user, role, navigate, isLoading, ministryContext]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
                <div className="animate-spin text-indigo-600">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        );
    }



    const handleMinistrySelect = (context: string, demoEmail?: string) => {
        setMinistryContext(context);
        sessionStorage.setItem('ministryContext', context);
        if (demoEmail) setEmail(demoEmail);
        setStep('ministry_login');
        setLoginError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            await login(email, password);
            // AuthContext will handle redirect based on role
        } catch (error: any) {
            console.error(error);
            setLoginError('Error de autenticación');
        } finally {
            setLoginLoading(false);
        }
    };

    useEffect(() => {
        const fetchPublicSettings = async () => {
            console.log("VisitorLanding: Starting fetch...");
            try {
                let tid = '';

                // 1. Improved Strategy: Fetch all tenants to find the "active" one
                // Queries tenants and prefers the one with valid settings or name
                const qTenants = query(collection(db, 'tenants'));
                const tenantsSnap = await getDocs(qTenants);

                let selectedTid = '';
                let selectedSettings = DEFAULT_SETTINGS;

                if (!tenantsSnap.empty) {
                    // Prefer one with settings
                    const bestMatch = tenantsSnap.docs.find(d => d.data().settings) || tenantsSnap.docs[0];

                    selectedTid = bestMatch.id;
                    const tData = bestMatch.data() as ChurchTenant;
                    selectedSettings = tData.settings || DEFAULT_SETTINGS;
                }

                if (selectedTid) {
                    setTenantId(selectedTid);
                    setSettings(selectedSettings);
                    return;
                }

                // Fallback (keep existing logic just in case)
                if (!tid) {
                    console.warn("VisitorLanding: No tenants found. Checking legacy t1...");
                    // Note: 'churchSettings' collection is likely unused, but we check 'tenants/t1' just in case
                    const tenantRef = await getDoc(doc(db, 'tenants', 't1'));
                    if (tenantRef.exists()) {
                        tid = 't1';
                        const tData = tenantRef.data() as ChurchTenant;
                        const sData = tData.settings || DEFAULT_SETTINGS;
                        console.log("VisitorLanding: Found t1 tenant directly (with defaults):", sData);
                        setTenantId(tid);
                        setSettings(sData);
                        return;
                    }
                }

                console.warn("VisitorLanding: No tenant found via discovery or t1 fallback.");

            } catch (error) {
                console.error("Error fetching public settings:", error);
            }
        };
        fetchPublicSettings();
    }, []);

    const nextPlan = plans.find(p => !p.isActive && new Date(p.date) >= new Date()) || plans[0];
    const nextPreacher = nextPlan?.team.preacher || 'Por definir';

    const handleLanguageSelect = (code: string) => {
        setLanguage(code as any);
        setSelectedLang(code);
        setStep('role_selection');
    };

    const t = ROLE_MESSAGES[selectedLang as keyof typeof ROLE_MESSAGES] || ROLE_MESSAGES.es;

    if (step === 'language') {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm mx-auto mb-6">
                            <img src="/levita-logo-new.jpg" alt="Levita Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">LEVITA</h1>
                        <p className="text-slate-500">Church Operating System</p>
                    </div>

                    <div className="space-y-4">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageSelect(lang.code)}
                                className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left"
                            >
                                <img
                                    src={lang.flagUrl}
                                    alt={lang.label}
                                    className="w-8 h-6 object-cover rounded shadow-sm"
                                />
                                <span className="text-lg font-bold text-slate-700 group-hover:text-indigo-900">{lang.label}</span>
                                <div className="absolute right-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight size={20} />
                                </div>
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        );
    }

    if (step === 'role_selection') {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-black text-slate-900 mb-2">{t.title}</h1>
                        <p className="text-slate-500">Selecciona tu perfil para continuar</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setStep('app')}
                            className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50 transition-all duration-200 text-left"
                        >
                            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-xl flex items-center justify-center">
                                <Heart size={24} />
                            </div>
                            <span className="text-lg font-bold text-slate-700 group-hover:text-pink-900">{t.visitor}</span>
                            <div className="absolute right-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} />
                            </div>
                        </button>

                        <button
                            onClick={() => setShowMemberLogin(true)}
                            className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left"
                        >
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <span className="text-lg font-bold text-slate-700 group-hover:text-indigo-900">{t.member}</span>
                            <div className="absolute right-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setStep('ministry_selection'); }}
                            className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-500 hover:bg-slate-50 transition-all duration-200 text-left"
                        >
                            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900">Líderes y Ministerios</span>
                            <div className="absolute right-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} />
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={() => setStep('language')}
                        className="w-full mt-8 text-center text-sm font-bold text-slate-300 hover:text-indigo-500 transition-colors"
                    >
                        Volver / Back
                    </button>
                </div>
                {showMemberLogin && <MemberLoginModal onClose={() => setShowMemberLogin(false)} initialTenantId={tenantId} initialChurchName={settings?.churchName} />}
            </div>
        );
    }

    if (step === 'ministry_selection') {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
                <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                    <button onClick={() => setStep('role_selection')} className="mb-8 text-slate-400 hover:text-slate-600 font-bold flex items-center gap-2">
                        ← Volver
                    </button>

                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-slate-800 mb-4">Selecciona tu Departamento</h2>
                        <p className="text-lg text-slate-500">¿A qué área deseas ingresar?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Music */}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); navigate('/musica'); }}
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
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleMinistrySelect('Anciano', 'anciano@levita.com'); }}
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
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleMinistrySelect('Audio', 'luis@levita.com'); }}
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

                        {/* Church Board */}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleMinistrySelect('Junta de Iglesia', 'junta@levita.com'); }}
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-indigo-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Junta de Iglesia</h3>
                                <p className="text-sm text-slate-400">Acceso a Panel y Reportes</p>
                            </div>
                        </button>

                        {/* Leader */}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleMinistrySelect('Líderes', 'lider@levita.com'); }}
                            className="group bg-white p-6 rounded-[2rem] shadow-lg hover:shadow-xl border border-transparent hover:border-emerald-200 transition-all flex items-center gap-6"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <BookOpen size={32} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-800">Líderes / Directores</h3>
                                <p className="text-sm text-slate-400">Gestión de Turnos y Departamentos</p>
                            </div>
                        </button>

                        {/* Admin */}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleMinistrySelect('Administración', 'pastor@levita.com'); }}
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
                </div >
            </div >
        );
    }

    if (step === 'ministry_login') {
        return (
            <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300 relative">
                    <button onClick={() => setStep('ministry_selection')} className="absolute top-8 left-8 text-slate-300 hover:text-slate-500">
                        ←
                    </button>

                    <div className="text-center mb-8 mt-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mx-auto mb-6">
                            <LogIn size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Login</h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Acceso a {ministryContext || 'Líderes'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {loginError && (
                            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl text-red-500 text-xs text-center font-bold">
                                {loginError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="usuario@levita.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="button"
                            onClick={(e) => handleLogin(e)}
                            disabled={loginLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all mt-4 disabled:opacity-50 flex justify-center"
                        >
                            {loginLoading ? <span className="animate-spin">⏳</span> : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50">
                        <p className="text-xs text-center text-slate-400">
                            Levita Church OS
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F4F8]">
            <VisitorApp
                initialTenantId={tenantId}
                initialSettings={settings}
                onExit={() => setStep('language')}
            />
            {showMemberLogin && <MemberLoginModal onClose={() => setShowMemberLogin(false)} initialTenantId={tenantId} initialChurchName={settings?.churchName} />}
        </div>
    );
};

export default VisitorLanding;
