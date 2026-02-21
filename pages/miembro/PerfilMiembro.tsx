import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell, MapPin, Download } from 'lucide-react';
import { useTenantSettings } from '../../hooks/useTenantSettings';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';

const PerfilMiembro: React.FC = () => {
    const { user, logout } = useAuth();
    const { settings } = useTenantSettings();
    const { installApp, isInstalled } = usePWAInstall();
    const { t } = useLanguage();

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-600" />
                    Mi Perfil
                </h1>
            </div>

            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center text-4xl font-bold mb-4 border-4 border-white/30 backdrop-blur-md">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-indigo-100">{user?.email}</p>
                    <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase mt-4">
                        Miembro
                    </span>
                </div>

                <div className="p-6 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                        <div className="p-2 bg-white rounded-full shadow-sm text-indigo-500"><MapPin size={20} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Iglesia</p>
                            <p className="font-bold text-slate-700">{settings?.churchName || 'Mi Iglesia'}</p>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 font-medium">Notificaciones Push</span>
                        </div>
                        <span className="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded-md">ACTIVADO</span>
                    </button>

                    {!isInstalled && !window.matchMedia('(display-mode: standalone)').matches && (
                        <button
                            onClick={installApp}
                            className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 rounded-2xl transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-indigo-500" />
                                <span className="text-slate-700 font-bold">{t('common.install_app') || 'Instalar App'}</span>
                            </div>
                            <span className="text-[10px] text-indigo-500 font-black bg-indigo-50 px-2 py-1 rounded-md uppercase group-hover:bg-white transition-colors">DISPONIBLE</span>
                        </button>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerfilMiembro;
