import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { Video, List, Heart, Calendar, Mic, ArrowRight, PlayCircle, Gift } from 'lucide-react';
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

    // Combined slides: [0: Welcome/Next, 1..N: Events]
    const totalSlides = 1 + upcomingEvents.length;

    // Auto-advance carousel
    useEffect(() => {
        if (totalSlides <= 1) return;
        const interval = setInterval(() => {
            setCurrentEventIndex(prev => (prev + 1) % totalSlides);
        }, 6000);
        return () => clearInterval(interval);
    }, [totalSlides]);

    const activeEvent = currentEventIndex > 0 ? upcomingEvents[currentEventIndex - 1] : null;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Text */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hola, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Bienvenido a Casa</p>
                </div>
            </div>

            {/* 1. MORPHO HERO BANNER */}
            <div className="p-1 rounded-[2.5rem] shadow-xl shadow-indigo-200/50 bg-white">
                <div className="relative w-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-[2.3rem] p-8 md:p-12 text-white overflow-hidden min-h-[320px] flex flex-col justify-center">

                    {/* Abstract Decorative Shapes (No Images) */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900 opacity-20 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

                    {currentEventIndex === 0 ? (
                        // SLIDE 0: Welcome / General
                        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 w-fit">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Panel de Miembro</span>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                                    Tu Vida en <br /> Comunidad
                                </h2>
                                <p className="text-indigo-100 text-lg font-medium opacity-90 max-w-md">
                                    Accede a los recursos, eventos y peticiones de nuestra familia de fe.
                                </p>
                            </div>

                            <button className="group flex items-center gap-3 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-900/10 hover:shadow-indigo-900/20 hover:scale-105 transition-all">
                                <Calendar size={20} className="group-hover:rotate-12 transition-transform" />
                                <span>Ver Calendario</span>
                            </button>
                        </div>
                    ) : (
                        // SLIDE N: Event
                        <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 w-fit">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Próximo Evento</span>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl md:text-5xl font-black leading-none tracking-tight">
                                    {activeEvent?.title}
                                </h2>
                                <p className="text-indigo-100 text-lg font-medium opacity-90 max-w-lg line-clamp-2">
                                    {activeEvent?.description || 'Detalles próximamente...'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm font-bold bg-black/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
                                <span className="flex items-center gap-2 opacity-90">
                                    <Calendar size={16} />
                                    {new Date(activeEvent!.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                <span className="w-px h-4 bg-white/30"></span>
                                <span className="flex items-center gap-2 opacity-90">
                                    <Mic size={16} />
                                    {activeEvent?.type}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Dots */}
                    {totalSlides > 1 && (
                        <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                            {Array.from({ length: totalSlides }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentEventIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. MORPHO GRID (Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Blue - En Vivo */}
                <button
                    onClick={() => navigate('/miembro/en-vivo')}
                    className="group relative h-48 rounded-[2rem] p-6 text-left text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                            <Video size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-none mb-1">En Vivo</h3>
                            <p className="text-blue-100 text-xs font-medium">Ver transmisión</p>
                        </div>
                    </div>
                </button>

                {/* Purple - Orden de Culto */}
                <button
                    onClick={() => navigate('/miembro/liturgia')}
                    className="group relative h-48 rounded-[2rem] p-6 text-left text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mb-10 group-hover:scale-125 transition-transform duration-700"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                            <List size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-none mb-1">Orden del Culto</h3>
                            <p className="text-purple-100 text-xs font-medium">Programa de hoy</p>
                        </div>
                    </div>
                </button>

                {/* Green - Peticiones */}
                <button
                    onClick={() => navigate('/miembro/oracion')}
                    className="group relative h-48 rounded-[2rem] p-6 text-left text-white shadow-xl shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -ml-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                            <Heart size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-none mb-1">Oración</h3>
                            <p className="text-emerald-100 text-xs font-medium">Enviar petición</p>
                        </div>
                    </div>
                </button>

                {/* Orange - Diezmos y Ofrendas (Was Eventos) */}
                <button
                    onClick={() => window.open('https://adventistgiving.org/donate/ANTBRS', '_blank')}
                    className="group relative h-48 rounded-[2rem] p-6 text-left text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-none mb-1">Diezmos y Ofrendas</h3>
                            <p className="text-orange-100 text-xs font-medium">Donar en línea</p>
                        </div>
                    </div>
                </button>
            </div>

        </div>
    );
};

export default InicioMiembro;
