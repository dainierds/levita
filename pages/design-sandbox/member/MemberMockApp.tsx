import React, { useState } from 'react';
import {
    Home, Video, List, Heart, User,
    Bell, Menu, X, Calendar, LogOut, Mic
} from 'lucide-react';
import { MOCK_USER, MOCK_EVENTS } from '../mockData';

const MockMemberDashboard = () => (
    <div className="p-4 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
        <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-slate-900">Bienvenido, {MOCK_USER.name.split(' ')[0]}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Iglesia Demo</p>
        </div>

        {/* Carousel Banner */}
        <div className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden h-48 flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <Calendar size={120} className="transform rotate-12 -mr-8 -mt-8" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <Mic size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Próximo Evento</span>
                </div>
                <h2 className="text-3xl font-bold mb-2 leading-tight">{MOCK_EVENTS[0].title}</h2>
                <p className="text-sm opacity-90 mb-4 font-medium leading-snug max-w-[80%]">{MOCK_EVENTS[0].description}</p>
                <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                    <Calendar size={14} />
                    <span>{MOCK_EVENTS[0].date}</span>
                </div>
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { color: 'bg-blue-500', shadow: 'shadow-blue-200', icon: Video, title: 'Transmisión En Vivo', sub: 'Ver culto en directo' },
                { color: 'bg-purple-500', shadow: 'shadow-purple-200', icon: List, title: 'Liturgia', sub: 'Orden del servicio actual' },
                { color: 'bg-green-500', shadow: 'shadow-green-200', icon: Heart, title: 'Peticiones', sub: 'Envía tu motivo de oración' },
                { color: 'bg-orange-500', shadow: 'shadow-orange-200', icon: Calendar, title: 'Eventos', sub: 'Calendario de actividades' },
            ].map((item, idx) => (
                <button key={idx} className={`${item.color} ${item.shadow} rounded-3xl p-6 text-left text-white shadow-lg hover:scale-[1.01] transition-transform relative overflow-hidden h-32 flex flex-col justify-between`}>
                    <div>
                        <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-2"><item.icon size={16} /></div>
                        <h3 className="font-bold text-lg leading-none">{item.title}</h3>
                    </div>
                    <p className="text-xs opacity-80 font-medium">{item.sub}</p>
                </button>
            ))}
        </div>
    </div>
);


const MemberMockApp: React.FC = () => {
    const [view, setView] = useState('inicio');
    const [menuOpen, setMenuOpen] = useState(false);

    const renderView = () => {
        switch (view) {
            case 'inicio': return <MockMemberDashboard />;
            default: return <div className="p-10 text-center text-slate-400">Prototipo en construcción: {view}</div>;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg z-40 flex items-center justify-between px-4">
                <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-lg"><Menu className="w-6 h-6" /></button>
                <h1 className="text-lg font-bold capitalize">{view}</h1>
                <div className="flex items-center gap-3">
                    <button className="relative p-2 hover:bg-white/10 rounded-lg">
                        <Bell className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/20">
                        {MOCK_USER.name.charAt(0)}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pt-16 pb-16 bg-gray-50">{renderView()}</main>

            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg z-40">
                <div className="flex h-full">
                    {[
                        { id: 'inicio', icon: Home, label: 'Inicio' },
                        { id: 'envivo', icon: Video, label: 'En Vivo' },
                        { id: 'liturgia', icon: List, label: 'Liturgia' },
                        { id: 'oracion', icon: Heart, label: 'Oración' },
                        { id: 'perfil', icon: User, label: 'Perfil' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 ${view === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default MemberMockApp;
