import React from 'react';
import { ServicePlan, User } from '../types';
import { BarChart3, TrendingUp, Calendar, Clock, Activity, CheckCircle2 } from 'lucide-react';

interface PersonalStatisticsProps {
    plans: ServicePlan[];
    user: User;
}

const PersonalStatistics: React.FC<PersonalStatisticsProps> = ({ plans, user }) => {
    // Calculate stats
    const myPlans = plans.filter(p =>
        new Date(p.date) < new Date() &&
        (p.team.elder === user.name || p.team.preacher === user.name)
    );

    const totalServices = myPlans.length;
    const timesPreached = myPlans.filter(p => p.team.preacher === user.name).length;
    const now = new Date();
    const thisMonth = myPlans.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const firstPlan = myPlans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    let monthsDiff = 1;
    if (firstPlan) {
        const start = new Date(firstPlan.date);
        monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
    }
    const avgPerMonth = monthsDiff > 0 ? (totalServices / monthsDiff).toFixed(1) : "0.0";

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={24} /> Mis Estadísticas
                </h2>
                <p className="text-slate-400 text-sm font-medium ml-8">Resumen de tu servicio en el ministerio.</p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Estilo Pill/Card blanco limpio */}
                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between relative overflow-hidden group border border-slate-50">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-indigo-600 mb-1">{timesPreached}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veces Predicado</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 scale-150 group-hover:scale-125 transition-transform">
                        <Activity size={50} className="text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between relative overflow-hidden group border border-slate-50">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-blue-600 mb-1">{totalServices}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turnos Cumplidos</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 scale-150 group-hover:scale-125 transition-transform">
                        <Calendar size={50} className="text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between relative overflow-hidden group border border-slate-50">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-emerald-600 mb-1">{thisMonth}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reuniones (Mes)</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 scale-150 group-hover:scale-125 transition-transform">
                        <BarChart3 size={50} className="text-emerald-600" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between relative overflow-hidden group border border-slate-50">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-pink-600 mb-1">{avgPerMonth}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promedio / Mes</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 scale-150 group-hover:scale-125 transition-transform">
                        <Clock size={50} className="text-pink-600" />
                    </div>
                </div>
            </div>

            {/* Ultima Predicacion Pill */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-50 mt-6">
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" /> Última Predicación
                </h3>
                <div className="bg-slate-50 rounded-2xl p-4 w-full">
                    <p className="text-lg font-bold text-slate-700">N/A</p>
                    <p className="text-xs text-slate-400 font-medium">Hace 0 días</p>
                </div>
            </div>

            {/* Green Banner */}
            <div className="bg-[#10B981] rounded-[1.5rem] p-6 text-white shadow-lg shadow-emerald-200 flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-full">
                    <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Desempeño Excelente</h3>
                    <p className="text-emerald-50 text-xs font-medium opacity-90">Has cumplido con el 100% de tus asignaciones este año. ¡Gracias por tu fidelidad!</p>
                </div>
            </div>

            {/* Spacer for bottom nav */}
            <div className="h-24 md:h-0"></div>
        </div>
    );
};

export default PersonalStatistics;
