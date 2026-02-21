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
import { ProfileView } from './views/ProfileView';

import {
  Home, Video, List, Heart, User, Calendar, LogOut, Globe,
  Signal, Wifi, Battery, Share, Bell, Search
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { motion } from 'framer-motion';

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
        const now = new Date();
        const todayZero = new Date(now);
        todayZero.setHours(0, 0, 0, 0);

        // SATURDAY NOON RULE: If it's Saturday (6) and time is >= 12:00, 
        // we skip today and look for next service (e.g. Tuesday).
        let searchStart = todayZero;

        if (now.getDay() === 6 && now.getHours() >= 12) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          searchStart = tomorrow;
        }

        // 1. Future Service Plans
        const futurePlans = loadedPlans
          .filter(p => !p.isActive && new Date(p.date + 'T00:00:00') >= searchStart)
          .map(p => {
            const [y, m, d] = p.date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);

            let time = p.startTime;

            // AUTO-FIX: If plan uses default '10:00' but settings have a specific time (e.g. 19:00), use settings.
            if (time === '10:00' || !time) {
              const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
              const dayName = DAYS_MAP[dateObj.getDay()];
              const meetingTimes = currentSettings?.meetingTimes || {};

              // Robust lookup
              const normalizedDay = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

              const matchedKey = Object.keys(meetingTimes).find(
                k => k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedDay
              );

              if (matchedKey && meetingTimes[matchedKey]) {
                time = meetingTimes[matchedKey];
              }
            }

            return {
              dateStr: p.date,
              dateObj: dateObj,
              time: time,
              preacher: p.team.preacher,
              type: 'PLAN' as const
            };
          });

        // 2. Future Teams (Roster) from Settings
        const futureTeams = (currentSettings?.teams || [])
          .filter(t => t.date && new Date(t.date + 'T00:00:00') >= searchStart)
          .map(t => {
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

            // Robust Lookup: Case-insensitive & Trimmed & Bilingual
            const meetingTimes = currentSettings?.meetingTimes || {};

            const matchedKey = Object.keys(meetingTimes).find(k => {
              const normK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return dayNames.some(d => d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normK);
            });

            // If match found, use it; otherwise default to '' so it gets filtered out
            const recTime = matchedKey ? meetingTimes[matchedKey] : '';

            return {
              dateStr: t.date!,
              dateObj: dateObj,
              time: recTime,
              preacher: t.members.preacher,
              type: 'TEAM' as const
            };
          })
          .filter(t => t.time !== '');

        const planDates = new Set(futurePlans.map(p => p.dateStr));
        const uniqueTeams = futureTeams.filter(t => !planDates.has(t.dateStr));
        const resolvedNext = [...futurePlans, ...uniqueTeams].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

        if (resolvedNext) {
          setNextService(resolvedNext);
        } else if (active && searchStart.getTime() === todayZero.getTime()) {
          // Only fallback to active if we are NOT skipping today
          setNextService({
            dateStr: active.date,
            time: active.startTime,
            preacher: active.team.preacher,
            dateObj: new Date(active.date + 'T00:00:00'),
            type: 'PLAN'
          });
        } else {
          // Fallback: Find next generic recurrence if nothing scheduled?
          // For now, let's leave as null or define a generic "Proximo Culto"
          // But the user requested generic fallback: "En espera..."
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
        return <ProfileView tenantId={initialTenantId} />;
      case ViewState.TRANSLATION:
        return <TranslationView tenantId={initialTenantId} />;
      default:
        return <HomeView onNavigate={setActiveView} />;
    }
  };

  // Helper for 12h format
  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  };

  // Ticker Content for Header
  const tickerText = nextService
    ? `PRÓXIMO CULTO: ${nextService.dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${formatTime12h(nextService.time)}  ✦  PREDICADOR: ${nextService.preacher?.toUpperCase() || 'POR DEFINIR'}  ✦  `
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
          className="w-full h-full overflow-y-auto bg-[#F2F4F7] pt-40 pb-24 scroll-smooth"
          onScroll={handleScroll}
          ref={scrollRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderContent()}
        </div>

        {/* --- NATIVE TAB BAR (Notch Style) --- */}
        <div className="absolute bottom-0 left-0 right-0 h-[5.5rem] z-50">
          <NotchedNavBar
            activeView={activeView}
            onNavigate={setActiveView}
          />
        </div>

      </div>
    </div>
  );
};

// --- SVG NOTCHED NAV BAR COMPONENT ---
const NotchedNavBar = ({ activeView, onNavigate }: { activeView: ViewState, onNavigate: (v: ViewState) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      // Use requestAnimationFrame to avoid ResizeObserver loop limit errors
      requestAnimationFrame(() => {
        if (entries[0]) setWidth(entries[0].contentRect.width);
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const tabs = [
    { id: ViewState.HOME, icon: Home, label: 'Inicio' },
    { id: ViewState.EVENTS, icon: Calendar, label: 'Eventos' },
    { id: ViewState.LIVE, icon: Video, label: 'En Vivo' },
    { id: ViewState.TRANSLATION, icon: Globe, label: 'Traducción' },
    { id: ViewState.PROFILE, icon: User, label: 'Perfil' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeView);
  const validIndex = activeIndex === -1 ? 0 : activeIndex;

  // Render nothing until we have width to prevent hydration mismatch/jumps
  if (width === 0) return <div ref={containerRef} className="w-full h-full" />;

  // Geometry
  const tabWidth = width / 5;
  const centerX = (validIndex * tabWidth) + (tabWidth / 2);
  const holeWidth = 76; // Slightly wider than button
  const depth = 38; // Deep enough for 50% of button

  // Construct SV Path with dynamic notch
  // We use slightly complex bezier curves to get that 'gooey' or 'liquid' connection
  // M = Move, L = Line, C = Cubic Bezier, Q = Quadratic Bezier
  const path = `
    M 0 30 
    Q 0 0 30 0
    L ${centerX - holeWidth / 2 - 15} 0
    C ${centerX - holeWidth / 2} 0, ${centerX - holeWidth / 2.5} ${depth}, ${centerX} ${depth}
    C ${centerX + holeWidth / 2.5} ${depth}, ${centerX + holeWidth / 2} 0, ${centerX + holeWidth / 2 + 15} 0
    L ${width - 30} 0
    Q ${width} 0 ${width} 30
    L ${width} 100
    L 0 100
    Z
  `;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* SVG Background */}
      <svg className="absolute inset-0 w-full h-full drop-shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pointer-events-none">
        <motion.path
          d={path}
          className="fill-white"
          animate={{ d: path }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      </svg>

      {/* Tabs */}
      <div className="relative w-full h-full flex items-end">
        {tabs.map((tab, idx) => {
          const isActive = idx === validIndex;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as any)}
              className="flex-1 h-full flex flex-col items-center justify-end pb-4 relative z-10 group"
            >
              <div className="relative">
                {/* Active Floating Bubble */}
                {isActive && (
                  <motion.div
                    layoutId="active-notch-bubble"
                    className="absolute left-1/2 -ml-[1.75rem] -top-[3.25rem] w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] border-[3px] border-white flex items-center justify-center text-white z-20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <tab.icon size={26} strokeWidth={2.5} />
                  </motion.div>
                )}

                {/* Inactive Icon */}
                <div className={`transition-all duration-300 ${isActive ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-slate-400 group-hover:text-indigo-500'}`}>
                  {isActive ? <div className="w-6 h-6" /> : <tab.icon size={26} strokeWidth={2} />}
                </div>
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'opacity-0 translate-y-2' : 'text-slate-400 opacity-100'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default App;