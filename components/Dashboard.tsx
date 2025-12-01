import React, { useState, useEffect } from 'react';
import { Radio, Clock, CheckCircle2, Music, Mic2, Calendar, Loader2, User } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { Role } from '../types';

import StatisticsPanel from './StatisticsPanel';
import { BarChart3 } from 'lucide-react';

interface DashboardProps {
  setCurrentView: (view: string) => void;
  role?: Role;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, role = 'ADMIN' }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { plans, loading: plansLoading } = usePlans();

  // Elders see ALL banners. Admins see ALL. Others might be restricted but Dashboard is mostly Admin/Elder.
  const activeEvents = events.filter(e => e.activeInBanner);

  const activePlan = plans.find(p => p.isActive);
  const nextPlan = plans.find(p => !p.isActive && new Date(p.date) >= new Date()) || plans[0];

  // Find the *next* preacher (from nextPlan)
  const nextPreacher = nextPlan?.team.preacher || 'Por definir';

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (activeEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % activeEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeEvents.length]);

  if (eventsLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-full mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Hola, Pastor.</h2>
        <p className="text-slate-500">Aquí está lo que sucede hoy en la iglesia.</p>
      </header>

      {/* Dynamic Carousel */}
      <section className="relative w-full h-64 rounded-soft overflow-hidden shadow-xl shadow-indigo-100 group transition-all duration-500">
        {activeEvents.length > 0 ? (
          <div className={`absolute inset-0 bg-gradient-to-r ${activeEvents[currentEventIndex].bannerGradient || 'from-indigo-500 to-purple-500'} flex items-center p-8 md:p-12 text-white transition-colors duration-500`}>
            <div className="space-y-4 z-10 max-w-2xl animate-in slide-in-from-bottom-4 duration-500" key={currentEventIndex}>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
                {activeEvents[currentEventIndex].type}
              </span>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                {activeEvents[currentEventIndex].title}
              </h3>
              <div className="flex items-center gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{activeEvents[currentEventIndex].date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>{activeEvents[currentEventIndex].time}</span>
                </div>
              </div>
            </div>
            {/* Abstract Shapes */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-6 right-8 flex gap-2">
              {activeEvents.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentEventIndex ? 'bg-white w-6' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
            No hay eventos destacados
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Status Card */}
        <div className="lg:col-span-2 card-soft p-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Estado del Culto</h3>
              <p className="text-slate-400 text-sm">Monitor de servicio en tiempo real</p>
            </div>
            {activePlan ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-full text-sm font-bold animate-pulse">
                <Radio size={16} /> EN VIVO
              </span>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-full text-sm font-bold">
                <Radio size={16} /> SIN ACTIVIDAD
              </span>
            )}
          </div>

          {activePlan ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wide">Predicando Ahora</p>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{activePlan.team.preacher}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-3xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Music size={16} />
                    <span className="text-xs font-bold uppercase">Música</span>
                  </div>
                  <p className="font-semibold text-slate-700">{activePlan.team.musicDirector}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-3xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Mic2 size={16} />
                    <span className="text-xs font-bold uppercase">Audio</span>
                  </div>
                  <p className="font-semibold text-slate-700">{activePlan.team.audioOperator}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Clock size={32} />
              </div>
              <p className="text-slate-500">No hay servicio activo en este momento.</p>
              {nextPlan && (
                <button
                  onClick={() => setCurrentView('planner')}
                  className="mt-4 text-indigo-600 font-semibold hover:underline"
                >
                  Ver próximo: {nextPlan.title}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions / Metrics */}
        <div className="space-y-6">
          <div className="card-soft p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Accesos Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCurrentView('planner')} className="p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors rounded-3xl text-left">
                <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm font-bold text-indigo-900">Ver Turnos</span>
              </button>
              <button onClick={() => setCurrentView('events')} className="p-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-3xl text-left">
                <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-2">
                  <Calendar size={16} />
                </div>
                <span className="text-sm font-bold text-pink-900">Crear Evento</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-soft p-6 text-white shadow-lg shadow-cyan-200">
            <h3 className="text-lg font-bold opacity-90 mb-1">Próximo Domingo</h3>
            <p className="text-3xl font-bold">10:30 AM</p>

            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-bold uppercase opacity-80 mb-1 flex items-center gap-1"><User size={12} /> Próximo Predicador</p>
              <p className="text-xl font-bold">{nextPreacher}</p>
            </div>

            <p className="opacity-80 mt-4 text-sm">Prepárate para el servicio de adoración.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
