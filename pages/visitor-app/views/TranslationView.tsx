import React from 'react';
import LiveTranslation from '../../../components/LiveTranslation';
import { useLanguage } from '../../../context/LanguageContext';

interface TranslationViewProps {
    tenantId?: string;
}

export const TranslationView: React.FC<TranslationViewProps> = ({ tenantId }) => {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Translation Interface */}
            <div className="max-w-3xl mx-auto">
                <LiveTranslation initialLanguage="en" tenantId={tenantId} />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-4 text-sm text-blue-700 dark:text-blue-300 max-w-3xl mx-auto">
                <div className="mt-1">ℹ️</div>
                <p>
                    <strong>{t('visitor.translation_note_title')}:</strong> {t('visitor.translation_note_desc')}
                </p>
            </div>
        </div>
    );
};
