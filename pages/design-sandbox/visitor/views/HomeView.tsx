import React from 'react';
import { PlayCircle, Calendar, ArrowRight, HeartHandshake } from 'lucide-react';
import { ViewState } from '../types';

interface HomeViewProps { onNavigate: (view: ViewState) => void; }

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-1 rounded-[2.5rem] shadow-neu dark:shadow-neu-dark">
                <div className="relative overflow-hidden rounded-[2.3rem] h-80 bg-neu-base dark:bg-neu-base-dark p-8 md:p-12 flex flex-col justify-center">
                    <div className="absolute inset-0 z-0"><img src="https://picsum.photos/1000/500?grayscale" className="w-full h-full object-cover opacity-20" /><div className="absolute inset-0 bg-gradient-to-r from-neu-base via-neu-base/80 to-transparent dark:from-neu-base-dark dark:via-neu-base-dark/80" /></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center space-x-2 mb-4"><span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span><span className="text-red-500 font-bold text-xs uppercase">En Vivo Ahora</span></div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-700 dark:text-gray-100 mb-4">Culto Dominical</h2>
                        <button onClick={() => onNavigate(ViewState.LIVE)} className="flex items-center space-x-3 px-8 py-4 bg-neu-base dark:bg-neu-base-dark text-brand-500 font-bold rounded-2xl shadow-neu dark:shadow-neu-dark hover:text-brand-600 active:shadow-neu-pressed transition-all"><PlayCircle size={24} /><span>Ver Transmisión</span></button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform">
                    <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-orange-500 mb-6"><HeartHandshake size={28} /></div>
                    <h3 className="text-xl font-bold mb-2">Devocional</h3>
                    <p className="text-gray-500 mb-6">"La fe es la certeza de lo que se espera..."</p>
                </div>
                <div className="relative bg-brand-500 p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark overflow-hidden">
                    <h3 className="relative text-2xl font-bold text-white mb-2">Ofrendar</h3>
                    <button className="relative w-full py-4 mt-8 bg-brand-600 rounded-xl font-bold text-white shadow-[5px_5px_10px_rgba(0,0,0,0.2),-5px_-5px_10px_rgba(255,255,255,0.1)] active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.2)]">Dar Ahora</button>
                </div>
            </div>
        </div>
    );
};
