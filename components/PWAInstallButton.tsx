import React from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
    className?: string;
    variant?: 'icon' | 'full' | 'dropdown';
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'full' }) => {
    const { isInstalled, installApp, deferredPrompt } = usePWAInstall();

    // If installed, don't show anything (or show nothing for now)
    if (isInstalled) return null;

    if (variant === 'icon') {
        return (
            <button
                onClick={installApp}
                className={`p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors ${className}`}
                title="Instalar App"
            >
                <Download size={20} />
            </button>
        );
    }

    if (variant === 'dropdown') {
        return (
            <button
                onClick={installApp}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors text-left ${className}`}
            >
                <Download size={16} />
                Instalar App
            </button>
        );
    }

    return (
        <button
            onClick={installApp}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-bold text-xs hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 ${className}`}
        >
            <Download size={16} />
            <span className="hidden sm:inline">Instalar App</span>
        </button>
    );
};

export default PWAInstallButton;
