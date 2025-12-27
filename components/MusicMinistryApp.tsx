import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChurchTenant, MusicTeam, ShiftTeam, ChurchEvent } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { Music, Calendar, Mic2, User, Home, Users, Clock, MapPin, LogOut } from 'lucide-react';
import { MOCK_TENANTS } from '../constants';

// Helper to get tenant
const useTenant = () => {
    const [tenant, setTenant] = useState<ChurchTenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const q = query(collection(db, 'tenants'));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const bestMatch = querySnapshot.docs.find(d => d.data().settings?.churchName) || querySnapshot.docs[0];
                    setTenant({ id: bestMatch.id, ...bestMatch.data() } as ChurchTenant);
                } else {
                    setTenant(MOCK_TENANTS[0]);
                }
            } catch (error) {
                console.error("Error fetching tenant:", error);
                setTenant(MOCK_TENANTS[0]);
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();
    }, []);

    return { tenant, loading };
};

// Helper: Format Date
const formatDate = (dateStr: string) => {
    if (!dateStr) return { day: '?', month: '?', weekday: '?', full: 'Fecha inválida' };
    const date = new Date(dateStr + 'T12:00:00'); // Midday to avoid timezone issues
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const full = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    return { day, month, weekday, full };
};

const MusicMinistryApp: React.FC = () => {
    const { user } = useAuth();
    const { tenant: defaultTenant, loading: tenantLoading } = useTenant();
    const navigate = useNavigate();

    const tenant = user?.tenantId ? { id: user.tenantId, name: user.tenantName || 'Mi Iglesia', settings: user.settings || {} } as any : defaultTenant;

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'home' | 'roster' | 'calendar'>('home');

    // Data State
    const [upcomingTeams, setUpcomingTeams] = useState<MusicTeam[]>([]);
    const [calendarTeams, setCalendarTeams] = useState<MusicTeam[]>([]); // For Itinerary
    const [upcomingShifts, setUpcomingShifts] = useState<ShiftTeam[]>([]); // For Roster
    const [allMusicUsers, setAllMusicUsers] = useState<any[]>([]);
    const [events, setEvents] = useState<ChurchEvent[]>([]);

    // Login State
    const [pin, setPin] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [debugEventsCount, setDebugEventsCount] = useState(0);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        if (user) {
            setIsAuthenticated(true);
        }
    }, [user]);

    // Data Fetching
    useEffect(() => {
        if (isAuthenticated && tenant) {

            // 1. Fetch Music Teams (Home & Calendar)
            const musicQ = query(
                collection(db, 'tenants', tenant.id, 'music_teams'),
                orderBy('date', 'asc')
            );
            // ... existing lines ...
            // 4. Fetch Events (Banners) - Global Collection Query
            const eventsQ = query(
                collection(db, 'events'),
                where('tenantId', '==', tenant.id)
            );
            const unsubscribeEvents = onSnapshot(eventsQ, (snapshot) => {
                const allEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChurchEvent));
                setDebugEventsCount(allEvents.length);

                const evs = allEvents.filter(e => {
                    // Loose check: true, "true", or just exists if specific logic needed
                    return Boolean(e.activeInBanner);
                });
                setEvents(evs);
            });

            const unsubscribeMusic = onSnapshot(musicQ, (snapshot) => {
                const allTeams = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MusicTeam));
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const futureTeams = allTeams
                    .filter(t => new Date(t.date + 'T00:00:00') >= today)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // Home Tab: Next 2 Teams
                setUpcomingTeams(futureTeams.slice(0, 2));

                // Calendar Tab: Next 4 Saturdays & 4 Tuesdays (approx 8-10 items logic)
                const rollingCalendar = futureTeams.filter(t => {
                    const d = new Date(t.date + 'T12:00:00');
                    const day = d.getDay();
                    return day === 2 || day === 6;
                }).slice(0, 8);

                setCalendarTeams(rollingCalendar);
            });


            // 2. Fetch Users (Real-time)
            const usersQ = query(collection(db, 'users'), where('tenantId', '==', tenant.id));
            const unsubscribeUsers = onSnapshot(usersQ, (snap) => {
                setAllMusicUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            // 3. Fetch Service Plans (Roster) - Real-time
            const plansQ = query(
                collection(db, 'servicePlans'),
                where('tenantId', '==', tenant.id)
            );

            const unsubscribePlans = onSnapshot(plansQ, (snapshot) => {
                const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)); // Type as any temporarily to map to view
                const todayStr = new Date().toLocaleDateString('en-CA');

                // Strict Filtering: Only show plans that match configured meeting days
                const allowedDays = (tenant?.settings?.meetingDays || ['Domingo']).map((d: string) => d.toLowerCase());

                const validPlans = upcoming.filter((p: any) => {
                    const pDate = new Date(p.date + 'T12:00:00');
                    const pDayName = pDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
                    return allowedDays.some((allowed: string) => pDayName.includes(allowed.split('á').join('a').substring(0, 3)));
                });

                // Fallback or use valid
                const displayPlans = validPlans.length > 0 ? validPlans : upcoming;

                // Map ServicePlan to structure expected by view (or update view)
                // View expects: date, members: { preacher, elder, musicDirector }
                // ServicePlan has: date, team: { preacher, elder, musicDirector }
                const mappedShifts = displayPlans.map((p: any) => ({
                    id: p.id,
                    date: p.date,
                    members: p.team
                }));

                setUpcomingShifts(mappedShifts);
            });


            return () => {
                unsubscribeMusic();
                // unsubscribeTenant(); // Tenant listener removed if only used for teams
                unsubscribeEvents();
                unsubscribeUsers();
                unsubscribePlans();
            };
        }
    }, [isAuthenticated, tenant?.id]);

    // Unified Banners (Derived State)
    const combinedBanners = [
        // 1. Welcome Card (Always First)
        {
            type: 'WELCOME',
            id: 'welcome-card',
            bannerGradient: 'from-indigo-600 via-purple-600 to-pink-500'
        },
        // 2. Events (Mapped)
        ...events.map(e => ({
            type: 'EVENT',
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time || 'N/A',
            bannerGradient: 'from-blue-600 via-cyan-600 to-teal-500' // Different gradient for events
        }))
    ];

    const getGroupLabel = (count: number, service: number) => {
        let type = '';
        if (count === 1) type = 'Solista';
        else if (count === 2) type = 'Dúo';
        else if (count === 3) type = 'Trío';
        else if (count === 4) type = 'Cuarteto';
        else type = 'Grupo';

        return `${type} ${service}er Servicio`;
    };

    const resolveName = (id: string) => {
        const u = allMusicUsers.find(u => u.id === id);
        return u ? u.name : 'Pendiente';
    };

    const resolveNames = (ids: string[]) => {
        if (!ids) return [];
        return ids.map(id => resolveName(id));
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Check verify specifically music pin, then member pin, then default
        const validPin = tenant?.settings?.musicMinistryPin || tenant?.settings?.memberPin || '1234';

        if (pin === validPin) {
            setIsAuthenticated(true);
        } else {
            setError('PIN incorrecto');
        }
    };

    if (tenantLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-xl text-center relative">
                    <button
                        onClick={() => navigate('/')}
                        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                        title="Volver"
                    >
                        <LogOut className="rotate-180" size={20} />
                    </button>

                    <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200">
                        <Music className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">Ministerio de Alabanza</h1>
                    <p className="text-slate-500 mb-8">Acceso exclusivo para miembros del equipo.</p>

                    {!user ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Tu Nombre (Opcional)"
                                value={userName}
                                onChange={e => setUserName(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-2xl p-4 text-center font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-pink-500"
                            />
                            <div>
                                <input
                                    type="password"
                                    placeholder="PIN de Acceso"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    className="w-full bg-slate-100 border-none rounded-2xl p-4 text-center font-bold text-slate-800 placeholder:text-slate-400 text-2xl tracking-widest focus:ring-2 focus:ring-pink-500 mb-2"
                                    maxLength={4}
                                />
                                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-slate-200">
                                Entrar
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in zoom-in">
                            <p className="text-green-500 font-bold mb-4">¡Hola {user.name}!</p>
                            <button onClick={() => navigate('/miembro/inicio')} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl mb-2">
                                Ir a mi Panel
                            </button>
                            <button onClick={() => setIsAuthenticated(true)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl">
                                Entrar al Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">
                            {activeTab === 'home' && 'Inicio'}
                            {activeTab === 'roster' && 'Turnos de Servicio'}
                            {activeTab === 'calendar' && 'Itinerario Mensual'}
                        </h1>
                        <p className="text-xs font-bold text-pink-500 tracking-widest uppercase">
                            {tenant?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {user?.name?.charAt(0) || userName.charAt(0) || 'U'}
                        </div>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-8">

                {/* --- TAB 1: HOME --- */}
                {activeTab === 'home' && (
                    <>
                        {/* Unified Banner Carousel */}
                        <div className="relative overflow-hidden rounded-[2.5rem] shadow-xl shadow-indigo-200 mb-8 min-h-[220px] transition-all duration-500">
                            {/* Dynamic Background */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${combinedBanners[currentBannerIndex]?.bannerGradient || 'from-indigo-600 via-purple-600 to-pink-500'} transition-all duration-1000`} />

                            {/* Content */}
                            <div className="relative z-10 h-full flex flex-col justify-center p-8 min-h-[220px]">
                                {combinedBanners[currentBannerIndex]?.type === 'WELCOME' ? (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-3 mb-2 opacity-80">
                                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><Music size={16} className="text-white" /></div>
                                            <span className="text-xs font-bold tracking-widest uppercase text-white">Bienvenida</span>
                                        </div>
                                        <h2 className="text-3xl font-black mb-2 text-white">Hola, {user?.name?.split(' ')[0] || userName || 'Adorador'}</h2>
                                        <p className="opacity-90 font-medium text-indigo-50">Aquí están los próximos servicios y eventos.</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white">
                                                {(combinedBanners[currentBannerIndex] as any).type === 'EVENT' ? 'Evento' : 'Noticia'}
                                            </span>
                                            {/* Date Badge */}
                                            <div className="flex items-center gap-1 text-xs font-bold text-white/90 bg-black/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                                                <Calendar size={12} />
                                                {typeof (combinedBanners[currentBannerIndex] as any).date === 'string' ? (combinedBanners[currentBannerIndex] as any).date : 'Fecha Pendiente'}
                                            </div>
                                        </div>
                                        <h3 className="font-black text-2xl leading-tight mb-2 text-white">{(combinedBanners[currentBannerIndex] as any).title}</h3>
                                        <p className="text-sm opacity-90 font-medium flex items-center gap-2 text-indigo-50">
                                            <Clock size={14} /> {(combinedBanners[currentBannerIndex] as any).time}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Decorative */}
                            <Music className="absolute -bottom-6 -right-6 w-40 h-40 opacity-10 rotate-12 text-white" />

                            {/* Indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                                {combinedBanners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentBannerIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'bg-white w-6' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Debug Info (Keep checking events) */}
                        {events.length === 0 && debugEventsCount > 0 && (
                            <div className="mb-8 px-4">
                                <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-xs font-medium">
                                    <p className="font-bold mb-1">🕵️ Chismoso (Debug):</p>
                                    <p>No se ven banners.</p>
                                    <p>Tenant ID: {tenant?.id}</p>
                                    <p>Colección DB: events (global)</p>
                                    <p>Eventos encontrados en DB: {debugEventsCount}</p>
                                    <p>Filtrados (activeInBanner=true): {events.length}</p>
                                    <p className="opacity-70 mt-1">Revisa que 'activeInBanner' sea true en Firestore.</p>
                                </div>
                            </div>
                        )}


                        {/* Next 2 Teams */}
                        <section>
                            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-pink-500" />
                                Próximos Servicios
                            </h3>

                            <div className="space-y-6">
                                {upcomingTeams.length > 0 ? upcomingTeams.map(team => {
                                    const dateInfo = formatDate(team.date);
                                    const teamMembers = allMusicUsers.filter(u => team.memberIds.includes(u.id));
                                    const s1Names = resolveNames(team.soloist1);
                                    const s2Names = resolveNames(team.soloist2);

                                    return (
                                        <div key={team.id} className="bg-white rounded-[2rem] p-6 shadow-lg shadow-pink-50 border border-pink-50/50">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                                                <div className="bg-pink-50 text-pink-500 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                                                    <span className="text-xs font-bold uppercase">{dateInfo.month}</span>
                                                    <span className="text-2xl font-black">{dateInfo.day}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 capitalize leading-none mb-1">
                                                        {dateInfo.weekday}
                                                    </h4>
                                                    <p className="text-slate-400 text-xs font-medium">Servicio General</p>
                                                </div>
                                            </div>

                                            {/* Note */}
                                            {team.note && (
                                                <div className="mb-6 bg-amber-50 text-amber-800 text-xs font-medium p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                                                    <span>💡</span>
                                                    <span>{team.note}</span>
                                                </div>
                                            )}

                                            {/* Soloists */}
                                            {(s1Names.length > 0 || s2Names.length > 0) && (
                                                <div className="mb-6 grid grid-cols-1 gap-3">
                                                    {s1Names.length > 0 && (
                                                        <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                                                                <Mic2 size={14} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{getGroupLabel(s1Names.length, 1)}</p>
                                                                <p className="font-bold text-indigo-900 text-sm truncate">{s1Names.join(', ')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {s2Names.length > 0 && (
                                                        <div className="bg-purple-50 p-3 rounded-xl flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                                                                <Mic2 size={14} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">{getGroupLabel(s2Names.length, 2)}</p>
                                                                <p className="font-bold text-purple-900 text-sm truncate">{s2Names.join(', ')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Team Members */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {teamMembers.map((member, idx) => (
                                                    <div key={member.id || idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                                            {member.name ? member.name.charAt(0) : '?'}
                                                        </div>
                                                        <p className="font-bold text-xs text-slate-700 truncate">{member.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium">No hay servicios próximos asignados</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* --- TAB 2: ROSTER --- */}
                {activeTab === 'roster' && (
                    <div className="space-y-6">
                        {upcomingShifts.map((shift, idx) => {
                            const dateInfo = formatDate(shift.date || '');
                            const isNext = idx === 0;
                            // Match colors with Home Tab / Elder App
                            const themeBg = isNext ? 'bg-[#3b82f6] shadow-blue-200' : 'bg-[#6366f1] shadow-indigo-200';
                            const label = `Equipo del ${dateInfo.weekday}`;

                            return (
                                <div key={shift.id} className={`${themeBg} rounded-[2rem] p-6 shadow-lg border border-white relative overflow-hidden text-white`}>
                                    {/* Badge */}
                                    <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-wider bg-black/20 text-white backdrop-blur-sm">
                                        {label}
                                    </div>

                                    {/* Date & Title */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm bg-white/20 text-white backdrop-blur-md">
                                            <span className="text-[10px] font-bold uppercase">{dateInfo.month}</span>
                                            <span className="text-xl font-black">{dateInfo.day}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold leading-tight drop-shadow-sm capitalize">
                                                {dateInfo.weekday} {dateInfo.full.split('de')[0]}
                                            </h2>
                                            <div className="flex items-center gap-2 text-white/80 text-xs font-bold mt-1">
                                                <Clock size={12} /> 10:00 AM
                                                <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                                <MapPin size={12} /> {tenant?.name || 'Iglesia'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Team Grid */}
                                    <div className="bg-white/10 rounded-2xl p-4 gap-4 grid grid-cols-2 backdrop-blur-sm">
                                        {(() => {
                                            const members = shift.members || {};
                                            const roleMap = [
                                                { key: 'elder', label: 'Anciano', icon: User, color: 'text-purple-500' },
                                                { key: 'preacher', label: 'Predicador', icon: Mic2, color: 'text-indigo-500' },
                                                { key: 'esMaster', label: 'Maestro de ES', icon: Users, color: 'text-green-500' },
                                                { key: 'audioOperator', label: 'Audio', icon: Mic, color: 'text-orange-500' },
                                            ];

                                            return roleMap.map(role => {
                                                // IMPORTANT: servicePlans store NAMES directly, not IDs. Do not use resolveName.
                                                const name = (members as any)[role.key];
                                                return (
                                                    <div key={role.key} className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${role.color}`}>
                                                            <role.icon size={14} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider ">{role.label}</p>
                                                            <p className="font-bold text-white text-xs truncate drop-shadow-sm">{name || '---'}</p>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                        {upcomingShifts.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No hay turnos próximos. Asegúrate de configurar los turnos en el Panel de Administración → Miembros → Turnos.</p>
                            </div>
                        )}
                    </div>
                )}


                {/* --- TAB 3: CALENDAR (ITINERARY) --- */}
                {activeTab === 'calendar' && (
                    <div className="space-y-4">
                        {calendarTeams.map((team) => {
                            const dateInfo = formatDate(team.date);
                            const teamMembers = allMusicUsers.filter(u => team.memberIds.includes(u.id));

                            return (
                                <div key={team.id} className="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${new Date(team.date).getDay() === 2 ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'
                                            }`}>
                                            <span className="text-[10px] font-bold uppercase">{dateInfo.month}</span>
                                            <span className="text-xl font-black">{dateInfo.day}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 capitalize truncate text-lg">{dateInfo.weekday}</h4>
                                            <p className="text-xs text-slate-400">{teamMembers.length} integrantes asignados</p>
                                        </div>
                                    </div>




                                    {(resolveNames(team.soloist1).length > 0 || resolveNames(team.soloist2).length > 0) && (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mb-3">
                                            {resolveNames(team.soloist1).length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Mic2 size={12} className="text-indigo-500 shrink-0" />
                                                    <p className="text-xs text-slate-700">
                                                        <span className="font-bold text-indigo-600 uppercase text-[10px] mr-2">
                                                            Primer Servicio: {resolveNames(team.soloist1).length === 1 ? 'Solista' :
                                                                resolveNames(team.soloist1).length === 2 ? 'Dúo' :
                                                                    resolveNames(team.soloist1).length === 3 ? 'Trío' : 'Cuarteto'}
                                                        </span>
                                                        {resolveNames(team.soloist1).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                            {resolveNames(team.soloist2).length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Mic2 size={12} className="text-purple-500 shrink-0" />
                                                    <p className="text-xs text-slate-700">
                                                        <span className="font-bold text-purple-600 uppercase text-[10px] mr-2">
                                                            Segundo Servicio: {resolveNames(team.soloist2).length === 1 ? 'Solista' :
                                                                resolveNames(team.soloist2).length === 2 ? 'Dúo' :
                                                                    resolveNames(team.soloist2).length === 3 ? 'Trío' : 'Cuarteto'}
                                                        </span>
                                                        {resolveNames(team.soloist2).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Member Names List */}
                                    <div className="flex flex-wrap gap-2">
                                        {teamMembers.map((member, idx) => (
                                            <div key={idx} className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{member.name}</span>
                                            </div>
                                        ))}
                                        {teamMembers.length === 0 && <span className="text-xs text-slate-400 italic"> - Sin asignaciones - </span>}
                                    </div>
                                </div>
                            );
                        })}
                        {calendarTeams.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No hay itinerario disponible</p>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 flex items-center justify-around pb-2">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center gap-1 transition-all p-4 ${activeTab === 'home' ? 'text-pink-500 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
                >
                    <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} fill={activeTab === 'home' ? 'currentColor' : 'none'} className={activeTab === 'home' ? 'bg-pink-50 rounded-xl box-content p-2' : ''} />
                    {activeTab !== 'home' && <span className="text-[10px] font-bold">Inicio</span>}
                </button>
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`flex flex-col items-center gap-1 transition-all p-4 ${activeTab === 'roster' ? 'text-purple-500 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
                >
                    <Users size={24} strokeWidth={activeTab === 'roster' ? 2.5 : 2} fill={activeTab === 'roster' ? 'currentColor' : 'none'} className={activeTab === 'roster' ? 'bg-purple-50 rounded-xl box-content p-2' : ''} />
                    {activeTab !== 'roster' && <span className="text-[10px] font-bold">Turnos</span>}
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex flex-col items-center gap-1 transition-all p-4 ${activeTab === 'calendar' ? 'text-indigo-500 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
                >
                    <Calendar size={24} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} fill={activeTab === 'calendar' ? 'currentColor' : 'none'} className={activeTab === 'calendar' ? 'bg-indigo-50 rounded-xl box-content p-2' : ''} />
                    {activeTab !== 'calendar' && <span className="text-[10px] font-bold">Itinerario</span>}
                </button>
            </nav>
        </div>
    );
};

export default MusicMinistryApp;
