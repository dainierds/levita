import React from 'react';
import { FileText, Calendar, TrendingUp, Bell, AlignJustify } from 'lucide-react'; // Menu icon

interface ElderBottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    notificationCount?: number;
}

const ElderBottomNav: React.FC<ElderBottomNavProps> = ({ currentView, setCurrentView, notificationCount = 0 }) => {
    const navItems = [
        { id: 'dashboard', label: 'Inicio', icon: AlignJustify },
        { id: 'planner', label: 'Orden', icon: FileText },
        { id: 'events', label: 'Itinerario', icon: Calendar },
        { id: 'statistics', label: 'Stats', icon: TrendingUp },
        { id: 'notifications', label: 'Avisos', icon: Bell },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex items-center gap-8 z-[100] border border-slate-100">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-blue-600 scale-105' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                        <div className="relative p-1">
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            {item.id === 'notifications' && notificationCount > 0 && (
                                <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default ElderBottomNav;
