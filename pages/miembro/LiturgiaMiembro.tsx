import React from 'react';
import { usePlans } from '../../hooks/usePlans';
import { List, User, Music, Mic2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LiturgiaMiembro: React.FC = () => {
    const { plans } = usePlans();
    const { t } = useLanguage();
    const activePlan = plans.find(p => p.isActive);

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="w-6 h-6 text-purple-600" />
                    Liturgia del Culto
                </h1>
                <p className="text-gray-500 text-sm">{activePlan ? activePlan.title || 'Servicio General' : 'No hay servicio activo'}</p>
            </div>

            {activePlan?.team && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Equipo Ministerial</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><User size={16} /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Predicador</p>
                                <p className="text-sm font-bold text-gray-700">{activePlan.team.preacher || '---'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500"><Music size={16} /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Música</p>
                                <p className="text-sm font-bold text-gray-700">{activePlan.team.musicDirector || '---'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {activePlan?.items.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
                        <span className="text-lg font-bold text-slate-200 mt-1">{String(idx + 1).padStart(2, '0')}</span>
                        <div>
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400 font-medium">{item.durationMinutes} min • {item.type}</p>
                        </div>
                    </div>
                ))}
                {!activePlan && (
                    <div className="text-center text-slate-400 italic py-12 bg-white rounded-2xl shadow-sm">
                        No hay orden del culto disponible en este momento.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiturgiaMiembro;
