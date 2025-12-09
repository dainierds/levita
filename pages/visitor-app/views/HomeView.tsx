import { PlayCircle, Calendar, ArrowRight, List, Heart, MapPin, Facebook, Instagram, Youtube, Clock } from 'lucide-react';
import { ViewState } from '../types';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../../types';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  events?: ChurchEvent[];
  nextPlan?: ServicePlan | null;
  settings?: ChurchSettings | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, events = [], nextPlan, settings }) => {
  // Get upcoming events (limit 2)
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const heroDate = nextPlan
    ? new Date(nextPlan.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Domingo';

  const heroTime = nextPlan?.startTime || '10:00 AM';
  const preacherName = nextPlan?.team?.preacher || 'Pastor Principal';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Hero Section - A clean, extruded card */}
      <div className="p-1 rounded-[2.5rem] shadow-neu dark:shadow-neu-dark">
        <div className="relative overflow-hidden rounded-[2.3rem] h-80 bg-neu-base dark:bg-neu-base-dark">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://picsum.photos/1000/500?grayscale"
              alt="Church"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neu-base via-neu-base/80 to-transparent dark:from-neu-base-dark dark:via-neu-base-dark/80" />
          </div>
          {/* Card 1: Orden de Culto (Was Devocional) */}
          <div
            onClick={() => onNavigate(ViewState.ORDER)}
            className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-orange-500 mb-6 group-hover:text-orange-600">
              <List size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Orden de Culto</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Sigue la liturgia y el programa del servicio de hoy.
            </p>
            <button className="flex items-center text-orange-500 font-bold text-sm hover:opacity-80 transition-opacity">
              VER ORDEN <ArrowRight size={16} className="ml-2" />
            </button>
          </div>

          {/* Card 2: Próximos Eventos (Was Esta Semana) */}
          <div
            onClick={() => onNavigate(ViewState.EVENTS)}
            className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-brand-500 mb-6">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">Próximos Eventos</h3>
            <ul className="space-y-4 text-gray-500 dark:text-gray-400 mb-6">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(evt => (
                  <li key={evt.id} className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700/50 last:border-0">
                    <span className="truncate max-w-[120px]">{evt.title}</span>
                    <span className="font-bold text-xs bg-brand-500 text-white px-2 py-1 rounded-md shadow-sm">
                      {new Date(evt.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm italic opacity-70">No hay eventos próximos</li>
              )}
            </ul>
          </div>

          {/* Card 3: Petición de Oración (Was Ofrendar) */}
          <div
            onClick={() => onNavigate(ViewState.PRAYER)}
            className="relative bg-brand-500 p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 overflow-hidden cursor-pointer"
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 -left-10 w-40 h-40 bg-indigo-900 opacity-20 rounded-full blur-2xl"></div>

            <div className="relative w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white mb-6">
              <Heart size={28} fill="currentColor" />
            </div>

            <h3 className="relative text-2xl font-bold text-white mb-2">Petición de Oración</h3>
            <p className="relative text-indigo-100 mb-8 leading-relaxed opacity-90">
              Estamos aquí para orar por ti. Comparte tu petición con nosotros.
            </p>
            <button className="relative w-full py-4 bg-brand-600 rounded-xl font-bold text-white shadow-[5px_5px_10px_rgba(0,0,0,0.2),-5px_-5px_10px_rgba(255,255,255,0.1)] active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.2)] transition-all">
              Enviar Petición
            </button>
          </div>

          {/* Card 4: Nuestra Iglesia (Info) */}
          <div className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-indigo-500 mb-6">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">{settings?.churchName || 'Nuestra Iglesia'}</h3>

            <div className="space-y-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>{settings?.address || 'Dirección no disponible'}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700/50 pt-4 mt-4">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Clock size={14} /> Horarios</h4>
                <ul className="space-y-1">
                  {settings?.meetingDays?.map(day => (
                    <li key={day} className="flex justify-between">
                      <span>{day}</span>
                      <span className="font-bold">{settings.meetingTimes[day] || 'TBA'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {settings?.socials?.facebook && (
                <a href={settings.socials.facebook} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-blue-600 hover:text-blue-700">
                  <Facebook size={18} />
                </a>
              )}
              {settings?.socials?.instagram && (
                <a href={settings.socials.instagram} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-pink-600 hover:text-pink-700">
                  <Instagram size={18} />
                </a>
              )}
              {settings?.socials?.youtube && (
                <a href={settings.socials.youtube} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-red-600 hover:text-red-700">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
      );
};