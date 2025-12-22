import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChurchTenant, MusicTeam, ShiftTeam } from '../types';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Music, Calendar, Mic2, User, Home, Users, Clock } from 'lucide-react';
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

    // Login State
    const [pin, setPin] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');

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
                // Filter specifically for Tuesdays (2) and Saturdays (6)
                const rollingCalendar = futureTeams.filter(t => {
                    const d = new Date(t.date + 'T12:00:00'); // Midday to miss TZ issues
                    const day = d.getDay();
                    return day === 2 || day === 6;
                }).slice(0, 8); // Limit to next 8 relevant dates

                setCalendarTeams(rollingCalendar);
            });

            // 2. Fetch Users (for resolving names)
            const usersQ = query(collection(db, 'users'), where('tenantId', '==', tenant.id));
            getDocs(usersQ).then(snap => {
                setAllMusicUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });

            // 3. Fetch Roster (from Settings)
            if (tenant.settings?.teams) {
                const teams = (tenant.settings.teams as ShiftTeam[])
                    .filter(t => t.date && new Date(t.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
                setUpcomingShifts(teams);
            }

            return () => {
                unsubscribeMusic();
            };
        }
    }, [isAuthenticated, tenant?.id, tenant?.settings]);

    // Helpers
    const resolveNames = (ids: string[] | string | undefined) => {
        if (!ids) return [];
        const idArray = Array.isArray(ids) ? ids : [ids];
        return idArray.map(id => allMusicUsers.find(u => u.id === id)?.name).filter(Boolean) as string[];
    };

    const getGroupLabel = (count: number, service: number) => {
        const srv = service === 1 ? '1er' : '2do';
        if (count === 1) return `Solista ${srv} Servicio`;
        if (count === 2) return `Dúo ${srv} Servicio`;
        if (count === 3) return `Trío ${srv} Servicio`;
        if (count === 4) return `Cuarteto ${srv} Servicio`;
        return `Grupo ${srv} Servicio`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
            weekday: date.toLocaleDateString('es-ES', { weekday: 'long' }),
            full: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        };
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
                <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-xl text-center">
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
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {user?.name?.charAt(0) || userName.charAt(0) || 'U'}
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-8">

                {/* --- TAB 1: HOME --- */}
                {activeTab === 'home' && (
                    <>
                        {/* Welcome Banner */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-xl shadow-indigo-200">
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black mb-2">Hola, {user?.name?.split(' ')[0] || userName || 'Adorador'}</h2>
                                <p className="opacity-90 font-medium">Aquí están los próximos servicios.</p>
                            </div>
                            <Music className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 rotate-12" />
                        </div>

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
                    <div className="space-y-4">
                        {upcomingShifts.map((shift) => {
                            const dateInfo = formatDate(shift.date || '');
                            return (
                                <div key={shift.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                                        <div>
                                            <h3 className="font-black text-slate-800 capitalize text-lg">{dateInfo.weekday}</h3>
                                            <p className="text-xs font-bold text-purple-500">{dateInfo.full}</p>
                                        </div>
                                        <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
                                            Turno
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {shift.members?.preacher && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                    <Mic2 size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Predicador</p>

                                                    {/* We need to resolve Name from ID if possible, assuming stored as ID. 
                                                        In TeamRoster it stores ID. Here we need to find user by ID in allMusicUsers or fetch all.
                                                        Optimization: We fetched 'allMusicUsers' which are filtered by Role=MUSIC. 
                                                        Preachers might not be in that list. We should fetch ALL users or just display the ID 
                                                        if we can't find name. 
                                                        Actually, TeamRoster stores the ID. 
                                                        Let's assumme we only have music users loaded. We might see IDs.
                                                        Fix: Fetch ALL users in useEffect.
                                                     */}
                                                    {/* Temporarily displaying raw value which might be ID or Name. 
                                                         Ideally, we look up name from ID. 
                                                         Using a simple lookup if user is in our loaded list. */}
                                                    <p className="font-bold text-slate-800">
                                                        {allMusicUsers.find(u => u.id === shift.members.preacher)?.name || shift.members.preacher}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {shift.members?.elder && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anciano de Turno</p>
                                                    <p className="font-bold text-slate-800">
                                                        {allMusicUsers.find(u => u.id === shift.members.elder)?.name || shift.members.elder}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {shift.members?.musicDirector && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                                    <Music size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Director Música</p>
                                                    <p className="font-bold text-slate-800">
                                                        {allMusicUsers.find(u => u.id === shift.members.musicDirector)?.name || shift.members.musicDirector}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {upcomingShifts.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No hay turnos programados próximamente</p>
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
                            // Only show abbreviated info
                            return (
                                <div key={team.id} className="bg-white rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-slate-100">
                                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 ${new Date(team.date).getDay() === 2 ? 'bg-indigo-50 text-indigo-500' : 'bg-pink-50 text-pink-500'
                                        }`}>
                                        <span className="text-[10px] font-bold uppercase">{dateInfo.month}</span>
                                        <span className="text-2xl font-black">{dateInfo.day}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 capitalize truncate">{dateInfo.weekday}</h4>
                                        <p className="text-xs text-slate-400 mb-2">{teamMembers.length} integrantes</p>
                                        <div className="flex -space-x-2">
                                            {teamMembers.slice(0, 5).map((m, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                    {m.name.charAt(0)}
                                                </div>
                                            ))}
                                            {teamMembers.length > 5 && (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                    +{teamMembers.length - 5}
                                                </div>
                                            )}
                                        </div>
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
