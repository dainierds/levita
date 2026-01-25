import React, { useState } from 'react';
import { ChurchSettings, ChurchTenant, SubscriptionTier, User, AppNotification, Role } from '../../types';
import Sidebar from '../Sidebar';
import Dashboard from '../Dashboard';
import ServicePlanner from '../ServicePlanner';
import EventsAdmin from '../EventsAdmin';
import UserManagement from '../UserManagement';
import ChurchConfig from '../ChurchConfig';
import RosterView from '../RosterView';
import NotificationAdmin from '../NotificationAdmin';
import TeamRoster from '../TeamRoster';
import SermonManager from '../SermonManager';
import StatisticsPanel from '../StatisticsPanel';
import ElderDashboard from '../ElderDashboard';
import ElderCalendarView from '../ElderCalendarView';
import ElderRosterView from '../ElderRosterView';
import ElderNotifications from '../ElderNotifications';
import ResourcesView from '../ResourcesView';
import ElderHeader from '../ElderHeader';
import ElderBottomNav from '../ElderBottomNav';
import PersonalStatistics from '../PersonalStatistics';
import PrayerRequestsAdmin from '../PrayerRequestsAdmin';
import MusicDepartment from '../MusicDepartment';
import VotingManager from '../board/VotingManager'; // New import
import BoardVoter from '../board/BoardVoter'; // New import
import { NotificationBell } from '../NotificationSystem';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, Loader2, LayoutGrid } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { usePlans } from '../../hooks/usePlans';
import { useUsers } from '../../hooks/useUsers'; // Import hook
import { updateTenantSettings } from '../../services/tenantService';
import MultiRoleSelection from '../MultiRoleSelection';
import PWAInstallButton from '../PWAInstallButton';


interface AdminAppProps {
    user: User;
    // users prop removed, fetched internally
    settings: ChurchSettings;
    tenants: ChurchTenant[];
    notifications: AppNotification[];
    currentTenantTier: SubscriptionTier;
    elderUnreadCount: number;
}

