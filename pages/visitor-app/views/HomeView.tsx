import React from 'react';
import { PlayCircle, Calendar, ArrowRight, List, Heart, MapPin, Facebook, Instagram, Youtube, Clock, Globe, Gift } from 'lucide-react';
import { ViewState } from '../types';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../../types';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  events?: ChurchEvent[];
  nextPlan?: ServicePlan | null;
  settings?: ChurchSettings | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, events = [], nextPlan, settings }) => {
  // Get upcoming events (limit 5 for carousel)
  const upcomingEvents = events
    .filter(e => e.activeInBanner && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  /* Logic for Hero Data */
  const checkIsToday = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const dateWithOffset = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return dateWithOffset.toDateString() === today.toDateString();
  };

  const checkIsMeetingDay = () => {
    if (!settings?.meetingDays) return false;
    const dayOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = dayOrder[new Date().getDay()];
    return settings.meetingDays.includes(todayName as any);
  };

  // Live if Active AND (It's the specific Date OR It's a recurring Meeting Day)
  // OR if Manual "Go Live" override is on
  const isLive = settings?.isLive || ((nextPlan?.isActive && (checkIsToday(nextPlan.date) || checkIsMeetingDay())) || false);

  // Date rendering
  let heroDate = 'Domingo';
  let heroTime = '10:00 AM';

  if (settings?.meetingTimes) {
    const days = Object.keys(settings.meetingTimes);
    if (days.length > 0) {
      const dayOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const today = new Date();
      const currentDayIndex = today.getDay();

      let nextMeetingDayName = null;

      for (let i = 0; i < dayOrder.length; i++) {
        const checkIndex = (currentDayIndex + i) % 7;
        const dayName = dayOrder[checkIndex];
        if (days.includes(dayName)) {
          nextMeetingDayName = dayName;
          break;
        }
      }

      if (nextMeetingDayName) {
        heroDate = nextMeetingDayName;
        heroTime = settings.meetingTimes[nextMeetingDayName];
      } else {
        heroDate = days[0];
        heroTime = settings.meetingTimes[days[0]];
      }
    }
  } else if (nextPlan) {
    const dateObj = new Date(nextPlan.date);
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
    heroDate = adjustedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    heroTime = nextPlan.startTime;
  }

  // Preacher rendering
  let preacherName = 'Pastor Principal';
  if (settings?.activeTeamId && settings.teams) {
    const activeTeam = settings.teams.find(t => t.id === settings.activeTeamId);
    if (activeTeam?.members?.preacher) {
      preacherName = activeTeam.members.preacher;
    }
  } else if (nextPlan?.team?.preacher) {
    preacherName = nextPlan.team.preacher;
  } else if (settings?.pastorName) {
    preacherName = settings.pastorName;
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {!settings && (
        <div className="bg-red-500 text-white p-4 rounded-xl font-bold text-center animate-pulse">
          ⚠️ ERROR: NO SETTINGS LOADED
        </div>
      )}

      {/* Hero Section Carousel */}
      <CarouselHero
        isLive={isLive}
        heroDate={heroDate}
        heroTime={heroTime}
        preacherName={preacherName}
        onNavigate={onNavigate}
        upcomingEvents={upcomingEvents}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Card: Traducción en Vivo */}
        <div
          onClick={() => onNavigate(ViewState.TRANSLATION)}
          className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-indigo-500 mb-6 group-hover:text-indigo-600">
            <Globe size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Traducción en Vivo</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Escucha el servicio traducido a tu idioma en tiempo real con IA.
          </p>
          <button className="flex items-center text-indigo-500 font-bold text-sm hover:opacity-80 transition-opacity">
            INICIAR TRADUCCIÓN <ArrowRight size={16} className="ml-2" />
          </button>
        </div>

        {/* Card: Donaciones / Ofrendas */}
        <div
          onClick={() => window.open('https://adventistgiving.org/donate/ANTBRS', '_blank')}
          className="bg-neu-base dark:bg-neu-base-dark p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-emerald-500 mb-6 group-hover:text-emerald-600">
            <Gift size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Donativos</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Contribuye a la misión y ministerios de nuestra iglesia de forma segura.
          </p>
          <button className="flex items-center text-emerald-500 font-bold text-sm hover:opacity-80 transition-opacity">
            DONAR AHORA <ArrowRight size={16} className="ml-2" />
          </button>
        </div>

        {/* Card 1: Orden de Culto */}
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



        {/* Card 3: Petición de Oración (Full Width) */}
        <div
          onClick={() => onNavigate(ViewState.PRAYER)}
          className="col-span-1 md:col-span-2 lg:col-span-3 relative bg-brand-500 p-8 md:p-10 rounded-[2rem] shadow-neu dark:shadow-neu-dark hover:-translate-y-2 transition-transform duration-300 overflow-hidden cursor-pointer flex flex-col md:flex-row items-center justify-between gap-6 group"
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-10 -left-10 w-40 h-40 bg-indigo-900 opacity-20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shrink-0">
              <Heart size={32} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">¿Necesitas Oración?</h3>
              <p className="text-indigo-100 text-lg opacity-90 max-w-xl">
                No estás solo. Comparte tu petición y nuestro equipo orará por ti esta semana.
              </p>
            </div>
          </div>

          <button className="relative z-10 px-8 py-4 bg-white text-brand-600 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            Enviar Petición
          </button>
        </div>

        {/* Card 4: Nuestra Iglesia / Info Footer (Full Width Horizontal) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-neu-base dark:bg-neu-base-dark p-6 md:p-8 rounded-[2rem] shadow-neu dark:shadow-neu-dark flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left transition-all hover:shadow-neu-pressed dark:hover:shadow-neu-dark-pressed">

          {/* Identity & Address */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark flex items-center justify-center text-gray-400 shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{settings?.churchName || 'Nuestra Iglesia'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 justify-center md:justify-start">
                <span className="opacity-70">{settings?.address || 'Ubicación no disponible'}</span>
              </p>
            </div>
          </div>

          {/* Schedule */}
          {(settings?.meetingDays && settings.meetingDays.length > 0) && (
            <div className="hidden md:block w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
          )}

          {(settings?.meetingDays && settings.meetingDays.length > 0) && (
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> Horarios
              </h4>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                {settings.meetingDays.slice(0, 2).map(day => ( // Show max 2 days to keep it compact
                  <span key={day}>{day} {settings.meetingTimes[day]}</span>
                ))}
              </div>
            </div>
          )}

          {/* Socials */}
          <div className="flex gap-3">
            {settings?.socials?.facebook && (
              <a href={settings.socials.facebook} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-blue-600 hover:text-blue-700 hover:scale-110 transition-transform">
                <Facebook size={18} />
              </a>
            )}
            {settings?.socials?.instagram && (
              <a href={settings.socials.instagram} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-pink-600 hover:text-pink-700 hover:scale-110 transition-transform">
                <Instagram size={18} />
              </a>
            )}
            {settings?.socials?.youtube && (
              <a href={settings.socials.youtube} target="_blank" rel="noreferrer" className="p-3 rounded-full bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark text-red-600 hover:text-red-700 hover:scale-110 transition-transform">
                <Youtube size={18} />
              </a>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

// Extracted Carousel Component for simpler logic
const CarouselHero: React.FC<{
  isLive: boolean;
  heroDate: string;
  heroTime: string;
  preacherName: string;
  onNavigate: (view: ViewState) => void;
  upcomingEvents: ChurchEvent[];
}> = ({ isLive, heroDate, heroTime, preacherName, onNavigate, upcomingEvents }) => {

  const [currentSlide, setCurrentSlide] = React.useState(0);
  // Slide 0 is the "Main" (Live/Next Service). Subsequent slides are events.
  const totalSlides = 1 + upcomingEvents.length;

  React.useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Helper to get active event for current slide (if > 0)
  const activeEvent = currentSlide > 0 ? upcomingEvents[currentSlide - 1] : null;

  // Determine Gradient
  // Default (Main Slide): Neutral Blue-ish/Gray or Red if Live
  // Event Slide: Use event.bannerGradient OR fallback
  const getBackgroundClass = () => {
    if (currentSlide === 0) {
      if (isLive) return 'bg-gradient-to-br from-red-600 via-red-500 to-orange-500';
      return 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'; // Default Neutral for Main Status
    }
    // Event Slide
    if (activeEvent?.bannerGradient) {
      // Ensure we have the full gradient string "bg-gradient-to-r from-x to-y" if user only stored "from-x to-y"
      // But assuming format is "from-green-400 to-blue-500"
      return `bg-gradient-to-br ${activeEvent.bannerGradient}`;
    }
    return 'bg-gradient-to-br from-blue-500 to-indigo-600'; // Fallback
  };

  // Text Color Logic: If it's the main slide (neutral), use dark text. If it's a gradient event, use white.
  const isDarkBackground = currentSlide > 0 || isLive;
  // Actually, users want the "Main" slide to look like the Admin one? 
  // Admin usually has "Next Service" in logic. 
  // Let's stick to: Main Slide = Neutral (Morpho) unless Live. 
  // Event Slides = Colored Gradients from Admin.

  return (
    <div className="p-1 rounded-[2.5rem] shadow-neu dark:shadow-neu-dark bg-white">
      {/* 
          Container for the inner banner. 
          The 'p-1' on parent + 'bg-white' creates the "fino virilito" (thin border).
          We apply the gradient to THIS inner div.
       */}
      <div className={`relative overflow-hidden rounded-[2.3rem] h-80 transition-all duration-500 ${getBackgroundClass()}`}>

        {/* Texture Overlay (Optional, keep if refined) */}
        {!isDarkBackground && (
          <img
            src={`https://api.dicebear.com/9.x/patterns/svg?seed=${currentSlide}&backgroundColor=transparent`}
            alt="Pattern"
            className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none"
          />
        )}

        {/* Abstract Shapes for Gradient Backgrounds */}
        {isDarkBackground && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>
          </>
        )}

        {/* Content Render */}
        {currentSlide === 0 ? (
          // MAIN SLIDE CONTENT
          <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 animate-in fade-in duration-500">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className={`w-3 h-3 rounded-full animate-pulse ${isLive ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-brand-500'}`}></span>
              <span className={`${isLive ? 'text-white' : 'text-brand-500'} font-bold tracking-widest text-xs uppercase`}>
                {isLive ? 'EN VIVO AHORA' : 'Próximo Servicio:'}
                {!isLive && <span className="text-gray-600 dark:text-gray-400 normal-case ml-1">{heroDate} {heroTime}</span>}
              </span>
            </div>
            <h2 className={`text-4xl md:text-5xl font-black ${isLive ? 'text-white' : 'text-gray-900 dark:text-gray-100'} mb-2 tracking-tight line-clamp-2`}>
              {isLive ? 'Únete Ahora' : 'Te Esperamos'}
            </h2>
            <p className={`${isLive ? 'text-red-100' : 'text-gray-500 dark:text-gray-400'} mb-8 max-w-lg text-lg flex items-center gap-2`}>
              <span className={`font-bold ${isLive ? 'text-white' : 'text-brand-500'}`}>Predica:</span> {preacherName}
            </p>

            <button
              onClick={() => onNavigate(ViewState.LIVE)}
              className={`w-max flex items-center space-x-3 px-8 py-4 ${isLive ? 'bg-white text-red-600 shadow-lg' : 'bg-neu-base dark:bg-neu-base-dark text-brand-500 shadow-neu dark:shadow-neu-dark'} font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all duration-200 group`}
            >
              <PlayCircle size={24} className="group-hover:scale-110 transition-transform" />
              <span>{isLive ? 'Ver Transmisión' : 'Ver Transmisiones'}</span>
            </button>
          </div>
        ) : (
          // EVENT SLIDE CONTENT (Always White Text on Gradient)
          <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
            {activeEvent && (
              <>
                <div className="inline-flex items-center space-x-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-white/50 backdrop-blur-md animate-pulse"></span>
                  <span className="text-white/80 font-bold tracking-widest text-xs uppercase border border-white/20 px-2 py-0.5 rounded-full bg-white/10">
                    Próximo Evento
                  </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight line-clamp-2 drop-shadow-sm">
                  {activeEvent.title}
                </h2>
                <p className="text-white/90 mb-8 max-w-lg text-lg flex items-center gap-4 font-medium">
                  <span className="flex items-center gap-1"><Calendar size={18} /> {new Date(activeEvent.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <span className="w-px h-4 bg-white/40"></span>
                  <span className="flex items-center gap-1"><Clock size={18} /> {new Date('2000-01-01T' + activeEvent.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </p>

                <button
                  onClick={() => onNavigate(ViewState.EVENTS)}
                  className="w-max flex items-center space-x-3 px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-2xl hover:bg-white hover:text-brand-600 transition-all duration-200 group shadow-lg"
                >
                  <Calendar size={24} className="group-hover:scale-110 transition-transform" />
                  <span>Ver Detalles</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? (isDarkBackground ? 'bg-white w-8' : 'bg-brand-500 w-8') : (isDarkBackground ? 'bg-white/40 hover:bg-white/60' : 'bg-gray-300 hover:bg-gray-400')}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};