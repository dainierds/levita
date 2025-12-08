import React from 'react';
import { Music, BookOpen, Mic } from 'lucide-react';

export const OrderView: React.FC = () => {
    const items = [{ time: '10:00 AM', title: 'Bienvenida', icon: <Mic /> }, { time: '11:00 AM', title: 'Mensaje', icon: <BookOpen /> }];
    return (
        <div className="max-w-3xl mx-auto py-4 relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2 bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-dark-pressed rounded-full" />
            <div className="space-y-12">
                {items.map((item, index) => (
                    <div key={index} className="flex md:justify-between items-center w-full">
                        <div className="w-full pl-20 md:pl-0 md:w-5/12">
                            <div className="p-6 rounded-[2rem] bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark hover:-translate-y-1 transition-transform">
                                <h3 className="font-bold text-lg dark:text-gray-200">{item.title}</h3>
                                <span className="text-xs font-bold text-brand-500">{item.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
