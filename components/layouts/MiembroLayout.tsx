import React, { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home, Video, List, Heart, User, Menu, Bell, Calendar, LogOut,
    Signal, Wifi, Battery, Share, Book
} from 'lucide-react';
import { useNextService } from '../../hooks/useNextService';

const MiembroLayout: React.FC = () => {
    const { user, logout } = useAuth();
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

    const navItems = [
        { path: '/miembro/inicio', icon: Home, label: 'Inicio' },
        { path: '/miembro/eventos', icon: Calendar, label: 'Eventos' },
        // Middle button handled separately
        { path: '/miembro/biblia', icon: Book, label: 'Biblia' }, // Future placeholder or link to external? Or keep 'Orden'?
        { path: '/miembro/perfil', icon: User, label: 'Perfil' },
    ];
    // Note: The original 'En Vivo' and 'Orden' might need to be fit into the 5-tab native bar or the + button.
    // Sandbox uses: Home, Events, [PLUS], Bible, Profile.
    // Original MiembroLayout uses: Home, Live, Events, Order, Prayer.
    // Strategy: Map closest matches.
    // Home -> Inicio
    // Events -> Eventos
    // [PLUS] -> Actions Menu? Or 'En Vivo'?
    // Bible -> (Not in original, maybe 'Orden'?)
    // Profile -> Perfil (was in menu, now in tab)

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
                                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Buenos días</h2>
                                <p className="text-lg font-black text-slate-900 leading-none truncate max-w-[150px]">{user?.name?.split(' ')[0] || 'Miembro'}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-slate-600">
                            <button
                                onClick={logout}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors relative text-red-500 hover:text-red-600"
                                title="Cerrar Sesión"
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
                                <span className="text-[10px] font-black text-white tracking-widest px-4">
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

                                        if (!nextService) return 'BIENVENIDOS A LA APP DE MIEMBROS  ✦  LEVITA 3.0  ✦  ';

                                        const text = `PRÓXIMO CULTO: ${nextService.dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${formatTime12h(nextService.time)}  ✦  PREDICADOR: ${nextService.preacher?.toUpperCase() || 'POR DEFINIR'}  ✦  `;
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
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] flex items-center justify-around px-2 z-50">

                    {/* Items */}
                    <TabItem
                        icon={Home}
                        label="Inicio"
                        isActive={location.pathname.includes('/miembro/inicio')}
                        onClick={() => navigate('/miembro/inicio')}
                    />
                    <TabItem
                        icon={Calendar}
                        label="Eventos"
                        isActive={location.pathname.includes('/miembro/eventos')}
                        onClick={() => navigate('/miembro/eventos')}
                    />

                    {/* Live Button (Center) */}
                    <TabItem
                        icon={Video}
                        label="En Vivo"
                        isActive={location.pathname.includes('/miembro/en-vivo')}
                        onClick={() => navigate('/miembro/en-vivo')}
                        isSpecial
                    />

                    <TabItem
                        icon={List}
                        label="Orden"
                        isActive={location.pathname.includes('/miembro/liturgia')}
                        onClick={() => navigate('/miembro/liturgia')}
                    />
                    <TabItem
                        icon={User}
                        label="Perfil"
                        isActive={location.pathname.includes('/miembro/perfil')}
                        onClick={() => navigate('/miembro/perfil')}
                    />
                </div>

            </div>
        </div>
    );
};

import { motion } from 'framer-motion';

const TabItem = ({ icon: Icon, label, isActive, onClick, isSpecial }: { icon: any, label: string, isActive: boolean, onClick: () => void, isSpecial?: boolean }) => {
    return (
        <button
            onClick={onClick}
            className="relative w-16 h-full"
        >
            {/* Active Bubble Background (The "Curve") */}
            {isActive && (
                <motion.div
                    layoutId="activeTabBubble"
                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] border-[3px] border-white z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
            )}

            {/* Icon - Absolute Positioning for Perfect Alignment */}
            <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 z-10 ${isActive ? '-top-[10px] text-white' : 'top-[17px] text-slate-400'}`}>
                <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            {/* Label */}
            <span className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-opacity duration-300 ${isActive ? 'opacity-0' : 'text-slate-400'}`}>
                {label}
            </span>
        </button>
    );
};

export default MiembroLayout;
