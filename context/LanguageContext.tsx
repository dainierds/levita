import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en' | null;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Simple dictionary for the demo
const TRANSLATIONS: Record<string, Record<string, string>> = {
    es: {
        'welcome': 'Bienvenido a Levita',
        'select_lang': 'Selecciona tu idioma',
        'visitor': 'Soy Visitante',
        'member': 'Soy Miembro / Líder',
        'admin': 'Soy Administrador',
        'login': 'Iniciar Sesión',
        'email': 'Correo Electrónico',
        'password': 'Contraseña',
        'enter': 'Entrar',
        'back': 'Volver',
        'church_os': 'Sistema Operativo para Iglesias',
    },
    en: {
        'welcome': 'Welcome to Levita',
        'select_lang': 'Select your language',
        'visitor': 'I am a Visitor',
        'member': 'I am a Member / Leader',
        'admin': 'I am an Administrator',
        'login': 'Login',
        'email': 'Email',
        'password': 'Password',
        'enter': 'Enter',
        'back': 'Back',
        'church_os': 'Church Operating System',
    }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(null);

    const t = (key: string) => {
        if (!language) return key;
        return TRANSLATIONS[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
