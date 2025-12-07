import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import ElderDashboard from './components/ElderDashboard';
import PersonalStatistics from './components/PersonalStatistics';
import ResourcesView from './components/ResourcesView';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ServicePlanner from './components/ServicePlanner';
import MemberApp from './components/MemberApp';
import UserManagement from './components/UserManagement';
import ChurchConfig from './components/ChurchConfig';
import RosterView from './components/RosterView';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import NotificationAdmin from './components/NotificationAdmin';
import EventsAdmin from './components/EventsAdmin';
import { ChurchSettings, ChurchTenant, SubscriptionTier, User, AppNotification } from './types';
import { Menu, Shield, Loader2 } from 'lucide-react';
import { NotificationProvider, NotificationBell } from './components/NotificationSystem';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEvents } from './hooks/useEvents';
import { usePlans } from './hooks/usePlans';
import { useUsers } from './hooks/useUsers';
import { useTenantSettings } from './hooks/useTenantSettings';
import { updateTenantSettings } from './services/tenantService';
import { LanguageProvider } from './context/LanguageContext';
import AudioDashboard from './components/AudioDashboard';
import StatisticsPanel from './components/StatisticsPanel';
import DbSeeder from './components/DbSeeder';
import JoinPage from './pages/JoinPage';
import TeamRoster from './components/TeamRoster';
import SermonManager from './components/SermonManager';
import ElderBottomNav from './components/ElderBottomNav';
import ElderNotifications from './components/ElderNotifications';
import ElderHeader from './components/ElderHeader';
import ElderCalendarView from './components/ElderCalendarView';
import ElderRosterView from './components/ElderRosterView';

// Components acting as Pages
import VisitorLanding from './pages/VisitorLanding';
import StaffPortal from './pages/StaffPortal';

// --- MOCK DATA ---
const DEFAULT_SETTINGS: ChurchSettings = {
  meetingDays: ['Domingo'],
  meetingTimes: { 'Domingo': '10:30' },
  preachingDays: ['Domingo'],
  rosterFrequency: 'Semanal',
  rosterDays: ['Domingo'],
  rosterAutoNotifications: false
};

const MOCK_TENANTS: ChurchTenant[] = [
  { id: 't1', name: 'Iglesia Vida Nueva', pastorName: 'Juan Pérez', pastorEmail: 'juan@vidanueva.com', tier: 'PLATINUM', status: 'ACTIVE', joinedDate: '10/01/2023' },
  { id: 't2', name: 'Centro Cristiano Fe', pastorName: 'Maria González', pastorEmail: 'maria@ccfe.com', tier: 'GOLD', status: 'ACTIVE', joinedDate: '15/02/2023' },
  { id: 't3', name: 'Misión Global', pastorName: 'Pedro Sanchez', pastorEmail: 'pedro@mision.org', tier: 'BASIC', status: 'BLOCKED', joinedDate: '20/03/2023' },
];

const MOCK_USERS: User[] = [
  { id: '1', name: 'Pastor Principal', email: 'pastor@levita.com', role: 'ADMIN', status: 'ACTIVE' },
  { id: '2', name: 'Líder de Alabanza', email: 'musica@levita.com', role: 'MUSIC', status: 'ACTIVE' },
  { id: '3', name: 'Hno. Carlos', email: 'carlos@levita.com', role: 'ELDER', status: 'ACTIVE' },
  { id: '4', name: 'Ps. Juan', email: 'juan@levita.com', role: 'PREACHER', status: 'ACTIVE' },
  { id: '5', name: 'Luis Tech', email: 'luis@levita.com', role: 'AUDIO', status: 'ACTIVE' },
  { id: '6', name: 'Maria Miembro', email: 'maria@levita.com', role: 'MEMBER', status: 'ACTIVE' },
];

