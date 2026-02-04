import React from 'react';
import { Calendar } from 'lucide-react';
import { ChurchEvent } from '../types';

interface EventStoryCardProps {
    event: ChurchEvent;
    index: number;
    onClick?: (eventId: string) => void;
}

const EventStoryCard: React.FC<EventStoryCardProps> = ({ event, index, onClick }) => {
    const imgUrl = event.imageUrl || `https://images.unsplash.com/photo-${index % 2 === 0 ? '1470225620780-dba8ba36b745' : '1438232992991-995b7058bbb3'}?auto=format&fit=crop&q=80&w=400`;
    const dateObj = new Date(event.date + 'T00:00:00');
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');

    const renderBadge = () => {
        switch (event.storyStyle) {
            case 'diagonal':
                return (
                    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden z-20 pointer-events-none">
                        <div className="absolute top-0 left-0 bg-[#D32F2F] text-white py-1.5 w-[200%] text-center font-bold text-[9px] uppercase tracking-widest shadow-lg -rotate-45 -translate-x-1/3 translate-y-4">
                            {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()} | {event.time}
                        </div>
                    </div>
                );
            case 'centered':
                return (
                    <div className="absolute inset-x-0 top-10 flex flex-col items-center justify-center text-white z-10 drop-shadow-2xl">
                        <span className="text-6xl font-black tracking-tighter leading-none mb-1">{day}</span>
                        <span className="text-xs font-black opacity-90 uppercase tracking-[0.3em] bg-black/20 backdrop-blur-sm px-3 py-1 rounded-sm border border-white/10">
                            {month} | {event.time}
                        </span>
                    </div>
                );
            case 'boxed':
                return (
                    <div className="absolute top-4 right-4 bg-slate-800/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-white z-10 shadow-xl flex flex-col items-center min-w-[60px]">
                        <span className="text-[9px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">
                            {dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-2xl font-black leading-none mb-1">{day}</span>
                        <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                            {month} • {event.time}
                        </span>
                    </div>
                );
            case 'glass':
                return null; // Handled in content
            case 'bottom':
                return null; // Handled in the content area with a gradient
            case 'pill':
            default:
                return (
                    <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wide z-10">
                        {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')} • {event.time}
                    </div>
                );
        }
    };

    return (
        <div
            onClick={() => onClick && onClick(event.id)}
            className={`relative w-36 h-56 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-slate-900 snap-start shadow-md group border border-slate-100/10 cursor-pointer transition-transform active:scale-95`}
        >
            <div className="absolute inset-0 bg-slate-900 animate-pulse"></div>
            <img src={imgUrl} alt="" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
            <div className={`absolute inset-0 flex flex-col justify-end p-4 z-10 ${event.storyStyle === 'bottom' ? 'bg-gradient-to-t from-black/95 via-black/40 to-transparent' :
                    event.storyStyle === 'boxed' ? 'bg-gradient-to-t from-black/90 via-transparent to-transparent' :
                        'bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80'
                }`} />

            {renderBadge()}

            {/* Content */}
            <div className={`absolute inset-0 flex flex-col justify-end p-4 z-10`}>
                <p className="text-white text-base font-bold leading-tight drop-shadow-md mb-1 line-clamp-3">
                    {event.title}
                </p>
                {(event.storyStyle === 'bottom' || event.storyStyle === 'glass') && (
                    <div className={`${event.storyStyle === 'glass' ? 'bg-white/10 backdrop-blur-md border-t border-white/10 -mx-4 -mb-4 p-3 flex justify-center mt-2' : 'text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm'}`}>
                        <span className={event.storyStyle === 'glass' ? 'text-[10px] font-black text-white uppercase tracking-widest' : ''}>
                            {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')} • {event.time}
                        </span>
                    </div>
                )}
                {event.storyStyle === 'boxed' && (
                    <div className="text-white/60 text-[9px] uppercase font-bold tracking-[0.2em] mt-1">
                        {dateObj.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase()}
                    </div>
                )}
                {event.storyStyle === 'pill' && (
                    <div className="flex items-center gap-1 text-white/70 text-[9px] uppercase font-bold tracking-wider mt-1">
                        <Calendar size={10} />
                        <span>Evento</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventStoryCard;
