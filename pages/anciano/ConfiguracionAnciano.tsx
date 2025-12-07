import React from 'react';
import { Settings, LogOut, Moon, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ConfiguracionAnciano: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-gray-600" />
                    Configuración
                </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-3 border-4 border-white/30">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="font-bold text-lg">{user?.name}</h2>
                    <p className="text-blue-100 text-sm">{user?.email}</p>
                </div>

                <div className="p-4 space-y-2">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <Moon className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 font-medium">Modo Oscuro</span>
                        </div>
                        <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                        </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 font-medium">Notificaciones</span>
                        </div>
                        <span className="text-xs text-blue-600 font-bold">ACTIVADO</span>
                    </button>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionAnciano;
