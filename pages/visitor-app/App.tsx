import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../types';
import { ViewState } from './types';
import { HomeView } from './views/HomeView';
import { LiveView } from './views/LiveView';
import { EventsView } from './views/EventsView';
import { OrderView } from './views/OrderView';
import { TranslationView } from './views/TranslationView';
import { PrayerView } from './views/PrayerView';

import {
  Home, Video, List, Heart, User, Calendar, LogOut, Globe,
  Signal, Wifi, Battery, Share, Bell, Search
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const SimpleView: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-in fade-in">
    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
      <Search size={32} className="opacity-30 text-slate-500" />
    </div>
    <h2 className="text-2xl font-bold mb-2 text-slate-600">{title}</h2>
    <p>Próximamente</p>
  </div>
);

interface AppProps {
  initialTenantId?: string;
  initialSettings?: ChurchSettings | null;
  onExit?: () => void;
}

const App: React.FC<AppProps> = ({ initialTenantId, initialSettings, onExit }) => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);

  // Data State
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  // Use a generic object for next service info to decouple from ServicePlan strict type if needed
  const [nextService, setNextService] = useState<{
    dateStr: string;
    time: string;
    preacher: string;
    dateObj: Date;
    type: 'PLAN' | 'TEAM';
  } | null>(null);

  const [settings, setSettings] = useState<ChurchSettings | null>(initialSettings || null);
  const [nextPlan, setNextPlan] = useState<ServicePlan | null>(null); // Keep for compatibility if needed

  // Native Shell State
  const [showNativeHeader, setShowNativeHeader] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 50) {
      setShowNativeHeader(false);
    } else {
      setShowNativeHeader(true);
    }
  };

  // Visitor Notification logic (simplified)
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem('levita_visitor_id');
    if (stored) return stored;
    const newId = 'visitor_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('levita_visitor_id', newId);
    return newId;
  });

  const { unreadCount } = useNotifications(initialTenantId, visitorId, 'VISITOR');


  useEffect(() => {
    if (initialSettings) setSettings(initialSettings);
    if (!initialTenantId) return;

    const fetchData = async () => {
      try {
        // Fetch Settings
        const settingsRef = doc(db, 'tenants', initialTenantId);
        const settingsSnap = await getDoc(settingsRef);
        let currentSettings = initialSettings;
        if (settingsSnap.exists()) {
          currentSettings = (settingsSnap.data().settings as ChurchSettings) || null;
          setSettings(currentSettings);
        }

        // Fetch Events
        const eventsQ = query(collection(db, 'events'), where('tenantId', '==', initialTenantId));
        const eventsSnap = await getDocs(eventsQ);
        setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchEvent)));

        // Fetch Plans
        const plansQ = query(collection(db, 'servicePlans'), where('tenantId', '==', initialTenantId));
        const plansSnap = await getDocs(plansQ);
        const loadedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

        const active = loadedPlans.find(p => p.isActive);
        setNextPlan(active || null); // Keep for live stream logic

        // --- RESOLVE NEXT SERVICE LOGIC (Copied from Dashboard) ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Future Service Plans
        const futurePlans = loadedPlans
          .filter(p => !p.isActive && new Date(p.date + 'T00:00:00') >= today)
          .map(p => {
            const [y, m, d] = p.date.split('-').map(Number);
            return {
              dateStr: p.date,
              dateObj: new Date(y, m - 1, d),
              time: p.startTime,
              preacher: p.team.preacher,
              type: 'PLAN' as const
            };
          });

        // 2. Future Teams (Roster) from Settings
        const futureTeams = (currentSettings?.teams || [])
          .filter(t => t.date && new Date(t.date + 'T00:00:00') >= today)
          .filter(t => {
            if (!t.date || !currentSettings?.meetingTimes) return false;
            const [y, m, d] = t.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return Object.keys(currentSettings.meetingTimes).includes(capitalizedDay);
          })
          .map(t => {
            const [y, m, d] = t.date!.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            const recTime = currentSettings?.meetingTimes?.[capitalizedDay as any] || '10:00';

            return {
              dateStr: t.date!,
              dateObj: dateObj,
              time: recTime,
              preacher: t.members.preacher,
              type: 'TEAM' as const
            };
          });

        const planDates = new Set(futurePlans.map(p => p.dateStr));
        const uniqueTeams = futureTeams.filter(t => !planDates.has(t.dateStr));
        const resolvedNext = [...futurePlans, ...uniqueTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

        if (resolvedNext) {
          setNextService(resolvedNext);
        } else if (active) {
          // If active, show that? Or next? User wants "Next".
          // If active is present, maybe we show "Active Now"?
          // Ticker usually likes "Next".
          setNextService({
            dateStr: active.date,
            time: active.startTime,
            preacher: active.team.preacher,
            dateObj: new Date(active.date + 'T00:00:00'),
            type: 'PLAN'
          });
        }
        // -----------------------------------------------------------

      } catch (error) {
        console.error("Error fetching visitor data:", error);
      }
    };
    fetchData();
  }, [initialTenantId, initialSettings]);


  // State for deep linking to events
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeView) {
      case ViewState.HOME:
        return (
          <HomeView
            onNavigate={setActiveView}
            onEventSelect={(id: string) => {
              setSelectedEventId(id);
              setActiveView(ViewState.EVENTS);
            }}
            events={events}
            nextPlan={nextPlan}
            nextService={nextService} // Pass our resolved service
            settings={settings}
          />
        );
      case ViewState.LIVE:
        return <LiveView tenantId={initialTenantId} />;
      case ViewState.EVENTS:
        return <EventsView events={events} selectedEventId={selectedEventId} />;
      case ViewState.ORDER:
        return <OrderView servicePlan={nextPlan} settings={settings} />;
      case ViewState.PRAYER:
        return <PrayerView tenantId={initialTenantId} />;
      case ViewState.PROFILE:
        return <SimpleView title="Mi Perfil" />;
      case ViewState.TRANSLATION:
        return <TranslationView tenantId={initialTenantId} />;
      default:
        return <HomeView onNavigate={setActiveView} />;
    }
  };

  // Ticker Content for Header
  const tickerText = nextService
    ? `PRÓXIMO CULTO: ${nextService.dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${nextService.time}  ✦  PREDICADOR: ${nextService.preacher?.toUpperCase() || 'POR DEFINIR'}  ✦  `
    : 'BIENVENIDOS A LA IGLESIA  ✦  ';
  const displayTicker = tickerText.repeat(4);

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center lg:p-4 font-sans text-slate-900">
      {/* Phone Frame Simulator */}
      <div className="w-full h-full lg:w-full lg:max-w-[400px] lg:h-[850px] bg-white lg:rounded-[3rem] overflow-hidden shadow-2xl relative lg:border-[8px] lg:border-slate-900 lg:ring-4 ring-slate-800">

        {/* --- NATIVE LAYER: STATUS BAR --- */}
        {/* --- NATIVE LAYER: HEADER --- */}
        <div
          className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 transform ${showNativeHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        >
          {/* WHITE FRONT CARD */}
          <div className="relative z-20 bg-white rounded-b-[2.5rem] shadow-sm px-6 py-4 pt-8 pb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                V
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bienvenido</h2>
                <p className="text-lg font-black text-slate-900 leading-none">Visitante</p>
              </div>
            </div>
            <div className="flex gap-4 text-slate-600 items-center">
              <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative" onClick={onExit}>
                <LogOut size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* COLORED BOTTOM CARD (Ticker) - Layered Behind */}
          {activeView === ViewState.HOME && (
            <div className="absolute inset-x-0 top-10 -bottom-10 z-10 rounded-b-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-[0_20px_40px_-12px_rgba(79,70,229,0.5)] flex items-end justify-center pb-2 overflow-hidden">

              {/* Marquee Content */}
              <div className="w-full flex items-center overflow-hidden mb-1">
                <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] flex items-center w-full">
                  <span className="text-[10px] font-black text-white tracking-widest px-4">{displayTicker}</span>
                </div>
              </div>

              {/* Masks for gradient fade at edges */}
              <div className="absolute left-0 bottom-0 top-20 w-8 bg-gradient-to-r from-blue-600 to-transparent z-20 pointer-events-none"></div>
              <div className="absolute right-0 bottom-0 top-20 w-8 bg-gradient-to-l from-purple-600 to-transparent z-20 pointer-events-none"></div>
            </div>
          )}
        </div>

        <style>{`
            @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
            }
        `}</style>

        {/* --- CONTENT AREA --- */}
        <div
          className="w-full h-full overflow-y-auto bg-[#F2F4F7] pt-28 pb-24 scroll-smooth"
          onScroll={handleScroll}
          ref={scrollRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderContent()}
        </div>

        {/* --- NATIVE TAB BAR --- */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-4 pb-8 flex justify-between items-center z-50 text-slate-400">
          <TabIcon
            icon={Home}
            label="Inicio"
            active={activeView === ViewState.HOME}
            onClick={() => setActiveView(ViewState.HOME)}
          />
          <TabIcon
            icon={Calendar}
            label="Eventos"
            active={activeView === ViewState.EVENTS}
            onClick={() => setActiveView(ViewState.EVENTS)}
          />

          {/* FAB */}
          <button
            onClick={() => setActiveView(ViewState.LIVE)}
            className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white mb-8 transform hover:scale-105 transition-transform active:scale-95"
          >
            <Video size={24} strokeWidth={2.5} />
          </button>

          <TabIcon
            icon={Globe}
            label="Traducción"
            active={activeView === ViewState.TRANSLATION}
            onClick={() => setActiveView(ViewState.TRANSLATION)}
          />
          <TabIcon
            icon={User}
            label="Perfil"
            active={activeView === ViewState.PROFILE}
            onClick={() => setActiveView(ViewState.PROFILE)}
          />
        </div>

      </div>
    </div>
  );
};

const TabIcon = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${active ? 'text-indigo-600' : 'hover:text-slate-600'}`}
  >
    <Icon size={24} fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 2.5} />
    <span className={`text-[10px] font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
  </button>
);

export default App;