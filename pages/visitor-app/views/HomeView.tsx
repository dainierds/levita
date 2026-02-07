import React from 'react';
import { ViewState } from '../types';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../../types';
import { Globe, Gift, List, Heart, MapPin, ChevronRight, UserCheck, Radio, Calendar, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import EventStoryCard from '../../../components/EventStoryCard';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  onEventSelect?: (eventId: string) => void;
  events?: ChurchEvent[];
  nextPlan?: ServicePlan | null;
  settings?: ChurchSettings | null;
}

// --- SUB-COMPONENTS (Copied & Adapted from MemberApp to maintain consistency) ---

const QuickActionsGrid: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  return (
    <div className="grid grid-cols-2 gap-4 px-6 mb-8">
      <button
        onClick={() => onNavigate(ViewState.TRANSLATION)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
          <Globe size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Traducción</span>
      </button>

      <button
        onClick={() => window.open('https://adventistgiving.org/donate/ANTBRS', '_blank')}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Gift size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Donaciones</span>
      </button>

      <button
        onClick={() => onNavigate(ViewState.ORDER)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
          <List size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Programa</span>
      </button>

      <button
        onClick={() => onNavigate(ViewState.PRAYER)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
          <Heart size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Oración</span>
      </button>
    </div>
  );
};


export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onEventSelect, events = [], nextPlan, settings }) => {

  // ... (Data logic remains unchanged) ...
  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today && e.activeInBanner && (e.targetAudience === 'PUBLIC' || e.targetAudience === 'MEMBERS_ONLY');
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const address = settings?.address;
  const globalActiveTeam = settings?.teams?.find(t => t.id === settings.activeTeamId);
  const displayTeam = globalActiveTeam ? {
    teamName: globalActiveTeam.name,
    preacher: globalActiveTeam.members.preacher,
    musicDirector: globalActiveTeam.members.musicDirector || (globalActiveTeam.members as any).worshipLeader,
    audioOperator: globalActiveTeam.members.audioOperator,
    elder: globalActiveTeam.members.elder
  } : (nextPlan?.team || null);


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 pt-2">

      {/* HERO SECTION: Next Service & Preacher */}
      <div className="mx-6 mb-8 mt-2 relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/30 group">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-800 bg-[length:200%_200%] animate-[gradient_6s_ease-in-out_infinite]"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative p-8 text-center text-white">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            Próximo Servicio
          </div>

          {/* Preacher Name */}
          <div className="mb-8 relative">
            <h2 className="text-4xl font-black mb-2 leading-none tracking-tight drop-shadow-md">
              {displayTeam?.preacher?.split(' ')[0] || (settings?.pastorName?.split(' ')[0] || 'Invitado')}
            </h2>
            {displayTeam?.preacher?.split(' ').length > 1 && (
              <p className="text-lg font-bold opacity-90 leading-none mb-1">{displayTeam.preacher.split(' ').slice(1).join(' ')}</p>
            )}
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
              Predicador
            </p>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-px bg-white/20 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
            <div className="bg-black/20 p-3 flex flex-col justify-center">
              <span className="text-xl font-bold leading-none mb-1">
                {nextPlan ? new Date(nextPlan.date + 'T00:00:00').getDate() : new Date().getDate()}
              </span>
              <span className="text-[9px] font-bold uppercase opacity-70">
                {nextPlan ? new Date(nextPlan.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() : 'HOY'}
              </span>
            </div>
            <div className="bg-black/20 p-3 flex flex-col justify-center">
              <span className="text-xl font-bold leading-none mb-1">
                {nextPlan?.startTime || settings?.meetingTimes?.['Sábado'] || '09:00'}
              </span>
              <span className="text-[9px] font-bold uppercase opacity-70">Hora</span>
            </div>
          </div>

          {displayTeam?.elder && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 opacity-80">
              <UserCheck size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Anciano: {displayTeam.elder.split(' ')[0]}</span>
            </div>
          )}

        </div>
      </div>

      {/* Stories Carousel Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className="font-bold text-slate-900 text-lg tracking-tight">Próximos Eventos</h3>
          <span onClick={() => onNavigate(ViewState.EVENTS)} className="text-indigo-600 text-xs font-bold cursor-pointer">Ver todo</span>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
            <EventStoryCard
              key={event.id}
              event={event}
              index={i}
              onClick={(id) => onEventSelect && onEventSelect(id)}
            />
          )) : (
            <div className="w-full text-center py-10 text-slate-400 text-sm font-bold bg-slate-50 rounded-3xl mx-6 border-dashed border-2 border-slate-200">
              No hay historias
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <QuickActionsGrid onNavigate={onNavigate} />

      {/* Main Vertical Content */}
      <div className="px-6 space-y-6">

        {/* Live Stream Card */}
        <div className="w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200 aspect-video relative group">
          {nextPlan?.isActive ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/live_stream?channel=UCjaxadventista7morenacersda63"
              title="Live Service"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 z-10"
            ></iframe>
          ) : (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Radio size={32} className="mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">OFFLINE</p>
                {nextPlan && (
                  <p className="text-[10px] text-slate-600 mt-1">Próximo: {new Date(nextPlan.date + 'T00:00:00').toLocaleDateString()} {nextPlan.startTime}</p>
                )}
              </div>
            </>
          )}
          {nextPlan?.isActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full z-20">
              <span className="text-[10px] font-bold text-white tracking-wider animate-pulse">EN VIVO</span>
            </div>
          )}
        </div>

        {/* Address Card */}
        {address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noreferrer"
            className="block bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 flex-shrink-0">
              <MapPin size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
              <p className="font-bold text-slate-800 text-sm line-clamp-1">{address}</p>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </a>
        )}


        {/* Socials Footer */}
        {settings?.socials && (
          <div className="flex justify-center gap-6 py-4 pb-8 opacity-50 grayscale hover:grayscale-0 transition-all">
            {settings.socials.facebook && (
              <a href={settings.socials.facebook} target="_blank" rel="noreferrer"><Facebook size={24} /></a>
            )}
            {settings.socials.instagram && (
              <a href={settings.socials.instagram} target="_blank" rel="noreferrer"><Instagram size={24} /></a>
            )}
            {settings.socials.youtube && (
              <a href={settings.socials.youtube} target="_blank" rel="noreferrer"><Youtube size={24} /></a>
            )}
          </div>
        )}

      </div>
    </div>
  );
};