import React from 'react';
import { User, Bell, Download } from 'lucide-react';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfileViewProps {
    tenantId?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ tenantId }) => {
    const { installApp, isInstalled } = usePWAInstall();
    const { t } = useLanguage();

    const handleNotificationRequest = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                alert(t('notifications.enabled') || '¡Notificaciones activadas!');
            } else {
                alert(t('notifications.denied') || 'Permiso denegado.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-600" />
                    {t('menu.profile') || 'Mi Perfil'}
                </h1>
            </div>

            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto flex items-center justify-center text-4xl font-bold mb-4 border-4 border-white/30 backdrop-blur-md">
                        V
                    </div>
                    <h2 className="text-2xl font-bold">{t('visitor.welcome_visitor') || '¡Bienvenido!'}</h2>
                    <p className="text-indigo-100">{t('visitor.profile_subtitle') || 'Gracias por acompañarnos hoy'}</p>
                    <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase mt-4">
                        {t('role.visitor') || 'Visitante'}
                    </span>
                </div>

                <div className="p-6 space-y-4">
                    <button
                        onClick={handleNotificationRequest}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group text-left"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-gray-700 font-medium">{t('common.enable_notifications') || 'Activar Notificaciones'}</span>
                        </div>
                        <ChevronRightIcon />
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
                            <span className="text-[10px] text-indigo-500 font-black bg-indigo-50 px-2 py-1 rounded-md uppercase group-hover:bg-white transition-colors">
                                {t('common.available') || 'DISPONIBLE'}
                            </span>
                        </button>
                    )}
                </div>

                <div className="p-8 bg-slate-50 text-center">
                    <p className="text-sm text-slate-500 italic">
                        {t('visitor.prayer_reminder') || '"Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos."'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Mateo 18:20</p>
                </div>
            </div>
        </div>
    );
};

const ChevronRightIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);
