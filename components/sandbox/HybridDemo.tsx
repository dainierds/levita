import React, { useState, useEffect, useRef } from 'react';
import { Share, Bell, Home, Calendar, Book, User, ArrowLeft, Battery, Wifi, Signal } from 'lucide-react';

const HybridDemo = ({ onExit }: { onExit: () => void }) => {
    const [showNativeHeader, setShowNativeHeader] = useState(true);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulate initial page load
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // "Bridge" Logic: Scroll Detection
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        // Simple logic: hide header when scrolling down past 50px
        if (scrollTop > 50) {
            setShowNativeHeader(false);
        } else {
            setShowNativeHeader(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            {/* Phone Frame Simulator */}
            <div className="w-full max-w-[400px] h-[850px] bg-white rounded-[3rem] overflow-hidden shadow-2xl relative border-[8px] border-slate-900 ring-4 ring-slate-800">

                {/* --- NATIVE LAYER: STATUS BAR --- */}
                <div className="h-12 bg-white flex justify-between items-center px-8 absolute top-0 left-0 right-0 z-50 select-none">
                    <span className="text-sm font-semibold text-slate-900">9:41</span>
                    <div className="flex gap-2 items-center text-slate-900">
                        <Signal size={16} strokeWidth={2.5} />
                        <Wifi size={16} strokeWidth={2.5} />
                        <Battery size={20} strokeWidth={2.5} />
                    </div>
                </div>

                {/* --- NATIVE LAYER: HEADER --- */}
                <div className={`absolute top-12 left-0 right-0 bg-white/80 backdrop-blur-xl z-40 transition-all duration-300 transform px-6 py-4 flex justify-between items-center border-b border-slate-100 ${showNativeHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">A</div>
                        <div>
                            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Buenos días</h2>
                            <p className="text-lg font-black text-slate-900 leading-none">Ana María</p>
                        </div>
                    </div>
                    <div className="flex gap-4 text-slate-600">
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Share size={20} strokeWidth={2} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell size={20} strokeWidth={2} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </div>

                {/* --- WEB LAYER: WEBVIEW WRAPPER --- */}
                <div
                    className="w-full h-full overflow-y-auto bg-[#F2F4F7] pt-32 pb-24 scroll-smooth" // pt-32 to clear header
                    onScroll={handleScroll}
                    ref={scrollRef}
                    style={{ WebkitOverflowScrolling: 'touch' }} // iOS momentum
                >
                    {loading ? (
                        <SkeletonLoader />
                    ) : (
                        <WebContent />
                    )}
                </div>

                {/* --- NATIVE LAYER: TAB BAR --- */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-4 pb-8 flex justify-between items-center z-50 text-slate-400">
                    <TabIcon icon={Home} label="Inicio" active />
                    <TabIcon icon={Calendar} label="Eventos" />
                    <div className="w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white mb-8 transform hover:scale-105 transition-transform">
                        <span className="text-2xl font-bold">+</span>
                    </div>
                    <TabIcon icon={Book} label="Biblia" />
                    <TabIcon icon={User} label="Perfil" />
                </div>

                {/* Exit Button for Demo */}
                <button
                    onClick={onExit}
                    className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-md transition-colors"
                >
                    Salir de Demo
                </button>

            </div>
        </div>
    );
};

const TabIcon = ({ icon: Icon, label, active }: any) => (
    <button className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${active ? 'text-indigo-600' : 'hover:text-slate-600'}`}>
        <Icon size={24} fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 2.5} />
        <span className={`text-[10px] font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
    </button>
);

const SkeletonLoader = () => (
    <div className="px-6 space-y-6 animate-pulse pt-4">
        <div className="w-full h-[400px] bg-slate-200 rounded-[2.5rem]"></div>
        <div className="flex gap-4 overflow-hidden">
            <div className="min-w-[140px] h-40 bg-slate-200 rounded-3xl"></div>
            <div className="min-w-[140px] h-40 bg-slate-200 rounded-3xl"></div>
            <div className="min-w-[140px] h-40 bg-slate-200 rounded-3xl"></div>
        </div>
        <div className="space-y-4">
            <div className="w-full h-24 bg-slate-200 rounded-2xl"></div>
            <div className="w-full h-24 bg-slate-200 rounded-2xl"></div>
            <div className="w-full h-24 bg-slate-200 rounded-2xl"></div>
        </div>
    </div>
);

const WebContent = () => (
    <div className="px-6 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Web Hero Banner */}
        <div className="relative w-full h-[460px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/20 group">
            <img
                src="https://images.unsplash.com/photo-1510936111840-65e151ad71bb?q=80&w=1000&auto=format&fit=crop"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Worship"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8 pb-10">
                <span className="bg-indigo-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black w-fit mb-4 shadow-lg uppercase tracking-wider">
                    Domingo de Ramos
                </span>
                <h2 className="text-4xl font-black text-white leading-[1.1] mb-3 tracking-tight">
                    Una Fe <br /> <span className="text-indigo-400">Inquebrantable</span>
                </h2>
                <p className="text-slate-200 font-medium text-lg max-w-[80%] leading-relaxed">
                    Descubre cómo mantenerte firme en medio de la tormenta.
                </p>
                <button className="mt-6 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-lg">
                    Ver Transmisión
                </button>
            </div>
        </div>

        {/* Horizontal Scroll Section: Events */}
        <div className="relative">
            <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Próximos Eventos</h3>
                <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full">Ver todos</span>
            </div>
            {/* Scrollable Container with simulated snap */}
            <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 snap-x mandatory hide-scrollbar" style={{ scrollPaddingLeft: '24px' }}>
                {[
                    { day: '12', month: 'OCT', title: 'Retiro de Jóvenes', img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&q=80', color: 'orange' },
                    { day: '15', month: 'OCT', title: 'Noche de Adoración', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', color: 'purple' },
                    { day: '20', month: 'OCT', title: 'Bautismos', img: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=500&q=80', color: 'blue' }
                ].map((item, i) => (
                    <div key={i} className="snap-center shrink-0 w-72 h-96 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute inset-0">
                            <img src={item.img} className="w-full h-full object-cover opacity-100 transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        </div>

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg">
                                <span className="text-[10px] font-bold uppercase">{item.month}</span>
                                <span className="text-xl font-black">{item.day}</span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h4 className="text-2xl font-black text-white mb-2 leading-tight">{item.title}</h4>
                            <button className="w-full py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white font-bold text-sm hover:bg-white hover:text-slate-900 transition-all">
                                Registrarme
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Vertical List: Reading Plan */}
        <div>
            <h3 className="text-2xl font-black text-slate-800 mb-6 px-1 tracking-tight">Tu Lectura Diaria</h3>
            <div className="space-y-4">
                {[
                    { title: 'Salmo 23', subtitle: 'El Señor es mi pastor', progress: 100 },
                    { title: 'Mateo 5', subtitle: 'Las bienaventuranzas', progress: 60 },
                    { title: 'Proverbios 3', subtitle: 'Sabiduría y obediencia', progress: 0 }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow active:scale-98">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${item.progress === 100 ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Book size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                            <p className="text-sm text-slate-500 font-medium">{item.subtitle}</p>
                        </div>
                        {item.progress > 0 && (
                            <div className="w-12 h-12 relative flex items-center justify-center">
                                <svg className="transform -rotate-90 w-12 h-12">
                                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className={`${item.progress === 100 ? 'text-green-500' : 'text-indigo-500'}`} strokeDasharray={113} strokeDashoffset={113 - (113 * item.progress) / 100} strokeLinecap="round" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Featured Podcast Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden text-white shadow-2xl shadow-indigo-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-indigo-300 font-bold uppercase text-xs tracking-widest">
                    <Signal size={12} />
                    Nuevo Episodio
                </div>
                <h3 className="text-2xl font-black mb-4">Liderazgo en Tiempos de Cambio</h3>
                <p className="text-slate-400 mb-6 font-medium">Con Pastor Carlos | 45 min</p>
                <div className="flex items-center gap-4">
                    <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-105 transition-transform">
                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                    <span className="font-bold">Escuchar ahora</span>
                </div>
            </div>
        </div>

        <div className="h-12"></div>
    </div>
);

export default HybridDemo;
