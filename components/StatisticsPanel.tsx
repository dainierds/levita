import React, { useRef } from 'react';
import { ServicePlan, DayOfWeek, Role } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Share2, Download, Mic2, Users, Music, Activity, Calendar, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLanguage } from '../context/LanguageContext';

interface StatisticsPanelProps {
    plans: ServicePlan[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ plans }) => {
    const { t } = useLanguage();
    const printRef = useRef<HTMLDivElement>(null);

    const calculateStats = () => {
        const totalServices = plans.length;
        const totalDuration = plans.reduce((acc, plan) => {
            const duration = plan.items.reduce((sum, item) => sum + item.durationMinutes, 0);
            return acc + duration;
        }, 0);
        const avgDuration = totalServices ? Math.round(totalDuration / totalServices) : 0;

        // Role Distribution
        const roleCounts: Record<string, number> = {
            PREACHER: 0,
            ELDER: 0,
            MUSIC: 0,
            AUDIO: 0
        };

        // Song Frequency
        const songCounts: Record<string, number> = {};

        plans.forEach(plan => {
            if (plan.team.preacher) roleCounts.PREACHER++;
            if (plan.team.elder) roleCounts.ELDER++;
            if (plan.team.musicDirector) roleCounts.MUSIC++;
            if (plan.team.audioOperator) roleCounts.AUDIO++;

            plan.items.filter(i => i.type === 'WORSHIP').forEach(song => {
                songCounts[song.title] = (songCounts[song.title] || 0) + 1;
            });
        });

        const roleData = [
            { name: t('role.preacher'), value: roleCounts.PREACHER, color: '#8884d8' },
            { name: t('role.elder'), value: roleCounts.ELDER, color: '#82ca9d' },
            { name: t('role.music'), value: roleCounts.MUSIC, color: '#ffc658' },
            { name: t('role.audio'), value: roleCounts.AUDIO, color: '#ff8042' },
        ].filter(d => d.value > 0);

        const topSongs = Object.entries(songCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Preacher Frequency
        const preacherCounts: Record<string, number> = {};
        plans.forEach(p => {
            if (p.team.preacher) preacherCounts[p.team.preacher] = (preacherCounts[p.team.preacher] || 0) + 1;
        });
        const topPreachers = Object.entries(preacherCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Duration Trend
        const durationData = plans
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-6) // Last 6 services
            .map(p => ({
                date: new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                duration: p.items.reduce((sum, i) => sum + i.durationMinutes, 0)
            }));

        return { totalServices, avgDuration, roleData, topSongs, topPreachers, durationData };
    };

    const stats = calculateStats();

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        const element = printRef.current;
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('levita-stats.pdf');
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{t('stats.title')}</h2>
                    <p className="text-slate-500">{t('stats.subtitle')}</p>
                </div>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 shadow-lg transition-all"
                >
                    <Download size={18} /> {t('stats.export_pdf')}
                </button>
            </div>

            <div ref={printRef} className="bg-slate-50 p-6 rounded-[3rem]">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                        <div>
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                                <Calendar size={20} />
                            </div>
                            <h3 className="text-4xl font-black tracking-tight">{stats.totalServices}</h3>
                        </div>
                        <p className="text-indigo-900 text-sm font-medium mb-1">{t('stats.total_services')}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                        <div>
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                <Clock size={20} />
                            </div>
                            <div className="flex items-baseline">
                                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.avgDuration}<span className="text-xl text-slate-400 ml-1">{t('common.min')}</span></h3>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase mb-1">{t('stats.avg_duration')}</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                        <div>
                            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mb-2">
                                <Music size={20} />
                            </div>
                            <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stats.topSongs.length}</h3>
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase mb-1">{t('stats.unique_songs')}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Role Distribution Pie */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 self-start">
                            <PieChart size={20} className="text-indigo-500" /> {t('stats.role_distribution')}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Duration Trend Line */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" /> {t('stats.duration_trend')}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.durationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="duration"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Preachers & Songs */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">{t('stats.top_preachers')}</h4>
                            <div className="space-y-4">
                                {stats.topPreachers.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            <span className="font-bold text-slate-700">{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${(p.count / (stats.totalServices || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">{p.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">{t('stats.frequent_songs')}</h4>
                            <div className="space-y-4">
                                {stats.topSongs.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                                                <Music size={14} />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                                        </div>
                                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500">{s.count}</span>
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
