import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../types';
import { ViewState } from './types';
import { Navbar } from './components/Sidebar'; // Importing the refactored Navbar
import { HomeView } from './views/HomeView';
import { LiveView } from './views/LiveView';
import { EventsView } from './views/EventsView';
import { OrderView } from './views/OrderView';
import { TranslationView } from './views/TranslationView';
import { PrayerView } from './views/PrayerView';

import { Bell, Moon, Sun, Search, User, ArrowLeft, LogOut } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const SimpleView: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 animate-in fade-in">
    <div className="w-24 h-24 rounded-full shadow-neu dark:shadow-neu-dark flex items-center justify-center mb-6">
      <Search size={32} className="opacity-30" />
    </div>
    <h2 className="text-3xl font-bold mb-2 text-gray-600 dark:text-gray-300">{title}</h2>
    <p>Esta sección está en construcción.</p>
  </div>
);

interface AppProps {
  initialTenantId?: string;
  initialSettings?: ChurchSettings | null;
  onExit?: () => void;
}

const App: React.FC<AppProps> = ({ initialTenantId, initialSettings, onExit }) => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [nextPlan, setNextPlan] = useState<ServicePlan | null>(null);
  const [settings, setSettings] = useState<ChurchSettings | null>(initialSettings || null);

  // Visitor Identification for Notifications
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem('levita_visitor_id');
    if (stored) return stored;
    const newId = 'visitor_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('levita_visitor_id', newId);
    return newId;
  });

  // Notifications Hook
  // We need to import useNotifications. Ensure the path is correct relative to this file.
  // ../../hooks/useNotifications
  const { unreadCount } = useNotifications(initialTenantId, visitorId, 'VISITOR');


  useEffect(() => {
    // If we already have settings, don't re-fetch unless tenant changes
    if (initialSettings) {
      setSettings(initialSettings);
    }

    if (!initialTenantId) return;

    const fetchData = async () => {
      if (!initialTenantId) {
        console.error("VisitorApp: No initialTenantId provided");
        return;
      }

      try {
        // Fetch Settings from Tenant Doc
        const settingsRef = doc(db, 'tenants', initialTenantId);
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const tenantData = settingsSnap.data();
          const settingsData = tenantData.settings as ChurchSettings;
          if (settingsData) {
            setSettings(settingsData);
          }
        }

        // Fetch Events
        const eventsQ = query(collection(db, 'events'), where('tenantId', '==', initialTenantId));
        const eventsSnap = await getDocs(eventsQ);
        const loadedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchEvent));

        setEvents(loadedEvents);

        // Fetch Plans (Active AND Upcoming)
        // We fetch all plans for the tenant and filter client-side to be safe with composite indexes
        // CRITICAL: Must use 'servicePlans' collection to match Admin App (hooks/usePlans.ts)
        const plansQ = query(
          collection(db, 'servicePlans'),
          where('tenantId', '==', initialTenantId)
        );
        const plansSnap = await getDocs(plansQ);
        const loadedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

        // Logic to determine active vs next plan
        const active = loadedPlans.find(p => p.isActive);

        if (active) {
          setNextPlan(active); // Treat active plan as the "Next/Current" one to display
          if (activeView === ViewState.HOME) {
            // Optional: auto-switch to LIVE view if configured, or just show "LIVE" badge in HomeView
          }
        } else {
          // 2. Find NEXT upcoming plan
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcoming = loadedPlans
            .filter(p => !p.isActive && new Date(p.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

          setNextPlan(upcoming || null);
        }


      } catch (error) {
        console.error("Error fetching visitor data:", error);
      }
    };
    fetchData();
  }, [initialTenantId, initialSettings]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activeView) {
      case ViewState.HOME:
        return <HomeView onNavigate={setActiveView} events={events} nextPlan={nextPlan} settings={settings} />;
      case ViewState.LIVE:
        return <LiveView tenantId={initialTenantId} />;
      case ViewState.EVENTS:
        return <EventsView events={events} />;
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
    <div className="flex flex-col h-screen overflow-hidden bg-neu-base dark:bg-neu-base-dark transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">

      {/* Header */}
      <header className="flex-none h-24 flex items-center justify-between px-6 lg:px-10 z-10 relative">
        <div className="flex items-center">
          {/* Back / Exit Button */}
          {onExit && (
            <button onClick={onExit} className="mr-4 p-2 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-gray-500 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          )}

          {/* User Avatar - Moved here from sidebar */}
          <div className="mr-4 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center border-2 border-neu-base dark:border-neu-base-dark active:shadow-neu-pressed">
              <User size={20} className="text-gray-400" />
            </div>
          </div>

          <div className="">
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-gray-200 tracking-tight">
              {activeView === ViewState.HOME && 'Dashboard'}
              {activeView === ViewState.LIVE && 'En Vivo'}
              {activeView === ViewState.EVENTS && 'Eventos'}
              {activeView === ViewState.ORDER && 'Orden del Culto'}
              {activeView === ViewState.PRAYER && 'Oración'}
              {activeView === ViewState.PROFILE && 'Perfil'}
              {activeView === ViewState.TRANSLATION && 'Traducción'}
            </h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium hidden sm:block">Modo Visitante</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Desktop User Avatar */}
          <button onClick={() => setActiveView(ViewState.PROFILE)} className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-xl shadow-neu dark:shadow-neu-dark hover:text-brand-500 transition-all active:shadow-neu-pressed">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">M</div>
            <span className="text-sm font-bold">Mi Perfil</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-12 h-7 md:w-14 md:h-8 rounded-full shadow-neu-pressed dark:shadow-neu-dark-pressed flex items-center px-1 transition-all duration-300 ${isDarkMode ? 'justify-end' : 'justify-start'}`}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-brand-500 shadow-md flex items-center justify-center text-white">
              {isDarkMode ? <Moon size={10} /> : <Sun size={10} />}
            </div>
          </button>


          <button
            onClick={() => {/* Toggle Notification View - To be implemented or just clear count */ }}
            className="p-3 md:p-4 rounded-full text-gray-500 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 md:top-3 md:right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-neu-base dark:border-neu-base-dark"></span>
            )}
          </button>
        </div>
      </header>


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-28 scroll-smooth no-scrollbar">
        <div className="w-full h-full">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
      />

    </div>
  );
};

export default App;