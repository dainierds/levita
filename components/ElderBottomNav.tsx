import React from 'react';
import { Home, FileText, Calendar, TrendingUp, Bell, AlignJustify } from 'lucide-react';

interface ElderBottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    notificationCount?: number;
}

const ElderBottomNav: React.FC<ElderBottomNavProps> = ({ currentView, setCurrentView, notificationCount = 0 }) => {
    const navItems = [
        { id: 'dashboard', label: 'Inicio', icon: AlignJustify }, // Menu icon for Dashboard/Home
        { id: 'planner', label: 'Orden', icon: FileText },
        { id: 'events', label: 'Itinerario', icon: Calendar },
        { id: 'statistics', label: 'Stats', icon: TrendingUp },
        { id: 'notifications', label: 'Avisos', icon: Bell },
    ];

    return (
        <div className="bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] text-[10px] font-bold md:rounded-b-xl">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`flex flex-col items-center gap-1 transition-all w-12 ${isActive ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                        <div className="relative">
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-indigo-600" : "text-slate-300"} />
                            {item.id === 'notifications' && notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default ElderBottomNav;
