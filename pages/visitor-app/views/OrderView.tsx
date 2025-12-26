import React from 'react';
import { Music, BookOpen, Mic, User, Headphones } from 'lucide-react';
import { ServicePlan, ChurchSettings } from '../../../types';

interface OrderViewProps {
  servicePlan?: ServicePlan | null;
  settings?: ChurchSettings | null;
}

export const OrderView: React.FC<OrderViewProps> = ({ servicePlan, settings }) => {
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'WORSHIP': return <Music size={20} />;
      case 'PREACHING': return <BookOpen size={20} />;
      case 'GENERAL': return <Mic size={20} />;
      default: return <Mic size={20} />;
    }
  };

  const calculateItems = () => {
    if (!servicePlan?.items) return []; // Use .items NOT .order

    // Default start time: parse servicePlan.startTime (HH:mm) if exists
    let startHour = 10;
    let startMin = 0;

    if (servicePlan.startTime) {
      const [h, m] = servicePlan.startTime.split(':').map(Number);
      if (!isNaN(h)) startHour = h;
      if (!isNaN(m)) startMin = m;
    }

    let currentTime = new Date();
    currentTime.setHours(startHour, startMin, 0, 0);

    return servicePlan.items.map(item => {
      const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      // Add duration
      currentTime.setMinutes(currentTime.getMinutes() + (item.durationMinutes || 5));

      return {
        time: timeStr,
        title: item.title,
        type: item.type,
        icon: getIcon(item.type)
      };
    });
  };

  const items = calculateItems();
  const dateStr = servicePlan ? new Date(servicePlan.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximo Servicio';

  // LOGIC: Use Service Plan Team directly
  const activePreacher = servicePlan?.team?.preacher || '---';
  const activeTeacher = servicePlan?.team?.sabbathSchoolTeacher || '---';
  const activeElder = servicePlan?.team?.elder || '---';
  const activeAudio = servicePlan?.team?.audioOperator || '---';

  return (
    <div className="max-w-3xl mx-auto py-4">

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-200">Orden del Culto</h2>
        <div className="inline-block mt-2 px-6 py-2 rounded-full shadow-neu-pressed dark:shadow-neu-dark-pressed text-brand-500 font-bold text-sm capitalize">
          {dateStr}
        </div>
      </div>

      {/* Team Section (Synced with Member App) */}
      {(servicePlan?.team || settings?.activeTeamId) && (
        <div className="mb-12 bg-neu-base dark:bg-neu-base-dark rounded-[2rem] p-6 shadow-neu dark:shadow-neu-dark border border-transparent mx-auto max-w-2xl">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 mb-6 text-xs uppercase tracking-widest text-center">Equipo Ministerial</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 px-4">

            {/* 1. Elder */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shadow-sm">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Anciano de Turno</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[140px]">{activeElder}</p>
              </div>
            </div>

            {/* 2. Preacher */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 shadow-sm">
                <Mic size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Predicador</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[140px]">{activePreacher}</p>
              </div>
            </div>

            {/* 3. Teacher */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shadow-sm">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Maestro de ES</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[140px]">{activeTeacher}</p>
              </div>
            </div>

            {/* 4. Audio */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 shadow-sm">
                <Headphones size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Operador de Audio</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate max-w-[140px]">{activeAudio}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="relative">
        {/* The Track (Pressed Line) - Only show if items exist */}
        {items.length > 0 && (
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2 md:-ml-1 bg-neu-base dark:bg-neu-base-dark shadow-neu-pressed dark:shadow-neu-dark-pressed rounded-full" />
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-[2rem] bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark mx-auto max-w-lg mt-8">
            <p className="text-gray-400 font-bold">No hay orden del culto definido aún.</p>
            <p className="text-xs text-gray-400 mt-2">El equipo pastoral está preparando el programa.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {items.map((item, index) => {
              // For desktop alternate left/right
              const isRight = index % 2 === 0;
              const isActive = index === 3; // Mock active state

              return (
                <div key={index} className={`flex md:justify-between items-center w-full ${isRight ? 'flex-row-reverse' : ''}`}>

                  {/* Empty space for desktop layout balance */}
                  <div className="hidden md:block w-5/12" />

                  {/* The Node (Circle on track) */}
                  <div className="absolute left-8 md:left-1/2 md:-ml-3 w-6 h-6 rounded-full border-4 border-neu-base dark:border-neu-base-dark shadow-neu dark:shadow-neu-dark bg-brand-500 z-10 flex items-center justify-center">
                    {isActive && <div className="w-full h-full rounded-full bg-white animate-ping opacity-75"></div>}
                  </div>

                  {/* Content Card */}
                  <div className="w-full pl-20 md:pl-0 md:w-5/12">
                    <div className={`
                            p-6 rounded-[2rem] transition-all duration-300
                            ${isActive
                        ? 'bg-brand-500 text-white shadow-[8px_8px_16px_rgba(109,93,252,0.4),-8px_-8px_16px_rgba(255,255,255,0.5)]'
                        : 'bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark hover:-translate-y-1'
                      }
                        `}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                          {item.title}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-black dark:bg-gray-700 dark:text-gray-300'}`}>
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 opacity-80">
                        {item.icon}
                        <span className="text-sm font-medium capitalize tracking-wide">{item.type}</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};