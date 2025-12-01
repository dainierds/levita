import React, { useMemo } from 'react';
import { ServicePlan } from '../types';
import { BarChart, Users, Mic2, Music, Clock, TrendingUp } from 'lucide-react';

interface StatisticsPanelProps {
    plans: ServicePlan[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ plans }) => {

    const stats = useMemo(() => {
        const totalServices = plans.length;

        // Frequency Maps
        const preachers: Record<string, number> = {};
        const elders: Record<string, number> = {};
        const songs: Record<string, number> = {};
        let totalDuration = 0;

        plans.forEach(plan => {
            // Preachers
            if (plan.team.preacher) {
                preachers[plan.team.preacher] = (preachers[plan.team.preacher] || 0) + 1;
            }
            // Elders
            if (plan.team.elder) {
                elders[plan.team.elder] = (elders[plan.team.elder] || 0) + 1;
            }

            // Items
            plan.items.forEach(item => {
                totalDuration += item.durationMinutes;
                if (item.type === 'WORSHIP') {
                    songs[item.title] = (songs[item.title] || 0) + 1;
                }
            });
        });

        const avgDuration = totalServices > 0 ? Math.round(totalDuration / totalServices) : 0;

        // Sort and slice top 5
        const topPreachers = Object.entries(preachers).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topElders = Object.entries(elders).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topSongs = Object.entries(songs).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { totalServices, avgDuration, topPreachers, topElders, topSongs };
    }, [plans]);

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-800">Estadísticas</h2>
                <p className="text-slate-500">Análisis histórico de servicios, predicadores y música.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Servicios</p>
                        <p className="text-3xl font-black text-slate-800">{stats.totalServices}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Duración Promedio</p>
                        <p className="text-3xl font-black text-slate-800">{stats.avgDuration} min</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-pink-50 text-pink-600 rounded-2xl">
                        <Music size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Canciones Únicas</p>
                        <p className="text-3xl font-black text-slate-800">{stats.topSongs.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Preachers */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Mic2 size={20} className="text-purple-500" /> Predicadores Frecuentes
                    </h3>
                    <div className="space-y-4">
                        {stats.topPreachers.map(([name, count], i) => (
                            <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                                        {i + 1}
                                    </span>
                                    <span className="font-bold text-slate-700">{name}</span>
                                </div>
                                <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-lg">
                                    {count} servicios
                                </span>
                            </div>
                        ))}
                        {stats.topPreachers.length === 0 && <p className="text-slate-400 italic">No hay datos suficientes.</p>}
                    </div>
                </div>

                {/* Top Elders */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" /> Ancianos de Turno
                    </h3>
                    <div className="space-y-4">
                        {stats.topElders.map(([name, count], i) => (
                            <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                                        {i + 1}
                                    </span>
                                    <span className="font-bold text-slate-700">{name}</span>
                                </div>
                                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">
                                    {count} turnos
                                </span>
                            </div>
                        ))}
                        {stats.topElders.length === 0 && <p className="text-slate-400 italic">No hay datos suficientes.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;
