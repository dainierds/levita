import React, { useMemo } from 'react';
import { ServicePlan } from '../types';
import { BarChart3, Users, Mic2, Music, Clock, TrendingUp, Calendar, Activity, PieChart } from 'lucide-react';

interface StatisticsPanelProps {
    plans: ServicePlan[];
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ plans }) => {

    const stats = useMemo(() => {
        const totalServices = plans.length;
        const sortedPlans = [...plans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Frequency Maps
        const preachers: Record<string, number> = {};
        const elders: Record<string, number> = {};
        const songs: Record<string, number> = {};
        let totalDuration = 0;

        // Role Counts for Donut Chart
        let roleCounts = {
            preacher: 0,
            elder: 0,
            music: 0,
            audio: 0
        };

        // Duration Trend (Last 7 services)
        const durationTrend = sortedPlans.slice(-7).map(plan => {
            const duration = plan.items.reduce((acc, item) => acc + item.durationMinutes, 0);
            return { date: plan.date, duration };
        });

        plans.forEach(plan => {
            // Preachers
            if (plan.team.preacher) {
                preachers[plan.team.preacher] = (preachers[plan.team.preacher] || 0) + 1;
                roleCounts.preacher++;
            }
            // Elders
            if (plan.team.elder) {
                elders[plan.team.elder] = (elders[plan.team.elder] || 0) + 1;
                roleCounts.elder++;
            }
            // Music
            if (plan.team.musicDirector) roleCounts.music++;
            // Audio
            if (plan.team.audioOperator) roleCounts.audio++;

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
        const topSongs = Object.entries(songs).sort((a, b) => b[1] - a[1]).slice(0, 5);

        // Calculate percentages for bars
        const maxPreacherCount = topPreachers[0]?.[1] || 1;
        const maxSongCount = topSongs[0]?.[1] || 1;

        return {
            totalServices,
            avgDuration,
            topPreachers,
            topSongs,
            roleCounts,
            durationTrend,
            maxPreacherCount,
            maxSongCount
        };
    }, [plans]);

    // Helper for Donut Chart
    const renderDonutChart = () => {
        const total = stats.roleCounts.preacher + stats.roleCounts.elder + stats.roleCounts.music + stats.roleCounts.audio;
        if (total === 0) return null;

        const data = [
            { label: 'Predicadores', value: stats.roleCounts.preacher, color: '#8b5cf6' }, // violet-500
            { label: 'Ancianos', value: stats.roleCounts.elder, color: '#3b82f6' }, // blue-500
            { label: 'Música', value: stats.roleCounts.music, color: '#ec4899' }, // pink-500
            { label: 'Audio', value: stats.roleCounts.audio, color: '#f97316' }, // orange-500
        ];

        let cumulativePercent = 0;

        return (
            <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    {data.map((slice, i) => {
                        const percent = slice.value / total;
                        const dashArray = `${percent * 314} 314`; // 2 * pi * r (r=50) approx 314
                        const offset = cumulativePercent * 314;
                        cumulativePercent += percent;

                        return (
                            <circle
                                key={i}
                                r="40"
                                cx="50"
                                cy="50"
                                fill="transparent"
                                stroke={slice.color}
                                strokeWidth="12"
                                strokeDasharray={dashArray}
                                strokeDashoffset={-offset}
                                className="transition-all duration-1000 ease-out hover:opacity-80"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800">{total}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Asignaciones</span>
                </div>
            </div>
        );
    };

    // Helper for Line Chart
    const renderLineChart = () => {
        if (stats.durationTrend.length < 2) return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Insuficientes datos</div>;

        const maxDuration = Math.max(...stats.durationTrend.map(d => d.duration)) * 1.2;
        const points = stats.durationTrend.map((d, i) => {
            const x = (i / (stats.durationTrend.length - 1)) * 100;
            const y = 100 - (d.duration / maxDuration) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="relative h-40 w-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        points={points}
                        className="drop-shadow-md"
                    />
                    {/* Points */}
                    {stats.durationTrend.map((d, i) => {
                        const x = (i / (stats.durationTrend.length - 1)) * 100;
                        const y = 100 - (d.duration / maxDuration) * 100;
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="1.5"
                                fill="#fff"
                                stroke="#6366f1"
                                strokeWidth="1"
                                className="hover:r-2 transition-all"
                            >
                                <title>{d.date}: {d.duration} min</title>
                            </circle>
                        );
                    })}
                </svg>
                {/* X Axis Labels */}
                <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                    {stats.durationTrend.map((d, i) => (
                        <span key={i}>{new Date(d.date).getDate()}</span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Panel de Estadísticas</h2>
                    <p className="text-slate-500">Visualización de métricas clave y rendimiento.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
                        Exportar PDF
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-200 text-white group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Activity size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <p className="text-indigo-100 text-sm font-medium mb-1">Total Servicios</p>
                        <h3 className="text-4xl font-black tracking-tight">{stats.totalServices}</h3>
                        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-100 bg-white/10 w-fit px-2 py-1 rounded-lg">
                            <span>+12% vs mes anterior</span>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={100} className="text-orange-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                            <Clock size={24} className="text-orange-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase mb-1">Duración Promedio</p>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.avgDuration}<span className="text-xl text-slate-400 ml-1">min</span></h3>
                        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(stats.avgDuration, 120) / 1.2}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Music size={100} className="text-pink-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
                            <Music size={24} className="text-pink-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase mb-1">Canciones Únicas</p>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.topSongs.length}</h3>
                        <div className="mt-4 flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-6 h-6 rounded-full border-2 border-white bg-pink-${i * 100 + 200}`}></div>
                            ))}
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">+</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area - Role Distribution */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 self-start">
                        <PieChart size={20} className="text-indigo-500" /> Distribución de Roles
                    </h3>
                    {renderDonutChart()}
                    <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                            <span className="text-xs font-bold text-slate-600">Predicadores</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-bold text-slate-600">Ancianos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                            <span className="text-xs font-bold text-slate-600">Música</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-xs font-bold text-slate-600">Audio</span>
                        </div>
                    </div>
                </div>

                {/* Duration Trend */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-500" /> Tendencia de Duración (min)
                    </h3>
                    {renderLineChart()}

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Preachers Bar Chart */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Top Predicadores</h4>
                            <div className="space-y-3">
                                {stats.topPreachers.map(([name, count], i) => (
                                    <div key={name} className="group">
                                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                            <span>{name}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-violet-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-violet-600"
                                                style={{ width: `${(count / stats.maxPreacherCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Songs Bar Chart */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Canciones Frecuentes</h4>
                            <div className="space-y-3">
                                {stats.topSongs.map(([name, count], i) => (
                                    <div key={name} className="group">
                                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                            <span>{name}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-pink-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-pink-600"
                                                style={{ width: `${(count / stats.maxSongCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;
