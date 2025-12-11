import React, { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, X, LayoutGrid, List } from 'lucide-react';

const EventosMiembro: React.FC = () => {
    const { events } = useEvents();
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    // Filter active events
    const allEvents = events.filter(e => e.activeInBanner);
    const upcomingEvents = allEvents
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- CALENDAR LOGIC ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const changeMonth = (increment: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };

    const handleEventClick = (event: any) => setSelectedEvent(event);

    const addToCalendar = (event: any, type: 'google' | 'apple') => {
        const startDate = new Date(event.date + 'T' + event.time);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours
        const text = encodeURIComponent(event.title);
        const details = encodeURIComponent(event.description || '');
        const location = encodeURIComponent(event.address || '');

        const iso = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

        if (type === 'google') {
            window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${iso(startDate)}/${iso(endDate)}&details=${details}&location=${location}`, '_blank');
        } else {
            // iCal logic
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
DTSTART:${iso(startDate)}
DTEND:${iso(endDate)}
LOCATION:${event.address || ''}
END:VEVENT
END:VCALENDAR`;
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${event.title}.ics`;
            a.click();
        }
    };

    const openDirections = (address?: string) => {
        if (!address) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };


    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentDate);
        const daysArray = Array.from({ length: days }, (_, i) => i + 1);
        const placeholders = Array.from({ length: firstDay }, (_, i) => i);

        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-gray-800 capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {placeholders.map(i => <div key={`p-${i}`} />)}
                    {daysArray.map(day => {
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayEvents = allEvents.filter(e => e.date === dateStr);
                        const hasEvent = dayEvents.length > 0;
                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                        return (
                            <div
                                key={day}
                                onClick={() => hasEvent && handleEventClick(dayEvents[0])}
                                className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer group
                                    ${Number(hasEvent)
                                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'
                                        : isToday ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-500 hover:bg-slate-50'}
                                `}
                            >
                                {day}
                                {hasEvent && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500 group-hover:bg-white transition-colors" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-6 max-w-5xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 flex-1 mr-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        Eventos
                    </h1>
                </div>
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex gap-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-3 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'calendar' ? renderCalendar() : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm">
                            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                            <p>No hay eventos futuros programados.</p>
                        </div>
                    ) : (
                        upcomingEvents.map(event => (
                            <div
                                key={event.id}
                                className="bg-white rounded-[2rem] p-4 shadow-xl border border-slate-100 flex flex-col gap-4 transform transition-all hover:-translate-y-1 hover:shadow-2xl"
                            >
                                {/* Image Header */}
                                <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-100">
                                    <img
                                        src={`https://api.dicebear.com/9.x/shapes/svg?seed=${event.id}&backgroundColor=f3f4f6,e5e7eb,d1d5db`}
                                        alt="Cover"
                                        className="object-cover w-full h-full opacity-90 hover:scale-110 transition-transform duration-700"
                                    />
                                    {/* Date Badge */}
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-lg px-3 py-1.5 rounded-xl text-center min-w-[3.5rem] border border-slate-100">
                                        <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short' }).replace('.', '')}
                                        </span>
                                        <span className="block text-xl font-black text-slate-800 leading-none mt-0.5">
                                            {new Date(event.date).getDate()}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur shadow text-slate-600 rounded-lg text-[10px] uppercase font-bold tracking-wide">
                                            {event.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="px-1">
                                    <h3 className="text-xl font-bold text-slate-800 leading-tight mb-3">
                                        {event.title}
                                    </h3>

                                    {/* Details grid/list */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <Clock size={16} className="text-indigo-500 shrink-0" />
                                            <span className="text-sm font-semibold text-slate-600">{event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <MapPin size={16} className="text-orange-500 shrink-0" />
                                            <span className="text-sm font-semibold text-slate-600 truncate">
                                                {event.placeName || 'Ubicación por definir'}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 italic mb-4 line-clamp-2 min-h-[40px]">
                                        {event.description || 'Sin descripción disponible.'}
                                    </p>

                                    {/* Actions */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => addToCalendar(event, 'google')}
                                                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            >
                                                <Calendar size={16} className="mb-1 text-slate-400" />
                                                Google
                                            </button>
                                            <button
                                                onClick={() => addToCalendar(event, 'apple')}
                                                className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            >
                                                <Calendar size={16} className="mb-1 text-slate-400" />
                                                Apple/iCal
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => openDirections(event.address)}
                                            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MapPin size={16} />
                                            Cómo llegar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Calendar Modal Logic (kept if user switches to calendar view and clicks event) */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-20"
                            aria-label="Cerrar"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>

                        <div className="mb-6">
                            <div className="w-full h-40 rounded-2xl bg-slate-100 mb-4 overflow-hidden relative">
                                <img
                                    src={`https://api.dicebear.com/9.x/shapes/svg?seed=${selectedEvent.id}&backgroundColor=f3f4f6,e5e7eb,d1d5db`}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-700">
                                    {selectedEvent.type}
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{selectedEvent.title}</h2>
                            <p className="text-slate-500">{selectedEvent.description}</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
                                    <p className="font-semibold capitalize">
                                        {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Hora</p>
                                    <p className="font-semibold">{selectedEvent.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Lugar</p>
                                    <p className="font-semibold">{selectedEvent.placeName || 'Ubicación por definir'}</p>
                                    <p className="text-xs text-slate-400 max-w-[200px] truncate">{selectedEvent.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => addToCalendar(selectedEvent, 'google')}
                                className="col-span-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Agendar
                            </button>
                            <button
                                onClick={() => openDirections(selectedEvent.address)}
                                className="col-span-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                Cómo llegar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventosMiembro;
