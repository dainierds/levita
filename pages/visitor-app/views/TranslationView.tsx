import React from 'react';
import LiveTranslation from '../../../components/LiveTranslation';

interface TranslationViewProps {
    tenantId?: string;
}

export const TranslationView: React.FC<TranslationViewProps> = ({ tenantId }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Traducción Simultánea</h2>
                    <p className="text-gray-500 dark:text-gray-400">Escucha el servicio en tu idioma preferido.</p>
                </div>
            </div>

            {/* Main Translation Interface */}
            <div className="max-w-3xl mx-auto">
                <LiveTranslation initialLanguage="en" tenantId={tenantId} />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-4 text-sm text-blue-700 dark:text-blue-300 max-w-3xl mx-auto">
                <div className="mt-1">ℹ️</div>
                <p>
                    <strong>Nota:</strong> Esta función recibe el audio directamente del sistema de sonido.
                    Selecciona tu idioma y pulsa el botón para comenzar a recibir la traducción.
                </p>
            </div>
        </div>
    );
};
