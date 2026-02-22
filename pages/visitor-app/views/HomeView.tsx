import React from 'react';
import { ViewState } from '../types';
import { ChurchEvent, ServicePlan, ChurchSettings } from '../../../types';
import { Globe, Gift, List, Heart, MapPin, ChevronRight, UserCheck, Radio, Calendar, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import EventStoryCard from '../../../components/EventStoryCard';
import { useLanguage } from '../../../context/LanguageContext';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  onEventSelect?: (eventId: string) => void;
  events?: ChurchEvent[];
  nextPlan?: ServicePlan | null;
  settings?: ChurchSettings | null;
  nextService?: any;
}

// --- SUB-COMPONENTS (Copied & Adapted from MemberApp to maintain consistency) ---

const QuickActionsGrid: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-4 px-6 mb-8">
      <button
        onClick={() => onNavigate(ViewState.TRANSLATION)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
          <Globe size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">{t('member.translation')}</span>
      </button>

      <button
        onClick={() => window.open('https://adventistgiving.org/donate/ANTBRS', '_blank')}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Gift size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">{t('visitor.give')}</span>
      </button>

      <button
        onClick={() => onNavigate(ViewState.ORDER)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
          <List size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">{t('member.program')}</span>
      </button>

      <button
        onClick={() => onNavigate(ViewState.PRAYER)}
        className="bg-white py-6 px-4 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center gap-4 text-center active:scale-95 transition-transform"
      >
        <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
          <Heart size={26} strokeWidth={2} />
        </div>
        <span className="text-sm font-bold text-slate-600">{t('member.prayer')}</span>
      </button>
    </div>
  );
};


export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onEventSelect, events = [], nextPlan, settings, nextService }) => {
  const { t, language } = useLanguage();

  // Sort events by date and filter active + future only
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

  // Ticker Content
  const tickerText = nextService
    ? `${t('visitor.next_service_prefix')}: ${nextService.dateObj.toLocaleDateString(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} - ${nextService.time}  ✦  ${t('visitor.preacher_prefix')}: ${nextService.preacher?.toUpperCase() || t('common.tbd').toUpperCase()}  ✦  `
    : `${t('visitor.welcome_ticker')}  ✦  `;

  // Repeat text to ensure smooth loop
  const displayTicker = tickerText.repeat(4);


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 pt-2">

      {/* Stories Carousel Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className="font-bold text-slate-900 text-lg tracking-tight">{t('visitor.upcoming_events')}</h3>
          <span onClick={() => onNavigate(ViewState.EVENTS)} className="text-indigo-600 text-xs font-bold cursor-pointer">{t('common.see_all')}</span>
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
              {t('visitor.no_events')}
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
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">{t('member.offline')}</p>
                {nextPlan && (
                  <p className="text-[10px] text-slate-600 mt-1">{t('dashboard.next_service')}: {new Date(nextPlan.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')} {nextPlan.startTime}</p>
                )}
              </div>
            </>
          )}
          {nextPlan?.isActive && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full z-20">
              <span className="text-[10px] font-bold text-white tracking-wider animate-pulse">{t('member.live_status')}</span>
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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('visitor.location')}</p>
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
