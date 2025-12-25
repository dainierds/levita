import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings } from '../types';
import { FileText, Calendar, TrendingUp, Bell, LogOut, BookOpen, Clock, Download, Mic, ChevronRight } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';

interface ElderDashboardProps {
    setCurrentView: (view: string) => void;
    user: User;
    settings?: ChurchSettings;
    notificationCount?: number;
}

const ElderDashboard: React.FC<ElderDashboardProps> = ({ setCurrentView, user, settings, notificationCount }) => {
    const { logout } = useAuth();
    const { events } = useEvents();
    const { plans } = usePlans();

    // 1. Next Event Logic
    const todayStr = new Date().toLocaleDateString('en-CA');

    const nextEvent = events
        .filter(e => e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

    // 2. Next Turns Logic (Fetch top 2)
    const nextPlans = plans
        .filter(p => !p.isActive && p.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 2);

    // 3. Next Preaching Logic
    const nextPreaching = plans
        .filter(p => !p.isActive && p.date >= todayStr)
        .filter(p => p.team.preacher === user.name)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

    // 4. Resources Count (Mock)
    const resourcesCount = 2;

    return (
        <div className="min-h-screen bg-transparent pb-32 max-w-md mx-auto md:my-8 md:min-h-[800px] flex flex-col pt-8 px-5">

            {/* Header Text */}
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-slate-900">Bienvenido, {user.name.split(' ')[0]}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{settings?.churchName || 'Iglesia'}</p>
            </div>

            {/* Hero Card (Event) */}
            <div
                onClick={() => setCurrentView('events')}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-3xl p-6 text-white shadow-lg shadow-pink-200 mb-6 relative overflow-hidden cursor-pointer group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <Calendar size={100} className="transform rotate-12 -mr-8 -mt-8" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Mic size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Próximo Evento</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-1 leading-tight">
                        {nextEvent ? nextEvent.title : 'Sin eventos próximos'}
                    </h2>
                    <p className="text-sm opacity-90 mb-4 font-medium leading-snug max-w-[80%]">
                        {nextEvent ? nextEvent.description || 'Consulta el calendario.' : 'No hay eventos programados.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                        <Calendar size={14} />
                        {nextEvent ? new Date(nextEvent.date).toLocaleDateString() : 'N/A'}
                    </div>
                </div>

                {/* Pagination Dots (Visual) */}
                <div className="absolute bottom-4 right-4 flex gap-1.5 opacity-80">
                    <div className="w-4 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                </div>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-4">
                {/* Blue Card - Roster (Now shows top 2) */}
                <button
                    onClick={() => setCurrentView('roster')}
                    className="col-span-2 bg-[#3b82f6] rounded-3xl p-5 text-left text-white shadow-lg shadow-blue-200 hover:scale-[1.01] transition-transform relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Próximos Turnos</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {nextPlans.length > 0 ? nextPlans.map((plan, i) => (
                            <div key={plan.id} className={`rounded-xl p-3 ${i === 0 ? 'bg-white/20' : 'bg-white/10'}`}>
                                <h3 className="font-bold text-sm leading-tight mb-1">
                                    {new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                </h3>
                                <p className="text-[10px] opacity-90 font-medium truncate">
                                    {plan.team?.elder || 'Sin Anciano'}
                                </p>
                            </div>
                        )) : (
                            <div className="col-span-2 text-sm opacity-80">No hay turnos programados.</div>
                        )}
                    </div>
                </button>

                {/* Purple Card - Preaching */}
                <button
                    onClick={() => setCurrentView('roster')}
                    className="bg-[#a855f7] rounded-3xl p-5 text-left text-white shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform relative overflow-hidden"
                >
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-1">Predicación</h3>
                    <p className="text-[10px] opacity-80 font-medium">
                        {nextPreaching ? new Date(nextPreaching.date).toLocaleDateString() : 'Sin datos'}
                    </p>
                </button>

                {/* Green Card - Order */}
                <button
                    onClick={() => setCurrentView('planner')}
                    className="bg-[#22c55e] rounded-3xl p-5 text-left text-white shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform relative overflow-hidden"
                >
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <FileText size={20} />
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-1">Orden de Culto</h3>
                    <p className="text-[10px] opacity-80 font-medium">Ver programa</p>
                </button>

                {/* Orange Card - Resources */}
                <button
                    onClick={() => setCurrentView('resources')}
                    className="bg-[#f97316] rounded-3xl p-5 text-left text-white shadow-lg shadow-orange-200 hover:scale-[1.02] transition-transform relative overflow-hidden"
                >
                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                        <BookOpen size={20} />
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-1">Recursos</h3>
                    <p className="text-[10px] opacity-80 font-medium">{resourcesCount} disponibles</p>
                </button>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={logout}
                    className="text-red-400 text-xs font-bold hover:text-red-500"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default ElderDashboard;
