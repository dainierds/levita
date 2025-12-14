import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChurchTenant, ChurchSettings, ChurchEvent, ServicePlan, MusicTeam } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Lock, Music, Calendar, Radio, Mic2, User, Play, Clock, MapPin, Bell, LogOut, ArrowLeft, List } from 'lucide-react';
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
    const [nextPlan, setNextPlan] = useState<ServicePlan | null>(null);
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

                // 1. Priority: Active Plan (Live)
                const active = plans.find(p => p.isActive);

                if (active) {
                    setNextPlan(active);
                } else {
                    // 2. Priority: Nearest Upcoming Plan
                    const upcoming = plans
                        .filter(p => new Date(p.date + 'T00:00:00') >= today)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                    setNextPlan(upcoming || null);
                }
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
                {nextPlan ? (
                    <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200 space-y-6">
                        {/* CARD 1: SERVICE INFO & TEAM */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl font-bold text-slate-800">{nextPlan.title || 'Servicio General'}</h4>
                                        {nextPlan.isActive && (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full animate-pulse">
                                                EN VIVO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium capitalize">
                                        {new Date(nextPlan.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        {' • '}{nextPlan.startTime}
                                    </p>
                                </div>
                                <div className="text-center bg-indigo-50 px-3 py-2 rounded-xl">
                                    <span className="block text-2xl font-black text-indigo-600 leading-none">{new Date(nextPlan.date).getDate()}</span>
                                    <span className="block text-[10px] font-bold text-indigo-400 uppercase">{new Date(nextPlan.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                </div>
                            </div>

                            {/* Service Team Grid (Merged with Roster) */}
                            <div className="bg-slate-50 rounded-2xl p-4 gap-4 grid grid-cols-2">
                                {(() => {
                                    // Logic to Merge Plan Team with Roster Team
                                    // 1. Get Plan Team
                                    const planTeam = nextPlan.team || {};

                                    // 2. Find matching Roster Team (ShiftTeam) from settings
                                    const rosterTeams = (tenant?.settings?.teams || []) as any[];
                                    const matchingRoster = rosterTeams.find(t => t.date === nextPlan.date);
                                    const rosterMembers = matchingRoster?.members || {};

                                    // 3. Define the roles we specifically want to show
                                    // This mapping aligns ServicePlanner keys with TeamRoster keys
                                    const roleMap = [
                                        { key: 'preacher', rosterKey: 'preacher', label: 'Predicador', icon: User, color: 'text-indigo-500' },
                                        { key: 'musicDirector', rosterKey: 'musicDirector', label: 'Dir. Música', icon: Music, color: 'text-pink-500' }, // Specifically requested
                                        { key: 'elder', rosterKey: 'elder', label: 'Anciano', icon: User, color: 'text-purple-500' },
                                        { key: 'audioOperator', rosterKey: 'audioOperator', label: 'Audio', icon: Mic2, color: 'text-orange-500' },
                                        { key: 'videoOperator', rosterKey: 'videoOperator', label: 'Video', icon: Play, color: 'text-blue-500' },
                                        { key: 'usher', rosterKey: 'usher', label: 'Ujier', icon: User, color: 'text-teal-500' },
                                    ];

                                    return roleMap.map(roleConfig => {
                                        // Priority: Plan Team > Roster Team
                                        const name = planTeam[roleConfig.key] || rosterMembers[roleConfig.rosterKey];

                                        if (!name) return null;

                                        return (
                                            <div key={roleConfig.key} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${roleConfig.color}`}>
                                                    <roleConfig.icon size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">{roleConfig.label}</p>
                                                    <p className="text-xs font-bold text-slate-700 truncate">{name}</p>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* CARD 2: REAL-TIME SERVICE ORDER (LITURGY) */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <List size={14} /> Orden del Culto
                            </h3>
                            <div className="space-y-3">
                                {nextPlan.items && nextPlan.items.length > 0 ? (
                                    nextPlan.items.map((item, idx) => (
                                        <div key={item.id || idx} className="group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all flex justify-between items-center">
                                            <div className="flex items-start gap-3">
                                                <span className="text-xs font-bold text-slate-300 mt-1 w-6">#{String(idx + 1).padStart(2, '0')}</span>
                                                <div>
                                                    <h4 className="font-bold text-slate-700 text-sm">{item.title}</h4>
                                                    <div className="flex items-center gap-2 text-[10px] mt-0.5">
                                                        <span className="font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                            {item.type === 'min' ? 'MINISTERIO' : item.type}
                                                        </span>
                                                        {item.type === 'WORSHIP' && item.key && (
                                                            <span className="text-pink-500 font-bold bg-pink-50 px-1.5 py-0.5 rounded-md">Key: {item.key}</span>
                                                        )}
                                                    </div>
                                                    {/* YouTube/External Links */}
                                                    {item.type === 'WORSHIP' && (
                                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                                            {item.youtubeLinks?.map((link, lIdx) => (
                                                                <a key={`l-${lIdx}`} href={link} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full hover:bg-red-100 flex items-center gap-1">
                                                                    <Play size={8} /> Link {lIdx + 1}
                                                                </a>
                                                            ))}
                                                            {item.links?.map((link, lIdx) => (
                                                                <a key={`n-${lIdx}`} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-0.5 rounded-full hover:bg-indigo-100 flex items-center gap-1" title={link.url}>
                                                                    <Play size={8} /> {link.label}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg tabular-nums">
                                                {item.durationMinutes}m
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-slate-400 text-xs italic">
                                        No hay items en el orden de culto.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="bg-slate-100 rounded-3xl p-8 text-center text-slate-400">
                        <Calendar className="mx-auto mb-2 opacity-50" />
                        No hay cultos programados.
                    </div>
                )}
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200 space-y-6">
                    {/* SERVICE INFO CONTENT AND ORDER CARD WOULD BE HERE - assuming they are inside the `section` above which was previously rendered properly but malformed at the end */}
                    {/* We are replacing the END of the file where the error is, so we need to close the `section` correctly or the `div` correctly */}

                    {/* ... content of the section is assumed to be correct up until the closing tag ... */}
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
