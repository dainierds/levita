import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { ServicePlan, User, ChurchSettings } from '../types';
import { Calendar, Clock, FileText, UserCheck, BookOpen, AlertCircle, Bell, BarChart3, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ElderDashboardProps {
    setCurrentView: (view: string) => void;
    user: User;
    settings?: ChurchSettings;
}

const ElderDashboard: React.FC<ElderDashboardProps> = ({ setCurrentView, user }) => {
    const { t } = useLanguage();
    const { events, loading: eventsLoading } = useEvents();
    const { plans, loading: plansLoading } = usePlans();

    const activeEvents = events.filter(e => e.activeInBanner);
    const sortedPlans = [...plans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find "My Next Shift"
    const myNextPlan = sortedPlans.find(p => {
        const team = p.team;
        const isFuture = new Date(p.date) >= new Date(new Date().setHours(0, 0, 0, 0));
        if (!isFuture) return false;

        return (
            team.elder === user.name ||
            team.preacher === user.name ||
            team.musicDirector === user.name ||
            team.audioOperator === user.name
        );
    });

    // Calculate some quick stats locally
    const myStats = {
        totalShifts: plans.filter(p => p.team.elder === user.name || p.team.preacher === user.name).length,
        nextMonthShifts: sortedPlans.filter(p => {
            const d = new Date(p.date);
            const now = new Date();
            return d.getMonth() === (now.getMonth() + 1) % 12 && (p.team.elder === user.name);
        }).length
    };

    if (eventsLoading || plansLoading) {
        return <div className="p-8 text-center text-slate-400">Cargando...</div>;
    }

    const nextEvent = activeEvents[0];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-md mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Bienvenido, {user.name}</h2>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wide opacity-80">{user.churchName || 'Iglesia'}</p>
                </div>
                <button onClick={() => setCurrentView('notifications')} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
                    <Bell size={24} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>

            {/* Main Banner - Next Event */}
            <div className="w-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-[2rem] p-8 text-white shadow-lg shadow-pink-200 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                <div className="relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                            <Calendar size={32} className="text-white" />
                        </div>
                        <div>
                            <span className="text-pink-100 text-xs font-bold uppercase tracking-wider mb-1 block">Próximo Evento</span>
                            <h3 className="text-2xl font-bold mb-2 leading-tight">{nextEvent?.title || 'Servicio Dominical'}</h3>
                            <p className="text-pink-50 opacity-90 text-sm mb-4 line-clamp-2">{nextEvent?.description || 'Acompáñanos en nuestro servicio de adoración.'}</p>

                            <div className="flex items-center gap-4 text-xs font-bold bg-black/20 w-fit px-3 py-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} /> {nextEvent?.date || 'Domingo'}
                                </div>
                                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={12} /> {nextEvent?.time || '10:30 AM'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
            </div>

            {/* Action Cards Stack (Mobile View) */}
            <div className="flex flex-col gap-6">

                {/* My Next Shift Card */}
                <div
                    onClick={() => setCurrentView('roster')}
                    className="cursor-pointer bg-blue-500 rounded-[2rem] p-6 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:translate-y-[-2px] transition-all relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-xs font-bold uppercase">Mi Próximo Turno</p>
                            <p className="font-medium text-sm opacity-80">{myNextPlan ? 'Sin turnos próximos' : 'Ver todo'}</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        {myNextPlan ? (
                            <>
                                <h4 className="text-xl font-bold mb-1">{myNextPlan.title}</h4>
                                <p className="text-blue-100 text-sm flex items-center gap-2">
                                    <Clock size={14} /> {myNextPlan.date} • {myNextPlan.startTime}
                                </p>
                                <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
                                    {myNextPlan.team.elder === user.name ? 'Anciano de Turno' :
                                        myNextPlan.team.preacher === user.name ? 'Predicador' :
                                            'Servicio'}
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 className="text-xl font-bold mb-1">Sin Asignaciones</h4>
                                <p className="text-blue-100 text-sm">No tienes turnos programados pronto.</p>
                            </>
                        )}
                    </div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* Stats Card */}
                <div className="bg-violet-500 rounded-[2rem] p-6 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:translate-y-[-2px] transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <FileText size={24} />
                        </div>
                        <div className="text-right">
                            <p className="text-violet-100 text-xs font-bold uppercase">Predicación</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h4 className="text-4xl font-black mb-1">{myStats.totalShifts}</h4>
                        <p className="text-violet-100 text-sm opacity-90">Predicaciones este año</p>
                        <div className="w-full bg-black/20 h-1.5 rounded-full mt-4 overflow-hidden">
                            <div className="bg-white/80 w-[45%] h-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Order of Service Card */}
                <div
                    onClick={() => setCurrentView('planner')}
                    className="cursor-pointer bg-emerald-500 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:translate-y-[-2px] transition-all relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <FileText size={24} />
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100 text-xs font-bold uppercase">Orden de Culto</p>
                            <p className="font-medium text-sm opacity-80">Ver programa</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-1">Programa Actual</h4>
                        <p className="text-emerald-100 text-sm">Ver detalles del servicio.</p>
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

            </div>

            {/* Reminders Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-slate-400" /> Recordatorios
                </h3>
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
                    <div className="w-1 bg-yellow-400 h-full rounded-full absolute left-0 top-0 bottom-0"></div>
                    <AlertCircle size={20} className="text-yellow-600 mt-0.5 z-10" />
                    <div className="z-10">
                        <p className="text-sm font-bold text-yellow-800">Importante: Reunión de Ancianos</p>
                        <p className="text-xs text-yellow-700 mt-1">Recuerda llegar 30 minutos antes del servicio para la reunión de oración.</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ElderDashboard;
