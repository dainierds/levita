import React from 'react';
import {
    Home,
    Video,
    List,
    Calendar,
    Heart,
    User
} from 'lucide-react';
import { ViewState, NavItem } from '../types';

interface NavbarProps {
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    activeView,
    onNavigate
}) => {

    const navItems: NavItem[] = [
        { id: ViewState.HOME, label: 'Inicio', icon: <Home size={22} /> },
        { id: ViewState.LIVE, label: 'En Vivo', icon: <Video size={22} /> },
        { id: ViewState.ORDER, label: 'Culto', icon: <List size={22} /> },
        { id: ViewState.EVENTS, label: 'Eventos', icon: <Calendar size={22} /> },
        { id: ViewState.PRAYER, label: 'Oración', icon: <Heart size={22} /> },
        { id: ViewState.PROFILE, label: 'Perfil', icon: <User size={22} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">

            {/* Container with Neumorphic Upward Shadow */}
            <nav className="h-24 bg-neu-base dark:bg-neu-base-dark shadow-neu-up dark:shadow-neu-up-dark rounded-t-[2.5rem] px-2 pb-2">
                <div className="h-full max-w-7xl mx-auto flex items-center justify-around md:justify-center md:space-x-12">
                    {navItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300
                  ${isActive
                                        ? 'text-brand-500 shadow-neu-pressed dark:shadow-neu-dark-pressed transform translate-y-1'
                                        : 'text-gray-900 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'
                                    }
                  w-14 h-14 md:w-auto md:h-auto md:px-6 md:py-3 md:flex-row md:space-x-3
                `}
                            >
                                <div className="relative z-10">
                                    {item.icon}
                                </div>

                                {/* Text Label - Hidden on mobile for space, visible on tablet+ */}
                                <span className={`
                  hidden md:block text-sm font-bold transition-colors
                  ${isActive ? 'text-brand-500' : 'text-gray-900'}
                `}>
                                    {item.label}
                                </span>

                                {/* Active Indicator Dots (Mobile Only) */}
                                {isActive && (
                                    <div className="md:hidden absolute -bottom-1 w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(109,93,252,0.8)]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
