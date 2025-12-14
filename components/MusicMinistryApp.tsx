import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChurchTenant, ChurchSettings, ChurchEvent, ServicePlan, MusicTeam } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Lock, Music, Calendar, Radio, Mic2, User, Play, Clock, MapPin, Bell, LogOut, ArrowLeft, List, Link as LinkIcon } from 'lucide-react';
import { MOCK_TENANTS } from '../constants'; // Fallback

// Helper to get tenant (Simplified version of VisitorLanding logic)
const useTenant = () => {
    const [tenant, setTenant] = useState<ChurchTenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // Improved Discovery: Fetch all tenants to find the "active" one
                const q = query(collection(db, 'tenants'));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Prefer one with settings or "active" flag if available
                    // For now, finding the first one that looks "configured" (has settings)
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

const MusicMinistryApp: React.FC = () => {
    const { user } = useAuth(); // Get authenticated user
    const { tenant: defaultTenant, loading: tenantLoading } = useTenant();
    const navigate = useNavigate(); // Hook for navigation

    // If user is logged in, use their tenant. Otherwise use the default/kiosk tenant
    const tenant = user?.tenantId ? { id: user.tenantId, name: user.tenantName || 'Mi Iglesia', settings: user.settings || {} } as any : defaultTenant;

    const [pin, setPin] = useState('');
    const [userName, setUserName] = useState(''); // New State for user name
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');

    // Auto-login if authenticated user
    useEffect(() => {
        if (user) {
            setIsAuthenticated(true);
        }
    }, [user]);

    // ... Data State ...
    const [events, setEvents] = useState<ChurchEvent[]>([]);
    const [upcomingPlans, setUpcomingPlans] = useState<ServicePlan[]>([]);
    const [musicTeam, setMusicTeam] = useState<MusicTeam | null>(null);
    const [musicMembers, setMusicMembers] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Trigger data fetch when authenticated
    useEffect(() => {
        if (isAuthenticated && tenant) {
            fetchDashboardData();

            // Real-time Service Plan Listener
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const q = query(
                collection(db, 'servicePlans'),
                where('tenantId', '==', tenant.id),
                orderBy('date', 'asc') // Order by date to easily find upcoming
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const plans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));

                // Filter for future or active plans
                const futurePlans = plans
                    .filter(p => p.isActive || new Date(p.date + 'T00:00:00') >= today)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 2); // Take top 2

                setUpcomingPlans(futurePlans);
            });

            return () => unsubscribe();
        }
    }, [isAuthenticated, tenant?.id]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!tenant) return;
        if (!userName.trim()) {
            setError('Por favor ingresa tu nombre.');
            return;
        }

        const settings = tenant?.settings;
        const validPin = settings?.musicMinistryPin;

        if (!validPin) {
            if (pin === '123456') {
                setIsAuthenticated(true);
                if (userName) localStorage.setItem('music_user_name', userName); // Persist name
                return;
            }
            setError('PIN no configurado en esta iglesia.');
            return;
        }

        if (pin === validPin) {
            setIsAuthenticated(true);
            if (userName) localStorage.setItem('music_user_name', userName); // Persist name
        } else {
            setError('PIN Incorrecto');
        }
    };

    // Load persisted name if available
    useEffect(() => {
        const storedName = localStorage.getItem('music_user_name');
        if (storedName) setUserName(storedName);
    }, []);

    const fetchDashboardData = async () => {
        if (!tenant) return;
        setIsLoadingData(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Fetch Upcoming Events (Active in Banner)
            const eventsQ = query(
                collection(db, 'events'), // Root collection
                where('tenantId', '==', tenant.id),
                where('activeInBanner', '==', true),
                orderBy('date', 'asc')
            );
            const eventsSnap = await getDocs(eventsQ);

            const fetchedEvents = eventsSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as ChurchEvent))
                .filter(e => {
                    const eventDate = new Date(e.date + 'T00:00:00');
                    // Filter out past events AND Elders-only events
                    if (e.targetAudience === 'ELDERS_ONLY') return false;
                    return eventDate >= today;
                });
            setEvents(fetchedEvents.slice(0, 5));

            // 2. Fetch Next Service Plan (Handled by Real-time Listener now)
            // We keep this empty or remove it to avoid race conditions/double sets.
            // The useEffect listener above handles setNextPlan.

            // 3. Fetch Nearest Music Team (Independent of Plan)
            // Music Teams ARE stored in subcollections (confirmed working)
            const musicQ = query(
                collection(db, 'tenants', tenant.id, 'music_teams'),
                orderBy('date', 'asc')
            );
            const musicSnap = await getDocs(musicQ);
            const allTeams = musicSnap.docs.map(d => ({ id: d.id, ...d.data() } as MusicTeam));

            // Find the nearest team >= today
            const nearestTeam = allTeams
                .filter(t => {
                    const teamDate = new Date(t.date + 'T00:00:00');
                    return teamDate >= today;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (nearestTeam) {
                setMusicTeam(nearestTeam);

                // Fetch Member Details
                if (nearestTeam.memberIds?.length > 0) {
                    try {
                        const usersQ = query(
                            collection(db, 'users'),
                            where('tenantId', '==', tenant.id)
                        );
                        const usersSnap = await getDocs(usersQ);
                        const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        const teamMembers = allUsers.filter(u => nearestTeam.memberIds.includes(u.id));
                        setMusicMembers(teamMembers);
                    } catch (userErr) {
                        console.error("MusicApp: Error fetching users:", userErr);
                    }
                } else {
                    setMusicMembers([]);
                }
            } else {
                setMusicTeam(null);
                setMusicMembers([]);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingData(false);
        }
    };

    // --- LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold"
                >
                    <ArrowLeft size={20} />
                    <span>Volver al Inicio</span>
                </button>

                <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-indigo-500" />
                    <div className="text-center mb-8 mt-4">
                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                            <Music size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">Ministerio de Alabanza</h1>
                        <p className="text-slate-400 text-sm mt-2">{tenant?.name || 'Cargando...'}</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tu Nombre</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={e => setUserName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 outline-none focus:border-pink-500 transition-all font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">PIN de Acceso</label>
                            <div className="flex justify-center">
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    maxLength={6}
                                    placeholder="••••••"
                                    className="w-48 text-center text-3xl font-black tracking-[0.5em] py-3 border-b-2 border-slate-200 outline-none focus:border-pink-500 text-slate-800 placeholder:text-slate-200 transition-colors"
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold text-center mt-4 bg-red-50 py-2 rounded-lg">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2"
                        >
                            <Lock size={18} /> Entrar
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- DASHBOARD SCREEN ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            {/* Header */}
            <header className="bg-white p-6 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/80">
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Hola, {userName || 'Equipo'} 👋</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{tenant.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell (Left) */}
                        <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            <Bell size={20} />
                        </button>

                        {/* Logout Button (Right) */}
                        <button
                            onClick={() => {
                                setIsAuthenticated(false);
                                localStorage.removeItem('music_user_name');
                                navigate('/'); // Redirect to Home / Language Selection
                            }}
                            className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-8">

                {/* 1. UPCOMING EVENTS CAROUSEL (Auto-Playing) */}
                <EventCarousel events={events} />

                {/* 2. MUSIC MINISTRY TEAM */}
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Mic2 className="text-pink-500" size={20} />
                        <h3 className="font-bold text-lg">Equipo de Alabanza</h3>
                    </div>

                    {musicTeam ? (
                        <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-pink-100 border border-pink-50">
                            {musicTeam.note && (
                                <div className="mb-6 bg-yellow-50 text-yellow-800 text-xs font-medium p-3 rounded-xl border border-yellow-100 flex items-start gap-2">
                                    <span className="text-lg">💡</span>
                                    <span className="mt-0.5">{musicTeam.note}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {musicMembers.map((member, idx) => (
                                    <div key={member.id || idx} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                                            {member.name ? member.name.charAt(0) : '?'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm text-slate-700 truncate">{member.name}</p>
                                            <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">Vocal / Músico</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] p-8 text-center border border-dashed border-slate-200">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                <Music size={24} />
                            </div>
                            <p className="text-sm text-slate-400 font-medium">No hay equipo asignado para esta fecha aún.</p>
                        </div>
                    )}
                </section>

                {/* 3. NEXT SERVICE INFO & ORDER */}
                {upcomingPlans.length > 0 ? (
                    <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                        {(() => {
                            const nextPlan = upcomingPlans[0];
                            const futurePlan = upcomingPlans[1];

                            // Helper function to render Service Info Card
                            const renderServiceInfoCard = (plan: typeof nextPlan, label: string, isNext: boolean) => (
                                <div key={plan.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                                    {/* Badge */}
                                    <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-wider ${isNext ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {label}
                                    </div>

                                    {/* Date & Title */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm ${isNext ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                                            <span className="text-[10px] font-bold uppercase">{new Date(plan.date).toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                            <span className="text-xl font-black">{new Date(plan.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 leading-tight">{plan.title || 'Culto General'}</h2>
                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
                                                <Clock size={12} /> {plan.time || '10:00 AM'}
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <MapPin size={12} /> {tenant.name}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Service Team Grid */}
                                    <div className="bg-slate-50 rounded-2xl p-4 gap-4 grid grid-cols-2">
                                        {(() => {
                                            const planTeam = plan.team || {};
                                            const rosterTeams = (tenant?.settings?.teams || []) as any[];
                                            const matchingRoster = rosterTeams.find(t => t.date === plan.date);
                                            const rosterMembers = matchingRoster?.members || {};

                                            const roleMap = [
                                                { key: 'preacher', rosterKey: 'preacher', label: 'Predicador', icon: User, color: 'text-indigo-500' },
                                                { key: 'musicDirector', rosterKey: 'musicDirector', label: 'Dir. Música', icon: Music, color: 'text-pink-500' },
                                                { key: 'elder', rosterKey: 'elder', label: 'Anciano', icon: User, color: 'text-purple-500' },
                                                { key: 'audioOperator', rosterKey: 'audioOperator', label: 'Audio', icon: Mic2, color: 'text-orange-500' },
                                                { key: 'videoOperator', rosterKey: 'videoOperator', label: 'Video', icon: Play, color: 'text-blue-500' },
                                                { key: 'usher', rosterKey: 'usher', label: 'Ujier', icon: User, color: 'text-teal-500' },
                                            ];

                                            return roleMap.map(roleConfig => {
                                                const name = planTeam[roleConfig.key] || rosterMembers[roleConfig.rosterKey];
                                                if (!name) return null;

                                                return (
                                                    <div key={roleConfig.key} className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${roleConfig.color}`}>
                                                            <roleConfig.icon size={14} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ">{roleConfig.label}</p>
                                                            <p className="font-bold text-slate-700 text-xs truncate">{name}</p>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    {/* 1. Next Service Info */}
                                    {renderServiceInfoCard(nextPlan, 'Siguiente Culto', true)}

                                    {/* 2. Future Event Info (Requested to be here) */}
                                    {futurePlan && renderServiceInfoCard(futurePlan, 'Futuro Evento', false)}

                                    {/* 3. Order of Service (For Next Plan) */}
                                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                <List size={20} className="text-indigo-500" />
                                                Orden del Culto
                                            </h3>
                                            {nextPlan.isActive && (
                                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-pulse">
                                                    En Vivo
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {nextPlan.items && nextPlan.items.length > 0 ? (
                                                nextPlan.items.map((item, i) => (
                                                    <div key={item.id} className="flex items-center gap-4 group">
                                                        <div className="text-xs font-bold text-slate-300 w-4 text-center group-hover:text-indigo-400 transition-colors">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 bg-slate-50 rounded-xl p-3 flex items-center justify-between group-hover:bg-slate-100 transition-colors">
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm">{item.title}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.type} • {item.durationMinutes}m</p>
                                                                    {item.key && <span className="text-[10px] font-bold bg-pink-100 text-pink-500 px-1 rounded">{item.key}</span>}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-1">
                                                                {item.youtubeLinks?.map((link, lI) => (
                                                                    <a key={lI} href={link} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-white text-red-400 flex items-center justify-center hover:text-red-600 hover:shadow-sm transition-all border border-slate-100">
                                                                        <Play size={10} />
                                                                    </a>
                                                                ))}
                                                                {item.links?.map((link, lI) => (
                                                                    <a key={lI} href={link.url} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full bg-white text-indigo-400 flex items-center justify-center hover:text-indigo-600 hover:shadow-sm transition-all border border-slate-100">
                                                                        <LinkIcon size={10} />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-slate-400 text-xs py-4 italic">No hay liturgia definida.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </section>
                ) : (
                    <div className="bg-slate-100 rounded-3xl p-8 text-center text-slate-400">
                        <Calendar className="mx-auto mb-2 opacity-50" />
                        No hay cultos programados.
                    </div>
                )}

            </main>
        </div>
    );
};

// --- REUSED MORPHO CAROUSEL COMPONENT (MATCHING MEMBER APP) ---
const EventCarousel: React.FC<{ events: ChurchEvent[] }> = ({ events }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Combined slides: [0: Generic Title, 1..N: Events]
    // If no events, just 0.
    const hasEvents = events.length > 0;
    const totalSlides = hasEvents ? events.length : 1;

    useEffect(() => {
        if (totalSlides <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, [totalSlides]);

    const activeEvent = hasEvents ? events[currentSlide] : null;

    return (
        <div className="rounded-[2.5rem] shadow-xl shadow-pink-200/50 bg-white p-1">
            <div className="relative w-full bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-[2.3rem] p-6 md:p-8 text-white overflow-hidden min-h-[220px] flex flex-col justify-center">

                {/* Abstract Decorative Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900 opacity-20 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                {!activeEvent ? (
                    // Default / No Events View
                    <div className="relative z-10 animate-in fade-in duration-500 space-y-4 text-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 text-white/90">
                            <Music size={32} />
                        </div>
                        <h2 className="text-3xl font-black leading-tight tracking-tight">Ministerio de Alabanza</h2>
                        <p className="text-pink-100 font-medium opacity-90">
                            "Cantad alegres a Dios, habitantes de toda la tierra."
                        </p>
                    </div>
                ) : (
                    // Active Event View
                    <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-500 space-y-6" key={activeEvent.id}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 w-fit">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Próximo Evento</span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black leading-none tracking-tight">
                                {activeEvent.title}
                            </h2>
                            <p className="text-pink-100 text-lg font-medium opacity-90 max-w-lg line-clamp-2">
                                {activeEvent.description || 'Detalles próximamente...'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-bold bg-black/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
                            <span className="flex items-center gap-2 opacity-90">
                                <Calendar size={16} />
                                {new Date(activeEvent.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                {activeEvent.endDate && activeEvent.endDate !== activeEvent.date && (
                                    <> - {new Date(activeEvent.endDate + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</>
                                )}
                            </span>
                            {activeEvent.time && (
                                <>
                                    <span className="w-px h-4 bg-white/30"></span>
                                    <span className="flex items-center gap-2 opacity-90">
                                        <Clock size={16} />
                                        {activeEvent.time}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Dots */}
                {totalSlides > 1 && (
                    <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                        {Array.from({ length: totalSlides }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicMinistryApp;
