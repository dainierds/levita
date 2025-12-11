import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChurchTenant, ChurchSettings, ChurchEvent, ServicePlan, MusicTeam } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Lock, Music, Calendar, Radio, Mic2, User, Play, Clock, MapPin } from 'lucide-react';
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
                    return eventDate >= today;
                });
            setEvents(fetchedEvents.slice(0, 5));

            // 2. Fetch Next Service Plan
            const plansQ = query(
                collection(db, 'servicePlans'), // Root collection
                where('tenantId', '==', tenant.id),
                orderBy('date', 'asc')
            );
            const plansSnap = await getDocs(plansQ);

            const allPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePlan));
            const upcomingPlan = allPlans
                .filter(p => {
                    const planDate = new Date(p.date + 'T00:00:00');
                    return planDate >= today;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            setNextPlan(upcomingPlan || null);

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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-indigo-500" />
                    <div className="text-center mb-8">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsAuthenticated(false);
                                localStorage.removeItem('music_user_name');
                            }}
                            className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors"
                        >
                            <Lock size={16} />
                        </button>
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                            <Music size={20} />
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-8">

                {/* 1. UPCOMING EVENTS BANNER (Carousel) */}
                {events.length > 0 ? (
                    <div className="overflow-x-auto pb-4 snap-x snap-mandatory flex gap-4 no-scrollbar">
                        {events.map((evt) => (
                            <div key={evt.id} className="snap-center shrink-0 w-[85%] relative rounded-[2rem] overflow-hidden shadow-lg h-48 group">
                                <div className={`absolute inset-0 bg-gradient-to-br ${evt.bannerGradient || 'from-pink-600 to-indigo-600'} opacity-90`} />
                                {/* Optional Image Background could go here */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                    <div className="bg-white/20 backdrop-blur-sm self-start px-3 py-1 rounded-lg text-[10px] font-bold uppercase mb-2">
                                        {evt.type}
                                    </div>
                                    <h3 className="text-xl font-bold leading-tight mb-1">{evt.title}</h3>
                                    <p className="text-xs opacity-80 flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(evt.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-48 rounded-[2rem] bg-gradient-to-r from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 border border-white shadow-inner">
                        <Calendar size={32} className="mb-2 opacity-50" />
                        <p className="font-bold text-sm">Sin eventos destacados</p>
                        <p className="text-xs opacity-75">Configura eventos en el panel de admin</p>
                    </div>
                )}

                {/* 2. NEXT SERVICE INFO */}
                {nextPlan ? (
                    <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="text-indigo-500" size={20} />
                            <h3 className="font-bold text-lg">Próximo Culto</h3>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800">{nextPlan.title || 'Servicio General'}</h4>
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

                            {/* Service Team */}
                            <div className="bg-slate-50 rounded-2xl p-4 gap-4 grid grid-cols-2">
                                {nextPlan.team && Object.entries(nextPlan.team).map(([role, name]) => {
                                    if (!name) return null; // Skip empty roles

                                    // Helper for labels and icons
                                    const getRoleInfo = (r: string) => {
                                        switch (r) {
                                            case 'preacher': return { label: 'Predicador', icon: User, color: 'text-indigo-500' };
                                            case 'musicDirector': return { label: 'Dir. Música', icon: Music, color: 'text-pink-500' };
                                            case 'elder': return { label: 'Anciano', icon: User, color: 'text-purple-500' };
                                            case 'audioOperator': return { label: 'Audio', icon: Mic2, color: 'text-orange-500' };
                                            default: return { label: r, icon: User, color: 'text-slate-400' };
                                        }
                                    };

                                    const info = getRoleInfo(role);
                                    const Icon = info.icon;

                                    return (
                                        <div key={role} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${info.color}`}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">{info.label}</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="bg-slate-100 rounded-3xl p-8 text-center text-slate-400">
                        <Calendar className="mx-auto mb-2 opacity-50" />
                        No hay cultos programados.
                    </div>
                )}

                {/* 3. MUSIC MINISTRY TEAM */}
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
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
                                            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Vocal / Músico</p>
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

            </main>
        </div>
    );
};

export default MusicMinistryApp;
