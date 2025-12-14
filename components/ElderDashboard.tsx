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
    const nextEvent = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    // 2. Next Turns Logic (Fetch top 2)
    const nextPlans = plans
        .filter(p => !p.isActive && new Date(p.date) >= new Date())
        // .filter(p => p.team.elder === user.name ...) // Disabling personal filter as per user request to show "next 2 teams" generally? Or personal?
        // User request: "muestre los dos equipos de turnos que siguen" (show the two duty teams that follow).
        // If I am an Elder, maybe I want to see MY next 2 turns? 
        // "Show THE two duty teams" -> The teams themselves. 
        // For now, I will show generally upcoming plans to align with Music App.
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2);

    // ...

    {/* Grid Menu */ }
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
            onClick={() => setCurrentView('planner')} // Ordered to ServicePlanner
            className="bg-[#22c55e] rounded-3xl p-5 text-left text-white shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform relative overflow-hidden"
        >
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <FileText size={20} /> {/* Icon for Order? */}
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

    {/* Logout below grid? Or relying on Header/Profile? Screenshot 1 doesn't show logout.
                Screenshot 0 had logout.
                ElderHeader has Menu button.
                We removed Sidebar.
                If ElderHeader Menu onclick -> opens dashboard?
                The Dashboard IS the menu?
                If I'm ON Dashboard, where is Logout?
                Maybe add a small text button at bottom?
                Or in the "Apps" style app, logout is usually in Profile settings (Header).
                I'll add a discreet logout button at bottom just in case.
            */}
    <div className="mt-8 text-center">
        <button
            onClick={logout}
            className="text-red-400 text-xs font-bold hover:text-red-500"
        >
            Cerrar Sesión
        </button>
    </div>
        </div >
    );
};

export default ElderDashboard;