const AdminApp: React.FC<AdminAppProps> = ({ user, settings, notifications, currentTenantTier, elderUnreadCount }) => {
    const { role: originalRole, logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');

    const location = useLocation();

    // Helper to determine restart context
    const getInitialContext = (): Role | null => {
        // 1. Check URL for explicit overrides
        const path = window.location.pathname.toLowerCase();

        if (path.includes('/app/board') && (user.role === 'BOARD' || user.secondaryRoles?.includes('BOARD'))) {
            return 'BOARD';
        }
        if (path.includes('/app/audio') && (user.role === 'AUDIO' || user.secondaryRoles?.includes('AUDIO'))) {
            return 'AUDIO';
        }

        // 2. Check Session Storage
        const sessionContext = sessionStorage.getItem('ministryContext');
        if (sessionContext) {
            let targetRole: Role | null = null;
            // Support both Readable Names and Role IDs
            if (sessionContext === 'Junta de Iglesia' || sessionContext === 'BOARD') targetRole = 'BOARD';
            if (sessionContext === 'Audio' || sessionContext === 'AUDIO') targetRole = 'AUDIO';
            if (sessionContext === 'Anciano' || sessionContext === 'ELDER') targetRole = 'ELDER';
            if (sessionContext === 'Administración' || sessionContext === 'ADMIN') targetRole = 'ADMIN';
            if (sessionContext === 'Líderes' || sessionContext === 'LEADER') targetRole = 'LEADER';
            if (sessionContext === 'MUSIC') targetRole = 'MUSIC';

            const hasRole =
                user.role === targetRole ||
                user.secondaryRoles?.includes(targetRole!) ||
                (targetRole === 'LEADER' && (user.role === 'TEACHER' || user.secondaryRoles?.includes('TEACHER')));

            console.log("🧐 Checking Session Role:", targetRole, "Has Role?", hasRole);

            if (targetRole && hasRole) {
                console.log("✅ Restoring from Session:", targetRole);
                console.groupEnd();
                return targetRole;
            }
        }

        console.log("❌ No context found. Showing Selector.");
        console.groupEnd();
        return null; // Force Selector if no clear context
    };

    const [contextRole, setContextRole] = useState<Role | null>(getInitialContext);
    const [isContextLocked] = useState(() => !!getInitialContext());

    // Sync Context with URL changes (Client-side navigation)
    React.useEffect(() => {
        const path = location.pathname.toLowerCase();
        if (path.includes('/app/board') && (user.role === 'BOARD' || user.secondaryRoles?.includes('BOARD'))) {
            setContextRole('BOARD');
            sessionStorage.setItem('ministryContext', 'BOARD');
        } else if (path.includes('/app/audio') && (user.role === 'AUDIO' || user.secondaryRoles?.includes('AUDIO'))) {
            setContextRole('AUDIO');
            sessionStorage.setItem('ministryContext', 'AUDIO');
        }
    }, [location.pathname, user.role, user.secondaryRoles]);

    const { events, loading: eventsLoading } = useEvents();
    const { plans, loading: plansLoading, savePlan } = usePlans();

    // FETCH USERS INTERNALLY (Only runs if AdminApp is mounted)
    const { users } = useUsers(); // Hook used properly here

    // --- MULTI-ROLE LOGIC ---
    const rawRoles = [originalRole, ...(user.secondaryRoles || [])];
    // Filter relevant roles for switching context
    const availableRoles = Array.from(new Set(rawRoles)).filter(r =>
        ['ADMIN', 'ELDER', 'BOARD', 'LEADER', 'MUSIC', 'AUDIO', 'TEACHER'].includes(r)
    ) as Role[];

    // Determine active role context
    const role = contextRole || originalRole;

    const showRoleSelector = availableRoles.length > 1 && !contextRole;

    // Determine derived permissions
    const hasBoardAccess = role === 'BOARD' || user.secondaryRoles?.includes('BOARD');



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

    if (showRoleSelector) {
        return (
            <MultiRoleSelection
                roles={availableRoles}
                userName={user.name}
                onSelect={(selected) => {
                    // Map functional roles to System Roles if needed for Context
                    const target = selected === 'TEACHER' ? 'LEADER' : selected;
                    setContextRole(target);
                    sessionStorage.setItem('ministryContext', target); // PERSIST SELECTION
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background flex text-slate-800 font-sans selection:bg-indigo-100">
            {role !== 'ELDER' && role !== 'BOARD' && (
                <Sidebar
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    role={role}
                    tier={currentTenantTier}
                    user={user}
                />
            )}

            <main className={`flex-1 relative ${(role !== 'ELDER' && role !== 'BOARD') ? 'md:ml-64' : 'bg-slate-50 min-h-screen'}`}>
                {/* Mobile Header - Matches Backup */}
                <div className="md:hidden p-4 flex justify-between items-center bg-white shadow-sm sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-xl">LEVITA</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasBoardAccess && (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-xs font-bold active:scale-95 transition-transform"
                            >
                                <LogOut size={14} />
                                <span>Salir</span>
                            </button>
                        )}
                        <PWAInstallButton variant="icon" className="bg-slate-50 text-slate-600" />
                        <NotificationBell />
                    </div>
                </div>

                {/* Desktop Top Bar - Hide for Elder Only (Board needs minimal version) */}
                {(role !== 'ELDER' || hasBoardAccess) && (
                    <div className="hidden md:flex absolute top-6 right-8 z-50 items-center gap-4">

                        {/* LIVE TOGGLE */}
                        {role !== 'BOARD' && (
                            <>
                                <button
                                    onClick={async () => {
                                        if (user?.tenantId) {
                                            try {
                                                await updateTenantSettings(user.tenantId, { ...settings, isLive: !settings?.isLive });
                                            } catch (err) {
                                                console.error("Error toggling live:", err);
                                            }
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm border ${settings?.isLive
                                        ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-red-500/50'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${settings?.isLive ? 'bg-white' : 'bg-slate-300'}`} />
                                    {settings?.isLive ? 'EN VIVO' : 'OFFLINE'}
                                </button>

                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Iglesia:</span>
                                    <span className="text-sm font-bold text-indigo-600">{settings?.churchName || 'Mi Iglesia'}</span>
                                </div>
                            </>
                        )}

                        {/* Removed 'Cambiar Dpto' button as per user request */}

                        <div className="text-xs font-bold text-red-400 hover:text-red-600 cursor-pointer" onClick={logout}>
                            Salir
                        </div>

                        <PWAInstallButton variant="icon" className="bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm" />
                        <NotificationBell />
                    </div>
                )}

                {/* LOADING STATE */}
                {(eventsLoading || plansLoading) && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-premium flex items-center gap-3 z-50 animate-fade-in">
                        <Loader2 className="animate-spin text-indigo-500" size={20} />
                        <span className="text-sm font-bold text-slate-600">Sincronizando...</span>
                    </div>
                )}

                {/* Elder Header - Show Always for Elder (unless in Board Mode) */}
                {role === 'ELDER' && !hasBoardAccess && (
                    <div className="w-full">
                        <ElderHeader user={user} onMenuClick={() => setCurrentView('dashboard')} isMenuOpen={currentView === 'dashboard'} />
                    </div>
                )}

                <div className="max-w-7xl mx-auto w-full">
                    {currentView === 'dashboard' && (role === 'ADMIN' || role === 'LEADER') && (
                        <Dashboard setCurrentView={setCurrentView} role={role} settings={settings} users={users} />
                    )}

                    {currentView === 'dashboard' && hasBoardAccess && user.tenantId && (
                        <BoardVoter user={user} tenantId={user.tenantId} />
                    )}

                    {currentView === 'dashboard' && role === 'ELDER' && !hasBoardAccess && (
                        <ElderDashboard setCurrentView={setCurrentView} user={user} settings={settings} notificationCount={elderUnreadCount} />
                    )}

                    {currentView === 'planner' && (
                        <ServicePlanner tier={currentTenantTier} users={users} role={role} />
                    )}

                    {currentView === 'events' && (role === 'ADMIN' || role === 'LEADER') && (
                        <EventsAdmin events={events} tier={currentTenantTier} role={role} />
                    )}

                    {currentView === 'events' && role === 'ELDER' && (
                        <ElderCalendarView />
                    )}

                    {currentView === 'users' && (role === 'ADMIN') && (
                        <UserManagement users={users} setUsers={() => { }} tier={currentTenantTier} currentUser={user} settings={settings} />
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

                    {currentView === 'resources' && role === 'ELDER' && (
                        <div className="md:max-w-md md:mx-auto md:my-8 bg-slate-50 min-h-screen md:min-h-[800px] md:rounded-[2.5rem] md:border md:border-slate-200 md:shadow-2xl overflow-hidden">
                            <ResourcesView />
                        </div>
                    )}

                    {currentView === 'prayers' && role === 'ADMIN' && (
                        <PrayerRequestsAdmin />
                    )}

                    {currentView === 'statistics' && (role === 'ADMIN') && (
                        <div className="p-8 max-w-full mx-auto">
                            <StatisticsPanel plans={plans} />
                        </div>
                    )}

                    {currentView === 'statistics' && (role === 'ELDER') && (
                        <PersonalStatistics plans={plans} user={user} />
                    )}

                    {currentView === 'resources' && (role === 'ELDER') && (
                        <ResourcesView />
                    )}

                    {currentView === 'team' && (
                        <TeamRoster
                            users={users}
                            settings={settings}
                            plans={plans}
                            savePlan={savePlan}
                            onSaveSettings={handleSaveSettings}
                            role={role}
                        />
                    )}

                    {currentView === 'music_dept' && (
                        <MusicDepartment users={users} tier={currentTenantTier} role={role} />
                    )}

                    {currentView === 'sermons' && (
                        <SermonManager />
                    )}

                    {currentView === 'voting_admin' && role === 'ADMIN' && user.tenantId && (
                        <VotingManager
                            users={users.filter(u => u.role === 'BOARD' || u.secondaryRoles?.includes('BOARD'))}
                            tenantId={user.tenantId}
                        />
                    )}
                </div>

            </main>

            {role === 'ELDER' && !hasBoardAccess && (
                <ElderBottomNav currentView={currentView} setCurrentView={setCurrentView} notificationCount={elderUnreadCount} />
            )}
        </div>
    );
};

export default AdminApp;
