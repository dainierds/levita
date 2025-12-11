import React, { useState, useEffect } from 'react';
import { db } from './services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ChurchSettings, ChurchTenant, SubscriptionTier, AppNotification } from './types';
import { Shield } from 'lucide-react';
import { NotificationProvider } from './components/NotificationSystem';
import { AuthProvider, useAuth } from './context/AuthContext';
// import { useUsers } from './hooks/useUsers'; // Removed
import { useTenantSettings } from './hooks/useTenantSettings';
import { LanguageProvider } from './context/LanguageContext';
import AudioDashboard from './components/AudioDashboard';
import DbSeeder from './components/DbSeeder';
import JoinPage from './pages/JoinPage';

// Components acting as Pages
import VisitorLanding from './pages/VisitorLanding';
import StaffPortal from './pages/StaffPortal';

// ELDER APP IMPORTS
import AncianoLayout from './components/layouts/AncianoLayout';
import InicioAnciano from './pages/anciano/InicioAnciano';
import ItinerarioAnciano from './pages/anciano/ItinerarioAnciano';
import OrdenCultoAnciano from './pages/anciano/OrdenCultoAnciano';
import MiTurnoAnciano from './pages/anciano/MiTurnoAnciano';
import EstadisticasAnciano from './pages/anciano/EstadisticasAnciano';
import RecursosAnciano from './pages/anciano/RecursosAnciano';
import NotificacionesAnciano from './pages/anciano/NotificacionesAnciano';
import ConfiguracionAnciano from './pages/anciano/ConfiguracionAnciano';

// MEMBER APP IMPORTS
import MiembroLayout from './components/layouts/MiembroLayout';
import InicioMiembro from './pages/miembro/InicioMiembro';
import EnVivoMiembro from './pages/miembro/EnVivoMiembro';
import LiturgiaMiembro from './pages/miembro/LiturgiaMiembro';
import OracionMiembro from './pages/miembro/OracionMiembro';
import EventosMiembro from './pages/miembro/EventosMiembro';
import PerfilMiembro from './pages/miembro/PerfilMiembro';

import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminApp from './components/roles/AdminApp';
import MusicMinistryApp from './components/MusicMinistryApp'; // New App
import { MOCK_TENANTS } from './constants';
import { Loader2 } from 'lucide-react';

const ProtectedApp: React.FC = () => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings } = useTenantSettings();

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


  // ELDER ROUTER
  if (role === 'ELDER') {
    return (
      <Routes>
        <Route element={<AncianoLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<InicioAnciano />} />
          <Route path="itinerario" element={<ItinerarioAnciano />} />
          <Route path="orden-culto" element={<OrdenCultoAnciano />} />
          <Route path="mi-turno" element={<MiTurnoAnciano />} />
          <Route path="estadisticas" element={<EstadisticasAnciano />} />
          <Route path="recursos" element={<RecursosAnciano />} />
          <Route path="notificaciones" element={<NotificacionesAnciano />} />
          <Route path="configuracion" element={<ConfiguracionAnciano />} />
        </Route>
        <Route path="*" element={<Navigate to="/anciano/inicio" replace />} />
      </Routes>
    );
  }

  // --- ADMIN & OTHER VIEWS (Single Page App) ---
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 0. MUSIC TEAM REDIRECTION
  if (role === 'MUSIC') {
    // Redirect to the standalone Music App route
    // We render Navigate component to redirect
    // BUT we need to make sure MusicMinistryApp handles auth user
    return <MusicMinistryApp />;
  }

  // 0.5 NO INTERFACE ROLES
  if (role === 'PREACHER') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
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
          className="btn-primary"
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

  // 2. MEMBER View (Router)
  if (role === 'MEMBER') {
    return (
      <NotificationProvider allNotifications={notifications} setAllNotifications={setNotifications} currentUserId={user?.id}>
        <Routes>
          <Route element={<MiembroLayout />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<InicioMiembro />} />
            <Route path="en-vivo" element={<EnVivoMiembro />} />
            <Route path="liturgia" element={<LiturgiaMiembro />} />
            <Route path="oracion" element={<OracionMiembro />} />
            <Route path="eventos" element={<EventosMiembro />} />
            <Route path="perfil" element={<PerfilMiembro />} />
          </Route>
          <Route path="*" element={<Navigate to="/miembro/inicio" replace />} />
        </Routes>
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
      <AdminApp
        user={user}
        // users removed
        settings={settings}
        tenants={tenants}
        notifications={notifications}
        currentTenantTier={currentTenantTier}
        elderUnreadCount={elderUnreadCount}
      />
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
      <Route path="/musica" element={<MusicMinistryApp />} />

      {/* Staff Portal Login */}
      <Route path="/portal" element={user ? <Navigate to="/app" /> : <StaffPortal />} />

      {/* Protected App Routes */}
      <Route path="/app/*" element={<ProtectedApp />} />
      <Route path="/anciano/*" element={<ProtectedApp />} />
      <Route path="/miembro/*" element={<ProtectedApp />} />

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
