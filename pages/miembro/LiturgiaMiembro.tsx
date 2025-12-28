import React from 'react';
import { usePlans } from '../../hooks/usePlans';
import { useTenantSettings } from '../../hooks/useTenantSettings';
import { List, User, Music, Mic2, Headphones, Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const LiturgiaMiembro: React.FC = () => {
    const { plans } = usePlans();
    const { t } = useLanguage();

    // 1. Find UPCOMING plans (active or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date ascending
    const sortedPlans = [...plans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter: Include active plans OR future plans
    // We want the next 2 relevant services
    const upcomingPlans = sortedPlans
        .filter(p => p.isActive || new Date(p.date) >= today)
        .slice(0, 2);

    // If no plans found at all
    if (upcomingPlans.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl shadow-sm">
                <List className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay servicios programados próximamente.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="w-6 h-6 text-purple-600" />
                    Orden del Culto
                </h1>
                <p className="text-gray-500 text-sm">Próximos equipos de turno y servicios.</p>
            </div>

            {/* Loop through the next 2 plans */}
            {upcomingPlans.map((plan) => {
                const isLive = plan.isActive;
                const dateObj = new Date(plan.date); // Assuming YYYY-MM-DD string works in constructor or is already ISO
                // Verify date string format from types if needed, usually '2024-01-01' works.
                // To be safe with timezones for YYYY-MM-DD, we can just split.
                const [y, m, d] = plan.date.split('-').map(Number);
                const localDate = new Date(y, m - 1, d);

                return (
                    <div key={plan.id} className="space-y-6">

                        {/* Header for this Plan */}
                        <div className="flex items-center gap-3 px-2">
                            <div className={`w-2 h-10 rounded-full ${isLive ? 'bg-green-500' : 'bg-indigo-500'}`} />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {plan.title || 'Servicio de Adoración'}
                                    {isLive && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">EN VIVO</span>}
                                </h2>
                                <p className="text-sm text-slate-500 capitalize">
                                    {localDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>

                        {/* TEAM DISPLAY (Matching Admin Roster) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                            {/* Decorative Background Icon */}
                            <User className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-50 rotate-12" />

                            <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wide text-center relative z-10">Equipo Ministerial</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                {/* 1. Anciano de Turno */}
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                                        <User size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Anciano de Turno</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{plan.team.elder || '---'}</p>
                                    </div>
                                </div>

                                {/* 2. Maestro de ES (Replaced 'Music') */}
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                                        {/* Using generic Icon if BookOpen not available, but usually lucide has it. Using User as fallback if import missing, but I will check imports */}
                                        <List size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Maestro de ES</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{plan.team.sabbathSchoolTeacher || '---'}</p>
                                    </div>
                                </div>

                                {/* 3. Predicador */}
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 shrink-0">
                                        <Mic2 size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Predicador</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{plan.team.preacher || '---'}</p>
                                    </div>
                                </div>

                                {/* 4. Operador de Audio */}
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                                        <Mic size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Audio</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{plan.team.audioOperator || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LITURGY ITEMS (Only show for the FIRST plan to save space, or all?) 
                             User asked for "Next two teams", implicitly usually just the names. 
                             But 'LiturgiaMiembro' implies the order of service too. 
                             I will show items ONLY for the closest/active plan to keep it clean, 
                             or maybe concise list for both. 
                             Let's show it for ALL but compact.
                         */}
                        <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-4">
                            {plan.items && plan.items.length > 0 ? (
                                plan.items.map((item, idx) => (
                                    <div key={item.id} className="flex gap-4 items-center py-2">
                                        <span className="text-sm font-bold text-slate-300 w-6">{String(idx + 1).padStart(2, '0')}</span>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{item.title}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.durationMinutes ? `${item.durationMinutes} min • ` : ''} {item.type}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-300 italic py-2">Orden del culto no publicada.</p>
                            )}
                        </div>

                        <div className="w-full h-px bg-slate-100 my-8" />
                    </div>
                );
            })}
        </div>
    );
};

export default LiturgiaMiembro;
