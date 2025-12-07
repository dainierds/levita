import React from 'react';
import { FileText, Calendar, TrendingUp, Bell, BarChart3, Download } from 'lucide-react';

interface ElderBottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    notificationCount?: number;
}

const ElderBottomNav: React.FC<ElderBottomNavProps> = ({ currentView, setCurrentView, notificationCount = 0 }) => {
    const navItems = [
        { id: 'dashboard', label: 'Inicio', icon: BarChart3 },
        { id: 'events', label: 'Itinerario', icon: FileText },
        { id: 'roster', label: 'Mi Turno', icon: Calendar },
        { id: 'statistics', label: 'Stats', icon: TrendingUp },
        { id: 'notifications', label: 'Avisos', icon: Bell, badge: notificationCount },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                {item.badge}
                            </span>
                        )}
                        {/* Optional label if space permits, AncianoLayout code didn't use labels on bottom nav, only icons */}
                    </button>
                );
            })}
        </div>
    );
};

export default ElderBottomNav;
