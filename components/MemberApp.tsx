import React from 'react';
import { ChurchEvent, ServicePlan } from '../types';
import { MapPin, Calendar, Clock, Radio, ChevronRight, Share2, Globe, Bell, User, Mic2, Heart, UserCheck, List } from 'lucide-react';
import LiveTranslation from './LiveTranslation';
import { requestNotificationPermission, subscribeToPush, sendLocalNotification } from '../services/notificationService';

interface MemberAppProps {
  activePlan?: ServicePlan;
  events: ChurchEvent[];
  onLoginRequest: () => void;
  nextPreacher?: string;
  address?: string;
}

const MemberApp: React.FC<MemberAppProps> = ({ activePlan, events, onLoginRequest, nextPreacher = 'Por definir', address }) => {
  // Filter events for members (Public + Members Only)
  const activeEvents = events.filter(e => e.activeInBanner && (e.targetAudience === 'PUBLIC' || e.targetAudience === 'MEMBERS_ONLY'));

  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission>('default');
  const [showPrayerForm, setShowPrayerForm] = React.useState(false);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      await subscribeToPush();
      sendLocalNotification('¡Notificaciones Activadas!', 'Ahora recibirás alertas de nuevos eventos y servicios.');
    }
  };

  return (
    <div className="min-h-screen bg-white md:max-w-md md:mx-auto md:shadow-2xl md:my-8 md:rounded-[3rem] overflow-hidden relative pb-20">

      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">LEVITA</h1>
          <p className="text-xs text-slate-400 font-medium">Comunidad de Fe</p>
        </div>
        <div className="flex items-center gap-3">
          {notifPermission !== 'granted' && (
            <button onClick={handleEnableNotifications} className="p-2 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
              <Bell size={18} />
            </button>
          )}
          <button onClick={onLoginRequest} className="text-sm font-bold text-slate-300 hover:text-indigo-600">
            Salir
          </button>
        </div>
      </div>

      <div className="px-6 space-y-8 overflow-y-auto pb-24 h-[calc(100vh-100px)] no-scrollbar">

        {/* Live Stream / YouTube Embed */}
        <div className="w-full bg-black rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-300 aspect-video relative">
          {activePlan?.isActive ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/live_stream?channel=UCjaxadventista7morenacersda63"
              title="Live Service"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
              <Radio size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest">Fuera del Aire</p>
            </div>
          )}

          {activePlan?.isActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold text-white tracking-wider">EN VIVO</span>
            </div>
          )}
        </div>

        {/* Address Card */}
        {address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase">Ubicación</p>
              <p className="font-bold text-slate-700 line-clamp-1">{address}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </a>
        )}

        {/* Read-Only Service Plan */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-500" /> Equipo de Hoy
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Predicador</p>
              <p className="font-bold text-slate-700">{activePlan?.team.preacher || '---'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Anciano</p>
              <p className="font-bold text-slate-700">{activePlan?.team.elder || '---'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Audio</p>
              <p className="font-bold text-slate-700">{activePlan?.team.audioOperator || '---'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Música</p>
              <p className="font-bold text-slate-700">{activePlan?.team.musicDirector || '---'}</p>
            </div>
          </div>

          {/* Next Preacher for Members */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-400 uppercase">Próximo Predicador</p>
              <p className="font-bold text-indigo-900">{nextPreacher}</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <List size={18} className="text-pink-500" /> Orden del Culto
          </h3>
          <div className="space-y-3">
            {activePlan?.items.map((item, idx) => (
              <div key={item.id} className="flex gap-3 items-start">
                <span className="text-xs font-bold text-slate-300 mt-1">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-sm font-bold text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.durationMinutes} min • {item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-teal-500" /> Próximos Eventos
        </h3>
        <div className="space-y-4">
          {activeEvents.map(event => (
            <div key={event.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {event.type}
                </span>
                <h4 className="text-xl font-bold text-slate-800 mt-3 leading-snug">{event.title}</h4>
              </div>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
          ))}
          {activeEvents.length === 0 && (
            <div className="w-full text-center text-slate-400 italic py-4">No hay eventos anunciados.</div>
          )}
        </div>

        {/* Prayer Request */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-full"><Heart className="text-white fill-white" size={20} /></div>
            <h3 className="font-bold text-lg">Petición de Oración</h3>
          </div>

          {!showPrayerForm ? (
            <>
              <p className="text-indigo-100 text-sm mb-4">¿Necesitas apoyo? Envíanos tu petición y nuestro equipo orará por ti.</p>
              <button onClick={() => setShowPrayerForm(true)} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors">
                Enviar Petición
              </button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setShowPrayerForm(false); sendLocalNotification('Petición Enviada', 'Estaremos orando por ti.'); }} className="space-y-3">
              <textarea
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-indigo-200 outline-none focus:bg-white/20"
                placeholder="Escribe tu petición aquí..."
                rows={3}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPrayerForm(false)} className="flex-1 py-2 bg-transparent border border-white/30 text-white rounded-lg font-bold text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-white text-indigo-600 rounded-lg font-bold text-xs">Enviar</button>
              </div>
            </form>
          )}
        </div>

      </div>

      {/* Bottom Nav (Visual Only for PWA feel) */}
      <div className="absolute bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg rounded-full shadow-2xl shadow-slate-300 border border-slate-100 flex items-center justify-around px-4 md:hidden">
        <button className="p-2 text-indigo-600"><Calendar size={24} /></button>
        <button className="p-2 text-slate-300"><MapPin size={24} /></button>
        <button className="p-2 text-slate-300"><Share2 size={24} /></button>
      </div>

    </div>
  );
};

export default MemberApp;