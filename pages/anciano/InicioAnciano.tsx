import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { usePlans } from '../../hooks/usePlans';
import { Calendar, FileText, BookOpen, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InicioAnciano: React.FC = () => {
    const { user } = useAuth();
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Next Turns (General - Top 2)
    const nextPlans = plans
        .filter(p => !p.isActive && new Date(p.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2);

    // Next Preaching
    const nextPreaching = plans
        .filter(p => !p.isActive && new Date(p.date) >= today)
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

            {/* 2. NAVIGATION GRID (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Blue - Próximos Turnos (Now shows top 2) */}
                <button
                    onClick={() => navigate('/anciano/mi-turno')}
                    className="bg-[#3b82f6] rounded-3xl p-5 text-left text-white shadow-lg shadow-blue-200 hover:scale-[1.01] transition-transform relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center">
                            <Calendar size={16} />
                        </div>
                        <span className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Próximos Turnos</span>
                    </div>

                    <div className="space-y-2 mt-1">
                        {nextPlans.length > 0 ? nextPlans.map((plan, i) => (
                            <div key={plan.id} className={`flex justify-between items-center rounded-lg p-2 ${i === 0 ? 'bg-white/20' : 'bg-white/10'}`}>
                                <div>
                                    <p className="font-bold text-xs leading-none">
                                        {new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-[10px] opacity-80 truncate max-w-[120px]">
                                        {plan.team?.elder || 'Sin Anciano'}
                                    </p>
                                </div>
                                {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm animate-pulse"></div>}
                            </div>
                        )) : (
                            <p className="text-xs opacity-80 font-medium">No hay turnos programados.</p>
                        )}
                    </div>
                </button>

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
