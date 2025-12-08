import React from 'react';
import { MapPin, Clock } from 'lucide-react';

export const EventsView: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark p-4 hover:-translate-y-2 transition-transform">
                    <div className="h-48 rounded-[2rem] overflow-hidden shadow-neu-pressed dark:shadow-neu-dark-pressed p-1 mb-4"><img src={`https://picsum.photos/400/250?random=${i}`} className="w-full h-full object-cover rounded-[1.8rem]" /></div>
                    <div className="p-4">
                        <h3 className="text-xl font-bold mb-4 dark:text-gray-200">Evento {i}</h3>
                        <button className="w-full py-4 rounded-xl font-bold text-brand-500 bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed hover:text-brand-600 transition-colors">Ver Detalles</button>
                    </div>
                </div>
            ))}
        </div>
    );
};
