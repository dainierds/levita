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
  Home, Video, List, Heart, User, Calendar, LogOut,
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
  const [nextPlan, setNextPlan] = useState<ServicePlan | null>(null);
  const [settings, setSettings] = useState<ChurchSettings | null>(initialSettings || null);

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
        if (settingsSnap.exists()) {
          setSettings((settingsSnap.data().settings as ChurchSettings) || null);
        }

        // Fetch Events
        const eventsQ = query(collection(db, 'events'), where('tenantId', '==', initialTenantId));
        const eventsSnap = await getDocs(eventsQ);
        setEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchEvent)));

        // Fetch Plans
        const plansQ = query(collection(db, 'servicePlans'), where('tenantId', '==', initialTenantId));
        const plansSnap = await getDocs(plansQ);
        const loadedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

        const todayStr = new Date().toLocaleDateString('en-CA');
        const active = loadedPlans.find(p => p.isActive); // Simplification: just take active

        if (active) {
          setNextPlan(active);
        } else {
          const upcoming = loadedPlans
            .filter(p => !p.isActive && p.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))[0];
          setNextPlan(upcoming || null);
        }

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

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center lg:p-4 font-sans text-slate-900">
      {/* Phone Frame Simulator */}
      <div className="w-full h-full lg:w-full lg:max-w-[400px] lg:h-[850px] bg-white lg:rounded-[3rem] overflow-hidden shadow-2xl relative lg:border-[8px] lg:border-slate-900 lg:ring-4 ring-slate-800">

        {/* --- NATIVE LAYER: STATUS BAR --- */}
        {/* --- NATIVE LAYER: HEADER --- */}
        <div className={`absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-40 transition-all duration-300 transform px-6 py-4 flex justify-between items-center border-b border-slate-100 ${showNativeHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
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
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative" onClick={() => setActiveView(ViewState.TRANSLATION)}>
              {/* Translation shortcut */}
              <Share size={20} strokeWidth={2} />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative" onClick={onExit}>
              <LogOut size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div
          className="w-full h-full overflow-y-auto bg-[#F2F4F7] pt-24 pb-24 scroll-smooth"
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
            icon={List}
            label="Orden"
            active={activeView === ViewState.ORDER}
            onClick={() => setActiveView(ViewState.ORDER)}
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