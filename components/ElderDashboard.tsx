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
        <div className="min-h-screen bg-slate-50 relative pb-24 md:pb-0">
            {/* Custom Header for Mobile (Overlays App Header) */}
            <div className="md:hidden bg-indigo-600 px-6 pt-8 pb-10 rounded-b-[2.5rem] shadow-xl relative z-10 transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500 border-2 border-indigo-300 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name}</h2>
                            <p className="text-indigo-200 text-sm font-medium">Anciano</p>
                        </div>
                    </div>
                    <button className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Desktop Only Warning */}
            <div className="hidden md:block p-8 text-center text-slate-400">
                <p>Esta vista está optimizada para móviles.</p>
            </div>

            {/* Menu List */}
            <div className="px-5 -mt-6 relative z-20 md:hidden">
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 overflow-hidden border border-slate-100">
                    {/* Active "Inicio" Banner */}
                    <div className="bg-indigo-600 p-4 flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg text-white">
                            <Home size={20} />
                        </div>
                        <span className="font-bold text-white">Inicio</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {menuItems.filter(i => i.id !== 'dashboard').map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentView(item.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon size={22} className="text-slate-700 group-hover:text-indigo-600 transition-colors" />
                                    <span className="font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                                </div>
                                {item.count !== undefined ? (
                                    <span className="text-slate-400 font-medium text-sm">{item.count}</span>
                                ) : (
                                    <ChevronRight size={18} className="text-slate-300" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="w-full mt-6 flex items-center gap-3 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default ElderDashboard;
