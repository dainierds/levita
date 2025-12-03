
import React, { useState } from 'react';
import { ChurchSettings, DayOfWeek } from '../types';
import { Calendar, Clock, BookOpen, Mic2, Save, Check, BellRing, Church, Facebook, Instagram, Youtube, Shield } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface ChurchConfigProps {
  settings: ChurchSettings;
  onSave: (settings: ChurchSettings) => void;
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ChurchConfig: React.FC<ChurchConfigProps> = ({ settings, onSave }) => {
  const [config, setConfig] = useState<ChurchSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();

  const toggleDay = (list: DayOfWeek[], day: DayOfWeek, key: 'meetingDays' | 'preachingDays' | 'rosterDays') => {
    const exists = list.includes(day);
    const newList = exists ? list.filter(d => d !== day) : [...list, day];
    setConfig({ ...config, [key]: newList });
  };

  const handleTimeChange = (day: DayOfWeek, time: string) => {
    setConfig({
      ...config,
      meetingTimes: { ...config.meetingTimes, [day]: time }
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onSave(config);
      setIsSaving(false);
      addNotification('success', 'Configuración Guardada', 'Los ajustes de la iglesia se han actualizado correctamente.');
    }, 1000);
  };

  const DaySelector = ({
    selectedDays,
    onChange,
    activeColorClass = 'bg-indigo-50 border-indigo-500 text-indigo-700',
    icon
  }: {
    selectedDays: DayOfWeek[],
    onChange: (d: DayOfWeek) => void,
    activeColorClass?: string,
    icon?: React.ReactNode
  }) => (
    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
      {DAYS.map(day => {
        const isSelected = selectedDays.includes(day);
        return (
          <button
            key={day}
            onClick={() => onChange(day)}
            className={`
              relative p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2
              ${isSelected ? `${activeColorClass} shadow-sm` : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}
            `}
          >
            {isSelected && <div className="absolute top-2 right-2"><Check size={12} /></div>}
            {icon && <div className={isSelected ? 'opacity-100' : 'opacity-50'}>{icon}</div>}
            <span className="text-sm font-semibold">{day}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 md:p-8 md:pt-20 max-w-full mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Configuración de Iglesia</h2>
          <p className="text-slate-500">Personaliza los días y horarios de mikata</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70"
        >
          {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
        </button>
      </div>

      {/* 0. General Info */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <Church className="text-indigo-500" size={24} />
          <h3 className="text-xl font-bold">Información General</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Iglesia</label>
            <input
              type="text"
              value={config.churchName || ''}
              onChange={(e) => setConfig({ ...config, churchName: e.target.value })}
              className="input-soft"
              placeholder="Ej. Iglesia Vida Nueva"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Física</label>
            <input
              type="text"
              value={config.address || ''}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              className="input-soft"
              placeholder="Ej. Av. Principal 123"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Redes Sociales</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute left-4 top-3 text-slate-400"><Facebook size={18} /></div>
              <input
                type="text"
                value={config.socials?.facebook || ''}
                onChange={(e) => setConfig({ ...config, socials: { ...config.socials, facebook: e.target.value } })}
                className="input-soft pl-12"
                placeholder="Facebook URL"
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-3 text-slate-400"><Instagram size={18} /></div>
              <input
                type="text"
                value={config.socials?.instagram || ''}
                onChange={(e) => setConfig({ ...config, socials: { ...config.socials, instagram: e.target.value } })}
                className="input-soft pl-12"
                placeholder="Instagram URL"
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-3 text-slate-400"><Youtube size={18} /></div>
              <input
                type="text"
                value={config.socials?.youtube || ''}
                onChange={(e) => setConfig({ ...config, socials: { ...config.socials, youtube: e.target.value } })}
                className="input-soft pl-12"
                placeholder="YouTube URL"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 1. Meeting Days */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <Calendar className="text-indigo-500" size={24} />
          <h3 className="text-xl font-bold">Días de Reunión</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Selecciona los días en que la iglesia tiene reuniones regulares</p>
        <DaySelector
          selectedDays={config.meetingDays}
          onChange={(d) => toggleDay(config.meetingDays, d, 'meetingDays')}
          activeColorClass="bg-indigo-50 border-indigo-500 text-indigo-700"
        />
      </section>

      {/* 2. Meeting Times */}
      {config.meetingDays.length > 0 && (
        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <Clock className="text-indigo-500" size={24} />
            <h3 className="text-xl font-bold">Horarios de Reunión</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Define el horario de inicio para cada día de reunión</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DAYS.map(day => {
              const isActive = config.meetingDays.includes(day);
              return (
                <div key={day} className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">{day}</label>
                  <div className={`
                    flex items-center px-4 py-3 border rounded-xl bg-slate-50
                    ${isActive ? 'border-indigo-200 bg-white ring-2 ring-indigo-50' : 'border-slate-100'}
                  `}>
                    <input
                      type="time"
                      value={config.meetingTimes[day] || ''}
                      onChange={(e) => handleTimeChange(day, e.target.value)}
                      disabled={!isActive}
                      className="bg-transparent w-full outline-none text-slate-700 font-medium disabled:text-slate-300"
                    />
                    {isActive && <Clock size={16} className="text-indigo-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Preaching Days */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <BookOpen className="text-purple-500" size={24} />
          <h3 className="text-xl font-bold">Días de Predicación</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Selecciona los días en que hay sermones/predicaciones programadas</p>
        <DaySelector
          selectedDays={config.preachingDays}
          onChange={(d) => toggleDay(config.preachingDays, d, 'preachingDays')}
          activeColorClass="bg-purple-50 border-purple-500 text-purple-700"
          icon={<BookOpen size={16} />}
        />
      </section>

      {/* 4. Roster Configuration */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <Mic2 className="text-green-500" size={24} />
          <h3 className="text-xl font-bold">Turnos de Plataforma</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Configura la frecuencia, días y automatizaciones para los turnos.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-500 mb-2">Frecuencia de Turnos</label>
            <select
              value={config.rosterFrequency}
              onChange={(e) => setConfig({ ...config, rosterFrequency: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option>Semanal</option>
              <option>Quincenal</option>
              <option>Mensual</option>
            </select>
          </div>

          {/* Automation Toggle */}
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
            <div>
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <BellRing size={16} className="text-orange-500" /> Notificar Asignaciones
              </h4>
              <p className="text-xs text-slate-400 mt-1">Enviar email automático al voluntario.</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, rosterAutoNotifications: !config.rosterAutoNotifications })}
              className={`relative w-12 h-7 rounded-full transition-colors ${config.rosterAutoNotifications ? 'bg-orange-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${config.rosterAutoNotifications ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-4">Días Activos para Turnos</label>
          <DaySelector
            selectedDays={config.rosterDays}
            onChange={(d) => toggleDay(config.rosterDays, d, 'rosterDays')}
            activeColorClass="bg-green-50 border-green-500 text-green-700"
            icon={<Mic2 size={16} />}
          />
        </div>
      </section>

      {/* 5. Member Access */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <Shield className="text-pink-500" size={24} />
          <h3 className="text-xl font-bold">Acceso de Miembros</h3>
        </div>
        <p className="text-sm text-slate-500 mb-6">Configura el PIN único para que los miembros accedan a la app.</p>

        <div className="max-w-xs">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN de Acceso</label>
          <input
            type="text"
            value={config.memberPin || ''}
            onChange={(e) => setConfig({ ...config, memberPin: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-mono text-lg tracking-widest text-center"
            placeholder="0000"
            maxLength={6}
          />
          <p className="text-xs text-slate-400 mt-2">Comparte este PIN con tu congregación.</p>
        </div>
      </section>

      {/* Summary Footer (Static) */}
      <div className="mt-8 bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-bold text-indigo-600 mb-1">📅 Reuniones</p>
              <p className="text-slate-500 truncate">{config.meetingDays.join(', ') || 'Ninguno'}</p>
            </div>
            <div>
              <p className="font-bold text-purple-600 mb-1">📖 Predicación</p>
              <p className="text-slate-500 truncate">{config.preachingDays.join(', ') || 'Ninguno'}</p>
            </div>
            <div>
              <p className="font-bold text-green-600 mb-1">🎤 Turnos</p>
              <p className="text-slate-500 truncate">{config.rosterFrequency} {config.rosterAutoNotifications && '(Auto-Notif.)'}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-70"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ChurchConfig;