import React from 'react';
import { Music, BookOpen, Mic, Coffee } from 'lucide-react';

export const OrderView: React.FC = () => {
    const items = [
        { time: '10:00 AM', title: 'Bienvenida', type: 'general', icon: <Mic size={20} /> },
        { time: '10:15 AM', title: 'Alabanza', type: 'music', icon: <Music size={20} /> },
        { time: '10:45 AM', title: 'Anuncios', type: 'general', icon: <Mic size={20} /> },
        { time: '11:00 AM', title: 'Mensaje', type: 'sermon', icon: <BookOpen size={20} /> },
        { time: '11:45 AM', title: 'Ministración', type: 'music', icon: <Music size={20} /> },
        { time: '12:00 PM', title: 'Café', type: 'break', icon: <Coffee size={20} /> },
    ];

    return (
        <div className="max-w-3xl mx-auto py-4">

            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-gray-800 dark:text-gray-200">Orden del Culto</h2>
                <div className="inline-block mt-2 px-6 py-2 rounded-full shadow-neu-pressed dark:shadow-neu-dark-pressed text-brand-500 font-bold text-sm">
                    Domingo, 12 de Octubre
                </div>
            </div>

            <div className="relative">
                {/* The Track (Pressed Line) */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2 md:-ml-1 bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-dark-pressed rounded-full" />

                <div className="space-y-12">
                    {items.map((item, index) => {
                        // For desktop alternate left/right
                        const isRight = index % 2 === 0;
                        const isActive = index === 3; // Mock active state

                        return (
                            <div key={index} className={`flex md:justify-between items-center w-full ${isRight ? 'flex-row-reverse' : ''}`}>

                                {/* Empty space for desktop layout balance */}
                                <div className="hidden md:block w-5/12" />

                                {/* The Node (Circle on track) */}
                                <div className="absolute left-8 md:left-1/2 md:-ml-3 w-6 h-6 rounded-full border-4 border-neu-base dark:border-neu-base-dark shadow-neu dark:shadow-neu-dark bg-brand-500 z-10 flex items-center justify-center">
                                    {isActive && <div className="w-full h-full rounded-full bg-white animate-ping opacity-75"></div>}
                                </div>

                                {/* Content Card */}
                                <div className="w-full pl-20 md:pl-0 md:w-5/12">
                                    <div className={`
                            p-6 rounded-[2rem] transition-all duration-300
                            ${isActive
                                            ? 'bg-brand-500 text-white shadow-[8px_8px_16px_rgba(109,93,252,0.4),-8px_-8px_16px_rgba(255,255,255,0.5)]'
                                            : 'bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark hover:-translate-y-1'
                                        }
                        `}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {item.title}
                                            </h3>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {item.time}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 opacity-80">
                                            {item.icon}
                                            <span className="text-sm font-medium capitalize tracking-wide">{item.type}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
