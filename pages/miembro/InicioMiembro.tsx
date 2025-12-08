import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { Video, List, Heart, Calendar, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InicioMiembro: React.FC = () => {
    const { user } = useAuth();
    const { events } = useEvents();
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

    return (
        <div className="p-4 space-y-6 max-w-5xl mx-auto">
            {/* Header Text */}
            <div className="text-center mb-2">
                <h1 className="text-xl font-bold text-slate-900">Bienvenido, {user?.name?.split(' ')[0]}</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Iglesia</p>
            </div>

            {/* 1. CAROUSEL BANNER (Top) */}
            <div className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden transition-all duration-500 h-48 flex flex-col justify-center">
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
                        <p className="opacity-80 text-sm">Mantente atento a las novedades.</p>
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
                {/* Blue - En Vivo */}
                <button
                    onClick={() => navigate('/miembro/en-vivo')}
                    className="bg-[#3b82f6] rounded-3xl p-6 text-left text-white shadow-lg shadow-blue-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <Video size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Transmisión En Vivo</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">Ver culto en directo</p>
                </button>

                {/* Purple - Liturgia */}
                <button
                    onClick={() => navigate('/miembro/liturgia')}
                    className="bg-[#a855f7] rounded-3xl p-6 text-left text-white shadow-lg shadow-purple-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <List size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Liturgia</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">Orden del servicio actual</p>
                </button>

                {/* Green - Peticiones */}
                <button
                    onClick={() => navigate('/miembro/oracion')}
                    className="bg-[#22c55e] rounded-3xl p-6 text-left text-white shadow-lg shadow-green-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <Heart size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Peticiones</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">Envía tu motivo de oración</p>
                </button>

                {/* Orange - Eventos */}
                <button
                    onClick={() => navigate('/miembro/eventos')}
                    className="bg-[#f97316] rounded-3xl p-6 text-left text-white shadow-lg shadow-orange-200 hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between"
                >
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2">
                            <Calendar size={16} />
                        </div>
                        <h3 className="font-bold text-lg leading-none">Eventos</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">Calendario de actividades</p>
                </button>
            </div>

        </div>
    );
};

export default InicioMiembro;
