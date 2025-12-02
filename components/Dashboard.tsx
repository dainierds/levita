import React, { useState, useEffect } from 'react';
import { Radio, Clock, CheckCircle2, Music, Mic2, Calendar, Loader2, User, FileText, UserCheck, Mic, BookOpen } from 'lucide-react';
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
        {/* Live Status Section - Split into 2 Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Service Order Timeline */}
          <div className="card-soft p-6 relative overflow-hidden h-full">
            {activePlan ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold animate-pulse uppercase tracking-wider">
                        <Radio size={10} /> En Vivo
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">{activePlan.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 leading-tight">{activePlan.title}</h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('planner')}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Ver Completo"
                  >
                    <FileText size={18} />
                  </button>
                </div>

                <div className="space-y-0 relative pl-2">
                  {/* Vertical Line */}
                  <div className="absolute left-[3.5rem] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                  {(() => {
                    let currentTime = new Date(`2000-01-01T${activePlan.startTime}`);
                    return activePlan.items.slice(0, 5).map((item, idx) => { // Show max 5 items to keep compact
                      const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      currentTime.setMinutes(currentTime.getMinutes() + item.durationMinutes);

                      return (
                        <div key={idx} className="relative flex items-center gap-4 py-2 group">
                          <div className="w-10 text-right text-[10px] font-bold text-slate-400 font-mono">
                            {timeStr}
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${item.type === 'WORSHIP' ? 'bg-pink-400' :
                            item.type === 'PREACHING' ? 'bg-indigo-500' : 'bg-slate-300'
                            }`}></div>
                          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                            <p className="text-sm font-bold text-slate-700 truncate">{item.title}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {activePlan.items.length > 5 && (
                    <div className="pl-14 pt-2 text-xs text-slate-400 italic">
                      + {activePlan.items.length - 5} elementos más...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Clock size={32} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-600 text-lg">Sin Servicio Activo</h3>
                  <p className="text-sm">Activa un plan en Orden de Cultos.</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Active Team Roster */}
          <div className="card-soft p-6 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-500" /> Equipo Oficial
            </h3>

            {activePlan ? (
              <div className="space-y-4">
                {/* Preacher */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Mic2 size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Predicador</span>
                    <p className="font-bold text-slate-800">{activePlan.team.preacher || 'No asignado'}</p>
                  </div>
                </div>

                {/* Music Director */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Music size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Director Música</span>
                    <p className="font-bold text-slate-800">{activePlan.team.musicDirector || 'No asignado'}</p>
                  </div>
                </div>

                {/* Audio */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Mic size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Audio</span>
                    <p className="font-bold text-slate-800">{activePlan.team.audioOperator || 'No asignado'}</p>
                  </div>
                </div>

                {/* Elder */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Anciano de Turno</span>
                    <p className="font-bold text-slate-800">{activePlan.team.elder || 'No asignado'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">No hay equipo asignado.</p>
              </div>
            )}
          </div>

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

              {role === 'ELDER' ? (
                <button onClick={() => setCurrentView('sermons')} className="p-4 bg-purple-50 hover:bg-purple-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-600 mb-2">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-sm font-bold text-purple-900">Crear Sermón</span>
                </button>
              ) : (
                <button onClick={() => setCurrentView('events')} className="p-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-2">
                    <Calendar size={16} />
                  </div>
                  <span className="text-sm font-bold text-pink-900">Crear Evento</span>
                </button>
              )}
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
