import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ArrowRight, Heart } from 'lucide-react';
import VisitorApp from '../components/VisitorApp';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { Link, useNavigate } from 'react-router-dom';

const VisitorLanding: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const { events } = useEvents();
    const { plans } = usePlans();
    const [hasSelectedLang, setHasSelectedLang] = useState(false);
    const navigate = useNavigate();

    // Calculate next preacher
    const nextPlan = plans.find(p => !p.isActive && new Date(p.date) >= new Date()) || plans[0];
    const nextPreacher = nextPlan?.team.preacher || 'Por definir';

    // If language is selected, show the Visitor App immediately
    if (language && hasSelectedLang) {
        return (
            <div className="relative">
                <VisitorApp
                    events={events}
                    onLoginRequest={() => navigate('/portal')}
                    nextPreacher={nextPreacher}
                />
                <div className="fixed bottom-4 left-4 z-50">
                    <Link to="/portal" className="text-[10px] text-slate-300 hover:text-slate-500 font-bold uppercase tracking-widest">
                        Staff Portal
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Brand */}
                <div className="flex flex-col justify-center items-start space-y-6">
                    <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-pink-200">
                        <Heart size={32} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-slate-800 tracking-tighter mb-2">BIENVENIDO</h1>
                        <p className="text-xl text-slate-500 font-medium">Estamos felices de verte.</p>
                    </div>
                </div>

                {/* Right: Selection */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-white">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Selecciona tu idioma</h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => { setLanguage('es'); setHasSelectedLang(true); }}
                            className="w-full group relative p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-pink-500 hover:shadow-lg transition-all text-left flex items-center gap-4"
                        >
                            <span className="text-4xl">🇪🇸</span>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-pink-600 transition-colors">Español</h3>
                            </div>
                            <div className="absolute right-6 text-slate-300 group-hover:text-pink-500">
                                <ArrowRight size={24} />
                            </div>
                        </button>

                        <button
                            onClick={() => { setLanguage('en'); setHasSelectedLang(true); }}
                            className="w-full group relative p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-pink-500 hover:shadow-lg transition-all text-left flex items-center gap-4"
                        >
                            <span className="text-4xl">🇺🇸</span>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-pink-600 transition-colors">English</h3>
                            </div>
                            <div className="absolute right-6 text-slate-300 group-hover:text-pink-500">
                                <ArrowRight size={24} />
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/portal" className="text-xs font-bold text-slate-300 hover:text-indigo-500 transition-colors">
                            ¿Eres miembro o líder? Entra aquí
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorLanding;
