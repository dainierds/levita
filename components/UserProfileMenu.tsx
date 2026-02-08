import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Download, ChevronDown, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface UserProfileMenuProps {
    user: {
        name: string;
        email?: string;
        role?: string;
    } | null;
    roleLabel?: string;
    onLogout?: () => void;
    variant?: 'simple' | 'full'; // simple = just avatar, full = name + avatar
    className?: string;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, roleLabel = 'Usuario', onLogout, variant = 'simple', className = '' }) => {
    const { logout } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // PWA Install Prompt Listener
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert(t('pwa.install_instructions') || 'Para instalar la App:\n\n1. Busca los 3 puntos o el botón Compartir en tu navegador.\n2. Selecciona "Instalar aplicación" o "Agregar a Inicio".');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        if (onLogout) onLogout();
        else logout();
    };

    const handleNotificationRequest = async () => {
        setShowProfileMenu(false);
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
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-2 rounded-full transition-colors ${variant === 'full' ? 'bg-slate-100 pl-1 pr-3 py-1 hover:bg-slate-200' : 'hover:opacity-80'}`}
            >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-700 overflow-hidden">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>

                {variant === 'full' && (
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                )}
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
                <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />

                    <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-2 min-w-[240px] animate-in fade-in slide-in-from-top-2 z-50">
                        {/* Header Info */}
                        <div className="px-4 py-3 border-b border-slate-50 mb-2">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || (t('common.guest') || 'Invitado')}</p>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">{t(`role.${roleLabel?.toLowerCase()}`) || roleLabel}</p>
                        </div>

                        {/* Language Switcher */}
                        <div className="px-4 py-2 border-b border-slate-50 mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Globe size={10} /> {t('common.language') || "Idioma"}
                            </p>
                            <div className="flex gap-2 justify-between">
                                {['es', 'en', 'pt', 'fr'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang as any)}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center uppercase border
                                            ${language === lang
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-1">
                            <button
                                onClick={handleNotificationRequest}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors text-left"
                            >
                                <Bell size={16} />
                                {t('common.enable_notifications') || "Activar Avisos"}
                            </button>

                            {/* PWA Install */}
                            {!window.matchMedia('(display-mode: standalone)').matches && (
                                <button
                                    onClick={handleInstallClick}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors text-left"
                                >
                                    <Download size={16} />
                                    {t('common.install_app') || "Instalar App"}
                                </button>
                            )}

                            <div className="h-px bg-slate-50 my-1" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left"
                            >
                                <LogOut size={16} />
                                {t('common.logout') || "Cerrar Sesión"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfileMenu;
