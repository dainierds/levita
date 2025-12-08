import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './views/HomeView';
import { LiveView } from './views/LiveView';
import { EventsView } from './views/EventsView';
import { OrderView } from './views/OrderView';
import { ViewState } from './types';
import { Menu, Bell, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisitorMockApp: React.FC = () => {
    const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const navigate = useNavigate();

    // Handle Dark Mode Class
    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // Cleanup on unmount (optional, to reset to light mode when leaving sandbox)
        return () => document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const renderContent = () => {
        switch (activeView) {
            case ViewState.HOME: return <HomeView onNavigate={setActiveView} />;
            case ViewState.LIVE: return <LiveView />;
            case ViewState.EVENTS: return <EventsView />;
            case ViewState.ORDER: return <OrderView />;
            case ViewState.PRAYER: return <div className="text-center p-10 font-bold text-gray-400">Prayer View Placeholder</div>;
            case ViewState.PROFILE: return <div className="text-center p-10 font-bold text-gray-400">Profile View Placeholder</div>;
            default: return <HomeView onNavigate={setActiveView} />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-neu-base dark:bg-neu-base-dark font-sans text-gray-600 dark:text-gray-300">
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} activeView={activeView} onNavigate={setActiveView} userName="Usuario" userEmail="user@email.com" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-24 flex items-center justify-between px-6 lg:px-10 z-10 shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-4 rounded-xl shadow-neu active:shadow-neu-pressed mr-4">
                            <Menu size={24} />
                        </button>
                        <h1 className="hidden md:block text-2xl font-extrabold text-gray-700 dark:text-gray-200">{activeView === ViewState.HOME ? 'Inicio' : activeView}</h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-14 h-8 rounded-full shadow-neu-pressed flex items-center px-1 transition-all">
                            <div className={`w-6 h-6 rounded-full bg-brand-500 shadow-md flex items-center justify-center text-white transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`}>
                                {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
                            </div>
                        </button>
                        <button className="p-4 rounded-full shadow-neu active:shadow-neu-pressed text-gray-500 dark:text-gray-400">
                            <Bell size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/design')}
                            className="p-4 rounded-full shadow-neu active:shadow-neu-pressed text-red-400 hover:text-red-500"
                            title="Salir del Sandbox"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 scroll-smooth no-scrollbar">
                    <div className="max-w-7xl mx-auto py-6">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};
export default VisitorMockApp;
