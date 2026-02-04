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
            case 'poster':
                return (
                    <div className="absolute top-4 left-4 text-white leading-none drop-shadow-md z-10 font-sans">
                        <span className="text-4xl font-bold block tracking-tighter shadow-black/20">{day}</span>
                        <span className="text-[10px] font-bold opacity-90 uppercase tracking-widest">{month} • {event.time}</span>
                    </div>
                );
            case 'ribbon':
                return (
                    <div className="absolute top-6 left-0 bg-[#D32F2F] text-white px-3 py-1 font-bold text-[10px] shadow-lg uppercase tracking-wider z-10 rounded-r-md">
                        {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()} | {event.time}
                    </div>
                );
            case 'banner':
                return (
                    <div className="absolute top-6 left-0 right-0 bg-white/95 backdrop-blur-sm py-2 flex justify-center items-center z-10 shadow-sm border-y border-white/50">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-900 tracking-widest uppercase">
                            {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')} • {event.time}
                        </span>
                    </div>
                );
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
            <div className={`absolute inset-0 flex flex-col justify-end p-4 z-10 ${event.storyStyle === 'bottom' ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent' : 'bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80'}`} />

            {renderBadge()}

            {/* Content */}
            <div className={`absolute inset-0 flex flex-col justify-end p-4 z-10`}>
                <p className="text-white text-base font-bold leading-tight drop-shadow-md mb-1 line-clamp-3">
                    {event.title}
                </p>
                {event.storyStyle === 'bottom' && (
                    <div className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm">
                        {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()} | {event.time}
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
