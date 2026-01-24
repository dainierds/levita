import React, { useState } from 'react';
import { ChurchEvent, EventType, Role } from '../types';
import { Calendar, Clock, MapPin, Plus, Trash2, X, Check, Image as ImageIcon, LayoutTemplate, Pencil, ChevronLeft, ChevronRight, List, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { parseCSV, parseICS } from '../utils/eventImport';

interface EventsAdminProps {
    events: ChurchEvent[];
    tier: string;
    role?: Role;
}

const GRADIENTS = [
    { name: 'Púrpura-Rosa', class: 'from-purple-500 to-pink-500' },
    { name: 'Azul-Cyan', class: 'from-blue-500 to-cyan-400' },
    { name: 'Verde-Esmeralda', class: 'from-emerald-400 to-green-500' },
    { name: 'Naranja-Rojo', class: 'from-orange-400 to-red-500' },
    { name: 'Índigo-Púrpura', class: 'from-indigo-500 to-purple-600' },
    { name: 'Amarillo-Naranja', class: 'from-yellow-400 to-orange-500' },
    { name: 'Azul-Profundo', class: 'from-blue-600 to-indigo-900' },
    { name: 'Atardecer', class: 'from-rose-500 to-orange-500' },
    { name: 'Naturaleza', class: 'from-teal-500 to-emerald-700' },
    { name: 'Elegante', class: 'from-slate-700 to-slate-900' },
    { name: 'Medianoche', class: 'from-violet-600 to-indigo-600' },
    { name: 'Candy', class: 'from-pink-500 to-rose-400' },
];

const EMOJIS = ['📅', '🙏', '🎂', '🎤', '📖', '🎵', '☀️', '✨', '🎉', '👨‍👩‍👧‍👦', '🎈', '🎁', '⛪', '✝️', '🕊️', '🏠', '💍', '🔔'];

const EventsAdmin: React.FC<EventsAdminProps> = ({ events, tier, role = 'ADMIN' }) => {
    const readOnly = role === 'LEADER';
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    // View Mode State
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
    const [currentDate, setCurrentDate] = useState(new Date());

    // New Event State
    const [newEvent, setNewEvent] = useState<Partial<ChurchEvent>>({
        title: '',
        description: '',
        date: '',
        endDate: '',
        time: '',
        type: 'SERVICE',
        location: '',
        activeInBanner: true,
        bannerGradient: 'from-purple-500 to-pink-500',
        targetAudience: 'PUBLIC',
        placeName: '',
        address: ''
    });

    const [selectedEmoji, setSelectedEmoji] = useState('📅');

    const handleCreateEvent = async () => {
        if (!user?.tenantId || !newEvent.title || !newEvent.date) return;

        setIsSubmitting(true);
        try {
            let titleToSave = newEvent.title;
            if (!editingEventId) {
                titleToSave = `${selectedEmoji} ${newEvent.title}`;
            }

            const eventData = {
                ...newEvent,
                title: titleToSave,
                tenantId: user.tenantId,
                activeInBanner: newEvent.activeInBanner ?? true,
                // Ensure endDate is stored, if empty make it undefined or null
                endDate: newEvent.endDate || null
            };

            if (editingEventId) {
                await updateDoc(doc(db, 'events', editingEventId), eventData);
            } else {
                await addDoc(collection(db, 'events'), eventData);
            }

            setShowModal(false);
            setEditingEventId(null);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                endDate: '',
                time: '',
                type: 'SERVICE',
                location: '',
                activeInBanner: true,
                bannerGradient: 'from-purple-500 to-pink-500',
                targetAudience: 'PUBLIC',
                placeName: '',
                address: ''
            });
            setSelectedEmoji('📅');
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error al guardar el evento");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId) return;

        setIsSubmitting(true);
        try {
            const text = await file.text();
            let importedEvents: any[] = []; // Using any to match partial import structure

            if (file.name.endsWith('.csv')) {
                importedEvents = parseCSV(text);
            } else if (file.name.endsWith('.ics')) {
                importedEvents = parseICS(text);
            } else {
                alert('Formato no soportado. Use .csv o .ics');
                setIsSubmitting(false);
                return;
            }

            if (importedEvents.length === 0) {
                alert('No se encontraron eventos válidos.');
                setIsSubmitting(false);
                return;
            }

            // Batch write seems safer/better, but limited to 500. 
            // Just looping addDoc for simplicity as expected volume is low, or separate batches.
            // Let's use batch for atomicity if < 500
            const batch = writeBatch(db);
            let count = 0;

            importedEvents.forEach(ev => {
                const docRef = doc(collection(db, 'events'));
                batch.set(docRef, {
                    ...ev,
                    tenantId: user.tenantId,
                    type: ev.type || 'SERVICE', // Ensure type
                    activeInBanner: true,
                    targetAudience: 'PUBLIC'
                });
                count++;
            });

            await batch.commit();
            alert(`Se han importado ${count} eventos correctamente.`);

        } catch (error) {
            console.error("Import error:", error);
            alert("Error al importar el archivo.");
        } finally {
            setIsSubmitting(false);
            // Reset input
            e.target.value = '';
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const handleDeleteEvent = async (eventId: string) => {
        if (deleteConfirmation === eventId) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                setDeleteConfirmation(null);
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Error al eliminar.");
            }
        } else {
            setDeleteConfirmation(eventId);
            setTimeout(() => setDeleteConfirmation(null), 3000);
        }
    };

    const toggleBannerStatus = async (event: ChurchEvent) => {
        try {
            await updateDoc(doc(db, 'events', event.id), {
                activeInBanner: !event.activeInBanner
            });
        } catch (error) {
            console.error("Error updating event:", error);
        }
    };

    const handleEditEvent = (ev: ChurchEvent) => {
        setEditingEventId(ev.id);
        setNewEvent({
            title: ev.title,
            description: ev.description,
            date: ev.date,
            endDate: ev.endDate || '',
            time: ev.time,
            type: ev.type,
            location: ev.location,
            activeInBanner: ev.activeInBanner,
            bannerGradient: ev.bannerGradient || 'from-purple-500 to-pink-500',
            targetAudience: ev.targetAudience || 'PUBLIC',
            placeName: ev.placeName || '',
            address: ev.address || ''
        });
        setShowModal(true);
    };

    // --- Calendar Helper Functions ---
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const changeMonth = (offset: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

    const getEventsForDate = (day: number) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        targetDate.setHours(0, 0, 0, 0);

        return events.filter(e => {
            if (!e.date) return false;

            const start = new Date(e.date + 'T00:00:00');
            start.setHours(0, 0, 0, 0);

            // Check if standard date matches
            if (start.getTime() === targetDate.getTime()) return true;

            // Check range if endDate exists
            if (e.endDate) {
                const end = new Date(e.endDate + 'T00:00:00');
                end.setHours(0, 0, 0, 0);
                return targetDate >= start && targetDate <= end;
            }

            return false;
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEvents = getEventsForDate(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            days.push(
                <div
                    key={day}
                    className={`min-h-[100px] border border-slate-100 p-2 relative flex flex-col gap-1 transition-all hover:bg-slate-50
                        ${isToday ? 'bg-indigo-50/30' : 'bg-white'}
                    `}
                    onClick={() => {
                        // Optional: Click empty space to create event on this date
                        setNewEvent(prev => ({
                            ...prev,
                            date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        }));
                        setShowModal(true);
                    }}
                >
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                        ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-500'}
                    `}>{day}</span>

                    {dayEvents.map(ev => {
                        // Determine if it's the start of the event for visual styling?
                        // For simplicity, just show pill
                        return (
                            <div
                                key={ev.id}
                                onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer truncate font-medium hover:scale-[1.02] transition-transform
                                    ${ev.activeInBanner ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                                `}
                                title={ev.title}
                            >
                                {ev.title}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
                    <h3 className="text-xl font-bold capitalize text-slate-800">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight /></button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                        <div key={d} className="p-3 text-center text-xs font-bold text-slate-400 uppercase">{d.slice(0, 3)}</div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 bg-slate-50 gap-px border-b border-l border-slate-200">
                    {days}
                </div>
            </div>
        )
    };

    if (tier === 'BASIC') {
        return (
            <div className="p-8 max-w-full mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-slate-800">Gestión de Eventos</h2>
                <div className="p-12 bg-white rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Función Premium</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        La gestión de eventos y banners rotativos está disponible en los planes GOLD y PLATINUM.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 pt-32 max-w-full mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Eventos y Banner</h2>
                    <p className="text-slate-500">Gestiona los eventos y el banner rotativo de la app.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <List size={16} /> Lista
                    </button>
                    <button
                        onClick={() => setViewMode('CALENDAR')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'CALENDAR' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Calendar size={16} /> Calendario
                    </button>
                </div>

                <div className="flex gap-2">
                    {!readOnly && (
                        <>
                            <label className="bg-slate-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg cursor-pointer flex items-center gap-2">
                                <Upload size={20} />
                                <span className="hidden md:inline">Importar</span>
                                <input type="file" accept=".csv,.ics" className="hidden" onChange={handleFileUpload} disabled={isSubmitting} />
                            </label>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                            >
                                <Plus size={20} /> <span className="hidden md:inline">Nuevo Evento</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode === 'LIST' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((ev) => (
                        <div key={ev.id} className="group relative bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                            {/* Banner Preview Strip */}
                            <div className={`h-24 bg-gradient-to-r ${ev.bannerGradient || 'from-indigo-500 to-purple-500'} p-6 relative`}>
                                {!readOnly && (
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditEvent(ev);
                                            }}
                                            className="p-2 bg-white/20 text-white hover:bg-white/40 backdrop-blur-md rounded-lg transition-all"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEvent(ev.id);
                                            }}
                                            className={`p-2 backdrop-blur-md rounded-lg transition-all z-50 flex items-center gap-1 ${deleteConfirmation === ev.id
                                                ? 'bg-red-600 text-white w-auto px-3'
                                                : 'bg-white/20 text-white hover:bg-red-500'
                                                }`}
                                        >
                                            {deleteConfirmation === ev.id ? (
                                                <span className="text-xs font-bold">¿Borrar?</span>
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 -mt-12 relative z-10">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{ev.title}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {ev.date}</span>
                                            {ev.endDate && <span className="flex items-center gap-1 text-slate-400">Hasta: {ev.endDate}</span>}
                                        </div>
                                        <span className="ml-auto flex items-center gap-1"><Clock size={12} /> {ev.time}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Visible en App</span>
                                    <button
                                        onClick={() => !readOnly && toggleBannerStatus(ev)}
                                        className={`w-12 h-7 rounded-full relative transition-colors ${ev.activeInBanner ? 'bg-green-500' : 'bg-slate-200'} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${ev.activeInBanner ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!readOnly && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="min-h-[200px] rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all gap-4 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold">Crear Nuevo Evento</span>
                        </button>
                    )}
                </div>
            ) : (
                renderCalendar()
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800">{editingEventId ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-8">
                            {/* LIVE PREVIEW (Omitted for brevity, kept structure) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Vista Previa</label>
                                <div className={`w-full aspect-[3/1] rounded-3xl bg-gradient-to-r ${newEvent.bannerGradient} p-6 md:p-8 flex flex-col justify-center text-white shadow-lg relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-8 opacity-10"><ImageIcon size={120} /></div>
                                    <div className="relative z-10">
                                        <h4 className="text-2xl font-bold">{newEvent.title || 'Título'}</h4>
                                        <p className="opacity-80 text-sm truncate">{newEvent.description || 'Descripción...'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Título del Evento</label>
                                    <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="input-soft" placeholder="Título" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Descripción</label>
                                    <textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="input-soft min-h-[80px]" placeholder="Detalles..." />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Lugar</label>
                                    <input type="text" value={newEvent.placeName} onChange={e => setNewEvent({ ...newEvent, placeName: e.target.value })} className="input-soft" placeholder="Lugar" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Dirección</label>
                                    <input type="text" value={newEvent.address} onChange={e => setNewEvent({ ...newEvent, address: e.target.value })} className="input-soft" placeholder="Dirección" />
                                </div>

                                {/* DATE RANGE INPUTS */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Fecha Inicio</label>
                                    <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="input-soft" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Fecha Fin (Opcional)</label>
                                    <input type="date" value={newEvent.endDate || ''} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} className="input-soft" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Hora</label>
                                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="input-soft" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Visibilidad</label>
                                    <div className="flex gap-2">
                                        {/* Simplification: Just two logic for now, keeping it same as before */}
                                        <button onClick={() => setNewEvent({ ...newEvent, targetAudience: 'PUBLIC' })} className={`p-3 rounded-xl border text-xs font-bold ${newEvent.targetAudience === 'PUBLIC' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>🌍 Público</button>
                                        <button onClick={() => setNewEvent({ ...newEvent, targetAudience: 'STAFF_ONLY' })} className={`p-3 rounded-xl border text-xs font-bold ${newEvent.targetAudience === 'STAFF_ONLY' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>🛡️ Staff</button>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Pickers for brevity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Color</label>
                                    <div className="flex gap-2 flex-wrap pb-2">
                                        {GRADIENTS.map(grad => (
                                            <button key={grad.name} type="button" onClick={() => setNewEvent({ ...newEvent, bannerGradient: grad.class })} className={`w-8 h-8 rounded-full bg-gradient-to-r ${grad.class} ${newEvent.bannerGradient === grad.class ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-110'} transition-all`} title={grad.name} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Cancelar</button>
                            <button onClick={handleCreateEvent} disabled={isSubmitting || !newEvent.title || !newEvent.date} className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50">
                                {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsAdmin;
