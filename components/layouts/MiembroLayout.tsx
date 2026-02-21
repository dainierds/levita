
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    Home, Video, List, Heart, User, Menu, Bell, Calendar, LogOut,
    Signal, Wifi, Battery, Share, Book
} from 'lucide-react';
import { useNextService } from '../../hooks/useNextService';
import { motion } from 'framer-motion';

const MiembroLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { nextService } = useNextService(user?.tenantId);

    // Native Shell Logic
    const [showNativeHeader, setShowNativeHeader] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop > 50) {
            setShowNativeHeader(false);
        } else {
            setShowNativeHeader(true);
        }
    };



    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center lg:p-4">
            {/* Phone Frame Simulator - Responsive: Full Screen on Mobile/Tablet, Framed on Desktop */}
            <div className="w-full h-full lg:w-full lg:max-w-[400px] lg:h-[850px] bg-white lg:rounded-[3rem] overflow-hidden shadow-2xl relative lg:border-[8px] lg:border-slate-900 lg:ring-4 ring-slate-800">

                {/* --- NATIVE LAYER: HEADER + TICKER COMBO --- */}
                <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 transform ${showNativeHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>

                    {/* WHITE FRONT CARD */}
                    <div className="relative z-20 bg-white rounded-b-[2.5rem] shadow-sm px-6 py-4 pt-12 pb-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                                {user?.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.welcome_prefix') || "Hola"}</h2>
                                <p className="text-lg font-black text-slate-900 leading-none truncate max-w-[150px]">{user?.name?.split(' ')[0] || (t('common.member') || 'Miembro')}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-slate-600">
                            <button
                                onClick={logout}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors relative text-red-500 hover:text-red-600"
                                title={t('common.logout') || "Cerrar Sesión"}
                            >
                                <LogOut size={20} strokeWidth={2} />
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
                                <Bell size={20} strokeWidth={2} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>
                        </div>
                    </div>

                    {/* COLORED BOTTOM CARD (Ticker) - Layered Behind */}
                    <div className="absolute inset-x-0 top-10 -bottom-10 z-10 rounded-b-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-[0_20px_40px_-12px_rgba(79,70,229,0.5)] flex items-end justify-center pb-2 overflow-hidden">

                        {/* Marquee Content */}
                        <div className="w-full flex items-center overflow-hidden mb-1 relative z-10">
                            <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] flex items-center w-full">
                                <span className="text-[10px] font-black text-white tracking-widest px-4 uppercase">
                                    {/* Content injected via logic below */}
                                    {(() => {
                                        // Helper for 12h format
                                        const formatTime12h = (time24: string) => {
                                            if (!time24) return '';
                                            const [hours, minutes] = time24.split(':').map(Number);
                                            const suffix = hours >= 12 ? 'PM' : 'AM';
                                            const hours12 = hours % 12 || 12;
                                            return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
                                        };

                                        if (!nextService) return (t('ticker.welcome') || 'BIENVENIDOS A LA APP DE MIEMBROS') + '  ✦  LEVITA 3.0  ✦  ';

                                        const nextServiceLabel = t('ticker.next_service') || 'PRÓXIMO CULTO';
                                        const preacherLabel = t('role.preacher') || 'PREDICADOR';
                                        const tbdLabel = t('common.tbd') || 'POR DEFINIR';

                                        const text = `${nextServiceLabel}: ${nextService.dateObj.toLocaleDateString(language || 'es', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${formatTime12h(nextService.time)}  ✦  ${preacherLabel}: ${nextService.preacher?.toUpperCase() || tbdLabel}  ✦  `;
                                        return text.repeat(4);
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Masks for gradient fade at edges */}
                        <div className="absolute left-0 bottom-0 top-20 w-8 bg-gradient-to-r from-blue-600 to-transparent z-20 pointer-events-none"></div>
                        <div className="absolute right-0 bottom-0 top-20 w-8 bg-gradient-to-l from-purple-600 to-transparent z-20 pointer-events-none"></div>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div
                    className="w-full h-full overflow-y-auto bg-[#F2F4F7] pt-44 pb-24 scroll-smooth"
                    onScroll={handleScroll}
                    ref={scrollRef}
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <Outlet />
                </div>

                {/* --- NATIVE TAB BAR (CURVED FULL WIDTH) --- */}
                <div className="absolute bottom-0 left-0 right-0 h-[5.5rem] z-50">
                    <NotchedNavBar />
                </div>

            </div>
        </div>
    );
};

// --- SVG NOTCHED NAV BAR COMPONENT (Member Version) ---
const NotchedNavBar = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            requestAnimationFrame(() => {
                if (entries[0]) setWidth(entries[0].contentRect.width);
            });
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const tabs = [
        { path: '/miembro/inicio', icon: Home, label: t('menu.home') || 'Inicio' },
        { path: '/miembro/eventos', icon: Calendar, label: t('menu.events') || 'Eventos' },
        { path: '/miembro/en-vivo', icon: Video, label: t('menu.live') || 'En Vivo' },
        { path: '/miembro/liturgia', icon: List, label: t('menu.order') || 'Orden' },
        { path: '/miembro/perfil', icon: User, label: t('menu.profile') || 'Perfil' },
    ];

    const activeIndex = tabs.findIndex(t => location.pathname.includes(t.path));
    const validIndex = activeIndex === -1 ? 0 : activeIndex;

    if (width === 0) return <div ref={containerRef} className="w-full h-full" />;

    const tabWidth = width / 5;
    const centerX = (validIndex * tabWidth) + (tabWidth / 2);
    const holeWidth = 76;
    const depth = 38;

    const path = `
    M 0 30 
    Q 0 0 30 0
    L ${centerX - holeWidth / 2 - 15} 0
    C ${centerX - holeWidth / 2} 0, ${centerX - holeWidth / 2.5} ${depth}, ${centerX} ${depth}
    C ${centerX + holeWidth / 2.5} ${depth}, ${centerX + holeWidth / 2} 0, ${centerX + holeWidth / 2 + 15} 0
    L ${width - 30} 0
    Q ${width} 0 ${width} 30
    L ${width} 100
    L 0 100
    Z
  `;

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <svg className="absolute inset-0 w-full h-full drop-shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pointer-events-none">
                <motion.path
                    d={path}
                    className="fill-white"
                    animate={{ d: path }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
            </svg>

            <div className="relative w-full h-full flex items-end">
                {tabs.map((tab, idx) => {
                    const isActive = idx === validIndex;
                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className="flex-1 h-full flex flex-col items-center justify-end pb-4 relative z-10 group"
                        >
                            <div className="relative">
                                {isActive && (
                                    <motion.div
                                        layoutId="active-notch-bubble-member"
                                        className="absolute left-1/2 -ml-[1.75rem] -top-[3.25rem] w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] border-[3px] border-white flex items-center justify-center text-white z-20"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    >
                                        <tab.icon size={26} strokeWidth={2.5} />
                                    </motion.div>
                                )}

                                <div className={`transition-all duration-300 ${isActive ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-slate-400 group-hover:text-indigo-500'}`}>
                                    {isActive ? <div className="w-6 h-6" /> : <tab.icon size={26} strokeWidth={2} />}
                                </div>
                            </div>

                            <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'opacity-0 translate-y-2' : 'text-slate-400 opacity-100'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MiembroLayout;
