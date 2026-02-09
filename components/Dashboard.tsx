import React, { useState, useEffect } from 'react';
import { Radio, Clock, CheckCircle2, Music, Mic2, Calendar, Loader2, User, FileText, UserCheck, Mic, BookOpen, ChevronRight, BarChart3 } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { usePlans } from '../hooks/usePlans';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Role, User as UserType } from '../types';
import { ChurchSettings } from '../types';
import EventStoryCard from './EventStoryCard';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface DashboardProps {
  setCurrentView: (view: string) => void;
  role?: Role;
  settings?: ChurchSettings;
  users?: UserType[];
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView, role = 'ADMIN', settings, users = [] }) => {
  const { t, language } = useLanguage();
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

      // Bilingual Lookup (ES/EN)
      const DAYS_LOOKUP = [
        ['Domingo', 'Sunday'],
        ['Lunes', 'Monday'],
        ['Martes', 'Tuesday'],
        ['Miércoles', 'Wednesday'],
        ['Jueves', 'Thursday'],
        ['Viernes', 'Friday'],
        ['Sábado', 'Saturday']
      ];
      const dayNames = DAYS_LOOKUP[dateObj.getDay()]; // [es, en]
      const meetingTimes = settings?.meetingTimes || {};

      return Object.keys(meetingTimes).some(k => {
        const normK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return dayNames.some(d => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normK);
      });
    })
    .map(t => {
      // Robust Meeting Time Lookup (Bilingual)
      const [y, m, d] = t.date!.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      const DAYS_LOOKUP = [
        ['Domingo', 'Sunday'],
        ['Lunes', 'Monday'],
        ['Martes', 'Tuesday'],
        ['Miércoles', 'Wednesday'],
        ['Jueves', 'Thursday'],
        ['Viernes', 'Friday'],
        ['Sábado', 'Saturday']
      ];
      const dayNames = DAYS_LOOKUP[dateObj.getDay()]; // [es, en]
      const meetingTimes = settings?.meetingTimes || {};

      // Find matching key (Priority: Check both ES and EN)
      const matchedKey = Object.keys(meetingTimes).find(k => {
        const normK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return dayNames.some(d => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normK);
      });

      const recTime = matchedKey ? meetingTimes[matchedKey] : '';

      return {
        dateStr: t.date!,
        dateObj: dateObj,
        time: recTime,
        preacher: t.members.preacher,
        type: 'TEAM'
      };
    })
    .filter(t => t.time !== '');

  // 3. Merge & Sort
  const allUpcoming = [...futurePlans, ...futureTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Deduplicate by date (Plan wins)
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
    <div className="p-4 md:p-8 pt-32 md:pt-32 space-y-8 max-w-full mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{t('dashboard.welcome', { name: user?.name?.split(' ')[0] || 'Pastor' })}</h2>
        <p className="text-slate-500">{t('dashboard.subtitle') || "Aquí está lo que sucede hoy en la iglesia."}</p>
      </header>

      {/* Stories Carousel Section */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">{t('dashboard.upcoming_events') || "Próximos Eventos"}</h3>
          <button
            onClick={() => setCurrentView('events')}
            className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
          >
            {t('events.title') || "Gestionar Eventos"} <ChevronRight size={14} />
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
              {t('dashboard.no_stories') || "No hay historias destacadas"}
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
                        <Radio size={10} /> {t('member.live') || "En Vivo"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">{activePlan.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 leading-tight">{activePlan.title}</h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('planner')}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    title={t('common.view') || "Ver Completo"}
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
                      + {activePlan.items.length - 5} {t('dashboard.more_items') || "elementos más..."}
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
                  <h3 className="font-bold text-slate-600 text-lg">{t('dashboard.no_service') || "Sin Servicio Activo"}</h3>
                  <p className="text-sm">{t('dashboard.activate_plan') || "Activa un plan en Orden de Cultos."}</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Active Team Roster */}
          <div className="card-soft p-6 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-500" />
              {displayTeam?.teamName || (t('dashboard.official_team') || 'Equipo Oficial')}
            </h3>

            {displayTeam ? (
              <div className="space-y-4">
                {/* Preacher */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Mic2 size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('role.preacher') || "Predicador"}</span>
                    <p className="font-bold text-slate-800">{displayTeam.preacher || (t('common.tbd') || 'No asignado')}</p>
                  </div>
                </div>

                {/* Music Director */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                    <Music size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('role.music_director') || "Director Música"}</span>
                    <p className="font-bold text-slate-800">{displayTeam.musicDirector || (t('common.tbd') || 'No asignado')}</p>
                  </div>
                </div>

                {/* Audio */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Mic size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('role.audio') || "Audio"}</span>
                    <p className="font-bold text-slate-800">{displayTeam.audioOperator || (t('common.tbd') || 'No asignado')}</p>
                  </div>
                </div>

                {/* Elder */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('role.elder') || "Anciano de Turno"}</span>
                    <p className="font-bold text-slate-800">{displayTeam.elder || (t('common.tbd') || 'No asignado')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">{t('dashboard.no_team') || "No hay equipo asignado."}</p>
              </div>
            )}

            {/* MUSIC TEAM DISPLAY (New) */}
            {musicTeamMembers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                  <Music size={14} /> {t('role.music') || "Equipo de Alabanza"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t('dashboard.quick_access') || "Accesos Rápidos"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCurrentView('planner')} className="p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors rounded-3xl text-left">
                <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm font-bold text-indigo-900">{t('dashboard.view_roster') || "Ver Turnos"}</span>
              </button>

              {role === 'ELDER' ? (
                <button onClick={() => setCurrentView('sermons')} className="p-4 bg-purple-50 hover:bg-purple-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-600 mb-2">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-sm font-bold text-purple-900">{t('sermons.create') || "Crear Sermón"}</span>
                </button>
              ) : role === 'LEADER' ? (
                <button onClick={() => setCurrentView('events')} className="p-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-2">
                    <Calendar size={16} />
                  </div>
                  <span className="text-sm font-bold text-pink-900">{t('events.view_calendar') || "Ver Calendario"}</span>
                </button>
              ) : (
                <button onClick={() => setCurrentView('events')} className="p-4 bg-pink-50 hover:bg-pink-100 transition-colors rounded-3xl text-left">
                  <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 mb-2">
                    <Calendar size={16} />
                  </div>
                  <span className="text-sm font-bold text-pink-900">{t('events.create') || "Crear Evento"}</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-soft p-6 text-white shadow-lg shadow-cyan-200">
            {(() => {
              // Resolved Next Item Logic (Render)
              if (resolvedNextItem) {
                // Formatting date using language for display
                const dayName = resolvedNextItem.dateObj.toLocaleDateString(language || 'es', { weekday: 'long' });
                const displayDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                return (
                  <>
                    <h3 className="text-lg font-bold opacity-90 mb-1">{t('dashboard.next_service') || "Próximo Servicio"}</h3>
                    <p className="text-xs mb-2 opacity-80">{displayDay}</p>
                    <p className="text-3xl font-bold">{resolvedNextItem.time}</p>
                  </>
                );
              }

              // Fallback
              const displayTime = '10:30 AM'; // Simplified fallback logic display

              return (
                <>
                  <h3 className="text-lg font-bold opacity-90 mb-1">{t('dashboard.next_service') || "Próximo Servicio"}</h3>
                  <p className="text-3xl font-bold">{displayTime}</p>
                </>
              );
            })()}

            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-bold uppercase opacity-80 mb-1 flex items-center gap-1"><User size={12} /> {t('member.next_preacher') || "Próximo Predicador"}</p>
              <p className="text-xl font-bold">
                {resolvedNextItem ? (resolvedNextItem.preacher || (t('common.tbd') || 'Por definir')) : (t('common.tbd') || 'Por definir')}
              </p>
            </div>

            <p className="opacity-80 mt-4 text-sm">{t('dashboard.prepare_service') || "Prepárate para el servicio de adoración."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
