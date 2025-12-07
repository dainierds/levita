import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { AlertCircle, CalendarClock } from 'lucide-react';

const ElderRosterView: React.FC = () => {
    const { user } = useAuth();
    const { plans, loading } = usePlans();

    // Filter logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myPlans = plans.filter(p => {
        const pDate = new Date(p.date);
        return pDate >= today && (
            p.team.elder === user?.name ||
            p.team.preacher === user?.name ||
            p.team.musicDirector === user?.name ||
            p.team.audioOperator === user?.name
        );
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
            <div className="bg-white p-6 pb-8 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 mb-8">
                {myPlans.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                        <p className="text-slate-500 font-medium">No tienes turnos asignados próximamente</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myPlans.map(plan => (
                            <div key={plan.id} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-indigo-900">{plan.title}</h4>
                                    <p className="text-xs text-indigo-500 font-semibold mt-1 flex items-center gap-1">
                                        <CalendarClock size={12} /> {plan.date} • {plan.startTime}
                                    </p>
                                </div>
                                <div className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-indigo-600 shadow-sm">
                                    {plan.team.elder === user?.name ? 'Anciano' : 'Asignado'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-6">
                <h3 className="font-bold text-slate-800 mb-4 ml-1">Recordatorios</h3>
                <div className="bg-[#FFF9E5] border border-yellow-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                    <div className="w-1.5 h-full min-h-[40px] bg-yellow-400 rounded-full shrink-0"></div>
                    <div>
                        <p className="text-sm text-yellow-900 font-bold mb-1 flex items-center gap-2">
                            📢 Importante
                        </p>
                        <p className="text-xs text-yellow-700 leading-relaxed font-medium">
                            Recuerda llegar 30 minutos antes del servicio para la reunión de oración.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElderRosterView;
