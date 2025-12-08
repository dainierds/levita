import React from 'react';
import { usePlans } from '../../hooks/usePlans';
import { Radio } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const EnVivoMiembro: React.FC = () => {
    const { plans } = usePlans();
    const { t } = useLanguage();
    const activePlan = plans.find(p => p.isActive);

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Radio className="w-6 h-6 text-red-500" />
                    Transmisión en Vivo
                </h1>
            </div>

            <div className="w-full bg-black rounded-[2rem] overflow-hidden shadow-xl shadow-slate-300 aspect-video relative">
                {activePlan ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/live_stream?channel=UCjaxadventista7morenacersda63"
                        title="Live Service"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                        <Radio size={32} className="mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase tracking-widest text-center px-4">
                            {t('member.offline') || 'No estamos transmitiendo en este momento'}
                        </p>
                    </div>
                )}

                {activePlan && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-white tracking-wider">EN VIVO</span>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="font-bold text-lg mb-2">Horarios de Culto</h2>
                <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Domingos 10:00 AM</li>
                    <li>• Miércoles 7:30 PM</li>
                </ul>
            </div>
        </div>
    );
};

export default EnVivoMiembro;
