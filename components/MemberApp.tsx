import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../types';
import { MapPin, Calendar, Clock, Radio, ChevronRight, Share2, Globe, Bell, User, Mic2, Heart, UserCheck, List, Gift, Play, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// --- SUB-COMPONENTS ---

const QuickActionsGrid = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-2 md:grid-cols-4 gap-4 px-6 mb-8">
      <button className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform">
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
          <Globe size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Traducción</span>
      </button>
      <button className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Gift size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Donaciones</span>
      </button>
      <button onClick={() => navigate('/miembro/liturgia')} className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform">
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
          <List size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Programa</span>
      </button>
      <button onClick={() => navigate('/miembro/oracion')} className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform">
        <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
          <Heart size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">Oración</span>
      </button>
    </div>
  );
};

const EventStoryCard = ({ event, index }: { event: ChurchEvent, index: number }) => {
  const colors = ["bg-indigo-600", "bg-pink-600", "bg-orange-500", "bg-emerald-500", "bg-purple-600", "bg-blue-600"];
  const color = colors[index % colors.length];
  // Removed uppercase to match refined look if needed, but keeping for now.
  // The screenshot shows "Culto Joven", "Clase de Mú...". Not entirely uppercase. 
  // Adjusting formatting.

  return (
    <div className={`relative w-40 h-64 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-slate-900 snap-start shadow-md group`}>
      <div className="absolute inset-0 bg-slate-900 animate-pulse"></div>
      <img src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1470225620780-dba8ba36b745' : '1438232992991-995b7058bbb3'}?auto=format&fit=crop&q=80&w=400`} alt="" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Circle Badge (Like Instagram Story) */}
      <div className="absolute top-3 left-3 p-[2px] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500">
        <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
          <img src={`https://images.unsplash.com/photo-${index % 2 === 0 ? '1470225620780-dba8ba36b745' : '1438232992991-995b7058bbb3'}?auto=format&fit=crop&q=80&w=100`} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <p className="text-white text-lg font-bold leading-tight drop-shadow-md mb-1 line-clamp-2">
          {event.title}
        </p>
      </div>
    </div>
  );
};

interface MemberAppProps {
  activePlan?: ServicePlan;
  events: ChurchEvent[];
  onLoginRequest: () => void;
  nextPreacher?: string;
  settings?: ChurchSettings;
}

const MemberApp: React.FC<MemberAppProps> = ({ activePlan, events, onLoginRequest, nextPreacher = 'Por definir', settings }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Filter events
  const activeEvents = events.filter(e => e.activeInBanner && (e.targetAudience === 'PUBLIC' || e.targetAudience === 'MEMBERS_ONLY'));
  const address = settings?.address;

  // Global Team
  const globalActiveTeam = settings?.teams?.find(t => t.id === settings.activeTeamId);
  const displayTeam = globalActiveTeam ? {
    teamName: globalActiveTeam.name,
    preacher: globalActiveTeam.members.preacher,
    musicDirector: globalActiveTeam.members.musicDirector || (globalActiveTeam.members as any).worshipLeader,
    audioOperator: globalActiveTeam.members.audioOperator,
    elder: globalActiveTeam.members.elder
  } : (activePlan?.team || null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 pt-2">

      {/* Stories Carousel */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className="font-bold text-slate-900 text-lg tracking-tight">Historias Destacadas</h3>
          <span onClick={() => navigate('/miembro/eventos')} className="text-indigo-600 text-xs font-bold cursor-pointer">Ver todo</span>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-4 snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>
          {activeEvents.length > 0 ? activeEvents.map((event, i) => (
            <EventStoryCard key={event.id} event={event} index={i} />
          )) : (
            <div className="w-full text-center py-10 text-slate-400 text-sm font-bold bg-slate-50 rounded-3xl mx-6 border-dashed border-2 border-slate-200">
              No hay historias
            </div>
          )}
        </div>
      </div>

      <QuickActionsGrid />

      <div className="px-6 space-y-6">
        {/* Live Stream Card */}
        <div className="w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200 aspect-video relative group">
          {activePlan?.isActive ? (
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">{t('member.offline')}</p>
              </div>
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold">
                OFFLINE
              </div>
            </>
          )}
          {activePlan?.isActive && (
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

        {/* Team Info Card */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-10 -translate-y-10 opacity-50" />

          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 relative z-10">
            <UserCheck size={20} className="text-indigo-600" />
            <span className="text-lg">{displayTeam?.teamName || 'Equipo de Hoy'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Predicador</p>
              <p className="font-bold text-slate-800 text-sm truncate">{displayTeam?.preacher || '---'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Anciano</p>
              <p className="font-bold text-slate-800 text-sm truncate">{displayTeam?.elder || '---'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Música</p>
              <p className="font-bold text-slate-800 text-sm truncate">{displayTeam?.musicDirector || '---'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Audio</p>
              <p className="font-bold text-slate-800 text-sm truncate">{displayTeam?.audioOperator || '---'}</p>
            </div>
          </div>
        </div>

        {/* Prayer Request Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Heart className="text-white fill-white" size={20} />
              </div>
              <h3 className="font-bold text-lg">Petición de Oración</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">
              ¿Necesitas apoyo espiritual? Envíanos tu petición y nuestro equipo orará por ti.
            </p>
            <button
              onClick={() => navigate('/miembro/oracion')}
              className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span>Enviar Petición</span>
              <List size={16} className="rotate-0" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


