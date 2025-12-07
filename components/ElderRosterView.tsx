import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { CalendarClock } from 'lucide-react';

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
        <div className="min-h-screen bg-[#f3f4f6] pb-32 max-w-md mx-auto md:my-8 md:min-h-[800px] pt-6">
            {myPlans.length === 0 ? (
                <div className="bg-white mx-4 rounded-3xl p-8 text-center shadow-sm mb-8">
                    <p className="text-slate-500 font-medium text-sm">No tienes turnos asignados próximamente</p>
                </div>
            ) : (
                <div className="mx-4 space-y-4 mb-8">
                    {myPlans.map(plan => (
                        <div key={plan.id} className="bg-white border border-indigo-100 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                            <div>
                                <h4 className="font-bold text-indigo-900 text-sm">{plan.title}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                                    <CalendarClock size={12} /> {plan.date} • {plan.startTime}
                                </p>
                            </div>
                            <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-600">
                                {plan.team.elder === user?.name ? 'Anciano' : 'Asignado'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mx-4">
                <h3 className="font-bold text-slate-900 mb-3 ml-1 text-sm">Recordatorios</h3>
                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                    <span className="text-lg mt-0.5">📢</span>
                    <p className="text-xs text-[#92400e] leading-relaxed">
                        <span className="font-bold">Importante:</span> Recuerda llegar 30 minutos antes del servicio.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ElderRosterView;
