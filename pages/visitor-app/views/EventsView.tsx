import React, { useState } from 'react';
import { MapPin, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Share, Download, X } from 'lucide-react';
import { ChurchEvent } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';

interface EventsViewProps {
  events?: ChurchEvent[];
  selectedEventId?: string | null;
}

type ViewMode = 'LIST' | 'CALENDAR';

export const EventsView: React.FC<EventsViewProps> = ({ events = [], selectedEventId }) => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);

  const currentLocale = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'en-US';

  // Sync selectedEvent with selectedEventId from props
  React.useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const found = events.find(e => e.id === selectedEventId);
      if (found) setSelectedEvent(found);
    }
  }, [selectedEventId, events]);

  const sortedEvents = events
    .filter(e => e.activeInBanner) // Only active
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- CALENDAR HELPER FUNCTIONS ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getEventsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    targetDate.setHours(0, 0, 0, 0);

    return sortedEvents.filter(e => {
      const start = new Date(e.date + 'T00:00:00');
      start.setHours(0, 0, 0, 0);

      if (start.getTime() === targetDate.getTime()) return true;

      if (e.endDate) {
        const end = new Date(e.endDate + 'T00:00:00');
        end.setHours(0, 0, 0, 0);
        return targetDate >= start && targetDate <= end;
      }
      return false;
    });
  };

  const addToGoogleCalendar = (event: ChurchEvent) => {
    const startTime = new Date(`${event.date}T${event.time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
    // Use endDate if available, else +2 hours
    const endDateTimeStr = event.endDate ? `${event.endDate}T${event.time}` : null;
    let endTime;

    if (endDateTimeStr) {
      endTime = new Date(new Date(endDateTimeStr).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    } else {
      endTime = new Date(new Date(`${event.date}T${event.time}`).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    }

    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.address || event.placeName || '');
    const title = encodeURIComponent(event.title);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const downloadICal = (event: ChurchEvent) => {
    const startTime = new Date(`${event.date}T${event.time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const endDateTimeStr = event.endDate ? `${event.endDate}T${event.time}` : null;
    let endTime;

    if (endDateTimeStr) {
      endTime = new Date(new Date(endDateTimeStr).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    } else {
      endTime = new Date(new Date(`${event.date}T${event.time}`).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.address || event.placeName}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEventCard = (event: ChurchEvent, isModal = false) => {
    const dateObj = new Date(event.date + 'T00:00:00');
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString(currentLocale, { month: 'short' });

    // Logic for range display
    const endDateObj = event.endDate ? new Date(event.endDate + 'T00:00:00') : null;
    const isMultiDay = endDateObj && endDateObj.getTime() !== dateObj.getTime();

    const timeStr = new Date('2000-01-01T' + event.time).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit', hour12: true });

    // MODAL SPECIFIC STYLES
    if (isModal) {
      return (
        <div key={event.id} className="relative w-full overflow-hidden rounded-[2.5rem] shadow-2xl bg-white group">

          {/* CONTENT */}
          <div className="relative z-10 p-0">
            {/* Header Image (Clear) */}
            <div className="relative h-64 w-full">
              <img
                src={event.imageUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${event.id}`}
                className="w-full h-full object-cover"
                alt={event.title}
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg flex flex-col items-center min-w-[60px]">
                <span className="text-xs font-bold text-slate-500 uppercase">{month}</span>
                <span className="text-2xl font-black text-slate-900">{day}</span>
              </div>
            </div>

            <div className="px-6 pb-8 -mt-6 relative z-20 bg-white rounded-t-[2rem]">
              {/* Center Pull Indicator (Visual only) */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 mt-3" />

              <h3 className="text-2xl font-black text-slate-800 mb-6 leading-tight text-center">{event.title}</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="p-2.5 rounded-full bg-indigo-100 text-indigo-600">
                    <Clock size={20} />
                  </div>
                  <span className="text-base font-bold text-slate-700">{timeStr}</span>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="p-2.5 rounded-full bg-orange-100 text-orange-600">
                    <MapPin size={20} />
                  </div>
                  <span className="text-base font-bold text-slate-700">{event.placeName || t('visitor.location_tbd')}</span>
                </div>

                {/* DESCRIPTION FIELD */}
                {event.description && (
                  <div className="mt-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); addToGoogleCalendar(event); }}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <CalendarIcon size={18} /> Google
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadICal(event); }}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Apple
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.address) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`, '_blank');
                  } else {
                    alert(t('visitor.address_missing'));
                  }
                }}
                className="mt-4 w-full py-4 rounded-2xl font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <MapPin size={18} /> {t('visitor.how_to_get')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={event.id} className={`group bg-neu-base dark:bg-neu-base-dark rounded-[2.5rem] shadow-neu dark:shadow-neu-dark p-4 transition-all duration-300 ${!isModal && 'hover:-translate-y-2'}`}>

        {/* Image Container */}
        <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-neu-pressed dark:shadow-neu-dark-pressed p-1 bg-gray-100 dark:bg-gray-800">
          <img
            src={event.imageUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${event.id}&backgroundColor=f3f4f6,e5e7eb,d1d5db`}
            alt={event.title}
            className={`w-full h-full object-cover rounded-[1.8rem] opacity-90 transition-transform duration-700 ${!isModal && 'group-hover:scale-110'}`}
          />
          <div className="absolute top-4 right-4 bg-neu-base/90 dark:bg-neu-base-dark/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg flex flex-col items-center min-w-[60px]">
            <span className="text-xs font-bold text-gray-400 uppercase">{month}</span>
            <span className="text-xl font-black text-gray-800 dark:text-gray-100">{day}</span>
            {isMultiDay && endDateObj && (
              <>
                <span className="h-px w-3 bg-gray-300 my-1"></span>
                <span className="text-xl font-black text-gray-800 dark:text-gray-100">{endDateObj.getDate()}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 mt-2">
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">{event.title}</h3>

          <div className="space-y-3">
            <div className="flex items-center p-3 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark">
              <div className="p-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-500 mr-3">
                <Clock size={16} />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{timeStr}</span>
            </div>

            <div className="flex items-center p-3 rounded-xl bg-neu-base dark:bg-neu-base-dark shadow-neu dark:shadow-neu-dark">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 mr-3">
                <MapPin size={16} />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {event.placeName || t('visitor.location_tbd')}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); addToGoogleCalendar(event); }}
              className="flex-1 py-3 px-2 rounded-xl font-bold text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed hover:text-blue-500 flex flex-col items-center gap-1"
              title={t('visitor.google_calendar')}
            >
              <CalendarIcon size={16} /> Google
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadICal(event); }}
              className="flex-1 py-3 px-2 rounded-xl font-bold text-xs bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed hover:text-green-500 flex flex-col items-center gap-1"
              title={t('visitor.apple_calendar')}
            >
              <Download size={16} /> Apple/iCal
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (event.address) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`, '_blank');
              } else {
                alert(t('visitor.address_missing'));
              }
            }}
            className="mt-4 w-full py-4 rounded-xl font-bold text-brand-500 shadow-neu dark:shadow-neu-dark active:shadow-neu-pressed dark:active:shadow-neu-dark-pressed hover:text-brand-600 transition-all"
          >
            {t('visitor.how_to_get')}
          </button>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-transparent"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => hasEvents && setSelectedEvent(dayEvents[0])} // If multiple, simplify to showing the first for now
          className={`relative h-24 md:h-32 bg-neu-base dark:bg-neu-base-dark border border-gray-100 dark:border-gray-800 rounded-xl p-2 flex flex-col items-start transition-all 
                ${isToday ? 'ring-2 ring-brand-500' : ''}
                ${hasEvents ? 'cursor-pointer hover:scale-[1.05] hover:z-10 hover:shadow-xl' : ''}
            `}
        >
          <span className={`text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-500 text-white' : 'text-gray-500'}`}>{day}</span>
          <div className="flex-1 w-full overflow-y-auto space-y-1 no-scrollbar">
            {dayEvents.map(evt => (
              <div
                key={evt.id}
                onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }} // Direct click on event pill
                className="text-[10px] bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded truncate hover:bg-brand-200 transition-colors"
              >
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, i + 7); // Jan 14, 2024 was Sunday
      weekDays.push(d.toLocaleDateString(currentLocale, { weekday: 'short' }));
    }

    return (
      <div className="animate-in fade-in duration-300">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6 bg-neu-base dark:bg-neu-base-dark p-4 rounded-2xl shadow-neu dark:shadow-neu-dark">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-full transition-colors"><ChevronLeft /></button>
          <h2 className="text-xl font-bold capitalize text-gray-800 dark:text-gray-100">
            {currentDate.toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-full transition-colors"><ChevronRight /></button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
          {weekDays.map(wd => <span key={wd}>{wd}</span>)}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 text-gray-800 dark:text-gray-200">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 relative">
      <div>
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-neu-base dark:bg-neu-base-dark p-2 rounded-[2rem] shadow-neu dark:shadow-neu-dark mb-8 w-full md:w-max mx-auto md:mx-0">
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-full font-bold text-sm transition-all active:scale-95 ${viewMode === 'LIST' ? 'bg-brand-500 text-white shadow-neu-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
            >
              {t('events.view_list')}
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-full font-bold text-sm transition-all active:scale-95 ${viewMode === 'CALENDAR' ? 'bg-brand-500 text-white shadow-neu-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
            >
              {t('events.view_calendar')}
            </button>
          </div>
        </div>

        {viewMode === 'LIST' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedEvents.length > 0 ? sortedEvents.filter(e => new Date(e.date) >= new Date()).map(event => renderEventCard(event)) : (
              <div className="col-span-full text-center py-20 text-gray-400">
                <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>{t('common.no_results')}</p>
              </div>
            )}
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      {/* FLOATING EVENT MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute -top-3 -right-3 z-50 p-2 bg-white rounded-full shadow-lg text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            {renderEventCard(selectedEvent, true)}
          </div>
        </div>
      )}

    </div>
  );
};