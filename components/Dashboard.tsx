import React, { useState, useEffect } from 'react'; // Added React imports
import { Radio, Clock, CheckCircle2, Music, Mic2, Calendar, Loader2, User, FileText, UserCheck, Mic, BookOpen } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { useAuth } from '../context/AuthContext'; // Added
import { Role, User as UserType } from '../types';

import { BarChart3, ChevronRight } from 'lucide-react';

import { ChurchSettings } from '../types';
import EventStoryCard from './EventStoryCard';
import { db } from '../services/firebase'; // Added
import { collection, query, where, getDocs } from 'firebase/firestore'; // Added

interface DashboardProps {
  setCurrentView: (view: string) => void;
  role?: Role;
  settings?: ChurchSettings;
  users?: UserType[]; // Added optional prop
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, role = 'ADMIN', settings, users = [] }) => {
  const { events, loading: eventsLoading } = useEvents();
  const { plans, loading: plansLoading } = usePlans();
  const { user } = useAuth();

  // Elders see ALL banners. Admins see ALL. Others might be restricted but Dashboard is mostly Admin/Elder.
  // Filter and sort events for stories
  const activeEvents = events
    .filter(e => {
      const eventDate = new Date(e.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today && e.activeInBanner;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);
  const activePlan = plans.find(p => p.isActive);

  // --- LOGIC: Resolved Next Service (Plan vs Team vs Recurrence) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Future Service Plans
  const futurePlans = plans
    .filter(p => !p.isActive && new Date(p.date + 'T00:00:00') >= today)
    .map(p => {
      // Parse as LOCAL date to avoid UTC shift
      const [y, m, d] = p.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return {
        dateStr: p.date,
        dateObj: dateObj,
        time: p.startTime, // Plan has explicit time
        preacher: p.team.preacher,
        type: 'PLAN'
      };
    });

  // 2. Future Teams (Roster)
  // Check if a team exists for a date that DOESN'T have a plan yet? 
  // Or just merge them and let Plan take precedence if dupe date.
  const futureTeams = (settings?.teams || [])
    .filter(t => t.date && new Date(t.date) >= today)
    .filter(t => {
      // Filter out teams on days that don't have a recurring meeting time (unless a Plan exists, handled separately)
      if (!t.date || !settings?.meetingTimes) return false;

      // Parse as LOCAL date to avoid UTC shift
      const [y, m, d] = t.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      // Only include if this day is a configured meeting day
      return Object.keys(settings.meetingTimes).includes(capitalizedDay);
    })
    .map(t => {
      // Find recurrent time for this day of week
      const [y, m, d] = t.date!.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const recTime = settings?.meetingTimes?.[capitalizedDay as any] || '10:00';

      return {
        dateStr: t.date!,
        dateObj: dateObj,
        time: recTime,
        preacher: t.members.preacher,
        type: 'TEAM'
      };
    });

  // 3. Merge & Sort
  const allUpcoming = [...futurePlans, ...futureTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Deduplicate by date (Plan wins)
  const uniqueUpcoming: typeof allUpcoming = [];
  const seenDates = new Set<string>();
  allUpcoming.forEach(item => {
    if (!seenDates.has(item.dateStr)) {
      seenDates.add(item.dateStr);
      uniqueUpcoming.push(item);
    } else {
      // If we already have this date, it was likely a Plan (since we put Plans first? No, we sorted by date).
      // If mixed, we want Plan to win.
      // Let's refine: Filter futureTeams to exclude dates present in futurePlans.
    }
  });

  // Refined Merge:
  const planDates = new Set(futurePlans.map(p => p.dateStr));
  const uniqueTeams = futureTeams.filter(t => !planDates.has(t.dateStr));
  const resolvedNextItem = [...futurePlans, ...uniqueTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];


  // --- Display Values ---
  const activeTeamId = settings?.activeTeamId;
  const globalActiveTeam = settings?.teams?.find(t => t.id === activeTeamId);

  const displayTeam = globalActiveTeam ? {
    teamName: globalActiveTeam.name,
    preacher: globalActiveTeam.members.preacher,
    musicDirector: globalActiveTeam.members.musicDirector || (globalActiveTeam.members as any).worshipLeader,
    audioOperator: globalActiveTeam.members.audioOperator,
    elder: globalActiveTeam.members.elder
  } : (activePlan?.team || null);


  const [musicTeamMembers, setMusicTeamMembers] = useState<UserType[]>([]);

  // Fetch Music Team Logic
  useEffect(() => {
    const getMusicTeam = async () => {
      if (!user?.tenantId) return;
      // Target date: Active Plan -> Resolved Next Item -> "Next Tuesday" Recurrence Date (Logic required)

      const targetDate = activePlan?.date || resolvedNextItem?.dateStr;
      if (!targetDate) return;

      try {
        const q = query(
          collection(db, 'tenants', user.tenantId, 'music_teams'),
          where('date', '==', targetDate)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const memberIds = data.memberIds as string[];
          const members = users.filter(u => memberIds.includes(u.id));
          setMusicTeamMembers(members);
        } else {
          setMusicTeamMembers([]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (users.length > 0) {
      getMusicTeam();
    }
  }, [activePlan, resolvedNextItem, user?.tenantId, users]);

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

      {/* Stories Carousel Section */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Próximos Eventos</h3>
          <button
            onClick={() => setCurrentView('events')}
            className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
          >
            Gestionar Eventos <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {activeEvents.length > 0 ? activeEvents.map((event, i) => (
            <EventStoryCard
              key={event.id}
              event={event}
              index={i}
              onClick={() => setCurrentView('events')}
            />
          )) : (
            <div className="w-full text-center py-10 text-slate-400 text-sm font-bold bg-white rounded-3xl border-dashed border-2 border-slate-100">
              No hay historias destacadas
            </div>
          )}
        </div>
      </div>

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
              <UserCheck size={18} className="text-indigo-500" />
              {displayTeam?.teamName || 'Equipo Oficial'}
            </h3>

            {displayTeam ? (
              <div className="space-y-4">
                {/* Preacher */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Mic2 size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Predicador</span>
                    <p className="font-bold text-slate-800">{displayTeam.preacher || 'No asignado'}</p>
                  </div>
                </div>

                {/* Music Director */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Music size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Director Música</span>
                    <p className="font-bold text-slate-800">{displayTeam.musicDirector || 'No asignado'}</p>
                  </div>
                </div>

                {/* Audio */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Mic size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Audio</span>
                    <p className="font-bold text-slate-800">{displayTeam.audioOperator || 'No asignado'}</p>
                  </div>
                </div>

                {/* Elder */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Anciano de Turno</span>
                    <p className="font-bold text-slate-800">{displayTeam.elder || 'No asignado'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">No hay equipo asignado.</p>
              </div>
            )}

            {/* MUSIC TEAM DISPLAY (New) */}
            {musicTeamMembers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <Music size={14} /> Equipo de Alabanza
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {musicTeamMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{m.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
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
              ) : role === 'LEADER' ? (
                <button onClick={() => setCurrentView('events')} className="p-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-2">
                    <Calendar size={16} />
                  </div>
                  <span className="text-sm font-bold text-pink-900">Ver Calendario</span>
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
            {(() => {
              // Resolved Next Item Logic (Render)
              if (resolvedNextItem) {
                const dayName = resolvedNextItem.dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                const displayDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                return (
                  <>
                    <h3 className="text-lg font-bold opacity-90 mb-1">Próximo {displayDay}</h3>
                    <p className="text-3xl font-bold">{resolvedNextItem.time}</p>
                  </>
                );
              }

              // Fallback to Recurrence if no resolved item
              let displayDay = 'Domingo';
              let displayTime = '10:30 AM';

              if (settings?.meetingTimes) {
                const days = Object.keys(settings.meetingTimes);
                if (days.length > 0) {
                  const dayOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  const today = new Date();
                  const currentDayIndex = today.getDay();

                  let foundDay = null;

                  // Check today and future days
                  for (let i = 0; i < dayOrder.length; i++) {
                    const checkIndex = (currentDayIndex + i) % 7;
                    const dayName = dayOrder[checkIndex];
                    if (days.includes(dayName)) {
                      foundDay = dayName;
                      break;
                    }
                  }

                  if (foundDay) {
                    displayDay = foundDay;
                    displayTime = settings.meetingTimes[foundDay];
                  }
                }
              }

              return (
                <>
                  <h3 className="text-lg font-bold opacity-90 mb-1">Próximo {displayDay}</h3>
                  <p className="text-3xl font-bold">{displayTime}</p>
                </>
              );
            })()}

            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-bold uppercase opacity-80 mb-1 flex items-center gap-1"><User size={12} /> Próximo Predicador</p>
              <p className="text-xl font-bold">
                {resolvedNextItem ? (resolvedNextItem.preacher || 'Por definir') : 'Por definir'}
              </p>
            </div>

            <p className="opacity-80 mt-4 text-sm">Prepárate para el servicio de adoración.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
