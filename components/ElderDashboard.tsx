import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings } from '../types';
import { FileText, Calendar, TrendingUp, Bell, LogOut, ChevronRight, Home, BookOpen, Clock, Download } from 'lucide-react';

interface ElderDashboardProps {
    setCurrentView: (view: string) => void;
    user: User;
    settings?: ChurchSettings;
    notificationCount?: number;
}

const ElderDashboard: React.FC<ElderDashboardProps> = ({ setCurrentView, user, notificationCount }) => {
    const { logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: Home, active: true },
        { id: 'events', label: 'Itinerario', icon: Calendar },
        { id: 'orders', label: 'Orden de Culto', icon: BookOpen }, // 'orders' used to match AncianoLayout label 'Orden Culto'
        { id: 'roster', label: 'Mi Turno', icon: Clock },
        { id: 'statistics', label: 'Estadísticas', icon: TrendingUp },
        // { id: 'resources', label: 'Recursos', icon: Download }, // User's code has resources
        { id: 'notifications', label: 'Notificaciones', icon: Bell, count: notificationCount || 0 },
    ];

    return (
        <div className="min-h-screen bg-transparent pb-32 max-w-md mx-auto md:my-8 md:min-h-[800px] flex flex-col pt-4 px-4">

            {/* Welcome & Info Card (Based on AppAncianos from user) */}
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-slate-100 mb-6 mt-4">
                <span className="text-4xl mb-4 inline-block">📱</span>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                    ¡Bienvenido a la App!
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                    Has iniciado sesión correctamente como Anciano.
                </p>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 text-left">
                    <h3 className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider">Tu información:</h3>
                    <ul className="text-xs text-gray-700 space-y-1.5">
                        <li><strong className="text-indigo-600">Nombre:</strong> {user.name}</li>
                        <li><strong className="text-indigo-600">Email:</strong> {user.email}</li>
                        <li><strong className="text-indigo-600">Iglesia ID:</strong> {user.tenantId || 'levita-church-01'}</li>
                    </ul>
                </div>
            </div>

            {/* Menu List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {menuItems.filter(i => i.id !== 'dashboard').map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentView(item.id)}
                            className="w-full flex items-center justify-between p-4 px-6 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <item.icon size={18} />
                                </div>
                                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                            </div>
                            {item.count !== undefined && item.count > 0 ? (
                                <span className="text-white bg-red-500 font-bold text-[10px] px-2 py-0.5 rounded-full">{item.count}</span>
                            ) : (
                                <ChevronRight size={16} className="text-slate-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-4 px-6 text-red-500 font-bold text-sm bg-white rounded-2xl border border-red-50 hover:bg-red-50 transition-colors shadow-sm"
                >
                    <LogOut size={18} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default ElderDashboard;
