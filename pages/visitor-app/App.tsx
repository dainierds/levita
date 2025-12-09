import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ChurchEvent, ServicePlan } from '../../types';
import { ViewState } from './types';
import { Navbar } from './components/Sidebar'; // Importing the refactored Navbar
import { HomeView } from './views/HomeView';
import { LiveView } from './views/LiveView';
import { EventsView } from './views/EventsView';
import { OrderView } from './views/OrderView';

import { Bell, Moon, Sun, Search, User } from 'lucide-react';

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
}

const App: React.FC<AppProps> = ({ initialTenantId }) => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [nextPlan, setNextPlan] = useState<ServicePlan | null>(null);

  useEffect(() => {
    if (!initialTenantId) return;

    const fetchData = async () => {
      try {
        // Fetch Events
        const eventsQ = query(collection(db, 'events'), where('tenantId', '==', initialTenantId));
        const eventsSnap = await getDocs(eventsQ);
        const loadedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchEvent));
        setEvents(loadedEvents);

        // Fetch Plans
        const plansQ = query(
          collection(db, 'plans'),
          where('tenantId', '==', initialTenantId),
          where('isActive', '==', false) // Find upcoming, assuming active is "Live"
          // orderBy('date') // Composite index might be missing, filter locally
        );
        const plansSnap = await getDocs(plansQ);
        const loadedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

        // Find next plan
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = loadedPlans
          .filter(p => new Date(p.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

        setNextPlan(upcoming || null);

      } catch (error) {
        console.error("Error fetching visitor data:", error);
      }
    };
    fetchData();
  }, [initialTenantId]);

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
        return <HomeView onNavigate={setActiveView} events={events} />;
      case ViewState.LIVE:
        return <LiveView />;
      case ViewState.EVENTS:
        return <EventsView events={events} />;
      case ViewState.ORDER:
        return <OrderView servicePlan={nextPlan} />;
      case ViewState.PRAYER:
        return <SimpleView title="Peticiones" />;
      case ViewState.PROFILE:
        return <SimpleView title="Mi Perfil" />;
      default:
        return <HomeView onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neu-base dark:bg-neu-base-dark transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">

      {/* Header */}
      <header className="flex-none h-24 flex items-center justify-between px-6 lg:px-10 z-10 relative">
        <div className="flex items-center">
          {/* User Avatar - Moved here from sidebar */}
          <div className="mr-4 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center border-2 border-neu-base dark:border-neu-base-dark active:shadow-neu-pressed">
              <span className="font-bold text-gray-400 dark:text-gray-500 text-sm">M</span>
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
            </h1>
            <p className="text-xs md:text-sm text-gray-400 font-medium hidden sm:block">Bienvenido, Miembro 1</p>
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

          <button className="p-3 md:p-4 rounded-full text-gray-500 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all relative">
            <Bell size={20} />
            <span className="absolute top-3 right-3 md:top-3 md:right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-neu-base dark:border-neu-base-dark"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-28 scroll-smooth no-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
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