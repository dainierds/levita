import React from 'react';
import { ServicePlan, User } from '../types';
import { BarChart3, TrendingUp, Calendar, Clock, Activity } from 'lucide-react';

interface PersonalStatisticsProps {
    plans: ServicePlan[];
    user: User;
}

const PersonalStatistics: React.FC<PersonalStatisticsProps> = ({ plans, user }) => {
    // Calculate stats
    const myPlans = plans.filter(p =>
        new Date(p.date) < new Date() && // Only past plans
        (p.team.elder === user.name || p.team.preacher === user.name) // Simplified matching
    );

    // Total services attended as Elder/Preacher
    const totalServices = myPlans.length;

    // Times Preached
    const timesPreached = myPlans.filter(p => p.team.preacher === user.name).length;

    // This month
    const now = new Date();
    const thisMonth = myPlans.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Avg per month (simplistic)
    const firstPlan = myPlans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    let monthsDiff = 1;
    if (firstPlan) {
        const start = new Date(firstPlan.date);
        monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
    }
    const avgPerMonth = (totalServices / monthsDiff).toFixed(1);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <TrendingUp className="text-indigo-500" /> Mis Estadísticas
                </h2>
                <p className="text-slate-500">Resumen de tu servicio en el ministerio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity size={80} className="text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-indigo-600 mb-1">{timesPreached}</h3>
                        <p className="text-slate-500 text-sm font-bold uppercase">Veces Predicado</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Calendar size={80} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-blue-600 mb-1">{totalServices}</h3>
                        <p className="text-slate-500 text-sm font-bold uppercase">Turnos Cumplidos</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <BarChart3 size={80} className="text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-emerald-600 mb-1">{thisMonth}</h3>
                        <p className="text-slate-500 text-sm font-bold uppercase">Reuniones (Mes)</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Clock size={80} className="text-pink-500" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-pink-600 mb-1">{avgPerMonth}</h3>
                        <p className="text-slate-500 text-sm font-bold uppercase">Promedio / Mes</p>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-500 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-200">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-full">
                        <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <h3 className="font-bold">Desempeño Excelente</h3>
                </div>
                <p className="opacity-90 text-sm">Has cumplido con el 100% de tus asignaciones este año. ¡Gracias por tu fidelidad!</p>
            </div>
        </div>
    );
};

// Start Icon helper (missing import fix for CheckCircle2 if needed)
import { CheckCircle2 } from 'lucide-react';

export default PersonalStatistics;
