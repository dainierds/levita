import React from 'react';
import { MapPin, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { EventItem } from '../types';

export const EventsView: React.FC = () => {
  const events: EventItem[] = [
    {
      id: '1',
      title: 'Retiro Espiritual',
      date: '15 Oct',
      time: '08:00 AM',
      location: 'Monte Sinaí',
      image: 'https://picsum.photos/400/250?random=1'
    },
    {
      id: '2',
      title: 'Noche de Adoración',
      date: '22 Oct',
      time: '07:00 PM',
      location: 'Auditorio',
      image: 'https://picsum.photos/400/250?random=2'
    },
    {
      id: '3',
      title: 'Escuela Bíblica',
      date: '05 Nov',
      time: '09:00 AM',
      location: 'Salón Niños',
      image: 'https://picsum.photos/400/250?random=3'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-neu-base dark:bg-neu-base-dark p-2 rounded-[2rem] shadow-neu dark:shadow-neu-dark mb-8 w-full md:w-max mx-auto md:mx-0">
         <div className="flex space-x-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-6 py-3 rounded-full bg-brand-500 text-white font-bold shadow-neu-sm text-sm transition-transform active:scale-95">Lista</button>
            <button className="flex-1 sm:flex-none px-6 py-3 rounded-full text-gray-500 font-bold hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors text-sm">Calendario</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <div key={event.id} className="group bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark p-4 transition-all duration-300 hover:-translate-y-2">
            
            {/* Image Container with inner shadow for depth */}
            <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-neu-pressed dark:shadow-neu-dark-pressed p-1">
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-full object-cover rounded-[1.8rem] opacity-90 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-neu-base/90 dark:bg-neu-base-dark/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg flex flex-col items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">{event.date.split(' ')[1]}</span>
                <span className="text-xl font-black text-gray-800 dark:text-gray-100">{event.date.split(' ')[0]}</span>
              </div>
            </div>
            
            <div className="p-4 mt-2">
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{event.title}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center p-3 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark">
                  <div className="p-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-500 mr-3">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{event.time}</span>
                </div>
                
                <div className="flex items-center p-3 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 mr-3">
                    <MapPin size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{event.location}</span>
                </div>
              </div>

              <button className="mt-6 w-full py-4 rounded-xl font-bold text-brand-500 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed hover:text-brand-600 transition-all">
                Registrarme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};