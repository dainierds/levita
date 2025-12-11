import React from 'react';
import { usePlans } from '../../hooks/usePlans';
import { useTenantSettings } from '../../hooks/useTenantSettings';
import { List, User, Music, Mic2, Headphones, Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LiturgiaMiembro: React.FC = () => {
    const { plans } = usePlans();
    const { settings } = useTenantSettings();
    const { t } = useLanguage();

    // Logic to determine active vs next plan (Same as Visitor App)
    const active = plans.find(p => p.isActive);
    let displayPlan = active;

    if (!displayPlan) {
        // Find NEXT upcoming plan
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = plans
            .filter(p => !p.isActive && new Date(p.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]; // Ascending (nearest first)

        displayPlan = upcoming;
    }

    // LOGIC: Determine Active Team (Prioritize Global Settings > Plan Settings)
    let activePreacher = displayPlan?.team?.preacher || '---';
    let activeMusic = displayPlan?.team?.musicDirector || '---';
    let activeElder = displayPlan?.team?.elder || '---';
    let activeAudio = displayPlan?.team?.audioOperator || '---';

    if (settings?.activeTeamId && settings.teams) {
        const globalActive = settings.teams.find(t => t.id === settings.activeTeamId);
        if (globalActive) {
            if (globalActive.members.preacher) activePreacher = globalActive.members.preacher;
            if (globalActive.members.musicDirector) activeMusic = globalActive.members.musicDirector;
            if (globalActive.members.elder) activeElder = globalActive.members.elder;
            if (globalActive.members.audioOperator) activeAudio = globalActive.members.audioOperator;
        }
    }

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="w-6 h-6 text-purple-600" />
                    Orden del Culto
                </h1>
                <p className="text-gray-500 text-sm">{displayPlan ? displayPlan.title || 'Servicio General' : 'No hay servicio activo'}</p>
            </div>

            {(displayPlan?.team || settings?.activeTeamId) && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wide text-center">Equipo Ministerial</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Anciano */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                                <User size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Anciano de Turno</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{activeElder}</p>
                            </div>
                        </div>

                        {/* 2. Predicador */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shrink-0">
                                <Mic size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Predicador</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{activePreacher}</p>
                            </div>
                        </div>

                        {/* 3. Música */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                                <Music size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Música</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{activeMusic}</p>
                            </div>
                        </div>

                        {/* 4. Audio */}
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                                <Headphones size={18} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Audio</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{activeAudio}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {displayPlan?.items.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
                        <span className="text-lg font-bold text-slate-200 mt-1">{String(idx + 1).padStart(2, '0')}</span>
                        <div>
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400 font-medium">{item.durationMinutes ? `${item.durationMinutes} min • ` : ''} {item.type}</p>
                        </div>
                    </div>
                ))}
                {!displayPlan && (
                    <div className="text-center text-slate-400 italic py-12 bg-white rounded-2xl shadow-sm">
                        No hay orden del culto disponible en este momento.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiturgiaMiembro;
