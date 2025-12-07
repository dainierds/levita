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
        <div className="min-h-screen bg-[#f3f4f6] pb-32 max-w-5xl mx-auto md:my-8 pt-6 px-4">
            <header className="mb-6">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={18} /> Mis Estadísticas
                </h2>
                {/* <p className="text-slate-400 text-xs font-medium ml-7 opacity-80">Resumen de tu servicio en el ministerio.</p> */}
            </header>

            {/* Stats Grid - 2x2 on mobile matching screenshot */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="text-2xl font-black text-[#4f46e5] mb-1">{timesPreached}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Veces Predicado</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="text-2xl font-black text-[#3b82f6] mb-1">{totalServices}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Turnos Cumplidos</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="text-2xl font-black text-[#10b981] mb-1">{thisMonth}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Reuniones</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <h3 className="text-2xl font-black text-[#ec4899] mb-1">{avgPerMonth}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Promedio/Mes</p>
                </div>
            </div>

            {/* Ultima Predicacion */}
            <div className="bg-white p-5 rounded-3xl shadow-sm mb-6">
                <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-indigo-600" /> Última Predicación
                </h3>
                <div className="bg-[#f3f4f6] rounded-2xl p-4 w-full border border-slate-100">
                    <p className="text-base font-bold text-slate-700">N/A</p>
                    <p className="text-[10px] text-slate-400 font-medium">Hace 0 días</p>
                </div>
            </div>

            {/* Green Banner */}
            <div className="bg-[#10B981] rounded-2xl p-4 text-white shadow-lg shadow-emerald-200 flex items-center gap-3">
                <div className="shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Desempeño Excelente</h3>
                    <p className="text-emerald-50 text-[10px] font-medium opacity-90 leading-tight mt-0.5">Has cumplido con el 0% de tus asignaciones este año.</p>
                </div>
            </div>

        </div>
    );
};

export default PersonalStatistics;
