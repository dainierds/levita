import React, { useState } from 'react';
import { ChurchEvent } from '../types';
import { Calendar, Heart, Globe, ArrowRight, Check, User } from 'lucide-react';
import LiveTranslation from './LiveTranslation';

interface VisitorAppProps {
  events: ChurchEvent[];
  onLoginRequest: () => void;
  nextPreacher?: string;
  initialLanguage?: LanguageCode;
}

type LanguageCode = 'es' | 'en' | 'pt' | 'fr';

const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const TRANSLATIONS: Record<LanguageCode, any> = {
  es: {
    welcome_label: "BIENVENIDO A",
    member_btn: "Soy Miembro",
    intro: "Estamos muy felices de tenerte aquí. Esta app está diseñada para ayudarte a conectarte y entender el mensaje de hoy.",
    upcoming: "Lo que viene",
    prayer_title: "¿Necesitas Oración?",
    prayer_desc: "Nuestro equipo de líderes está listo para orar por ti al finalizar el servicio.",
    connect_btn: "Quiero conectar",
    select_lang_title: "Selecciona tu idioma",
    select_lang_desc: "Para una mejor experiencia en el servicio",
    continue_btn: "Continuar"
  },
  en: {
    welcome_label: "WELCOME TO",
    member_btn: "I am a Member",
    intro: "We are so happy to have you here. This app is designed to help you connect and understand today's message.",
    upcoming: "Coming Up",
    prayer_title: "Need Prayer?",
    prayer_desc: "Our leadership team is ready to pray for you at the end of the service.",
    connect_btn: "I want to connect",
    select_lang_title: "Select your language",
    select_lang_desc: "For a better service experience",
    continue_btn: "Continue"
  },
  pt: {
    welcome_label: "BEM-VINDO A",
    member_btn: "Sou Membro",
    intro: "Estamos muito felizes em tê-lo aqui. Este aplicativo foi projetado para ajudá-lo a se conectar e entender a mensagem de hoje.",
    upcoming: "O que vem por aí",
    prayer_title: "Precisa de Oração?",
    prayer_desc: "Nossa equipe de líderes está pronta para orar por você no final do culto.",
    connect_btn: "Quero conectar",
    select_lang_title: "Selecione seu idioma",
    select_lang_desc: "Para uma melhor experiência no culto",
    continue_btn: "Continuar"
  },
  fr: {
    welcome_label: "BIENVENUE À",
    member_btn: "Je suis membre",
    intro: "Nous sommes très heureux de vous avoir ici. Cette application est conçue pour vous aider à vous connecter et à comprendre le message d'aujourd'hui.",
    upcoming: "À venir",
    prayer_title: "Besoin de prière ?",
    prayer_desc: "Notre équipe de direction est prête à prier pour vous à la fin du service.",
    connect_btn: "Je veux me connecter",
    select_lang_title: "Choisissez votre langue",
    select_lang_desc: "Pour une meilleure expérience de service",
    continue_btn: "Continuer"
  }
};

const VisitorApp: React.FC<VisitorAppProps> = ({ events, onLoginRequest, nextPreacher = 'Por definir', initialLanguage }) => {
  const [selectedLang, setSelectedLang] = useState<LanguageCode | null>(initialLanguage || null);

  // If no language selected, show selection screen
  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">LEVITA</h1>
            <p className="text-slate-500">Church Operating System</p>
          </div>

          <div className="space-y-4">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left"
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-lg font-bold text-slate-700 group-hover:text-indigo-900">{lang.label}</span>
                <div className="absolute right-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={20} />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={onLoginRequest}
            className="w-full mt-8 text-center text-sm font-bold text-slate-300 hover:text-indigo-500 transition-colors"
          >
            Administración / Miembros
          </button>
        </div>
      </div>
    );
  }

  const t = TRANSLATIONS[selectedLang];
  const upcomingEvents = events
    .filter(e => e.activeInBanner && e.targetAudience === 'PUBLIC')
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white md:max-w-md md:mx-auto md:shadow-2xl md:my-8 md:rounded-[3rem] overflow-hidden relative pb-20">

      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">LEVITA</h1>
          <p className="text-xs text-slate-400 font-medium">Comunidad de Fe</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedLang(null)} className="text-xs font-bold text-slate-300 hover:text-indigo-600 flex items-center gap-1">
            {SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.flag} {selectedLang.toUpperCase()}
          </button>
          <button onClick={onLoginRequest} className="text-sm font-bold text-slate-300 hover:text-indigo-600">
            {t.member_btn}
          </button>
        </div>
      </div>

      <div className="px-6 space-y-8 overflow-y-auto pb-24 h-[calc(100vh-100px)] no-scrollbar">

        {/* Live Stream / YouTube Embed */}
        <div className="w-full bg-black rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-300 aspect-video relative">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/live_stream?channel=UCjaxadventista7morenacersda63"
            title="Live Service"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>

          {/* Live Indicator (Mock logic as we don't have activePlan here yet) */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-white tracking-wider">EN VIVO</span>
          </div>
        </div>

        {/* Translation Widget */}
        <section>
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Globe size={18} className="text-indigo-500" /> Traducción en Vivo
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              Silencia el video para escuchar
            </span>
          </div>
          <LiveTranslation initialLanguage={selectedLang} />
        </section>

        {/* Next Preacher Card */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximo Predicador</p>
            <h3 className="text-lg font-bold text-slate-800">{nextPreacher}</h3>
          </div>
        </div>

        {/* Upcoming Events */}
        <section>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-pink-500" /> {t.upcoming}
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center">
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex flex-col items-center justify-center text-pink-600 font-bold leading-none shadow-sm">
                  <span className="text-xs">{event.date.split(' ')[0]}</span>
                  <span className="text-xs opacity-70">{event.date.split(' ')[1]}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700">{event.title}</h4>
                  <p className="text-xs text-slate-400">{event.time} • {event.location}</p>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <div className="w-full text-center text-slate-400 italic py-4">No hay eventos próximos.</div>
            )}
          </div>
        </section>

        {/* Connect Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl shadow-slate-200">
          <Heart className="mb-4 text-red-400 fill-red-400" size={32} />
          <h3 className="text-xl font-bold mb-2">{t.prayer_title}</h3>
          <p className="text-slate-400 text-sm mb-4">{t.prayer_desc}</p>
          <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
            {t.connect_btn}
          </button>
        </div>
      </div>

    </div>
  );
};

export default VisitorApp;