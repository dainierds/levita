import React from 'react';
import { useEvents } from '../../hooks/useEvents';
import { Calendar, Clock, MapPin } from 'lucide-react';

const EventosMiembro: React.FC = () => {
    const { events } = useEvents();

    // Filter active future events
    const activeEvents = events
        .filter(e => e.activeInBanner && new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    Próximos Eventos
                </h1>
            </div>

            <div className="space-y-4">
                {activeEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm">
                        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No hay eventos programados.</p>
                    </div>
                ) : (
                    activeEvents.map(event => (
                        <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 group hover:shadow-xl transition-all">
                            <div className={`h-2 w-full ${event.type === 'worship' ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                            <div className="p-6">
                                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3">
                                    {event.type}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{event.description}</p>

                                <div className="flex flex-col gap-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-orange-500" />
                                        <span className="font-medium">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-orange-500" />
                                        <span className="font-medium">{event.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventosMiembro;
