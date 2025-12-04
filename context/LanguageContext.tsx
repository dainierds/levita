import React, { createContext, useContext, useState, useEffect } from 'react';

import { TRANSLATIONS } from '../utils/translations';

type Language = 'es' | 'en' | 'pt' | 'fr' | null;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(null);

    // Load language from local storage on mount
    useEffect(() => {
        const savedLang = localStorage.getItem('appLanguage') as Language;
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    // Save language to local storage when changed
    useEffect(() => {
        if (language) {
            localStorage.setItem('appLanguage', language);
        }
    }, [language]);

    const t = (key: string, params?: Record<string, string>) => {
        const lang = language || 'es'; // Default to Spanish if null
        let text = TRANSLATIONS[lang]?.[key] || key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
