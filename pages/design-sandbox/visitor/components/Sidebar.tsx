import React from 'react';
import { Home, Video, List, Calendar, Heart, User, LogOut, X } from 'lucide-react';
import { ViewState, NavItem } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeView: ViewState;
    onNavigate: (view: ViewState) => void;
    userEmail: string;
    userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeView, onNavigate, userEmail, userName }) => {
    const navItems: NavItem[] = [
        { id: ViewState.HOME, label: 'Inicio', icon: <Home size={22} /> },
        { id: ViewState.LIVE, label: 'En Vivo', icon: <Video size={22} /> },
        { id: ViewState.ORDER, label: 'Culto', icon: <List size={22} /> },
        { id: ViewState.EVENTS, label: 'Eventos', icon: <Calendar size={22} /> },
        { id: ViewState.PRAYER, label: 'Oración', icon: <Heart size={22} /> },
        { id: ViewState.PROFILE, label: 'Perfil', icon: <User size={22} /> },
    ];

    const handleNavClick = (view: ViewState) => {
        onNavigate(view);
        if (window.innerWidth < 1024) onClose();
    };

    const drawerClasses = `
    fixed inset-y-0 left-0 z-50 w-80 bg-neu-base dark:bg-neu-base-dark transform transition-transform duration-300 ease-in-out
    lg:translate-x-0 lg:static lg:block
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

    return (
        <>
            <div className={`fixed inset-0 bg-neu-base/80 dark:bg-neu-base-dark/80 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`${drawerClasses} ${isOpen ? 'shadow-2xl' : ''} lg:z-0 flex flex-col h-full p-6`}>
                <div className="flex flex-col items-center justify-center pt-8 pb-8">
                    <button onClick={onClose} className="absolute top-6 right-6 lg:hidden p-3 rounded-full text-gray-500 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed transition-all"><X size={20} /></button>
                    <div className="w-24 h-24 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center mb-4 border-4 border-neu-base dark:border-neu-base-dark">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center"><span className="text-3xl font-bold text-gray-400">M</span></div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">{userName}</h2>
                    <p className="text-sm text-brand-500 font-medium">{userEmail}</p>
                </div>
                <nav className="flex-1 space-y-4 overflow-y-auto no-scrollbar py-2">
                    {navItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 ${isActive ? 'text-brand-500 shadow-neu-pressed dark:shadow-neu-dark-pressed font-bold transform scale-[0.98]' : 'text-gray-500 dark:text-gray-400 shadow-neu dark:shadow-neu-dark hover:-translate-y-1'}`}>
                                <span className={isActive ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}>{item.icon}</span>
                                <span>{item.label}</span>
                                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(109,93,252,0.5)]"></div>}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};
