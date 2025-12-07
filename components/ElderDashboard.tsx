import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings } from '../types';
import { FileText, Calendar, TrendingUp, Bell, LogOut, X, ChevronRight, Home, BookOpen, Clock, Download } from 'lucide-react';

interface ElderDashboardProps {
    setCurrentView: (view: string) => void;
    user: User;
    settings?: ChurchSettings;
}

const ElderDashboard: React.FC<ElderDashboardProps> = ({ setCurrentView, user }) => {
    const { logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: Home, active: true },
        { id: 'events', label: 'Itinerario', icon: Calendar },
        { id: 'planner', label: 'Orden de Culto', icon: BookOpen },
        { id: 'roster', label: 'Mi Turno', icon: Clock },
        { id: 'statistics', label: 'Estadísticas', icon: TrendingUp },
        { id: 'resources', label: 'Recursos', icon: Download },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, count: 0 },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32 max-w-md mx-auto md:my-8 md:min-h-[800px] flex flex-col pt-4">

            {/* Header Card */}
            <div className="bg-[#6366f1] mx-4 rounded-t-[1.5rem] rounded-b-[1.5rem] p-6 shadow-xl shadow-indigo-200/50 relative overflow-hidden mb-4 pb-8">
                <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{user.name}</h2>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Anciano</p>
                        </div>
                    </div>
                    {/* The X implies closing the 'Menu' view. In our logic, Dashboard IS the menu, so X might go back to last view or do nothing? 
                        Screenshot shows it as a modal-like state. We'll make it navigate to 'events' or just be visual for now if no history. */}
                    <button onClick={() => setCurrentView('events')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Active Tab Indicator (Visual) matching screenshot */}
                <div className="bg-[#4f46e5] rounded-xl p-3 flex items-center gap-3">
                    <div className="p-1 bg-white/10 rounded text-white">
                        <Home size={18} />
                    </div>
                    <span className="text-white font-bold text-sm">Inicio</span>
                </div>
            </div>

            {/* Menu List */}
            <div className="bg-white mx-4 rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden -mt-6 relative z-20">
                <div className="divide-y divide-slate-50">
                    {menuItems.filter(i => i.id !== 'dashboard').map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentView(item.id)}
                            className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon size={20} className="text-slate-700" />
                                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                            </div>
                            {item.count !== undefined && item.count > 0 ? (
                                <span className="text-slate-400 font-medium text-xs">{item.count}</span>
                            ) : (
                                <ChevronRight size={16} className="text-slate-300" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Logout inside the white card or below? Screenshot 2 shows it separate below with red text */}
            </div>

            <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-4 px-6 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors rounded-2xl"
                >
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </div>


        </div>
    );
};

export default ElderDashboard;