const ProtectedApp: React.FC = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const { events, loading: eventsLoading, updateEvent } = useEvents();
  const { plans, loading: plansLoading, savePlan } = usePlans();
  const { users, loading: usersLoading } = useUsers();
  const { settings, loading: settingsLoading } = useTenantSettings();

  const [currentView, setCurrentView] = useState('dashboard');
  // const [settings, setSettings] = useState<ChurchSettings>(DEFAULT_SETTINGS); // Removed local state
  const [tenants, setTenants] = useState<ChurchTenant[]>(MOCK_TENANTS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentTenantTier, setCurrentTenantTier] = useState<SubscriptionTier>('PLATINUM');
  const [elderUnreadCount, setElderUnreadCount] = useState(0);

  // Elder Notification Real-time Listener
  useEffect(() => {
    if (role !== 'ELDER' || !user?.tenantId || !user?.uid) return;

    const notifQuery = query(
      collection(db, 'notificaciones'),
      where('iglesiaId', '==', user.tenantId),
      orderBy('fechaCreacion', 'desc')
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const myNotifs = allNotifs.filter((notif: any) => {
        if (notif.destinatarioId && notif.destinatarioId === user.uid) return true;
        if (Array.isArray(notif.destinatarios) && notif.destinatarios.includes(user.uid)) return true;
        if (!notif.destinatarioId && !notif.destinatarios) return true; // Global
        return false;
      });

      const unread = myNotifs.filter((notif: any) => {
        if (!notif.leidas) return true;
        return notif.leidas[user.uid] !== true;
      }).length;

      setElderUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleSaveSettings = async (newSettings: ChurchSettings) => {
    if (user?.tenantId) {
      try {
        await updateTenantSettings(user.tenantId, newSettings);
      } catch (error) {
        console.error("Error saving settings:", error);
        alert("Error al guardar la configuración.");
      }
    }
  };

  // Calculate next preacher
  const nextPlan = plans.find(p => !p.isActive && new Date(p.date) >= new Date()) || plans[0];
  const nextPreacher = nextPlan?.team.preacher || 'Por definir';

  // Redirect logic for restricted roles
  // Redirect logic for restricted roles
  // Removed MUSIC and PREACHER redirect as they now have no interface access.
  useEffect(() => {
    // ELDER is allowed in Dashboard.
  }, [role, currentView]);

  if (!user) {
    return <Navigate to="/portal" replace />;
  }

  // 0. NO INTERFACE ROLES
  if (role === 'MUSIC' || role === 'PREACHER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Shield size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h1>
        <p className="text-slate-500 mb-6 max-w-md">
          Este rol no tiene acceso a la plataforma administrativa.
          Si crees que es un error, contacta a tu administrador.
        </p>
        <button
          onClick={logout}
          className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  // 1.5 AUDIO View
  if (role === 'AUDIO') {
    return (
      <NotificationProvider allNotifications={notifications} setAllNotifications={setNotifications} currentUserId={user?.id}>
        <AudioDashboard />
        <div className="fixed bottom-4 right-4 z-[100] flex gap-2">
          <button onClick={logout} className="bg-[#2d313a] border border-slate-700 px-4 py-2 rounded-full shadow-lg text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
            Salir
          </button>
        </div>
      </NotificationProvider>
    );
  }

  // 2. MEMBER View (PWA)
  if (role === 'MEMBER') {
    return (
      <NotificationProvider allNotifications={notifications} setAllNotifications={setNotifications} currentUserId={user?.id}>
        <MemberApp
          activePlan={plans.find(p => p.isActive)}
          events={events}
          onLoginRequest={async () => {
            navigate('/');
            await logout();
          }}
          nextPreacher={nextPreacher}
          settings={settings}
        />
      </NotificationProvider>
    );
  }

  // 2. SUPER ADMIN View
  if (role === 'SUPER_ADMIN') {
    return (
      <NotificationProvider allNotifications={notifications} setAllNotifications={setNotifications} currentUserId="0">
        <SuperAdminDashboard tenants={tenants} setTenants={setTenants} />
        <div className="fixed bottom-4 right-4 z-[100] flex gap-2">
          <button onClick={logout} className="bg-white px-4 py-2 rounded-full shadow-lg text-xs font-bold text-red-500">
            Salir
          </button>
        </div>
      </NotificationProvider>
    );
  }

  // 3. ADMIN / TECH View
  return (
    <NotificationProvider allNotifications={notifications} setAllNotifications={setNotifications} currentUserId={user?.id}>
      <div className="min-h-screen bg-[#F7F8FA] flex text-slate-800 font-sans selection:bg-indigo-100">
        {role !== 'ELDER' && (
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            role={role}
            tier={currentTenantTier}
            user={user!}
          />
        )}

        <main className={`flex-1 relative ${role !== 'ELDER' ? 'md:ml-64' : 'bg-slate-50 min-h-screen'}`}>
          {/* Mobile Header */}
          <div className="md:hidden p-4 flex justify-between items-center bg-white shadow-sm sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <h1 className="font-bold text-xl">LEVITA</h1>
            </div>
            <NotificationBell />
          </div>

          {/* Desktop Top Bar - Hide for Elder */}
          {role !== 'ELDER' && (
            <div className="hidden md:flex absolute top-6 right-8 z-50 items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Iglesia:</span>
                <span className="text-sm font-bold text-indigo-600">{settings?.churchName || 'Mi Iglesia'}</span>
              </div>

              <button onClick={logout} className="text-xs font-bold text-red-400 hover:text-red-600">
                Salir
              </button>

              <NotificationBell />
            </div>
          )}

          {/* LOADING STATE */}
          {(eventsLoading || plansLoading) && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 z-50">
              <Loader2 className="animate-spin text-indigo-500" size={16} />
              <span className="text-xs font-bold text-slate-500">Sincronizando...</span>
            </div>
          )}



          {/* Elder Header - Show Always for Elder */}
          {role === 'ELDER' && (
            <div className="w-full">
              <ElderHeader user={user!} onMenuClick={() => setCurrentView('dashboard')} isMenuOpen={currentView === 'dashboard'} />
            </div>
          )}

          {currentView === 'dashboard' && role === 'ADMIN' && (
            <Dashboard setCurrentView={setCurrentView} role={role} settings={settings} />
          )}

          {currentView === 'dashboard' && role === 'ELDER' && (
            <ElderDashboard setCurrentView={setCurrentView} user={user!} settings={settings} notificationCount={elderUnreadCount} />
          )}

          {currentView === 'planner' && (
            <ServicePlanner tier={currentTenantTier} users={users} />
          )}

          {currentView === 'events' && role === 'ADMIN' && (
            <EventsAdmin events={events} tier={currentTenantTier} />
          )}

          {currentView === 'events' && role === 'ELDER' && (
            <ElderCalendarView />
          )}

          {currentView === 'users' && (role === 'ADMIN') && (
            <UserManagement users={users} setUsers={() => { }} tier={currentTenantTier} currentUser={user} />
          )}

          {currentView === 'settings' && (role === 'ADMIN') && (
            <ChurchConfig settings={settings} onSave={handleSaveSettings} />
          )}

          {currentView === 'roster' && (
            role === 'ELDER' ? (
              <ElderRosterView />
            ) : (
              <RosterView
                plans={plans}
                savePlan={savePlan}
                settings={settings}
                users={users}
                onSaveSettings={handleSaveSettings}
              />
            )
          )}

          {currentView === 'notifications' && (role === 'ADMIN') && (
            <NotificationAdmin users={users} />
          )}

          {currentView === 'notifications' && (role === 'ELDER') && (
            <ElderNotifications />
          )}



          {currentView === 'statistics' && (role === 'ADMIN') && (
            <div className="p-8 max-w-full mx-auto">
              <StatisticsPanel plans={plans} />
            </div>
          )}

          {currentView === 'statistics' && (role === 'ELDER') && (
            <PersonalStatistics plans={plans} user={user!} />
          )}

          {currentView === 'resources' && (role === 'ELDER') && (
            <ResourcesView />
          )}

          {currentView === 'team' && (
            <TeamRoster
              users={users}
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {currentView === 'sermons' && (
            <SermonManager />
          )}

        </main>

        {role === 'ELDER' && (
          <ElderBottomNav currentView={currentView} setCurrentView={setCurrentView} notificationCount={elderUnreadCount} />
        )}
      </div>
    </NotificationProvider>
  );
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Visitor Route */}
      <Route path="/" element={<VisitorLanding />} />

      {/* Staff Portal Login */}
      <Route path="/portal" element={user ? <Navigate to="/app" /> : <StaffPortal />} />

      {/* Protected App Routes */}
      <Route path="/app" element={<ProtectedApp />} />

      {/* Invitation Join Route */}
      <Route path="/join" element={<JoinPage />} />

      {/* Database Seeder (Remove in Production) */}
      <Route path="/seed" element={<DbSeeder />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
