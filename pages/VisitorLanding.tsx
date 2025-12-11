import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowRight, Heart, User, Lock, Users, Palette } from 'lucide-react';
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
    const { events } = useEvents();
    const { plans } = usePlans();
    const navigate = useNavigate();

    const [step, setStep] = useState<'language' | 'role_selection' | 'app'>('language');
    const [selectedLang, setSelectedLang] = useState<string>('es');
    const [showMemberLogin, setShowMemberLogin] = useState(false);
    const [settings, setSettings] = useState<ChurchSettings | null>(null);
    const [tenantId, setTenantId] = useState<string | undefined>(undefined);

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
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Globe size={32} />
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
                            onClick={() => navigate('/portal')}
                            className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-500 hover:bg-slate-50 transition-all duration-200 text-left"
                        >
                            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                                <Lock size={24} />
                            </div>
                            <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900">{t.admin}</span>
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
