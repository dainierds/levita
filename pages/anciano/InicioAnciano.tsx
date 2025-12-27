import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { usePlans } from '../../hooks/usePlans';
import { Calendar, FileText, BookOpen, Mic, Clock, MapPin, User, Music, Mic2, Play, List, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InicioAnciano: React.FC = () => {
    const { user, tenant } = useAuth();
    const { events } = useEvents();
    const { plans } = usePlans();
    const navigate = useNavigate();

    // --- CAROUSEL LOGIC ---
    const [currentEventIndex, setCurrentEventIndex] = useState(0);

    // Filter only future events for the carousel
    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Auto-advance carousel
    useEffect(() => {
        if (upcomingEvents.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentEventIndex(prev => (prev + 1) % upcomingEvents.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [upcomingEvents.length]);

    const activeEvent = upcomingEvents[currentEventIndex];

    // --- DATA FOR BUTTONS ---
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

    // Next Turns (General - Top 2)
    const nextPlans = plans
        .filter(p => !p.isActive && p.date >= todayStr)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2);

    // Next Preaching
    const nextPreaching = plans
        .filter(p => !p.isActive && p.date >= todayStr)
        .filter(p => p.team.preacher === user?.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];


    return (
        <div className="p-4 space-y-6 max-w-5xl mx-auto">
            {/* Header Text */}
            <div className="text-center mb-2">
                <h1 className="text-xl font-bold text-slate-900">Bienvenido, {user?.name?.split(' ')[0]}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Iglesia</p>
            </div>

            {/* 1. CAROUSEL BANNER (Top) */}
            <div className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-pink-200 relative overflow-hidden transition-all duration-500 h-48 flex flex-col justify-center">
                {/* Decorative Background Icon */}
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Calendar size={120} className="transform rotate-12 -mr-8 -mt-8" />
                </div>

                {upcomingEvents.length > 0 ? (
                    <div className="relative z-10 animate-in fade-in duration-500 key={activeEvent.id}">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <Mic size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Próximo Evento</span>
                        </div>

                        <h2 className="text-3xl font-bold mb-2 leading-tight">
                            {activeEvent.title}
                        </h2>
                        <p className="text-sm opacity-90 mb-4 font-medium leading-snug max-w-[80%] line-clamp-2">
                            {activeEvent.description || 'Consulta los detalles del evento.'}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                            <Calendar size={14} />
                            {new Date(activeEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                        <Calendar size={48} className="mb-2 opacity-50" />
                        <h2 className="text-xl font-bold">No hay eventos próximos</h2>
                        <p className="opacity-80 text-sm">Consulta el calendario más tarde.</p>
                    </div>
                )}

                {/* Carousel Dots */}
                {upcomingEvents.length > 1 && (
                    <div className="absolute bottom-4 right-4 flex gap-1.5 z-20">
                        {upcomingEvents.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentEventIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 2. NEXT SERVICE TEAMS (Linked to Team Roster) */}
            {nextPlans.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                    {(() => {
                        // Strict Filtering: Only show plans that match configured meeting days
                        // This prevents showing "ghost" plans or deleted events
                        const allowedDays = (tenant?.settings?.meetingDays || ['Domingo']).map((d: string) => d.toLowerCase());

                        const validPlans = nextPlans.filter(p => {
                            const pDate = new Date(p.date + 'T12:00:00');
                            const pDayName = pDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
                            // Simple normalization to match Spanish day names (accents)
                            // e.g. "sábado" matches "sabado" logic if needed, but usually locale string handles it
                            // We do a loose check if the day is pertinent
                            return allowedDays.some((allowed: string) => pDayName.includes(allowed.split('á').join('a').substring(0, 3)));
                        });

                        // Fallback: If strict filter removes everything (edge case), show raw nextPlans. 
                        // But usually validPlans is what we want.
                        const displayPlans = validPlans.length > 0 ? validPlans : nextPlans;

                        const nextPlan = displayPlans[0];
                        const futurePlan = displayPlans[1];

                        // Helper function to render Service Info Card
                        const renderServiceInfoCard = (plan: typeof nextPlan, label: string, themeBg: string) => (
                            <div key={plan.id} className={`${themeBg} rounded-[2rem] p-6 shadow-lg border border-white relative overflow-hidden text-white`}>
                                {/* Badge */}
                                <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl text-xs font-black uppercase tracking-wider bg-black/20 text-white backdrop-blur-sm">
                                    {label}
                                </div>

                                {/* Date & Title */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm bg-white/20 text-white backdrop-blur-md">
                                        <span className="text-[10px] font-bold uppercase">{new Date(plan.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                        <span className="text-xl font-black">{new Date(plan.date + 'T12:00:00').getDate()}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold leading-tight drop-shadow-sm capitalize">
                                            {new Date(plan.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' })} {new Date(plan.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                        </h2>
                                        <div className="flex items-center gap-2 text-white/80 text-xs font-bold mt-1">
                                            <Clock size={12} /> {plan.time || '10:00 AM'}
                                            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                            <MapPin size={12} /> {tenant?.name || 'Iglesia'}
                                        </div>
                                    </div>
                                </div>

                                {/* Service Team Grid */}
                                <div className="bg-white/10 rounded-2xl p-4 gap-4 grid grid-cols-2 backdrop-blur-sm">
                                    {(() => {
                                        const planTeam = plan.team || {};
                                        // Role mapping matches TeamManager.tsx to ensure we show the same data
                                        const roleMap = [
                                            { key: 'elder', label: 'Anciano', icon: User, color: 'text-purple-500' },
                                            { key: 'preacher', label: 'Predicador', icon: Mic2, color: 'text-indigo-500' },
                                            { key: 'esMaster', label: 'Maestro de ES', icon: Users, color: 'text-green-500' },
                                            { key: 'audioOperator', label: 'Audio', icon: Mic, color: 'text-orange-500' },
                                        ];

                                        return roleMap.map(roleConfig => {
                                            const name = (planTeam as any)[roleConfig.key];

                                            return (
                                                <div key={roleConfig.key} className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${roleConfig.color}`}>
                                                        <roleConfig.icon size={14} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider ">{roleConfig.label}</p>
                                                        <p className="font-bold text-white text-xs truncate drop-shadow-sm">{name || '---'}</p>
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
                                {/* 1. Next Service (Blue) */}
                                {nextPlan && renderServiceInfoCard(
                                    nextPlan,
                                    `Equipo del ${new Date(nextPlan.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}`,
                                    'bg-[#3b82f6] shadow-blue-200'
                                )}

                                {/* 2. Future Service (Indigo) - Replaces "Future Event" */}
                                {futurePlan && renderServiceInfoCard(
                                    futurePlan,
                                    `Equipo del ${new Date(futurePlan.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}`,
                                    'bg-[#6366f1] shadow-indigo-200'
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* 3. NAVIGATION GRID (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Purple - Predicación */}
                <button
                    onClick={() => navigate('/anciano/itinerario')}
                    className="bg-[#a855f7] rounded-3xl p-6 text-left text-white shadow-lg shadow-purple-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <FileText size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Predicación</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">
                        {nextPreaching ? new Date(nextPreaching.date).toLocaleDateString() : 'Sin predicaciones'}
                    </p>
                </button>

                {/* Green - Orden de Culto */}
                <button
                    onClick={() => navigate('/anciano/orden-culto')}
                    className="bg-[#22c55e] rounded-3xl p-6 text-left text-white shadow-lg shadow-green-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <FileText size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Orden de Culto</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">Ver programa</p>
                </button>

                {/* Orange - Recursos */}
                <button
                    onClick={() => navigate('/anciano/recursos')}
                    className="bg-[#f97316] rounded-3xl p-6 text-left text-white shadow-lg shadow-orange-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <BookOpen size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Recursos</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">2 disponibles</p>
                </button>
            </div>

        </div>
    );
};

export default InicioAnciano;
