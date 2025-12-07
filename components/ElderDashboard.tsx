import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings } from '../types';
import { FileText, Calendar, TrendingUp, Bell, LogOut, X, ChevronRight, Home, BookOpen, Clock } from 'lucide-react';

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
        { id: 'notifications', label: 'Notificaciones', icon: Bell, count: 0 },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32 max-w-md mx-auto md:my-8 md:min-h-[800px] flex flex-col justify-center">

            {/* Header Card */}
            <div className="bg-[#4F46E5] mx-4 rounded-[2rem] p-6 shadow-xl shadow-indigo-200/50 relative overflow-hidden mb-6 group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <div className="w-32 h-32 rounded-full bg-white blur-2xl -mr-10 -mt-10"></div>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{user.name}</h2>
                            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Anciano</p>
                        </div>
                    </div>
                    <button className="p-2 bg-white/10 rounded-xl text-indigo-100 hover:bg-white/20 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Active Tab Indicator (Visual) */}
                <div className="mt-6 bg-[#4338CA] rounded-xl p-3 flex items-center gap-3">
                    <div className="p-1.5 bg-white/10 rounded-lg text-white">
                        <Home size={18} />
                    </div>
                    <span className="text-white font-bold text-sm">Inicio</span>
                </div>
            </div>

            {/* Menu List */}
            <div className="bg-white mx-4 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {menuItems.filter(i => i.id !== 'dashboard').map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentView(item.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                <span className="font-bold text-slate-600 group-hover:text-slate-900 text-sm">{item.label}</span>
                            </div>
                            {item.count !== undefined && item.count > 0 ? (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.count}</span>
                            ) : (
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <div className="mt-8 px-8">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600 transition-colors"
                >
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default ElderDashboard;
