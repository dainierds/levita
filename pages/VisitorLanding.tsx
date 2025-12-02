import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowRight, Heart } from 'lucide-react';
import VisitorApp from '../components/VisitorApp';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { Link, useNavigate } from 'react-router-dom';

const SUPPORTED_LANGUAGES = [
    { code: 'es', label: 'Español', flagUrl: 'https://flagcdn.com/w80/es.png' },
    { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/w80/us.png' },
    { code: 'pt', label: 'Português', flagUrl: 'https://flagcdn.com/w80/br.png' },
    { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/w80/fr.png' },
];

const VisitorLanding: React.FC = () => {
    const { setLanguage } = useLanguage();
    const { events } = useEvents();
    const { plans } = usePlans();
    const navigate = useNavigate();

    // Steps: 'language' -> 'app'
    const [step, setStep] = useState<'language' | 'app'>('language');
    const [selectedLang, setSelectedLang] = useState<string>('es');

    // Calculate next preacher
    const nextPlan = plans.find(p => !p.isActive && new Date(p.date) >= new Date()) || plans[0];
    const nextPreacher = nextPlan?.team.preacher || 'Por definir';

    const handleLanguageSelect = (code: string) => {
        setLanguage(code as any);
        setSelectedLang(code);
        setStep('app');
    };

    // STEP 1: LANGUAGE SELECTION (Centered Card)
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

                    <div className="mt-8 text-center">
                        <Link to="/portal" className="text-xs font-bold text-slate-300 hover:text-indigo-500 transition-colors">
                            Administración / Miembros
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 2: WELCOME SCREEN + APP (Split Layout)
    return (
        <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Left: Brand / Welcome Message */}
                <div className="flex flex-col justify-center items-start space-y-6 lg:pl-12">
                    <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-pink-200 rotate-3 hover:rotate-6 transition-transform">
                        <Heart size={40} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-slate-800 tracking-tighter mb-4">
                            BIENVENIDO
                        </h1>
                        <p className="text-2xl text-slate-500 font-medium max-w-md leading-relaxed">
                            Estamos felices de verte. Disfruta de la experiencia.
                        </p>
                    </div>

                    {/* Optional: Back to language selection */}
                    <button
                        onClick={() => setStep('language')}
                        className="text-sm font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-2 mt-8"
                    >
                        <Globe size={16} /> Cambiar idioma
                    </button>
                </div>

                {/* Right: The Visitor App (Embedded) */}
                <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                    {/* We wrap VisitorApp to constrain its width and make it look like a phone/card */}
                    <div className="transform scale-95 lg:scale-100 transition-transform origin-top-right">
                        <VisitorApp
                            events={events}
                            onLoginRequest={() => navigate('/portal')}
                            nextPreacher={nextPreacher}
                            initialLanguage={selectedLang as any}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorLanding;
