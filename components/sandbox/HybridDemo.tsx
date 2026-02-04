import React, { useState, useEffect, useRef } from 'react';
import { Share, Bell, Home, Calendar, Book, User, ArrowLeft, Battery, Wifi, Signal, Plus, Globe, Gift, List, Heart, Play } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center lg:p-4">
            {/* Phone Frame Simulator - Responsive: Full Screen on Mobile/Tablet, Framed on Desktop */}
            <div className="w-full h-full lg:w-full lg:max-w-[400px] lg:h-[850px] bg-white lg:rounded-[3rem] overflow-hidden shadow-2xl relative lg:border-[8px] lg:border-slate-900 lg:ring-4 ring-slate-800">

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
                    className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white px-4 py-1 rounded-full text-xs font-bold backdrop-blur-md transition-colors shadow-xl"
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

// --- WEB CONTENT COMPONENTS ---

const QuickActionsGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-2 md:grid-cols-4 gap-4 px-6 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Globe size={24} />
            </div>
            <span className="text-xs font-bold text-slate-700">Traducción</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Gift size={24} />
            </div>
            <span className="text-xs font-bold text-slate-700">Donaciones</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                <List size={24} />
            </div>
            <span className="text-xs font-bold text-slate-700">Programa</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
                <Heart size={24} />
            </div>
            <span className="text-xs font-bold text-slate-700">Oración</span>
        </div>
    </div>
);

const StoryCardType1 = ({ img, title, avatar }: { img: string, title: string, avatar?: string }) => (
    <div className="relative w-32 h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-md snap-start">
        <img src={img} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {avatar && (
            <div className="absolute top-2 left-2 p-0.5 bg-blue-500 rounded-full">
                <div className="w-7 h-7 rounded-full border-2 border-white overflow-hidden">
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                </div>
            </div>
        )}
        <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold leading-tight drop-shadow-md">
            {title}
        </p>
    </div>
);

const StoryCardType2 = ({ img, title }: { img: string, title: string }) => (
    <div className="relative w-32 h-52 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-indigo-500/20 snap-start group">
        <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute bottom-3 left-3 right-3 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
            <p className="text-white text-[10px] font-bold text-center leading-tight">
                {title}
            </p>
        </div>
    </div>
);

const StoryCardType3 = ({ img, title, label }: { img: string, title: string, label: string }) => (
    <div className="relative w-32 h-52 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-900 snap-start border border-slate-800">
        <img src={img} alt="" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">
            {label}
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-3">
            <div className="w-6 h-1 bg-indigo-500 mb-2 rounded-full"></div>
            <p className="text-white text-sm font-black leading-none uppercase tracking-tighter">
                {title}
            </p>
        </div>
    </div>
);

const StoriesCarousel = () => (
    <div className="mb-6 pt-4">
        <div className="flex items-center justify-between px-6 mb-3">
            <h3 className="font-bold text-slate-800 text-lg">Historias Destacadas</h3>
            <span className="text-indigo-500 text-xs font-bold">Ver todo</span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-4 snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
            {/* Create Story */}
            <div className="relative w-32 h-52 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 flex flex-col snap-start border border-slate-200">
                <div className="h-2/3 bg-slate-200 relative">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1 bg-white relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm">
                        <Plus size={20} />
                    </div>
                    <p className="mt-6 text-center text-[10px] font-bold text-slate-700">Crear Historia</p>
                </div>
            </div>

            <StoryCardType1
                img="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=400"
                avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100"
                title="Culto Joven"
            />

            <StoryCardType2
                img="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400"
                title="Clase de Música"
            />

            <StoryCardType3
                img="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400"
                title="NOCHE ADORACIÓN"
                label="HOY 7PM"
            />

            <StoryCardType1
                img="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=400"
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                title="Charla de Salud"
            />
        </div>
    </div>
);

const WebContent = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

        <StoriesCarousel />

        <QuickActionsGrid />

        <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Próximos Eventos</h3>
            </div>
            {/* Event List */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            <img src={`https://images.unsplash.com/photo-${i === 1 ? '1543165365' : i === 2 ? '1504609773096' : '1507643179173'}-07a786f67f1f?auto=format&fit=crop&q=80&w=200`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Domingo, 10:00 AM</span>
                            <h4 className="font-bold text-slate-800">Servicio de Adoración</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">Una experiencia transformadora para toda la familia.</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Podcast Section */}
        <div className="px-6 mb-8">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Podcast Reciente</h3>
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <Play size={20} fill="white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Fe en Tiempos Modernos</h4>
                        <p className="text-slate-400 text-sm">Episodio 4 • 24 min</p>
                    </div>
                </div>

                {/* Visualizer bars */}
                <div className="flex items-end gap-1 h-8 mt-6 opacity-50">
                    {[...Array(20)].map((_, i) => (
                        <div key={i}
                            className="w-1.5 bg-indigo-500 rounded-t-full animate-pulse"
                            style={{
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
        <div className="h-24"></div>
    </div>
);

export default HybridDemo;
