import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
    Home, Calendar, ClipboardList, User, BarChart3,
    Bell, Menu, X, BookOpen, Settings, LogOut
} from 'lucide-react';

const AncianoLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState(0);

    // Fetch Real-time Notifications count
    useEffect(() => {
        if (!user?.tenantId) return;

        // Query: Tenant's notifications targeted at ELDERs or PUBLIC
        // Note: In a real app complexity is higher (user-specific + role-based)
        const q = query(
            collection(db, 'notifications'),
            where('tenantId', '==', user.tenantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const count = snapshot.docs.filter(doc => {
                const data = doc.data();
                // Check Audience
                const audience = data.targetAudience;
                const isRelevant = audience === 'ELDER' || audience === 'ALL' || (Array.isArray(audience) && audience.includes('ELDER'));

                // Check Read Status
                const readBy = data.readBy || [];
                const isUnread = !readBy.includes(user.uid);

                return isRelevant && isUnread;
            }).length;

            setNotificaciones(count);
        });

        return () => unsubscribe();
    }, [user]);

    const navItems = [
        { path: '/anciano/inicio', icon: Home, label: 'Inicio' },
        { path: '/anciano/itinerario', icon: Calendar, label: 'Itinerario' },
        { path: '/anciano/orden-culto', icon: ClipboardList, label: 'Orden' },
        { path: '/anciano/mi-turno', icon: User, label: 'Mi Turno' },
        { path: '/anciano/estadisticas', icon: BarChart3, label: 'Stats' }
    ];

    const menuItems = [
        { path: '/anciano/inicio', icon: Home, label: 'Inicio' },
        { path: '/anciano/itinerario', icon: Calendar, label: 'Itinerario' },
        { path: '/anciano/orden-culto', icon: ClipboardList, label: 'Orden de Culto' },
        { path: '/anciano/mi-turno', icon: User, label: 'Mi Turno' },
        { path: '/anciano/estadisticas', icon: BarChart3, label: 'Estadísticas' },
        { path: '/anciano/recursos', icon: BookOpen, label: 'Recursos' },
        { path: '/anciano/notificaciones', icon: Bell, label: 'Notificaciones' },
        { path: '/anciano/configuracion', icon: Settings, label: 'Configuración' }
    ];

    const getTitulo = () => {
        const ruta = location.pathname;
        if (ruta.includes('inicio')) return 'Inicio';
        if (ruta.includes('itinerario')) return 'Itinerario';
        if (ruta.includes('orden-culto')) return 'Orden de Culto';
        if (ruta.includes('mi-turno')) return 'Mi Turno';
        if (ruta.includes('estadisticas')) return 'Estadísticas';
        if (ruta.includes('recursos')) return 'Recursos';
        if (ruta.includes('notificaciones')) return 'Notificaciones';
        if (ruta.includes('configuracion')) return 'Configuración';
        return 'Elder Ministry';
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg z-40 flex items-center justify-between px-4">
                {/* Botón Menú */}
                <button
                    onClick={() => setMenuOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Título */}
                <h1 className="text-lg font-bold">{getTitulo()}</h1>

                {/* Notificaciones + Avatar */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/anciano/notificaciones')}
                        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Bell className="w-6 h-6" />
                        {notificaciones > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {notificaciones}
                            </span>
                        )}
                    </button>

                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/20">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto pt-16 pb-16">
                <Outlet />
            </main>

            {/* BOTTOM NAVIGATION */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40">
                <div className="flex h-full">
                    {navItems.map(({ path, icon: Icon, label }) => {
                        const isActive = location.pathname.includes(path);
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${isActive
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* MENÚ LATERAL */}
            {menuOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        onClick={() => setMenuOpen(false)}
                    />

                    {/* Menú */}
                    <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-300">
                        {/* Header del menú */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 relative">
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl mb-3 border-2 border-white/30 backdrop-blur-md">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="font-bold text-lg leading-tight">{user?.name}</h2>
                            <p className="text-sm text-blue-100 opacity-80">{user?.email}</p>
                        </div>

                        {/* Opciones del menú */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {menuItems.map(({ path, icon: Icon, label }) => (
                                <button
                                    key={path}
                                    onClick={() => {
                                        navigate(path);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-b border-slate-50/50"
                                >
                                    <Icon className="w-5 h-5 text-slate-500" />
                                    <span className="text-slate-700 font-medium text-sm">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Cerrar sesión */}
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-6 py-5 border-t border-gray-100 hover:bg-red-50 text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-bold text-sm">Cerrar Sesión</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AncianoLayout;
